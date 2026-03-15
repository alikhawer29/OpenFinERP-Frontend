export const AttachmentIcon = 'ATTACHMENT_ICON'; // Special marker for attachment icon
const user = JSON.parse(localStorage.getItem('user-storage'))

export const subscriptionLogsHeaders = [
  'S. No.',
  'Subscription Title',
  'Amount',
  'Subscription Date',
  'Expiry Date',
  'Status',
];

export const warehouseHeaders = ['Code', 'Name', 'Creation Date', 'Action'];

export const classificationMasterHeaders = [
  'S. No.',
  {
    title: 'Classification',
    key: 'classification',
  },
  'Description',
  'Action',
];

export const cbClassificationMasterHeaders = [
  'S. No.',
  'Group',
  'Title',
  'Action',
];

export const commisionMasterHeaders = [
  'Account Type',
  'Acccount Name',
  'Commission Type',
  'Receipts',
  'Payments',
  'TMN Buy Remittance',
  'TMN Sell Remittance',
  'Currency Transfer Request (TRQ) ',
  'Outward Remittance',
  'Currency Buy/Sell',
  'Inward Remittance(DBN)',
  'Action',
];

export const costCenterRegisterHeaders = [
  'Code',
  'Description',
  'Group',
  'Default',
  'Action',
];
export const walkInCustomerHeaders = [
  'Customer Name',
  'Company',
  'Mobile Number',
  'Nationality',
  'ID Type',
  'ID No.',
  'Expiry Date',
  'Status',
  'City',
  'Action',
];

export const walkInHeaders = [
  'Name',
  'Address',
  'Telephone Number',
  'Mobile Number',
  'Nationality',
  'ID Type',
  'ID No.',
  'Expiry Date',
];

export const beneficiaryRegisterHeaders = [
  'Beneficiary Name',
  'Beneficiary Address',
  'Account',
  'Nationality',
  'Purpose',
  'Action',
];

export const partyLedgerHeaders = [
  'Account Code',
  'Account Name',
  'Telephone Number',
  'Mobile Number',
  'Debit Limit',
  'Classification',
  'Status',
  'Action',
];

export const currencyRegisterHeaders = [
  'Currency',
  'Currency Name',
  'Rate Type',
  'Rate Variation (%)',
  'Currency Type',
  'Allow Online Rate',
  'Allow Auto-Pairing',
  'Allow Second Preference',
  'Special Rate Currency',
  'Restrict Pair',
  'Group',
  'Action  ',
];

export const tellerRegisterHeaders = [
  'Code',
  'Till Assigned to User',
  'Cash A/C',
  'Action',
];

export const countryRegisterHeaders = ['Code', 'Country', 'Action'];

export const officeLocationMasterHeaders = [
  'S.No',
  'Office Location',
  'Action',
];

export const groupMasterHeaders = [
  'Code',
  'Group Type',
  'Description',
  'Action',
];

export const salesmanHeaders = [
  'Code',
  'Name',
  'User ID',
  // 'Creation Date',
  'Action',
];

export const attachmentsTableHeaders = ['S.No', 'File Name', 'Action'];

export const documentRegisterHeaders = [
  'Grp',
  'Type',
  'Description',
  'Number',
  'Issue Date',
  'Due Date',
  'User ID',
  'Last Updated',
  'Action',
];

export const documentRegisterAdminHeaders = [
  'Grp',
  'Type',
  'Description',
  'Number',
  'Issue Date',
  'Due Date',
  'Last Updated',
  'Action',
];

export const userManagementHeaders = [
  'S. No.',
  'Business ID',
  'Business Name',
  'Contact Person',
  'User ID',
  'Phone No.',
  'Email Address',
  'Reg. Date',
  'Status',
  'Action',
];

export const branchLogHeaders = [
  'S. No.',
  'Name',
  'Users',
  'Address',
  'Manager',
  'Supervisor',
  'Base Currency',
  'Status',
];

