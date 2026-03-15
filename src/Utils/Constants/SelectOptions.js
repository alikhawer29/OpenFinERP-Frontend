export const statusClassMap = {
  Active: 'success',
  active: 'success',
  unblock: 'success',
  unblocked: 'success',
  approve: 'success',
  approved: 'success',
  Approved: 'success',
  open: 'info',
  'discounted_collection': 'warning',
  settled: 'success',
  settle: 'success',
  'return unpaid': 'warning',
  expiring: 'warning',
  hold: 'yellow',
  pending: 'warning',
  revert: 'danger',
  pay: 'warning',
  post: 'danger',
  collection: 'warning',
  Cancelled: 'danger',
  cancelled: 'danger',
  Disapproved: 'danger',
  disapproved: 'danger',
  unapproved: 'danger',
  'un-approved': 'danger',
  Inactive: 'danger',
  inactive: 'danger',
  block: 'danger',
  expired: 'danger',
  blocked: 'danger',
  rejected: 'danger',
  edit: 'warning',
  delete: 'danger',
  approvebtn: 'yellow',
  holdbtn: 'warning',
  postbtn: 'success',
  'cancel postingbtn': 'danger',
};
export const dateRangeSelectOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'past6months', label: '6 Months' },
  { value: 'yearly', label: 'Yearly' },
];
export const dateRangeSelectBudgetOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];
export const notificationOptions = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];
export const filterActiveAndInactive = [
  { value: 'All', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
export const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
export const sortingOptions = [
  {
    value: '10',
    label: '10',
  },
  {
    value: '25',
    label: '25',
  },
  {
    value: '50',
    label: '50',
  },
  {
    value: '100',
    label: '100',
  },
];
export const ledgerOptions = [
  { label: 'PL', value: 'party' },
  { label: 'GL', value: 'general' },
  { label: 'WIC', value: 'walkin' },
];
export const idTypeOptions = [
  {
    value: 'Emirates ID',
    label: 'Emirates ID',
  },
  {
    value: 'Driving License',
    label: 'Driving License',
  },
];
export const rateTypeOptions = [
  {
    value: 'Multiply',
    label: 'Multiply',
  },
  {
    value: 'Divide',
    label: 'Divide',
  },
];
export const currencyTypeOptions = [
  {
    value: 'Regular Currency',
    label: 'Regular Currency',
  },
  {
    value: 'Crypto Currency',
    label: 'Crypto Currency',
  },
  {
    value: 'Gold Coin',
    label: 'Gold Coin',
  },
];
export const currencyPairs = [
  { id: 1, currency: 'CNY', agcy: 'RUB' },
  { id: 2, currency: 'CNY', agcy: 'TMN' },
  { id: 3, currency: 'CNY', agcy: 'TRL' },
  { id: 4, currency: 'CNY', agcy: 'USD' },
  { id: 5, currency: 'CNY', agcy: 'DHS' },
  { id: 6, currency: 'CNY', agcy: 'EUR' },
  { id: 7, currency: 'DHS', agcy: 'EUR' },
  { id: 8, currency: 'DHS', agcy: 'CNY' },
  { id: 9, currency: 'DHS', agcy: 'USD' },
  { id: 10, currency: 'DHS', agcy: 'TRL' },
  { id: 11, currency: 'DHS', agcy: 'TMN' },
  { id: 12, currency: 'DHS', agcy: 'RUB' },
  { id: 13, currency: 'EUR', agcy: 'RUB' },
  { id: 14, currency: 'EUR', agcy: 'TMN' },
  { id: 15, currency: 'EUR', agcy: 'TRL' },
];

// Transaction Type

export const transactionTypeOptions = [
  { label: 'All', value: '' },
  { label: 'JV', value: 'JV' },
  { label: 'RV', value: 'RV' },
  { label: 'PV', value: 'PV' },
  {
    label: 'BDV',
    value: 'BDV',
  },
  {
    label: 'BWV',
    value: 'BWV',
  },
  {
    label: 'A2A',
    value: 'A2A',
  },
  {
    label: 'IPV',
    value: 'IPV',
  },
  {
    label: 'CBS',
    value: 'CBS',
  },
  {
    label: 'TBN',
    value: 'TBN',
  },
  {
    label: 'TSN',
    value: 'TSN',
  },
  {
    label: 'TRQ',
    value: 'TRQ',
  },
  {
    label: 'FSN',
    value: 'FSN',
  },
  {
    label: 'FBN',
    value: 'FBN',
  },
  {
    label: 'DBN',
    value: 'DBN',
  },
  { label: 'DPV', value: 'DPV' },
  {
    label: 'SVR',
    value: 'SVR',
  },
  {
    label: 'SJV',
    value: 'SJV',
  },
  { label: 'TTR', value: 'TTR' },
  {
    label: 'PDCP',
    value: 'PDCP',
  },
  {
    label: 'PDCR',
    value: 'PDCR',
  },
];

export const transactionTypeLogsOptions = [
  { label: 'All', value: '' },
  { label: 'RV', value: 'receipt_voucher' },
  { label: 'JV', value: 'journal_voucher' },
  { label: 'PV', value: 'payment_voucher' },
  { label: 'IPV', value: 'internal_payment_voucher' },
  { label: 'SVR', value: 'suspense_voucher' },
  { label: 'BDV', value: 'deposit_voucher' },
  { label: 'BWV', value: 'withdrawal_voucher' },
  { label: 'BITTV', value: 'inward_voucher' },
  { label: 'PPV', value: 'pdcr_payment_voucher' },
  { label: 'SJV', value: 'suspense_posting' },
  { label: 'A2A', value: 'account_to_account' },
  { label: 'TSN', value: 'tmn_buy_currency_deal' },
  { label: 'TBN', value: 'tmn_sell_currency_deal' },
  { label: 'FBN', value: 'outward_remittance_register' },
  { label: 'DPV', value: 'debit_note_payment_voucher' },
  { label: 'FSN', value: 'outward_remittance' },
  { label: 'TRQ', value: 'currency_transfer_request' },
  { label: 'CBS', value: 'foreign_currency_deal' },
  { label: 'TTR', value: 'ttr_register' },
  { label: 'DBN', value: 'inward_payment_order' },
  { label: 'CA', value: 'credit_adjustment' },
];


export const transactionTypeOptionsWithName = [
  { value: 'all', label: 'All' },
  {
    value: 'journal_voucher',
    label: 'JV - Journal Voucher',
  },
  {
    value: 'receipt_voucher',
    label: 'RV - Receipt Voucher',
  },
  {
    value: 'payment_voucher',
    label: 'PV - Payment Voucher',
  },
  {
    value: 'bank_deposit_voucher',
    label: 'BDV - Bank Deposit Voucher',
  },
  {
    value: 'bank_withdrawal_voucher',
    label: 'BWV - Bank Withdrawal Voucher',
  },
  {
    value: 'pdcr_payment_voucher',
    label: 'PPV - PDCR Payment Voucher',
  },
  {
    value: 'account_to_account',
    label: 'A2A - Account To Account',
  },
  {
    value: 'internal_payment_voucher',
    label: 'IPV - Internal Payment Voucher',
  },
  {
    value: 'foreign_currency_deal',
    label: 'CBS - Foreign Currency Deal',
  },
  {
    value: 'tmn_sell_currency_deal',
    label: 'TBN - Touman Selling Note',
  },
  {
    value: 'tmn_buy_currency_deal',
    label: 'TSN - Touman Buying Note',
  },
  {
    value: 'currency_transfer_request',
    label: 'TRQ - Currency Transfer Request',
  },
  {
    value: 'outward_remittance',
    label: 'FSN - Outward Remittance',
  },
  {
    value: 'outward_remittance_register',
    label: 'FBN - Outward Remittance Register',
  },
  {
    value: 'inward_payment_order',
    label: 'DBN - Inward Payment Order',
  },
  {
    value: 'debit_note_payment_voucher',
    label: 'DPV - Debit Note Payment Voucher',
  },
  {
    value: 'suspense_voucher',
    label: 'SVR - Suspense Voucher',
  },
  {
    value: 'suspense_posting',
    label: 'SJV - Suspense Posting',
  },
  {
    value: 'telex_transfer_register',
    label: 'TTR - Telex Transfer Register',
  },
  {
    value: 'bank_inward_tt_voucher',
    label: 'BITTV - Bank Inward TT Voucher',
  },
  {
    value: 'credit_adjustment',
    label: 'CA - Credit Adjustment',
  },
];

export const transactionLogsUserOptions = [
  { value: '1', label: 'User 1' },
  { value: '2', label: 'User 2' },
];
export const transactionLogsActionOptions = [
  { value: '', label: 'All' },
  { value: 'edit', label: 'Edited' },
  { value: 'delete', label: 'Deleted' },
];
// PDC Process
export const PDCProcessOpenTypeOptions = [
  { value: 'settled_on_due_date', label: 'Settled on due date' },
  { value: 'cancelled_on_due_date', label: 'Cancelled on due date' },
  { value: 'discount_through_bank', label: 'Discount Through Bank' },
  {
    value: 'collection_given_to_bank',
    label: 'Collection - Given to Bank on Collection Basis',
  },
];
export const PDCProcessSettledTypeOptions = [
  { value: 'recall_settled_cheque', label: 'Recall a Settled Cheque' },
  {
    value: 'cancel_settled_cheque',
    label: 'Cancel a Settled Cheque (Mark as Open Cheque)',
  },
];
export const PDCProcessDiscountCollectionTypeOptions = [
  { value: 'settled_on_due_date', label: 'Settled on due date' },
  { value: 'cancelled_on_due_date', label: 'Cancelled on due date' },
];
export const PDCProcessCollectionTypeOptions = [
  { value: 'settled_on_due_date', label: 'Settled on due date' },
  { value: 'cancelled_on_due_date', label: 'Cancelled on due date' },
];
export const PDCProcessCancelledTypeOptions = [
  { value: 'recall_cancelled_cheque', label: 'Recall a Cancelled Cheque' },
];
export const PDCProcessPayableOpenTypeOptions = [
  { value: 'settled_on_due_date', label: 'Settled on due date' },
  { value: 'cancelled_on_due_date', label: 'Cancelled on due date' },
];
export const PDCProcessPayableSettledTypeOptions = [
  { value: 'recall_settled_cheque', label: 'Recall a Settled Cheque' },
];
export const PDCProcessPayableCancelledTypeOptions = [
  { value: 'recall_cancelled_cheque', label: 'Recall a Cancelled Cheque' },
];
export const PDCProcessReceivableFilterOptions = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Settled', value: 'settled' },
  { label: 'Discounted Collection', value: 'discounted_collection' },
  { label: 'Collection', value: 'collection' },
  { label: 'Cancelled', value: 'cancelled' },
];
// Outward Remittance
export const settleThruOptions = [
  { label: 'On A/C', value: 'on_account' },
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
  { label: 'PDC', value: 'pdc' },
];
export const payTypeOptions = [
  { label: 'Cash Deposit', value: 'cash_deposit' },
  { label: 'Cash Payment', value: 'cash_payment' },
  { label: 'Cheque Deposit', value: 'cheque_deposit' },
  { label: 'Cheque Payment', value: 'cheque_payment' },
  { label: 'PDC', value: 'pdc' },
  // { label: 'Online', value: 'online' },
];
export const transactionApprovalTypes = [
  {
    value: '',
    label: 'All',
  },
  {
    value: 'JV',
    label: 'JV',
  },
  {
    value: 'RV',
    label: 'RV',
  },
  {
    value: 'PV',
    label: 'PV',
  },
  {
    value: 'A2A',
    label: 'A2A',
  },
  {
    value: 'CBS',
    label: 'CBS',
  },
  {
    value: 'TSN/TBN',
    label: 'TSN/TBN',
  },
  {
    value: 'TRQ',
    label: 'TRQ',
  },
  {
    value: 'FSN',
    label: 'FSN',
  },
  {
    value: 'FBN',
    label: 'FBN',
  },
];

export const transactionTypeStatus = [
  {
    label: "All",
    value: ""
  },
  {
    label: "Pending",
    value: "pending"
  },
  {
    label: "Approved",
    value: "approved"
  },
  {
    label: "Unapproved",
    value: "un-approved"
  }
]
export const supportStatusOptions = [
  {
    label: "Pending",
    value: "pending"
  },
  {
    label: "Resolved",
    value: "resolved"
  },
  {
    label: "Cancelled",
    value: "cancelled"
  }
]