const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (v) => EMAIL.test(String(v).trim())

export function validateLogin({ email, password }) {
  const e = {}
  if (!email.trim()) e.email = 'Email is required.'
  else if (!isEmail(email)) e.email = 'Enter a valid email address.'
  if (!password) e.password = 'Password is required.'
  return e
}

export function validateRegister({ name, email, password, confirm, role }) {
  const e = {}
  if (name.trim().length < 2) e.name = 'Enter your full name.'
  if (!email.trim()) e.email = 'Email is required.'
  else if (!isEmail(email)) e.email = 'Enter a valid email address.'
  if (password.length < 8) e.password = 'Password must be at least 8 characters.'
  else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) e.password = 'Use letters and at least one number.'
  if (confirm !== password) e.confirm = 'Passwords do not match.'
  if (!['client', 'freelancer'].includes(role)) e.role = 'Choose an account type.'
  return e
}

export function validateJob(f) {
  const e = {}
  if (f.title.trim().length < 10) e.title = 'Title must be at least 10 characters.'
  if (f.description.trim().length < 50) e.description = 'Describe the job in at least 50 characters.'
  if (!f.category) e.category = 'Select a category.'
  const min = Number(f.budgetMin), max = Number(f.budgetMax)
  if (!min || min < 10) e.budgetMin = 'Minimum budget must be at least $10.'
  if (!max || max < min) e.budgetMax = 'Maximum must be greater than or equal to minimum.'
  if (!f.duration.trim()) e.duration = 'Enter an expected duration.'
  if (f.skills.length === 0) e.skills = 'Add at least one skill.'
  return e
}

export function validateProposal(f, job) {
  const e = {}
  const amt = Number(f.amount)
  if (!amt || amt <= 0) e.amount = 'Enter your proposed budget.'
  else if (job && amt > job.budgetMax * 1.5) e.amount = `Bid is far above the client budget (max $${job.budgetMax}).`
  const days = Number(f.deliveryDays)
  if (!days || days < 1 || days > 365) e.deliveryDays = 'Enter delivery time between 1 and 365 days.'
  if (f.coverLetter.trim().length < 50) e.coverLetter = 'Cover letter must be at least 50 characters.'
  return e
}

export function validateProfile(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Name is required.'
  if (f.hourlyRate !== '' && f.hourlyRate != null && Number(f.hourlyRate) < 0) e.hourlyRate = 'Rate cannot be negative.'
  return e
}