export const unlockRequestHeaders = [
  'Request Date Time',
  'Requestor Name',
  'Approval /Rejection Date TIme',
  'Status',
  'Action',
];

export const unlockRequestAdminHeaders = [
  'Request Date Time',
  'Requestor Name',
  'Approval /Rejection Date TIme',
  'Action',
];

export const subscriptionManagemenAdminHeaders = [
  'S.No.',
  'Subscription Name',
  'Number of Users',
  'Branches',
  'Price Monthly',
  'Price Yearly',
  'Modification Date',
  'Action',
];

export const subscriptionManagementCustomHeaders = [
  'S.No.',
  'Subscription Name',
  'Number of Users',
  'Business ID',
  'Branches',
  'Price Monthly',
  'Price Yearly',
  'Modification Date',
  'Action',
];

export const subscriptionRequestHeaders = [
  'S.No.',
  'Business Name',
  'Email',
  'Expected No. of Users',
  'Expected No. of Branches',
  'Status',
  'Action',
];

export const adminSubscriptionLogsHeaders = [
  'S.No.',
  'Business Name',
  'Subscription Name',
  'No Of Branches',
  "No Of Users",
  'Amount',
  'Subscription Type',
  'Subscription Date',
  'Status',
];

export const supportManagementHeaders = [
  'S.No.',
  'Supprt Type',
  'Creation Date',
  'Action',
];

export const supportLogsHeaders = [
  'S.No.',
  'Name',
  'Email',
  'Support Type',
  'Date',
  'Status',
  'Resolved / Cancelled By',
  'Action',
];

export const supportLogsAdminHeaders = [
  'S.No.',
  'Name',
  'Email',
  'Support Type',
  'Date',
  'Action',
];

export const userMaintenanceHeaders = [
  // 'ID',
  'S.No.',
  'User ID',
  'User Name',
  'Phone Number',
  'Status',
  'Action',
];

export const userDowngradeHeaders = [
  // 'ID',
  'S.No.',
  'User ID',
  'User Name',
  'Phone Number',
  'Status',
  'Action',
];

export const branchDowngradeHeaders = [
  'S.No.',
  'Name',
  'Address',
  'Manager',
  'Supervisor',
  'Base Currency',
  'Status',
  'Action',
];

export const branchManagementHeaders = [
  'S.No.',
  'Name',
  'Address',
  'Manager',
  'Supervisor',
  'Base Currency',
  'Status',
  'Action',
];

export const vatRateHeaders = ['Title/Description', 'VAT Percentage', 'Action'];

export const userLogsHeaders = ['S.No.', 'User ID', 'Login Date/Time'];

export const transactionNumberHeaders = [
  'Transaction Type',
  'Prefix',
  'Starting No.',
  'Next Tran. No.',
  'Transaction Number Limit',
  'Action',
];

export const transactionNumberHeadersAccess = [
  'Transaction Type',
  'Prefix',
  'Starting No.',
  'Next Tran. No.',
  'Transaction Number Limit',
];

export const unlockRequestLogsHeaders = [
  'Request Date Time',
  'Requestor Name',
  'Approval /Rejection Date TIme',
  'Status',
  'Action',
];

export const chequeRegisterHeaders = [
  'S.No.',
  'Cheque Number',
  'Bank',
  'Tran. No.',
  'Transaction Date',
  'Issued To',
  'Amount',
  'Reference No',
  'Status',
  'Action',
];

export const chequeRegisterHeadersAccess = [
  'S.No.',
  'Cheque Number',
  'Bank',
  'Tran. No.',
  'Transaction Date',
  'Issued To',
  'Amount',
  'Reference No',
  'Status',
];

export const transactionLogsHeaders = [
  'S.No.',
  'Transaction Type',
  'Number',
  'Transaction Date',
  'Modification Date',
  'Modification Time',
  'User ID',
  'Action Type',
];

export const allMaturityAlertTabs = [
  'PDCs',
  'FC Remittance',
  'Debit Note Payment',
  'Documents',
];

