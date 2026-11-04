// Social profile URLs come from env vars so no company account is ever invented.
// Set any of these in .env (see .env.example); unset ones are simply not shown in the footer.
const clean = (v) => (typeof v === 'string' && /^https?:\/\//i.test(v.trim()) ? v.trim() : '')

export const SOCIAL_LINKS = {
  linkedin: clean(import.meta.env.VITE_SOCIAL_LINKEDIN),
  instagram: clean(import.meta.env.VITE_SOCIAL_INSTAGRAM),
  facebook: clean(import.meta.env.VITE_SOCIAL_FACEBOOK),
  x: clean(import.meta.env.VITE_SOCIAL_X),
}
