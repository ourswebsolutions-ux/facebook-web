/**
 * Facebook Marketplace Automation — navigation & feature catalog
 */

export const FEATURE_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        title: 'Admin Dashboard',
        description: 'Overview of accounts, listings, and marketplace activity.',
        type: 'dashboard',
      },
      {
        id: 'activity',
        label: 'Activity Monitoring',
        title: 'Activity Monitoring',
        description: 'Track user actions, jobs, and system events in real time.',
        type: 'admin-activity',
      },
      {
        id: 'inbox',
        label: 'Inbox',
        title: 'Inbox',
        description: 'Manage Marketplace messages and auto-replies.',
        type: 'inbox',
        actions: ['Refresh', 'Read Messages', 'Auto Reply'],
      },
      {
        id: 'accounts',
        label: 'FB Accounts',
        title: 'FB Account Management',
        description: 'Add, edit, and manage Facebook accounts for automation.',
        type: 'accounts',
      },
    ],
  },
  {
    id: 'accounts',
    label: 'Account Management',
    items: [
      {
        id: 'account-listings',
        label: 'FB Account Listings',
        title: 'FB Account Listings',
        description: 'Post listings on Facebook accounts — choose mode from dropdown.',
        type: 'account-listings',
        actions: ['Start Listing'],
      },
      {
        id: 'account-warmup',
        label: 'FB Account Warm Up',
        title: 'FB Account Warm Up',
        description: 'Warm accounts with natural activity before bulk listing.',
        type: 'account-warmup',
        actions: ['Start Warm Up', 'Pause', 'Select Accounts'],
      },
      // {
      //   id: 'open-accounts',
      //   label: 'Open FB Accounts',
      //   title: 'Open FB Accounts',
      //   description: 'Open and control multiple Facebook account sessions.',
      //   type: 'open-accounts',
      //   actions: ['Open Selected', 'Open All', 'Refresh Status'],
      // },
      // {
      //   id: 'profile-updater',
      //   label: 'FB Profile Updater',
      //   title: 'FB Profile Updater',
      //   description: 'Bulk update profile photo, bio, and account details.',
      //   type: 'profile-updater',
      //   actions: ['Update Profiles', 'Upload Assets', 'Select Accounts'],
      // },
    ],
  },
  // {
  //   id: 'listings',
  //   label: 'Listing Management',
  //   items: [
  //     { id: 'ai-ultra-listings', label: 'AI Ultra Listings V2.0', ... },
  //     { id: 'create-drafts', label: 'Create Only Drafts', ... },
  //     { id: 'listing-management', label: 'Listing Management', ... },
  //   ],
  // },
  // {
  //   id: 'marketing',
  //   label: 'Marketing Tools',
  //   items: [...],
  // },
  // TODO: AI Features — hidden until backend AI endpoints are tested and ready
  // {
  //   id: 'ai',
  //   label: 'AI Features',
  //   items: [
  //     {
  //       id: 'ai-title',
  //       label: 'AI Title Generation',
  //       title: 'AI Listing Title Generation',
  //       description: 'Generate optimized marketplace titles with AI.',
  //       type: 'ai-text',
  //       field: 'title',
  //       actions: ['Generate Titles', 'Copy All'],
  //     },
  //     {
  //       id: 'ai-description',
  //       label: 'AI Description Creation',
  //       title: 'AI Description Creation',
  //       description: 'Create persuasive listing descriptions automatically.',
  //       type: 'ai-text',
  //       field: 'description',
  //       actions: ['Generate Descriptions', 'Copy All'],
  //     },
  //     {
  //       id: 'ai-optimization',
  //       label: 'AI Content Optimization',
  //       title: 'AI Content Optimization',
  //       description: 'Optimize existing listing content for better performance.',
  //       type: 'ai-text',
  //       field: 'optimize',
  //       actions: ['Optimize Content', 'Apply Changes'],
  //     },
  //     {
  //       id: 'ai-draft-creation',
  //       label: 'AI Draft Creation',
  //       title: 'AI Draft Creation',
  //       description: 'Generate complete marketplace drafts using AI.',
  //       type: 'ai-draft',
  //       actions: ['Create AI Drafts', 'Preview'],
  //     },
  //     {
  //       id: 'smart-suggestions',
  //       label: 'Smart Listing Suggestions',
  //       title: 'Smart Listing Suggestions',
  //       description: 'Get AI suggestions for pricing, category, and keywords.',
  //       type: 'ai-suggestions',
  //       actions: ['Get Suggestions', 'Apply'],
  //     },
  //     {
  //       id: 'automated-workflow',
  //       label: 'Automated Workflow Support',
  //       title: 'Automated Workflow Support',
  //       description: 'Chain AI + listing tasks into automated workflows.',
  //       type: 'automation',
  //       actions: ['Build Workflow', 'Run Workflow'],
  //     },
  //   ],
  // },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        title: 'Settings',
        description: 'Secure system preferences, delays, and defaults.',
        type: 'settings',
      },
    ],
  },
]

export const ALL_FEATURES = FEATURE_SECTIONS.flatMap((s) => s.items)

export function getFeature(id) {
  return ALL_FEATURES.find((f) => f.id === id) || ALL_FEATURES[0]
}
