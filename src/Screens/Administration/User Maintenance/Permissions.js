// prettier-ignore
export const newMasterPermissionOptions = {
  //  Masters
  'Chart of Account'           : ['View', 'Create', 'Edit', 'Delete'],
  'Document Register'          : ['View', 'Create', 'Edit', 'Delete'],
  'Party Ledger'               : ['View', 'Create', 'Edit', 'Delete'],
  'Salesman Register'          : [        'Create', 'Edit', 'Delete'],
  'Walk-in Customer'           : ['View', 'Create', 'Edit', 'Delete'],
  'Commission Master'          : [        'Create', 'Edit', 'Delete'],
  'Teller Register'            : [        'Create', 'Edit', 'Delete'],
  'Currency Register'          : ['View', 'Create', 'Edit', 'Delete'],
  'Classification Master'      : ['View', 'Create', 'Edit', 'Delete'],
  'Country Register'           : [        'Create',         'Delete'],
  'Wearhouse Master'           : [        'Create', 'Edit', 'Delete'],
  'Office Location Master'     : [        'Create', 'Edit', 'Delete'],
  'CB Classification Master'   : [        'Create', 'Edit', 'Delete'],
  'Group Master'               : ['View', 'Create', 'Edit', 'Delete'],
  'Beneficiary Register'       : ['View', 'Create', 'Edit'          ],
  'Cost Center Register'       : [        'Create', 'Edit', 'Delete'],
};

// prettier-ignore
export const newTransactionPermissionOptions = {
    
  //  Transactions
  'Journal Voucher'            : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Receipt Voucher'            : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Payment Voucher'            : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Internal Payment Voucher'   : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Bank Transactions'          : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Inward Payment Order'       : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'TKN Currency Deal'          : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Currency Transfer'          : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'POCR Payment Voucher'       : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Account to Account'         : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Suspense Voucher'           : ['View', 'Create', 'Edit', 'Delete', 'Print'],
  'Rate of Exchange'           : [        'Create', 'Edit', 'Delete'         ],
  'Outward Remittance'         : ['View', 'Create', 'Back to Back Entry', 'Edit', 'Delete', 'Print'],
  'Foreign Currency Deal'      : ['View', 'Create Single Deal', 'Create Multiple Deals', 'Edit', 'Delete', 'Print'],
  'Outward Remittance Register': ['Post', 'Edit', 'Delete', 'Print'],
  'TTR Register'               : ['Create', 'Edit', 'Delete', 'Print'],
  'Inward Payment Cancellation': ['Cancel Payment'],
  'Inward Payment'             : ['Pay', 'Print'],
  'Deal Register'              : ['Print'],
  'Suspense Posting'           : ['Post', 'Cancel Posting'],
  'Application Printing'       : ['Print'],
}

// prettier-ignore
export const newProcessPermissionOptions = {
  //  Process
  'PDC Processing'             : ['Process'],
  'Periodic Account Locking'   : ['Process'],
  'Balance Write-Off'          : ['Post'],
  'PDC Payment Processing'     : ['Settle', 'Return Unpaid', 'Revert'],
  'Profit & Loss Posting'      : ['Re-Calculate Closing Rate', 'Rate Re-Valuation', 'Profit & Loss Balance Conversion', 'Profit & Loss Posting', 'Print'],
  'Transaction Approval'       : [],
  'Transaction Lock Register'  : ['Rate Release', 'Delete'],
}

// prettier-ignore
export const newReportsPermissionOptions = {
  //  Reports
  'Journal Report'                      : ['View', 'Export to Excel', 'Export to PDF'],
  'Walk-in Customer Statement'          : ['View', 'Export to Excel', 'Export to PDF'],
  'Walk-in Customer Outstanding Balance': ['View', 'Export to Excel', 'Export to PDF'],
  'Outstanding Balance'                 : ['View', 'Export to Excel', 'Export to PDF'],
  'Expense Journal'                     : ['View', 'Export to Excel', 'Export to PDF'],
  'Cash & Bank Balance'                 : ['View', 'Export to Excel', 'Export to PDF'],
  'Post Dated Cheque Report'            : ['View', 'Export to Excel', 'Export to PDF'],
  'VAT Report'                          : ['View', 'Export to Excel', 'Export to PDF'],
  'Currency Transfer Register Report'   : ['View', 'Export to Excel', 'Export to PDF'],
  'Outward Remittance Report'           : ['View', 'Export to Excel', 'Export to PDF'],
  'Outward Remittance Enquiry'          : ['View', 'Export to Excel', 'Export to PDF'],
  'Inward Remittance Report'            : ['View', 'Export to Excel', 'Export to PDF'],
  'Deal Register Report'                : ['View', 'Export to Excel', 'Export to PDF'],
  'Account Turnover Report'             : ['View', 'Export to Excel', 'Export to PDF'],
  'Trial Balance'                       : ['View', 'Export to Excel', 'Export to PDF'],
  'Profit & Loss Statement'             : ['View', 'Export to Excel', 'Export to PDF'],
  'Balance Sheet'                       : ['View', 'Export to Excel', 'Export to PDF'],
  'Exchange Profit & Loss'              : ['View', 'Export to Excel', 'Export to PDF'],
  'Account Enquiry'                     : ['View', 'Export to Excel', 'Export to PDF'],
  'Statement of Account'                : ['View', 'Email As PDF', 'Email As Excel', 'Export to Excel', 'Export to PDF'],
  'Budgeting & Forecasting Report'      : ['View', 'Create Projection', 'Edit Projection', 'Export to Excel', 'Export to PDF'],

}

// prettier-ignore
export const newAdministrationPermissionOptions = {
  // Administration
  'User Maintenance'                    : ['View', 'Create', 'Edit', 'Delete', 'Block/Unblock'],
  'Password Reset'                      : ['Reset'], // should always be true
  'Branch Management'                   : ['View', 'Create', 'Edit', 'Delete', 'Block/Unblock'],
  'Cheque Register'                     : ['Create Cheque Book', 'Delete Cheque Book', 'Delete Single Cheque'],
  'Transaction Log'                     : ['Print'],
  'User Logs'                           : ['View'],
  'Branch Selection'                    : ['Access Branch A', 'Access Branch B', 'Access Branch C'],
  'Maturity Alert'                      : ['Print'],
  'System Integrity Check'              : ['View'],
  'Deal Register Updation'              : ['Update Deal Register'],
  'Subscription Logs'                   : ['View Subscription Logs', 'Renew Subscription', 'Change Subscription', 'Request Custom Subscription', 'Buy Custom Subscription'],
  'Transaction Number Register'         : ['Edit'],
}

// You can also create an initial state object for all  set to false
export const getInitialPermissionState = () => {
  const initialState = {};

  Object.entries(newMasterPermissionOptions).forEach(([section, actions]) => {
    initialState[section] = actions.reduce(
      (acc, action) => ({
        ...acc,
        [action]: false,
      }),
      {}
    );
  });

  return initialState;
};
