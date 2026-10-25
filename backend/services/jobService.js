const Job = require('../models/Job');
const { fetchRemoteTechJobs, getApiKey } = require('./recruitmentService');

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function splitAmounts(fullAmount, chargePercent = 2) {
  const full = Number(fullAmount || 0);
  return {
    userVisibleAmount: roundMoney(full * 0.40),
    adminAmount: roundMoney(full * 0.60),
    transactionChargePercent: Number(chargePercent || 0),
    transactionChargeAmount: roundMoney(full * (Number(chargePercent || 0) / 100))
  };
}

function cleanList(value, defaults = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).slice(0, 12);
  if (typeof value === 'string') return value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean).slice(0, 12);
  return defaults;
}

function normalizeExternalJob(job = {}, index = 0) {
  const disclosedAmount = job.fullAmount || job.amount || job.budget || job.price || job.salaryAmount || 0;
  const defaultAmount = Number(process.env.DEFAULT_JOB_FULL_AMOUNT || process.env.DEFAULT_JOB_FULL_AMOUNT || 0);
  const fullAmount = Number(disclosedAmount || defaultAmount || 0);
  const chargePercent = Number(job.transactionChargePercent || 2);
  return {
    title: job.title || job.job_title || '',
    description: job.description || job.job_description || 'Real job opportunity available through SP WorldTech recruitment portal.',
    shortDescription: job.shortDescription || job.description?.slice?.(0, 220) || job.job_description?.slice?.(0, 220) || '',
    responsibilities: cleanList(job.responsibilities, []),
    requirements: cleanList(job.requirements || job.qualifications, job.skills || []),
    skills: cleanList(job.skills || job.requiredSkills, ['Remote Work', 'Communication']),
    benefits: cleanList(job.benefits, []),
    category: job.category || job.job_category || 'Remote Tech Jobs',
    fullAmount,
    ...splitAmounts(fullAmount, chargePercent),
    dueDate: job.dueDate || job.deadline ? new Date(job.dueDate || job.deadline) : undefined,
    externalId: job.externalId || job.job_id || job.id || undefined,
    company: job.company || job.employer_name || job.employer || 'SP WorldTech Client',
    companyLogo: job.companyLogo || job.employer_logo || '',
    companyInfo: job.companyInfo || job.employer_website || '',
    clientEmail: job.clientEmail || job.employer_email || '',
    clientContact: job.clientContact || job.employer_contact || '',
    location: job.location || (job.job_is_remote ? 'Remote' : undefined) || 'Remote',
    country: job.country || job.job_country || '',
    workMode: job.workMode || (job.isRemote || job.job_is_remote ? 'Remote' : 'Flexible'),
    employmentType: job.employmentType || job.job_employment_type || 'Full-time',
    experienceLevel: job.experienceLevel || job.experience_level || 'Not specified',
    salary: job.salary || '',
    salaryAmount: job.salaryAmount || 0,
    applyLink: job.applyLink || job.job_apply_link || job.url || '',
    postedAt: job.postedAt || job.createdAt || undefined,
    closingDate: job.closingDate || job.dueDate || undefined,
    source: 'external_job_api',
    status: job.status || 'open'
  };
}

async function syncRecruitmentJobs() {
  const configured = Boolean(getApiKey());
  if (!configured) return { synced: 0, configured: false };

  try {
    const query = process.env.JOB_API_QUERY || 'remote software developer jobs';
    const limit = Math.min(Number(process.env.JOB_API_SYNC_LIMIT || 25), 50);
    const jobs = await fetchRemoteTechJobs({ query, limit });
    let synced = 0;
    for (let index = 0; index < jobs.length; index += 1) {
      const normalized = normalizeExternalJob({ ...jobs[index], source: 'external_job_api' }, index);
      if (!normalized.title) continue;
      const lookup = normalized.externalId
        ? { externalId: normalized.externalId, source: normalized.source }
        : { title: normalized.title, company: normalized.company, source: normalized.source };
      await Job.findOneAndUpdate(lookup, normalized, { upsert: true, new: true, setDefaultsOnInsert: true });
      synced += 1;
    }
    return { synced, configured: true };
  } catch (error) {
    console.error('SP WorldTech job sync failed:', error.message);
    return { synced: 0, configured: true, error: error.message };
  }
}

async function ensureJobs() {
  const recruitmentJobs = await syncRecruitmentJobs();
  return { recruitmentJobs };
}

module.exports = { ensureJobs, syncRecruitmentJobs, splitAmounts, normalizeExternalJob };
