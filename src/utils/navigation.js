import { LayoutDashboard, Briefcase, PlusCircle, Inbox, FolderKanban, Wallet, UserCircle, Search, Send, Users, ShieldCheck } from 'lucide-react'

export const roleHome = (role) => `/${role}`

export const NAV = {
  client: [
    { to: '/client', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/client/jobs', label: 'My Jobs', icon: Briefcase },
    { to: '/client/jobs/new', label: 'Post a Job', icon: PlusCircle },
    { to: '/client/proposals', label: 'Proposals', icon: Inbox },
    { to: '/client/projects', label: 'My Projects', icon: FolderKanban },
    { to: '/client/payments', label: 'Payments', icon: Wallet },
    { to: '/client/profile', label: 'Profile', icon: UserCircle },
  ],
  freelancer: [
    { to: '/freelancer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/freelancer/jobs', label: 'Browse Jobs', icon: Search },
    { to: '/freelancer/proposals', label: 'My Proposals', icon: Send },
    { to: '/freelancer/projects', label: 'My Projects', icon: FolderKanban },
    { to: '/freelancer/payments', label: 'Payments', icon: Wallet },
    { to: '/freelancer/profile', label: 'Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: ShieldCheck, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { to: '/admin/payments', label: 'Payments', icon: Wallet },
  ],
}
