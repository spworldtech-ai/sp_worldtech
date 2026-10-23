// Test helpers: in-memory stand-ins for Mongoose models so the real route and
// controller code can be exercised without a MongoDB server.
const path = require('path');
const Module = require('module');

function stub(relativePath, exportsValue) {
  const resolved = require.resolve(path.join(__dirname, '..', relativePath));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: exportsValue };
}

let counter = 0;
const newId = () => (++counter).toString(16).padStart(24, '0');

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (expected && typeof expected === 'object' && '$ne' in expected) return String(actual) !== String(expected.$ne);
    return String(actual) === String(expected);
  });
}

function makeModel() {
  const rows = [];
  class Doc {
    constructor(data) { Object.assign(this, { _id: newId(), createdAt: new Date(), ...data }); }
    async save() { if (!rows.includes(this)) rows.push(this); return this; }
  }
  const chain = (value) => {
    const promise = Promise.resolve(value);
    const q = { select: () => q, sort: () => q, populate: () => q, then: (a, b) => promise.then(a, b), catch: (b) => promise.catch(b) };
    return q;
  };
  const Model = {
    _rows: rows,
    _Doc: Doc,
    create: async (data) => { const doc = new Doc(data); rows.push(doc); return doc; },
    find: (filter) => chain(rows.filter((row) => matches(row, filter)).reverse()),
    findOne: (filter) => chain(rows.find((row) => matches(row, filter)) || null),
    findById: (id) => chain(rows.find((row) => String(row._id) === String(id)) || null),
    countDocuments: (filter) => chain(rows.filter((row) => matches(row, filter)).length),
    deleteOne: async (filter) => { const i = rows.findIndex((row) => matches(row, filter)); if (i >= 0) rows.splice(i, 1); },
    deleteMany: async (filter) => { for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], filter)) rows.splice(i, 1); },
    exists: async (filter) => rows.some((row) => matches(row, filter)),
    updateOne: async () => ({})
  };
  return Model;
}

module.exports = { stub, makeModel };