export const maturityAlertPDCHeaders = [
  'PDC',
  'Due Date',
  'Chq.No',
  'FCy',
  'FC Amount',
  'Party',
  'Bank',
];

export const maturityAlertFCRemittanceHeaders = [
  'FSN Number',
  'Due Date',
  'Account Name',
  'Beneficiary',
  'FCy',
  'FC amount',
  'Ag FCy',
  'Ag FCy Amount',
  'FC Balance Amount',
];

export const maturityAlertDebitNoteHeaders = [
  'DBN Number',
  'Due Date',
  'Sender',
  'Beneficiary',
  'Currency',
  'FC Total',
  'FC Balance Amount',
];

export const maturityAlertDocumentHeaders = [
  'Grp',
  'Type',
  'Description',
  'Number',
  'Issue Date',
  'Due Date',
];

export const systemIntegrityHeaders = [
  'Type',
  'Number',
  'Date',
  'Title of Account',
  'Narration',
  'FCy',
  'FC Amount',
  'LC Debit',
  'LC Credit',
  'C/C',
  'User ID',
  'Issue Description',
];

export const dealRegisterUpdationHeaders = [
  'Date',
  'FCy',
  'Account',
  'Deal Register',
  'Counter',
  'Difference',
];

export const pdcProcessHeaders = [
  'Cheque No.',
  'Due Date',
  'Posting Date',
  'FCy',
  'FC Amount',
  'Drawn on',
  'Title of Account',
  'Narration',
  'Status',
  'Action',
];

export const pdcrPaymentPostingHeaders = [
  'Cheque No.',
  'Dated',
  'FCy',
  'FC Amount',
  'Received From',
  'Issued To',
  'Action',
];

export const pdcrPaymentPostingHeadersRights = [
  'Cheque No.',
  'Dated',
  'FCy',
  'FC Amount',
  'Received From',
  'Issued To',
];

export const transactionApprovalHeaders = [
  'No.',
  'Date',
  'Debit Account',
  'Credit Account',
  'Trans. Type',
  'Fcy',
  'FC Amount',
  'User ID',
  'Approved by',
  'Received From/Paid To',
  'Comment',
  'Status',
  AttachmentIcon,
  'Action',
];

export const rateRevaluationHeaders = [
  'Group',
  'Currency',
  'FC Balance',
  'Valuation Rate',
  'Value in DHS',
  'Gain/Loss',
];

export const transactionLockHeaders = [
  'Trans. Type',
  'Trans. No',
  'Trans. Date',
  'Party',
  'FCy',
  'FC Amount',
  'Locked By',
  'Locked Date & Time',
  'Action',
];

export const journalVoucherHeaders = [
  'S.No.',
  'Ledger',
  'Account',
  'Narration',
  'Currency',
  'FC Amount',
  'Rate',
  'LC Amount',
  'Sign',
  'Action',
];

export const journalVoucherViewHeaders = [
  'S. No',
  'Ledger',
  'Account',
  'Narration',
  'Currency',
  'FC Amount',
  'LC Amount',
  'Rate',
  'Sign',
];

export const journalVoucherListHeaders = [
  'Date',
  'JV No.',
  'Ledger',
  'Account Name',
  'Narration',
  'Currency',
  'FC Amount',
  'LC Amount',
  'Sign',
  'User ID',
  'Time',
  AttachmentIcon,
];
export const remittanceRateOfExchangeHeaders = [
  'Currency',
  'Ag.FCy',
  'Buy Rate',
  'Buy From',
  'Buy Upto',
  'Sell Rate',
  'Sell From',
  'Sell Upto',
  'Action',
];

export const specialRateCurrencyHeaders = [
  'Currency',
  'Ag.FCy',
  'Buy Rate',
  'Buy From',
  'Buy Upto',
  'Sell Rate',
  'Sell From',
  'Sell Upto',
  'Action',
];

