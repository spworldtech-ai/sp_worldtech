function cleanList(value, defaults = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).slice(0, 12);
  if (typeof value === 'string') return value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean).slice(0, 12);
  return defaults;
}

function normalizeJSearchJob(job = {}, index = 0) {
  const title = job.job_title || job.title || '';
  const employer = job.employer_name || job.company || job.employer || 'Hiring company';
  const location = job.job_is_remote ? 'Remote' : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || job.location || 'Remote / Flexible';
  const applyLink = job.job_apply_link || job.job_google_link || job.apply_link || job.url || job.job_url || '';
  const salaryMin = job.job_min_salary || job.salary_min || job.min_salary;
  const salaryMax = job.job_max_salary || job.salary_max || job.max_salary;
  const salaryAmount = Number(salaryMax || salaryMin || job.salary || job.amount || 0);
  const salary = salaryMin || salaryMax
    ? `${salaryMin || ''}${salaryMin && salaryMax ? ' - ' : ''}${salaryMax || ''} ${job.job_salary_currency || job.salary_currency || 'USD'}`
    : 'Salary not disclosed';
  const description = job.job_description || job.description || `${title || 'Remote job'} opportunity from ${employer}. Apply through SP WorldTech for internal review before any client contact.`;
  const country = job.job_country || job.country || '';
  const employmentType = job.job_employment_type || job.employment_type || job.job_type || 'Full-time';
  const experienceLevel = job.job_required_experience?.required_experience_in_months
    ? `${Math.ceil(Number(job.job_required_experience.required_experience_in_months) / 12)}+ years`
    : job.experience_level || job.job_experience_level || 'Not specified';
  const skills = cleanList(job.job_required_skills || job.skills || job.required_skills, ['Software Development', 'Communication', 'Remote Collaboration']);
  const responsibilities = cleanList(job.job_highlights?.Responsibilities || job.responsibilities, []);
  const requirements = cleanList(job.job_highlights?.Qualifications || job.requirements || job.qualifications, skills);
  const benefits = cleanList(job.job_highlights?.Benefits || job.benefits, []);
  return {
    externalId: job.job_id || job.id || `${title}-${employer}-${index}`,
    title,
    company: employer,
    description,
    shortDescription: description.length > 220 ? `${description.slice(0, 220)}...` : description,
    responsibilities,
    requirements,
    skills,
    benefits,
    category: job.job_publisher || job.category || 'Remote Tech Jobs',
    companyLogo: job.employer_logo || job.company_logo || '',
    companyInfo: job.employer_website || job.company_website || '',
    clientEmail: job.employer_email || job.client_email || '',
    clientContact: job.employer_contact || job.client_contact || '',
    location,
    country,
    workMode: job.job_is_remote ? 'Remote' : (/hybrid/i.test(location) ? 'Hybrid' : 'On-site'),
    employmentType,
    experienceLevel,
    salary,
    salaryAmount,
    fullAmount: salaryAmount,
    applyLink,
    isRemote: Boolean(job.job_is_remote || /remote|work from home|wfh/i.test(`${location} ${title}`)),
    postedAt: job.job_posted_at_datetime_utc || job.job_posted_at_timestamp ? new Date(job.job_posted_at_datetime_utc || Number(job.job_posted_at_timestamp) * 1000) : undefined,
    closingDate: job.job_offer_expiration_datetime_utc ? new Date(job.job_offer_expiration_datetime_utc) : undefined,
    dueDate: job.job_offer_expiration_datetime_utc ? new Date(job.job_offer_expiration_datetime_utc) : undefined,
    source: 'external_job_api',
    status: 'open'
  };
}

function getApiKey() {
  return process.env.JOB_API_KEY || process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || '';
}

function selectEndpoint(type = 'jsearch') {
  return String(type).toLowerCase().includes('remote')
    ? (process.env.REMOTE_JOBS_URL || process.env.JSEARCH_URL || process.env.JOB_API_URL || '')
    : (process.env.JSEARCH_URL || process.env.JOB_API_URL || '');
}

function buildHeaders(apiKey) {
  return { Accept: 'application/json', 'x-api-key': apiKey, 'X-RapidAPI-Key': apiKey };
}

async function fetchJSearchJobs({ query = 'software developer jobs in Nigeria', country = '', language = 'en', limit = 20, remote = false } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('SP WorldTech recruitment service is not available yet. Add your job API key in Vercel.');
  if (!selectEndpoint('jsearch')) throw new Error('SP WorldTech recruitment endpoint is not configured yet.');

  const url = new URL(selectEndpoint('jsearch'));
  url.searchParams.set('query', query || 'software developer jobs in Nigeria');
  url.searchParams.set('language', language || 'en');
  if (country) url.searchParams.set('country', String(country).toLowerCase());
  if (remote) url.searchParams.set('work_from_home', 'true');
  url.searchParams.set('num_pages', '1');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { headers: buildHeaders(apiKey), signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.message || data.error || data.detail || `SP WorldTech recruitment request failed with ${response.status}`;
      throw new Error(message);
    }
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map(normalizeJSearchJob).filter(job => job.title && job.externalId);
  } finally { clearTimeout(timeout); }
}

async function fetchRemoteTechJobs({ query = 'remote software developer jobs', limit = 20, country = '', language = 'en' } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('SP WorldTech remote job service is not available yet. Add your job API key in Vercel.');
  const endpoint = selectEndpoint('remote');
  if (!endpoint) throw new Error('SP WorldTech remote job endpoint is not configured yet.');
  const url = new URL(endpoint);
  url.searchParams.set('query', query || 'remote software developer jobs');
  url.searchParams.set('language', language || 'en');
  if (country) url.searchParams.set('country', String(country).toLowerCase());
  if (endpoint.includes('/jsearch/')) url.searchParams.set('work_from_home', 'true');
  url.searchParams.set('num_pages', '1');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { headers: buildHeaders(apiKey), signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || data.detail || `SP WorldTech remote jobs request failed with ${response.status}`);
    const rows = Array.isArray(data.data) ? data.data : Array.isArray(data.jobs) ? data.jobs : Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map(normalizeJSearchJob).filter(job => job.title && job.externalId);
  } finally { clearTimeout(timeout); }
}

module.exports = { fetchRemoteTechJobs, fetchJSearchJobs, normalizeJSearchJob, getApiKey };
