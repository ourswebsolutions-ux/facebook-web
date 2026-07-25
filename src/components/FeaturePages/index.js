import {
  AccountListings,
  OldAccountListings,
  SlowListings,
  SlowListingsV2,
  AccountWarmup,
  OpenAccounts,
  ProfileUpdater,
} from './AccountManagement'
import {
  ListingManagement,
  AIUltraListings,
  CreateDrafts,
  AIDraftPublisher,
  DraftPublisher,
  RenewListings,
  RelistListings,
  DeleteAllListings,
  XDraftDelete,
} from './ListingManagement'
import {
  AdsMultiplier,
  ClickTracking,
  ListingAutomation,
} from './MarketingTools'
import {
  AITitleGeneration,
  AIDescriptionCreation,
  AIContentOptimization,
  AIDraftCreation,
  SmartSuggestions,
  AutomatedWorkflowSupport,
} from './AIFeatures'
import {
  Dashboard,
  ActivityView,
  InboxView,
} from './Overview'
import { SettingsView } from './System'

const FEATURE_PAGE_MAP = {
  'dashboard': Dashboard,
  'activity': ActivityView,
  'inbox': InboxView,
  'settings': SettingsView,
  'account-listings': AccountListings,
  'old-account-listings': OldAccountListings,
  'slow-listings': SlowListings,
  'slow-listings-v2': SlowListingsV2,
  'account-warmup': AccountWarmup,
  'open-accounts': OpenAccounts,
  'profile-updater': ProfileUpdater,
  'listing-management': ListingManagement,
  'ai-ultra-listings': AIUltraListings,
  'create-drafts': CreateDrafts,
  'ai-draft-publisher': AIDraftPublisher,
  'draft-publisher': DraftPublisher,
  'renew-listings': RenewListings,
  'relist-listings': RelistListings,
  'delete-all-listings': DeleteAllListings,
  'x-draft-delete': XDraftDelete,
  'ads-multiplier': AdsMultiplier,
  'click-tracking': ClickTracking,
  'listing-automation': ListingAutomation,
  'ai-title': AITitleGeneration,
  'ai-description': AIDescriptionCreation,
  'ai-optimization': AIContentOptimization,
  'ai-draft-creation': AIDraftCreation,
  'smart-suggestions': SmartSuggestions,
  'automated-workflow': AutomatedWorkflowSupport,
}

export default FEATURE_PAGE_MAP