export const journalReportHeaders = [
  'Type',
  'Tran. No.',
  'Date',
  'Title of Account',
  'Narration',
  'FCY',
  'Debit',
  'Credit',
  'Base Amount',
  'C/C',
  'User ID',
  'Updated On',
  AttachmentIcon,
];

export const walkInCustomerStatementHeaders = [
  'Date',
  'Type',
  'Tran. No',
  'Narration',
  'FCY',
  'Debit',
  'Credit',
  'Balance',
  'Sign',
  'Value Date',
];

export const walkInCustomerAccountJournalHeaders = [
  'Title of Account',
  'Narration',
  'FCy',
  'Debit',
  'Credit',
];

export const walkInCustomerOutstandingBalanceHeaders = [
  'Title of Account',
  'FCy',
  'Debit',
  'Credit',
];

export const statementOfAccountsHeaders = [
  'Date',
  'Type',
  'Tran. No',
  'Narration',
  'FCY',
  'Debit',
  'Credit',
  'Balance',
  'Sign',
  'Value Date',
];

export const outstandingBalanceHeaders = [
  'Title of Account',
  'FCy',
  'Debit',
  'Credit',
];

export const generatedOutstandingBalanceHeaders = [
  'Title of Account',
  'FCy',
  'Debit',
  'Credit',
  'Base Currency Value',
];

export const expenseJournalHeaders = [
  'Type',
  'Tran. No.',
  'Date',
  'Account Title',
  'Narration',
  'FCy',
  'FCy Amount',
  'Base Currency Value',
  'User ID',
];

export const postDatedChequesHeaders = [
  'Title of Account',
  'Cheque No.',
  'Base Amount',
  'Due Date',
  'Drawn on',
  'Posting Date',
  'Status',
  'FCy',
  'FC Amount',
  'C/C',
  'Discount/Collection Bank',
];

export const vatTaxReportHeaders = [
  'Date',
  'Type',
  'Trans. No.',
  'Ledger',
  'Title of Account',
  'TRN',
  'Country',
  'State',
  'FCy',
  'FC Taxable Amount',
  'VAT %',
  'FC VAT Amount',
  'Base Taxable Amount',
  `Base VAT Amount (${user?.state?.user?.base_currency})`,
  'C/C',
];

export const vatTaxZeroReportHeaders = [
  'Date',
  'Type',
  'Trans. No.',
  'Ledger',
  'Title of Account',
  'TRN',
  'Country',
  'State',
  'FCy',
  'FC Taxable Amount',
  'VAT %',
  'FC VAT Amount',
  // 'Base Taxable Amount',
  // `Base VAT Amount (${user?.state?.user?.base_currency})`,
  // 'C/C',
];

export const vatTaxReportOutOfScopeHeaders = [
  'Date',
  'Type',
  'Tran. No.',
  'Ledger',
  'Account',
  'TRN',
  'Country',
  'State',
  'FCy',
  'FC Taxable Amount',
  'Base Taxable Amount',
  'Reason',
  'C/C',
];

export const vatTaxReportOtherOutputHeaders = [
  'Date',
  'Type',
  'Tran. No.',
  'Ledger',
  'Account',
  'TRN',
  'Country',
  'State',
  'FCy',
  'FC Taxable Amount',
  'VAT Term',
  'VAT %',
  'FC VAT Amount',
  'Base Taxable Amount',
  `Base VAT Amount (${user?.state?.user?.base_currency})`,
  'C/C',
];

export const VATSummaryReportHeaders = [
  'Description',
  'Base Taxable Amount',
  'VAT Amount',
];


export const budgetingForecastingReportHeaders = [
  'Metrics',
  'Projected',
  'Actual',
  'Variance',
];

// Budgeting Report (based on Budget Setup) headers
export const budgetingReportHeaders = [
  'Fiscal Year',
  'Month',
  'Account Group',
  'Account Name',
  'Budgeted Amount',
  'Actual Amount',
  'Variance (Budget vs Actual)',
  'Variance %',
  'Remarks',
  'Action',
];

