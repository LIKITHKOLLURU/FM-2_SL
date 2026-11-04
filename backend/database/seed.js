import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'node:url'
import db from '../config/database.js'

const PASSWORD = 'Password123'
const ADMIN_PASSWORD = 'Admin123'
const iso = (d) => `${d}T09:00:00.000Z`

// IDs are assigned by insertion order, so the references below (e.g. client 2) rely on it.
const users = [
  ['Alex Morgan', 'admin@freelancehub.com', ADMIN_PASSWORD, 'admin', 'Platform Administrator', 'FreelanceHub', 'San Francisco, US', 'Keeping the marketplace safe, fair and fast.', [], null, '2026-01-05'],
  ['Sarah Mitchell', 'sarah@northwind.com', PASSWORD, 'client', 'Head of Product', 'Northwind Labs', 'Austin, US', 'Product leader building B2B SaaS tools. I value clear communication and quick iteration.', [], null, '2026-02-11'],
  ['David Chen', 'david@brightpath.io', PASSWORD, 'client', 'Founder', 'BrightPath Studio', 'Toronto, CA', 'Running a small creative agency and hiring specialists for client work.', [], null, '2026-03-02'],
  ['Priya Sharma', 'priya@dev.com', PASSWORD, 'freelancer', 'Full-Stack Developer', '', 'Bengaluru, IN', 'Full-stack engineer with 7 years building React and Node.js products for startups.', ['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'], 45, '2026-02-20'],
  ['Marcus Johnson', 'marcus@design.com', PASSWORD, 'freelancer', 'Product & Brand Designer', '', 'London, UK', 'Designer focused on crisp interfaces and memorable brand systems.', ['Figma', 'UI Design', 'Branding', 'Prototyping', 'Illustration'], 55, '2026-03-14'],
  ['Elena Rossi', 'elena@words.com', PASSWORD, 'freelancer', 'Content & SEO Writer', '', 'Milan, IT', 'Writer helping brands rank and convert with research-driven content.', ['Copywriting', 'SEO', 'Content Strategy', 'Social Media', 'Scriptwriting'], 35, '2026-04-01'],
]

// client, title, description, category, min, max, duration, experience, skills, status, created
const jobs = [
  [2, 'Build a React analytics dashboard for our SaaS product', 'We need an experienced React developer to build a responsive analytics dashboard with charts, filters and CSV export. Designs are ready in Figma. The dashboard consumes a REST API (documentation provided).\n\nDeliverables: reusable component library, responsive layouts, unit tests for core components.', 'Web Development', 2500, 4000, '4-6 weeks', 'Expert', ['React', 'Tailwind CSS', 'Recharts'], 'open', '2026-10-21'],
  [2, 'Mobile app UI/UX design for a fitness startup', 'Design a modern, motivating mobile experience for our fitness tracking app: onboarding, workout library, progress screens and settings. Deliver a clickable Figma prototype and a design system.', 'Design', 1800, 3000, '3-4 weeks', 'Intermediate', ['Figma', 'UI Design', 'Prototyping'], 'open', '2026-10-24'],
  [3, 'SEO blog content series: 12 long-form articles', 'Looking for a skilled writer to produce 12 SEO-optimised articles (1,500+ words each) for a B2B project management audience. Keyword briefs will be supplied.', 'Writing', 600, 1200, '4 weeks', 'Intermediate', ['SEO', 'Copywriting', 'Content Strategy'], 'open', '2026-10-26'],
  [3, 'Shopify store theme customization', 'Customize an existing Shopify theme: new homepage sections, product page upgrades, speed optimisation and mobile polish.', 'Web Development', 900, 1500, '2-3 weeks', 'Intermediate', ['Shopify', 'Liquid', 'JavaScript'], 'open', '2026-10-28'],
  [2, 'Node.js REST API for a booking platform', 'Design and build a secure REST API for a booking platform: authentication, availability engine, bookings, payment hooks and an admin API. Documentation and automated tests required.', 'Web Development', 3000, 5000, '8 weeks', 'Expert', ['Node.js', 'PostgreSQL', 'REST'], 'in_progress', '2026-08-30'],
  [3, 'Brand identity and logo package', 'Create a complete brand identity for a new wellness brand: logo suite, colour palette, typography, social templates and a short brand guideline PDF.', 'Design', 700, 1400, '3 weeks', 'Intermediate', ['Branding', 'Illustration', 'Figma'], 'in_progress', '2026-09-15'],
  [2, 'Product explainer video script', 'Write a punchy 90-second explainer video script plus a storyboard outline for our new analytics feature launch.', 'Writing', 300, 600, '1 week', 'Entry', ['Scriptwriting', 'Copywriting'], 'completed', '2026-08-05'],
  [3, 'Data visualization for annual impact report', 'Turn our annual impact data (spreadsheets provided) into 10 polished charts and infographics suitable for print and web.', 'Data & Analytics', 1200, 2200, '3 weeks', 'Intermediate', ['Data Visualization', 'Figma', 'Excel'], 'open', '2026-10-30'],
  [2, 'WordPress to Next.js migration', 'Migrate our marketing site from WordPress to Next.js with a headless CMS, keeping SEO rankings intact with proper redirects and metadata.', 'Web Development', 2000, 3500, '5 weeks', 'Expert', ['Next.js', 'React', 'SEO'], 'open', '2026-11-01'],
  [3, 'Social media marketing plan for Q1', 'Develop a Q1 social media strategy including content calendar, channel plan, KPIs and 20 sample post concepts.', 'Marketing', 500, 900, '2 weeks', 'Entry', ['Social Media', 'Content Strategy'], 'open', '2026-11-02'],
]

