export const DEMO_ACCOUNTS = [
  { id: '1', name: 'Account Alpha', status: 'ready', listings: 12 },
  { id: '2', name: 'Account Beta', status: 'warming', listings: 3 },
  { id: '3', name: 'Account Gamma', status: 'ready', listings: 28 },
  { id: '4', name: 'Account Delta', status: 'limited', listings: 0 },
]

export const DEMO_LISTINGS = [
  { id: 'l1', title: 'iPhone 13 Pro — Excellent Condition', status: 'active', price: '$499' },
  { id: 'l2', title: 'Gaming Chair Black/Red', status: 'draft', price: '$89' },
  { id: 'l3', title: 'MacBook Air M1 256GB', status: 'active', price: '$650' },
  { id: 'l4', title: 'Sofa Set 3-Seater', status: 'expired', price: '$220' },
]

export const QUICK_LINKS = [
  { id: 'accounts', label: 'FB Accounts' },
  { id: 'old-account-listings', label: 'Old Account Listings' },
  { id: 'slow-listings-v2', label: 'Slow Listings V2' },
  { id: 'ai-ultra-listings', label: 'AI Ultra Listings' },
  { id: 'account-warmup', label: 'Account Warm Up' },
  { id: 'draft-publisher', label: 'Draft Publisher' },
  { id: 'click-tracking', label: 'Click Tracking' },
  { id: 'inbox', label: 'Inbox' },
]

export const DEMO_USERS = [
  { id: 1, name: 'Admin', email: 'admin@company.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Operator', email: 'ops@company.com', role: 'Operator', status: 'active' },
  { id: 3, name: 'Viewer', email: 'view@company.com', role: 'Viewer', status: 'disabled' },
]

export const PERMISSIONS = [
  'Manage accounts',
  'Create / publish listings',
  'Delete listings',
  'Run marketing tools',
  'Use AI features',
  'Manage users',
  'View activity logs',
]