export const yearlyBudgetingReportHeaders = [
  'Fiscal Year',
  'Account Group',
  'Account Name',
  'Budgeted Amount',
  'Actual Amount',
  'Variance (Budget vs Actual)',
  'Variance %',
  'Remarks',
  'Action',
];

export const currencyTransferRegisterReportHeaders = [
  'Tran No.',
  'Date',
  'Time',
  'From Account',
  'To Account',
  'Currency',
  'Amount',
  'Narration',
  'Net Total',
  'Doc Type',
  'Doc No.',
  'Bank',
  'City',
  'Code',
];

export const outwardRemittanceReportHeaders = [
  'Tran. Type',
  'Tran. No.',
  'Date',
  'Account',
  'Beneficiary',
  'FCy',
  'FC Amount',
  'Ag. FCy',
  'Rate',
  'Commission',
  'Doc. SWIFT',
  'Ag. FC Amount',
  'Confirmation Status',
  'Comment',
];

export const outwardRemittanceEnquiryHeaders = [
  'Tran. Type',
  'Tran. No.',
  'Date',
  'Account',
  'Beneficiary',
  'FCy',
  'FC Amount',
  'Ag. FCy',
  'Rate',
  'User Id',
  'Status',
  'Ag. FC Amount',
  'Opposing No.',
  'Opposing Acccount',
];

export const inwardRemittanceReportHeaders = [
  'Tran No.',
  'Tran Date',
  'Account',
  'Nationality',
  'Beneficiary Name',
  'Beneficiary Place of Work',
  'Beneficiary Nationality',
  'Beneficiary ID No.',
  'Contact Number',
  'Country of Origin',
  'Purpose',
  'FCy',
  'FC Amount',
  'LC Amount',
];

export const dealRegisterReportHeaders = [
  'Account',
  'Buy FCy',
  'Buy FC Amount',
  'Sell FCy',
  'Sell FC Amount',
  'Rate',
  'Convert Rate',
  'Tran.No.',
  'Value Date',
  'User ID',
  'Date',
  'Time',
];

export const accountTurnoverReportHeaders = [
  'Ledger',
  'Account',
  'Contact No.',
  'FCy',
  'Balance B/f',
  'Total Debit',
  'Total Credit',
  'Balance C/f',
];

export const exchangeProfitLossReportHeaders = [
  'Type',
  'Currency',
  'Op Balance',
  'Avg Op Rate',
  'Op in LC',
  'Total Buy',
  'Avg Buy Rate',
  'Buy in LC',
  'Total Sell',
  'Avg Sell Rate',
  'Sell in LC',
  'Cl Balance',
  'Avg Cl Rate',
  'Cl in LC',
  'Sales Value in LC',
  'Cost of Sale in LC',
  'Profit/Loss in LC',
];

export const dailyTransactionSummaryHeaders = [
  'Date',
  'Opening',
  'Avg. Op Rate',
  'Buy',
  'Avg. Buy Rate',
  'Sell',
  'Avg. Sell Rate',
  'Cl',
  'Avg. Cl Rate',
  'Sale Value in LC',
  'Cost of Sale in LC',
  'Difference',
];

export const exchangeProfitLossReportHeadersForCombine = [
  'Type',
  'Currency',
  'Op Balance',
  'Op Rate',
  'Op in LC',
  'Total Buy',
  'Avg Buy Rate',
  'Buy in LC',
  'Total Sell',
  'Avg Sell Rate',
  'Sell in LC',
  'Cl Balance',
  'Avg Cl LC',
  'Cl in LC',
  'Sales Value in LC',
  'Cost of Sale in LC',
  'Profit/Loss in LC',
];

export const accountEnquiryHeaders = [
  'Type',
  'Number',
  'Date',
  'Title of Account',
  'Narration',
  'Debit',
  'Credit',
  'FCy',
  'FC Amount',
];

export const financialReportHeaders = [
  'Account',
  'FCy',
  'FC Debit',
  'FC Credit',
  'LC Debit',
  'LC Credit',
];

