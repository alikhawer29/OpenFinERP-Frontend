//////      ADMIN     //////
// User Management
export const statusFiltersConfig = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'settle', label: 'Settle' },
];

export const generalStatusFiltersConfig = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const subscriptionStatusFiltersConfig = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
];

export const userStatusFiltersConfig = [
  { value: '', label: 'All' },
  { value: '0', label: 'Blocked' },
  { value: '1', label: 'Active' },
  { value: '2', label: 'Inactive' },
];

export const userStatusFilters = [
  { value: '', label: 'All' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
];

export const notificationFilterOptions = [
  { value: '', label: 'All' },
  { value: '0', label: 'Read' },
  { value: '1', label: 'Unread' },
];

//////      BUSINESS     //////
export const unlockRequestFilterOptions = [
  { value: '', label: 'All' },
  { value: '0', label: 'Approved' },
  { value: '1', label: 'Pending' },
  { value: '2', label: 'Rejected' },
];

export const attachmentFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const markTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'marked', label: 'Marked' },
  { value: 'un-marked', label: 'Unmarked' },
];

export const markTypeBoolean = [
  { value: 'all', label: 'All' },
  { value: 1, label: 'Marked' },
  { value: 0, label: 'Unmarked' },
]

export const systemIntegrityFiltersConfig = [
  { value: 'All', label: 'All' },
  { value: 'A', label: 'Ledger invalid' },
  { value: 'B', label: 'Account code missing' },
  { value: 'C', label: 'Account code invalid' },
  { value: 'D', label: 'Date missing' },
  { value: 'E', label: 'Invalid type' },
  { value: 'F', label: 'Narration Blank' },
  { value: 'G', label: 'Invalid FCy' },
  { value: 'H', label: 'Invalid Transaction No' },
  { value: 'I', label: 'Cost Center Missing' },
  { value: 'J', label: 'Base Cy amount mis-match' },
  { value: 'K', label: 'Base Cy amount same for FCy' },
  { value: 'L', label: 'dr/cr total mis-match' },
];