// job, freelancer, amount, days, cover letter, status, created
const proposals = [
  [5, 4, 4200, 56, 'I have shipped three booking systems on Node.js and PostgreSQL. I would deliver a documented, tested API in two-week sprints with a demo at the end of each.', 'accepted', '2026-09-02'],
  [6, 5, 1100, 21, 'Branding is my specialty. I will start with a short discovery call, present three directions and refine one into a full identity system.', 'accepted', '2026-09-17'],
  [7, 6, 450, 7, 'I write scripts that make complex features feel simple. Happy to share explainer samples. Two revision rounds are included.', 'accepted', '2026-08-06'],
  [1, 4, 3400, 35, 'Dashboards with Recharts and Tailwind are my daily work. I can start next week and will provide a reusable, tested component library along with the screens.', 'pending', '2026-10-23'],
  [2, 5, 2400, 24, 'I recently designed two fitness and wellness apps. I will deliver user flows, hi-fi screens, a design system and a clickable prototype ready for developer handoff.', 'pending', '2026-10-25'],
  [3, 6, 900, 28, 'I have written for several B2B SaaS blogs and consistently rank articles on page one. I will deliver three articles per week with on-page SEO included.', 'pending', '2026-10-27'],
  [9, 4, 2800, 30, 'I have migrated multiple WordPress sites to Next.js with zero ranking loss. I will map every URL and ship redirects and structured data as part of the migration.', 'pending', '2026-11-02'],
  [5, 5, 4800, 70, 'Although design is my core, I can collaborate with a back-end partner to deliver this API on time.', 'rejected', '2026-09-03'],
  [4, 4, 1100, 16, 'Happy to customise your theme and improve Core Web Vitals. I will share a before and after performance report.', 'pending', '2026-10-29'],
  [8, 5, 1700, 20, 'I design clear, editorial-style infographics. I would deliver 10 charts in print and web formats with source files.', 'pending', '2026-11-01'],
]

// job, client, freelancer, proposal, title, budget, deadline, status, progress, created
const projects = [
  [5, 2, 4, 1, 'Node.js REST API for a booking platform', 4200, '2026-10-30', 'in_progress', 55, '2026-09-04'],
  [6, 3, 5, 2, 'Brand identity and logo package', 1100, '2026-11-08', 'in_review', 85, '2026-09-18'],
  [7, 2, 6, 3, 'Product explainer video script', 450, '2026-08-14', 'completed', 100, '2026-08-07'],
]

// project, client, freelancer, amount, type, status, date
const payments = [
  [1, 2, 4, 2100, 'deposit', 'paid', '2026-09-04'],
  [1, 2, 4, 2100, 'final', 'pending', '2026-10-30'],
  [2, 3, 5, 550, 'deposit', 'paid', '2026-09-18'],
  [2, 3, 5, 550, 'final', 'pending', '2026-11-08'],
  [3, 2, 6, 225, 'deposit', 'paid', '2026-08-07'],
  [3, 2, 6, 225, 'final', 'paid', '2026-08-15'],
]

const seedTx = db.transaction(() => {
  const u = db.prepare(`INSERT INTO users (name,email,password_hash,role,title,company,location,bio,skills,hourly_rate,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?, 'active', ?, ?)`)
  users.forEach(([n, e, pw, r, t, c, l, b, s, h, d]) => u.run(n, e, bcrypt.hashSync(pw, 10), r, t, c, l, b, JSON.stringify(s), h, iso(d), iso(d)))

  const j = db.prepare(`INSERT INTO jobs (client_id,title,description,category,budget_min,budget_max,duration,experience,skills,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  jobs.forEach(([c, t, d, cat, mn, mx, du, ex, sk, st, cr]) => j.run(c, t, d, cat, mn, mx, du, ex, JSON.stringify(sk), st, iso(cr), iso(cr)))

  const p = db.prepare(`INSERT INTO proposals (job_id,freelancer_id,proposed_amount,delivery_days,cover_letter,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
  proposals.forEach(([jb, f, a, dd, cl, st, cr]) => p.run(jb, f, a, dd, cl, st, iso(cr), iso(cr)))
  // Deadlines / due dates are IST calendar dates (YYYY-MM-DD); other columns are UTC timestamps.

  const pr = db.prepare(`INSERT INTO projects (job_id,client_id,freelancer_id,proposal_id,title,budget,deadline,status,progress,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  projects.forEach(([jb, c, f, pp, t, b, dl, st, pg, cr]) => pr.run(jb, c, f, pp, t, b, dl, st, pg, iso(cr), iso(cr)))

  const pay = db.prepare(`INSERT INTO payments (project_id,client_id,freelancer_id,amount,payment_type,payment_status,payment_date,created_at) VALUES (?,?,?,?,?,?,?,?)`)
  payments.forEach(([pj, c, f, a, ty, st, d]) => pay.run(pj, c, f, a, ty, st, st === 'pending' ? d : iso(d), iso(d)))
})

// Seeds only when there are no users, so restarts never overwrite data.
export function seedIfEmpty() {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return false
  seedTx()
  return true
}

// Wipes every table, restarts id counters and re-seeds (dev/demo only).
export function resetAndSeed() {
  db.transaction(() => {
    for (const t of ['payments', 'projects', 'proposals', 'jobs', 'users']) db.prepare(`DELETE FROM ${t}`).run()
    db.prepare(`DELETE FROM sqlite_sequence`).run()
    seedTx()
  }).immediate()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(seedIfEmpty() ? 'Database seeded.' : 'Database already has data; nothing seeded.')
}