export const inwardTTTableHeaders = [
  'Date',
  'BITTV No.',
  'Bank',
  'Ledger',
  'From Account',
  'FCy',
  'FC Amount',
  'LC Amount',
  'Comm. Type',
  'FC Commission',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const depositTableHeaders = [
  'Date',
  'BDV No.',
  'From Account',
  'To Account',
  'FCy',
  'FC Amount',
  'LC Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const withdrawalTableHeaders = [
  'Date',
  'BWV No.',
  'From Account',
  'To Account',
  'FCy',
  'FC Amount',
  'LC Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const pdcrTableHeaders = [
  '',
  'PDCR Party',
  'Cheque Number',
  'Due Date',
  'Currency',
  'FC Amount',
  'PDCR Bank',
];
export const pdcrViewTableHeaders = [
  'PDCR Party',
  'Cheque Number',
  'Due Date',
  'Currency',
  'FC Amount',
  'PDCR Bank',
];

export const searchTableHeaders = [
  'Date',
  'PPV No.',
  'Ledger',
  'PDCR Party',
  'PDCR Bank',
  'Cheque Number',
  'Due Date',
  'FCy',
  'FC Amount',
  'LC Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const searchTableHeadersForPdcr = [
  'PDCR Party',
  'Cheque Number',
  'Due Date',
  'Currency',
  'FC Amount',
  'PDCR Bank',
];

export const outwardRemittanceHeaders = [
  'Date',
  'FSN No.',
  'Dr. Ledger',
  'Dr. Account',
  'Ref. No.',
  'Beneficiary',
  'Sending FC',
  'Sending FC Amount',
  'Ag. FC',
  'Ag. Amount',
  'Charges',
  'VAT',
  'Net Total',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const outwardRemittanceRegisterHeaders = [
  'FSN No.',
  'Date',
  'Account Name',
  'Beneficiary',
  'FCy',
  'FC amount',
  'Ag FCy',
  'Ag FCy Amount',
  'Against TT',
  'FBN Account Name',
  'FC Payment Amount',
  'FC Balance Amount',
  'Pay from account',
  'Office Location',
  'Doc Swift',
  'Confirmation',
  'Status',
  'Approved By',
  'Comment',
  'Action',
];

export const applicationPrintingHeaders = [
  'FSN Number',
  'Date',
  'FCy',
  'Amount',
  'Beneficiary',
  'Account Name',
  'Account Number',
  'Status',
  'Action',
];

export const ttrRegisterBankDetailsHeaders = [
  'Date',
  'Credit Party',
  'Bank Name',
  'Bank Account',
  'Remarks',
  'Amount',
  'Allocated',
  'Unallocated',
  'Confirmed',
  'Unconfirmed',
  'User ID',
  'Action',
];

export const ttrRegisterAllocationHeaders = [
  'Date',
  'Debit Party',
  'Credit Party',
  'Bank Name',
  'Bank Account',
  'Remarks',
  'Allocated',
  'Confirmed',
  'Un-confirmed',
  'Action',
];

export const ttrRegisterAllocationUpdateHeaders = [
  'Date',
  'Credit Party',
  'Bank Name',
  'Bank Account',
  'Remarks',
  'Amount',
  'Allocated',
  'Un-allocated',
  'Confirmed',
];

export const ttrRegisterConfirmationHeaders = [
  'Date',
  'Debit Party',
  'Credit Party',
  'Bank Name',
  'Bank Account',
  'Remarks',
  'Allocated',
  'Confirmed',
  'Un-confirmed',
];

export const newTTRConfirmationHeaders = [
  'Doc Type',
  'Doc No.',
  'Narration',
  'TMN Amount',
];

export const suspenseVoucherNewHeaders = [
  'S. No.',
  'Narration',
  'Debit',
  'Credit',
  'Status',
  'Action',
];

export const suspenseVoucherHeaders = [
  'S. No.',
  'Narration',
  'Debit',
  'Credit',
  'Status',
];

export const suspenseVouchersTableHeaders = [
  'Date',
  'SVR No.',
  'Ledger',
  'Account Name',
  'FCy',
  'Debit Amount',
  'Credit Amount',
  'Status',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const suspencePostingHeaders = [
  'SVR No.',
  'Date',
  'Account',
  'Narration',
  'Currency',
  'Debit',
  'Credit',
  'SJV No.',
  'Posted Account',
  'Approved by',
  'Action',
];

export const allocationTableHeaders = [
  'Sell No',
  'Account Name',
  'Amount',
  'Doc Type',
  'Number',
  'Bank',
  'Code',
  'City',
  'Description',
  'Action',
];

export const currencyTransferNewHeaders = [
  'S. No.',
  'Currency',
  'Amount',
  'Narration',
  'Doc. Type',
  'Doc. No.',
  'Bank',
  'City',
  'Code',
  'Action',
];

export const currencyTransferTableHeaders = [
  'Date',
  'TRQ No.',
  'Dr. Ledger',
  'Debit Account',
  'Cr. Ledger',
  'Credit Account',
  'Doc. Type',
  'Doc. No.',
  'Bank',
  'City',
  'FCY',
  'FC Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const summaryTableHeaders = ['', 'FC Amount', '@Rate', 'Base Value'];

export const dealRegistryHeaders = [
  'Account',
  'Buy',
  'Sell',
  'AG FCY',
  'AG FC Amt.',
  'Rate',
  'User ID',
  'Convert Rate',
  'Tran. No.',
  'Value Date',
  'Description',
  'Balance'
];

export const positionSummaryHeaders = [
  'Currency',
  'Currency Name',
  'FC Opening',
  'FC Buy',
  'FC Sell',
  'FC Closing',
  'Avg Closing Rate',
];

export const inwardPaymentOrderNewHeaders = [
  'S. No.',
  'Ref.No.',
  'Pay Type',
  'Beneficiary',
  'Sender',
  'ID No.',
  'Contact No.',
  'Currency',
  'FC Amount',
  'Commission',
  'Pay Date',
  'Bank Name',
  'Bank Account',
  'Narration',
  'Action',
];

export const walkInSearchHeaders = [
  'Name',
  'Address',
  'Telephone Number',
  'Mobile Number',
  'ID Type',
  'ID Number',
  'Expiry Date',
];

export const SUMMARY_TABLE_HEADERS = [
  'Currency',
  'Total',
  'Commission',
  'VAT Amount',
  'Net Total',
];

export const inwardPaymentOrderTableHeaders = [
  'Date',
  'DBN No.',
  'Dr. Ledger',
  'Dr. Account',
  'Ref. No.',
  'Pay Type',
  'Pay Date',
  'Beneficiary',
  'Sender',
  'FCy',
  'FC Amount',
  'Commission',
  'VAT',
  'Net Total',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const inwardPaymentCancellationHeaders = [
  'DBN No.',
  'Settlement No',
  'Pay Date',
  'Account',
  'Beneficiary',
  'Mode',
  'Currency',
  'FC Amount',
  'Paid By',
  'Action',
];

export const inwardPaymentHeaders = [
  'Pay Date',
  'Beneficiary',
  'ID Number',
  'Sender',
  'Contact No',
  'Currency',
  'FC Balance Amount',
  'FC Total',
  'Ref No.',
  'Debit Note Number',
  'Debit Note Date',
  'Debit Party',
  'Pay Type',
  'Bank',
  'Detail',
  'Comment',
  'Action',
];

export const paymentVoucherHeaders = [
  'Date',
  'RV No.',
  'Ledger',
  'Account Name',
  'Mode',
  'Paid To',
  'Currency',
  'Amount',
  'FCy',
  'Amount',
  'Commission',
];

export const receiptVoucherTableHeaders = [
  'Date',
  'RV No.',
  'Ledger',
  'Account Name',
  'Received From',
  'FCy',
  'Amount',
  'Commission ',
  'VAT',
  'FCy Net Received',
  'LC Net Total',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const paymentVoucherTableHeaders = [
  'Date',
  'PV No.',
  'Ledger',
  'Account Name',
  'Paid To',
  'Mode',
  'Mode Account',
  'Currency',
  'Amount',
  'Commission ',
  'VAT',
  'FCy Net Received',
  'LC Net Total',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const specialComissionHeaders = [
  'S. No',
  'Ledger',
  'Credit Account',
  'Narration',
  'Percentage',
  'Amount',
  'Action',
];
export const specialCommissionHeaders = [
  'S. No',
  'Ledger',
  'Credit Account',
  'Narration',
  'Percentage',
  'Amount',
  'Action',
];

export const internalPaymentVoucherHeaders = [
  'S. No',
  'Ledger',
  'Debit Account',
  'Narration',
  'Amount',
  'VAT %',
  'VAT Amount',
  'Net Total',
  'Action',
];

export const internalPaymentVoucherTableHeaders = [
  'Date',
  'IPV No.',
  'Cr Ledger',
  'Credit Account',
  'Dr Ledger',
  'Debit Account',
  'FCy',
  'Amount',
  'VAT',
  'FC Net Total',
  'LC Net Total',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const cashAndBankBalanceHeaders = ['Account', 'FCy', 'Balance'];
export const accountToAccountTableHeaders = [
  'Date',
  'A2A No.',
  'Dr. Ledger',
  'Debit Account',
  'Cr. Ledger',
  'Credit Account',
  'FCy',
  'FC Amount',
  'LC Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];

export const fCDMultiDealHeaders = [
  'S. No.',
  'Debit Ledger',
  'Debit Account',
  'Credit Ledger',
  'Credit Account',
  'Buy FCy',
  'Buy FCy Amount',
  'Rate',
  'Sell FCy',
  'Sell FCy Amount',
  'Comm. Type',
  'Comm. Currency',
  'Comm. Amount',
  'Naration',
  AttachmentIcon,
  'Action',
];

export const fCDMultiDealSummaryHeaders = [
  'Buy FCy',
  'Total Buy FCy Amount',
  'Sell FCy',
  'Total Sell FCy Amount',
];

export const foreignCurrencyDealHeaders = [
  'Date',
  'CBS No.',
  'Dr. Ledger',
  'Debit Account',
  'Cr. Ledger',
  'Credit Account',
  'Buy FCy',
  'Buy FC Amount',
  'Rate',
  'Sell FCy',
  'Sell FC Amount',
  'Comm. FCy',
  'Comm. Amount',
  'User ID',
  'Time',
  AttachmentIcon,
];
export const budgetSetupHeaders = [
  'Fiscal Period',
  'Total Budget Amount',
  'Action',
];
export const budgetSetupHeadersAccess = [
  'Fiscal Period',
  'Total Budget Amount',
];
export const budgetSetupAccountsHeaders = [
  'Account Group',
  'Account Name',
  'Action',
];
export const budgetSetupEntriesHeaders = [
  'Fiscal Year',
  'Period',
  'Account Group',
  'Account Name',
  'Budget Amount',
  'Remarks',
  'Action',
];


export const groupClassificationHeaders = [
  'Group Name',
  'Ledger',
  'Creation Date',
  'Action'
];

export const upcomingSubscriptionRenewalHeaders = [
  'S.No.',
  'Business Name',
  'Subscription Name',
  'Subscription Date',
  'Renewal Date',
  'Remaining Days',
  'Renewal Status',
  'Last Emailed On',
  'Action',
];

export const customSubscriptionRequestHeaders = [
  'S.No.',
  'Business Name',
  'Email',
  'Expected No. of Users',
  'Expected No. of Branches',
  'Action',
];

export const subscriptionRequestsHeaders = [
  'S.No.',
  'Business Name',
  'Subscription Name',
  'Subscription Date',
  'Renewal Date',
  'Remaining Days',
  'Renewal Status',
  'Last Emailed On',
  'Action',
];

