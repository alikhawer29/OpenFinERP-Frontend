import * as Yup from 'yup';

export const signUpValidationSchema = Yup.object().shape({
  business_name: Yup.string()
    .required('Business Name is required')
    .max(50, 'Business Name must be at most 50 characters'),
  user_name: Yup.string()
    .required('Full Name is required')
    .matches(
      /^[a-zA-Z]+(?: [a-zA-Z]+)*$/,
      'Full Name must contain only letters'
    )
    .max(39, 'Full Name must be at most 39 characters'),
  user_id: Yup.string()
    .required('User ID is required')
    .max(30, 'User ID must be at most 30 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be atleast 8 characters long'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Please re-enter your new password'),
});
export const changePasswordValidation = Yup.object().shape({
  current_password: Yup.string().required('Current Password is required'),
  password: Yup.string()
    .required('New Password is required')
    .min(8, 'Password must be atleast 8 characters long'),
  password_confirmation: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('password'), null], 'Passwords do not match.')
    .label('Confirm Password'),
});
export const loginValidationSchema = Yup.object().shape({
  user_id: Yup.string().required('User ID is required'),
  password: Yup.string()
    // .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});
export const adminLoginValidationSchema = Yup.object().shape({
  email: Yup.string().required('Email is required'),
  password: Yup.string()
    // .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});
export const forgotEmail = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email address is required'),
});
export const forgotCode = Yup.object().shape({
  verificationCode: Yup.string()
    .required('Verification code is required')
    .matches(/^\d{4}$/, 'Verification code must be 4 digits'),
});
export const forgotPassword = Yup.object().shape({
  password: Yup.string()
    // .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  password_confirmation: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .label('Confirm Password'),
});
export const supportFormSchema = Yup.object().shape({
  name: Yup.string().required('Full Name is required'),
  email: Yup.string().required('Email is required'),
  support_type: Yup.string().required('Support Type is required'),
  message: Yup.string().required('Message is required'),
  contact_no: Yup.string()
    .required('Contact number is required')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid contact number'),
  files: Yup.array()
    .min(1, 'At least one attachment is required')
    .of(Yup.mixed().required('Attachments are required.')),
});
export const NewRequestValidationSchema = Yup.object().shape({
  user_id: Yup.string().required('User ID is required'),
  contact_no: Yup.string()
    .required('Contact number is required')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid contact number'),
  support_type: Yup.string().required('Support Type is required'),
  message: Yup.string().required('Message is required'),
  status: Yup.string().required('Status is required'),
  files: Yup.array()
    .min(1, 'At least one attachment is required')
    .of(Yup.mixed().required('Attachments are required.')),
});

export const addWalkInCustomerValidationSchema = Yup.object().shape({
  customer_name: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, 'Customer name must contain only letters')
    .required('Customer name is required')
    .max(30, 'Customer name cannot exceed 30 characters'),
  company: Yup.string().required('Company name is required'),
  city: Yup.string().required('City is required'),
  mobile_number: Yup.string()
    .required('Mobile number is required')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid mobile number'),
  telephone_number: Yup.string()
    .required('Telephone number is required')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid telephone number'),
  email: Yup.string().nullable().email('Invalid email format'),
  id_type: Yup.string().required('ID type is required'),
  id_number: Yup.string().required('ID number is required'),
  // issue_date: Yup.date()
  //   .required('Issue date is required')
  //   .typeError('Invalid date format'),
  // expiry_date: Yup.date()
  //   .required('Expiry date is required')
  //   .typeError('Invalid date format')
  //   .min(Yup.ref('issue_date'), 'Expiry date must be after issue date'),
  vat_trn: Yup.string()
    .matches(
      /^[a-zA-Z0-9\s]+$/, // Only allows letters, numbers, and spaces
      'Field cannot contain special characters'
    )
    .nullable(),
  nationality: Yup.string().required('Nationality is required'),
  status: Yup.string().required('Status is required'),
});
export const addCurrencyRegisterValidationSchema = Yup.object().shape({
  currency_code: Yup.string().required('Currency Code is required'),
  currency_name: Yup.string().required('Currency Name is required'),
  rate_type: Yup.string().required('Rate Type is required'),
  currency_type: Yup.string().required('Currency Type is required'),
  rate_variation: Yup.number().required('Rate Variation is required'),
  allow_online_rate: Yup.string(),
  allow_auto_pairing: Yup.string(),
  allow_second_preference: Yup.string(),
  special_rate_currency: Yup.string(),
  restrict_pair: Yup.string(),
});
export const editCurrencyRegisterValidationSchema = Yup.object().shape({
  currency_code: Yup.string().required('Currency Code is required'),
  currency_name: Yup.string().required('Currency Name is required'),
  rate_type: Yup.string().required('Rate Type is required'),
  currency_type: Yup.string().required('Currency Type is required'),
  rate_variation: Yup.number().required('Rate Variation is required'),
  // group: Yup.string().required('Group is required'),
  allow_online_rate: Yup.string(),
  allow_auto_pairing: Yup.string(),
  allow_second_preference: Yup.string(),
  special_rate_currency: Yup.string(),
  restrict_pair: Yup.string(),
});
export const newWareHouseSchema = Yup.object({
  name: Yup.string().required('Warehouse name is required'),
});
export const addClassificationSchema = Yup.object({
  classification: Yup.string().required('Classification required'),
  description: Yup.string().required('Description is required'),
});
export const addClassificationTypeSchema = Yup.object({
  type: Yup.string().required('Classification type is required'),
});
export const addPartyLedgerClassificationSchema = Yup.object({
  classification: Yup.string().required('Classification is required'),
});
export const addBeneficiaryRegisterValidationSchema = Yup.object().shape({
  account: Yup.string().required('Account is required'),
  type: Yup.string().required('Type is required'),
  name: Yup.string()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  company: Yup.string()
    .nullable()
    .min(2, 'Company name must be at least 2 characters'),
  contact_no: Yup.string()
    .nullable()
    .min(8, 'Contact number must be at least 8 digits')
    .max(15, 'Contact number cannot exceed 15 digits'),
  bank_account_number: Yup.string()
    .nullable()
    .matches(/^[0-9]+$/, 'Bank account number must be numeric'),
  // swift_bic_code: Yup.string()
  //   .nullable()
  //   .matches(/^[A-Za-z0-9]{8,11}$/, 'Invalid SWIFT/BIC code'),
  swift_bic_code: Yup.string()
    .nullable()
    .test('is-valid-swift', 'Invalid SWIFT/BIC code', (value) => {
      if (!value) return true;
      if (value.length < 8) return true;
      return /^[A-Za-z0-9]{8,11}$/.test(value);
    }),
  routing_number: Yup.string()
    .nullable()
    .matches(/^[0-9]+$/, 'Routing number must be numeric'),
  // iban: Yup.string()
  //   .nullable()
  //   .matches(/^[A-Za-z0-9]{15,34}$/, 'Invalid IBAN format'),
  iban: Yup.string()
    .nullable()
    .test('is-valid-swift', 'Invalid IBAN format', (value) => {
      if (!value) return true;
      if (value.length < 15) return true;
      return /^[A-Za-z0-9]{15,34}$/.test(value);
    }),
  corresponding_bank_account_number: Yup.string()
    .nullable()
    .matches(/^[0-9]+$/, 'Corresponding bank account number must be numeric'),
  // corresponding_swift_bic_code: Yup.string()
  //   .nullable()
  //   .matches(/^[A-Za-z0-9]{8,11}$/, 'Invalid corresponding SWIFT/BIC code'),
  corresponding_swift_bic_code: Yup.string()
    .nullable()
    .test('is-valid-swift', 'Invalid corresponding SWIFT/BIC code', (value) => {
      if (!value) return true;
      if (value.length < 8) return true;
      return /^[A-Za-z0-9]{8,11}$/.test(value);
    }),
  corresponding_routing_number: Yup.string()
    .nullable()
    .matches(/^[0-9]+$/, 'Corresponding routing number must be numeric'),
  corresponding_iban: Yup.string()
    .nullable()
    .test('is-valid-swift', 'Invalid corresponding IBAN format', (value) => {
      if (!value) return true;
      if (value.length < 15) return true;
      return /^[A-Za-z0-9]{15,34}$/.test(value);
    }),
  // corresponding_iban: Yup.string()
  //   .nullable()
  //   .matches(/^[A-Za-z0-9]{15,34}$/, 'Invalid corresponding IBAN format'),
  purpose: Yup.string().nullable(),
  ifsc_code: Yup.string()
    .nullable()
    .matches(/^[A-Za-z0-9]{11}$/, 'Invalid IFSC code'),
});
export const addCBClassificationSchema = Yup.object({
  group: Yup.string().required('Group required'),
  title: Yup.string().required('Title is required'),
});
export const addCommissionValidationSchema = Yup.object().shape({
  account_type: Yup.string().required('Account Type name is required'),
  account: Yup.string().required('account is required'),
  commission_type: Yup.string().required('Commission type is required'),
  receipt_percentage: Yup.string().required('Receipt percentage is required'),
  payment_percentage: Yup.string().required('Payment percentage is required'),
  tmn_buy_remittance_percentage: Yup.string().required(
    'TMN buy remittance percentage is required'
  ),
  tmn_sell_remittance_percentage: Yup.string().required(
    'TMN sell remittance percentage is required'
  ),
  currency_transfer_request_percentage: Yup.string().required(
    'Currency transfer request percentage is required'
  ),
  outward_remittance_percentage: Yup.string().required(
    'Outward remittance percentage is required'
  ),
  currency_buy_sell_percentage: Yup.string().required(
    'Currency buy/sell percentage is required'
  ),
  inward_remittance_percentage: Yup.string().required(
    'Inward remittance percentage is required'
  ),
});
export const addCostCenterRegisterValidationSchema = Yup.object({
  type: Yup.string().required('Title is required'),
  group: Yup.string().required('Group required'),
});

export const partyLedgerAccountValidationSchema = Yup.object().shape({
  account_title: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, 'Account Title must contain only letters') // Letters and spaces
    .max(30, 'Account Title cannot exceed 30 characters')
    .required('Account Title is required'),
  classification: Yup.string().required('Classification is required'),
  debit_posting_account: Yup.string().required(
    'Debit Posting Account is required'
  ),
  credit_posting_account: Yup.string().required(
    'Credit Posting Account is required'
  ),
});

export const userMaintenanceValidationSchema = Yup.object().shape({
  user_name: Yup.string().required('User Name is required'),

  user_id: Yup.string().required('User ID is required'),

  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),

  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must not exceed 20 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),

  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Confirm Password is required'),
});

export const partyLedgerContactValidationSchema = Yup.object().shape({
  company_name: Yup.string().required('Company Name is required'),
  telephone_number: Yup.string()
    .required('Telephone Number is required')
    .matches(/^\+?[1-9]\d{1,14}$/, 'Enter a valid telephone number'),
  fax: Yup.string()
    .nullable()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Enter a valid fax number'), // Optional but validated
  email: Yup.string().nullable().email('Enter a valid email'), // Optional but must be valid if entered
  mobile_number: Yup.string()
    .nullable()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Enter a valid mobile number'), // Optional but validated
});
export const partyLedgerIdValidationSchema = Yup.object().shape({
  id_type: Yup.string().required('ID Type is required'),
  id_number: Yup.string().required('ID Number is required'),
  issue_date: Yup.date()
    .required('Issue date is required')
    .typeError('Invalid date format'),
  valid_upto: Yup.date()
    .required('Expiry date is required')
    .typeError('Invalid date format')
    .min(Yup.ref('issue_date'), 'Expiry date must be after issue date'),
});
export const partyLedgerVatValidationSchema = Yup.object().shape({
  vat_trn: Yup.string()
    .matches(
      /^[a-zA-Z0-9.\s]+$/,
      'VAT TRN can only contain letters, numbers, decimal points and spaces'
    )
    .nullable('VAT TRN is required'),
  vat_country: Yup.string().nullable('VAT country is required'),
  vat_state: Yup.string().nullable('VAT state is required'),
});

export const addTellerRegisterValidationSchema = Yup.object().shape({
  till_assigned_to_user: Yup.string().required(
    'Till Assigned To User is required'
  ),
  cash_account: Yup.string().required('Cash Account is required'),
});
export const addCountryValidationSchema = Yup.object({
  country: Yup.string().required('Country is required'),
});
export const addOfficeLocationValidationSchema = Yup.object({
  office_location: Yup.string().required('Office Location is required'),
});
export const addGroupMasterValidationSchema = Yup.object({
  group_type: Yup.string().required('Group Type is required'),
  description: Yup.string().required('Description is required'),
});
export const addSalesmanValidationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .max(30, 'Name must be at most 30 characters long'),
});
export const addDocumentRegisterValidationSchema = Yup.object({
  group_name: Yup.string().required('Group is required'),
  type: Yup.string().required('Type is required'),
  description: Yup.string().required('Description is required'),
  number: Yup.string().required('Number is required'),
  issue_date: Yup.date()
    .required('Issue date is required')
    .typeError('Invalid date format'),
  due_date: Yup.date()
    .required('Due date is required')
    .typeError('Invalid date format')
    .min(Yup.ref('issue_date'), 'Due date must be after issue date'),
});
export const addAttachmentValidationSchema = Yup.object({
  files: Yup.mixed()
    .required('A document is required.') // Ensure something is provided
    .test(
      'is-valid-documents',
      'At least one valid file must be provided.',
      function (value) {
        const validDocumentTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/gif',
          'image/png',
        ];

        // Ensure at least one valid file or URL is present
        const hasValidFiles =
          value &&
          value.some((file) => {
            if (typeof file === 'string') {
              return true; // If it's a string, assume it's a valid URL
            }
            if (file instanceof File) {
              return validDocumentTypes.includes(file.type); // Validate document file type
            }
            return false;
          });

        return hasValidFiles;
      }
    ),
});
export const addCOAValidationSchema = Yup.object({
  account_name: Yup.string().required('Account Name is required'),
  account_type: Yup.string().required('Account Type is required'),
  // parent_account_id: Yup.string().required('Parent Account is required'),
  // parent_account_id: Yup.string().required('Parent Account is required'),
  // description: Yup.string().required('Description is required'),
});
export const editCOAValidationSchema = Yup.object({
  account_name: Yup.string().required('Account Name is required'),
  account_type: Yup.string().required('Account Type is required'),
  // parent_account_id: Yup.string().required('Parent Account is required'),
  // parent_account_id: Yup.string().required('Parent Account is required'),
  // description: Yup.string().required('Description is required'),
});
export const addSupportTypeSchema = Yup.object({
  name: Yup.string().required('Support Type Name is required'),
});

export const editProfileSchema = Yup.object({
  business_name: Yup.string().required('Business name is required'),
  user_name: Yup.string().required('User name is required'),
  phone: Yup.string().required('Phone Number is required'),
});

export const editVatDetailsSchema = Yup.object({
  vat_country: Yup.string().required('Country name is required'),
  vat_state: Yup.string().required('State name is required'),
  vat_trn: Yup.string().required('trn is required'),
});

export const editAdminProfileSchema = Yup.object({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  country_code: Yup.string().required('Country Code is required'),
  phone: Yup.string().required('Phone Number is required'),
});

export const statementOfAccountsValidationSchema = Yup.object({
  account_type: Yup.string().required('Account type is required'),
  account_id: Yup.string().required('Account id is required'),
  currency: Yup.string().required('Currency is required'),
  period_type: Yup.string().required('Period type is required'),
  number_of_days: Yup.number()
    .typeError('Number of Days must be a number')
    .integer('Number of Days must be an integer')
    .min(1, 'Number of Days must be greater than 0')
    .nullable(),
});

export const changePasswordSchema = Yup.object({
  current_password: Yup.string().required('Current Password is required'),
  password: Yup.string().required('New Password is required'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Please re-enter your new password'),
});

export const addPackageValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Subscription Name is required')
    .min(3, 'Subscription Name must be at least 3 characters long')
    .max(50, 'Subscription Name must be at most 50 characters long'),
  no_of_users: Yup.number()
    .required('Number of Users is required')
    .typeError('Number of Users must be a valid number')
    .positive('Number of Users must be positive')
    .integer('Number of Users must be an integer'),
  branches: Yup.number()
    .required('Branch is required')
    .typeError('Branch must be a valid number')
    .min(1, 'Branch must be at least 1') // Assuming a minimum value of 1 for branches
    .max(100, 'Branch must be at most 100'), // Assuming a maximum value of 100 for branches
  price_monthly: Yup.number()
    .required('Monthly Price is required')
    .typeError('Monthly Price must be a valid number')
    .positive('Monthly Price must be positive'),
  price_yearly: Yup.number()
    .required('Yearly Price is required')
    .typeError('Yearly Price must be a valid number')
    .positive('Yearly Price must be positive'),
});
export const passwordResetValidationSchema = Yup.object({
  user_id: Yup.string().required('User ID is required'),
  current_password: Yup.string().required('Current Password is required'),
  password: Yup.string().required('New Password is required'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Please re-enter new password'),
});

export const branchManagementValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Branch Name is required')
    .max(50, 'Branch Name must be at most 50 characters'),
  address: Yup.string()
    .required('Address is required')
    .max(100, 'Address must be at most 100 characters'),
  city: Yup.string().required('City is required'),
  phone: Yup.string()
    .required('Contact No is required')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid Contact No number'),
  supervisor: Yup.string().required('Supervisor is required'),
});
export const branchVatRateValidationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  percentage: Yup.number()
    .required('Percentage is required')
    .typeError('Percentage must be a valid number'),
});

// Branch Management Validation Schemas
export const branchSystemDatesValidationSchema = Yup.object().shape({
  opening_date: Yup.date()
    .required('Opening Date is required')
    .typeError('Invalid date format'),
  closed_upto_date: Yup.date()
    .required('Closed Upto Date is required')
    .typeError('Invalid date format')
    .min(
      Yup.ref('opening_date'),
      'Closed Upto date must be after Opening date'
    ),
  accept_data_upto_date: Yup.date()
    .required('Accept Data Upto Date is required')
    .typeError('Invalid date format')
    .min(
      Yup.ref('closed_upto_date'),
      'Accept Data Upto date must be after Closed Upto date'
    ),
});
export const branchDashboardValidationSchema = Yup.object().shape({
  startup_alert_period: Yup.number()
    .required('Startup Alert Period is required')
    .positive('Must be a positive number')
    .integer('Must be a whole number'),
  currency_rate_trend: Yup.number()
    .required('Currency Rate Trend is required')
    .positive('Must be a positive number')
    .integer('Must be a whole number'),
  dashboard_comparison_period: Yup.number()
    .required('Dashboard Comparison is required')
    .positive('Must be a positive number')
    .integer('Must be a whole number'),
  // currency_pairs: Yup.array().min(
  //   1,
  //   'At least one currency pair must be selected'
  // ),
});
export const branchCentralBankValidationSchema = Yup.object().shape({
  inward_payment_order_limit: Yup.number()
    .required('Inwards Payment Order is required')
    .positive('Must be a positive number'),
  outward_remittance_limit: Yup.number()
    .required('Outwards Remittance is required')
    .positive('Must be a positive number'),
  counter_transaction_limit: Yup.number()
    .required('Counter Transaction is required')
    .positive('Must be a positive number'),
  cash_limit: Yup.number()
    .required('Cash Limit is required')
    .positive('Must be a positive number'),
  cash_bank_pay_limit: Yup.number()
    .required('Cash/Bank Pay Limit is required')
    .positive('Must be a positive number'),
  monthly_transaction_limit: Yup.number()
    .required('Monthly Transaction is required')
    .positive('Must be a positive number'),
  counter_commission_limit: Yup.number()
    .required('Counter Commission is required')
    .positive('Must be a positive number'),
});
export const branchVatParametersValidationSchema = Yup.object().shape({
  vat_trn: Yup.string()
    .required('VAT TRN is required')
    .matches(
      /^[a-zA-Z0-9.\s]+$/,
      'VAT TRN can only contain letters, numbers, decimal points and spaces'
    ),
  vat_country: Yup.string().required('Country is required'),
  default_city: Yup.string().required('Default City is required'),
  cities: Yup.string().required('Cities is required'),
  vat_type: Yup.string().required('VAT Type is required'),
  vat_percentage: Yup.number().when('vat_type', {
    is: (val) => val !== 'variable',
    then: (schema) =>
      schema
        .required('VAT Percentage is required')
        .min(0, 'VAT Percentage cannot be negative')
        .max(100, 'VAT Percentage cannot exceed 100'),
  }),
});
export const branchMiscParametersValidationSchema = Yup.object().shape({
  debit_posting_account: Yup.string().required(
    'Debit Posting Account is required'
  ),
  credit_posting_account: Yup.string().required(
    'Credit Posting Account is required'
  ),
});

export const deleteChequeBookValidationSchema = Yup.object().shape({
  bank: Yup.string().required('Bank Account is required'),
  reference_no: Yup.mixed().required('Reference No. is required'),
});

export const addChequeBookValidationSchema = Yup.object().shape({
  bank: Yup.string().required('Bank Account is required'),
  starting_no: Yup.string().required('Starting No. is required'),
  count: Yup.string().required('Count is required'),
});

export const customSubscriptionRequestValidationSchema = Yup.object().shape({
  user_name: Yup.string().required('Business Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  no_of_users: Yup.string().required('Expected No. of Users is required'),
  branches: Yup.string().required('Expected No. of Branches is required'),
});

export const paymentValidationSchema = Yup.object().shape({
  cardholder_name: Yup.string()
    .trim()
    .matches(/^[a-zA-Z\s]+$/, 'Cardholder Name must contain only letters')
    .required('Card holder name is required'),
  card_number: Yup.string()
    .test('len', 'Card number must be 16 digits', (val) =>
      val ? val.replace(/\D/g, '').length === 16 : false
    )
    .required('Card number required'),
  cvv_number: Yup.string()
    .matches(/^\d{3}$/, 'CVV must be exactly 3 digits')
    .required('CVV is required'),
  exp_month: Yup.string()
    // .matches(/^(0[1-9]|1[0-2])$/, 'Expiry Month must be between 01 and 12')
    .required('Validity is required'),
});

export const subscriptionPaymentValidationSchema = Yup.object().shape({
  cardholderName: Yup.string()
    .trim()
    .matches(/^[a-zA-Z\s]+$/, 'Cardholder Name must contain only letters')
    .required('Card holder name is required'),
  number: Yup.string()
    .test('len', 'Card number must be 16 digits', (val) =>
      val ? val.replace(/\D/g, '').length === 16 : false
    )
    .required('Card number required'),
  cvv: Yup.string()
    .trim()
    .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
    .required('CVV is required'),
  exp_month: Yup.string()
    // .matches(/^(0[1-9]|1[0-2])$/, 'Expiry Month must be between 01 and 12')
    .required('Validity is required'),
});

export const foreignCurrencyDealValidationSchema = Yup.object().shape({
  date: Yup.date(),
  debitLedger: Yup.string().required('Debit ledger is required'),
  debitAccount: Yup.string().required('Debit account is required'),
  creditLedger: Yup.string().required('Credit ledger is required'),
  creditAccount: Yup.string().required('Credit account is required'),
  buyFCyDr: Yup.string().required('Buy FCy (Dr) is required'),
  buyFCyDrAmount: Yup.string().required('Buy FCy (Dr) amount is required'),
  buyFCyCr: Yup.string().required('Buy FCy (Cr) is required'),
  buyFCyCrAmount: Yup.string().required('Buy FCy (Cr) amount is required'),
  rateType: Yup.string().required('Rate type is required'),
  sellFCCr: Yup.string().required('Sell FC (Cr) is required'),
  sellFCDr: Yup.string().required('Sell FC (Dr) is required'),
  commissionType: Yup.string().required('Commission type is required'),
  commission: Yup.string().required('Commission is required'),
  narration: Yup.string().required('Narration is required'),
  comment: Yup.string().required('Comment is required'),
});

export const bankTransactionSchema = Yup.object().shape({
  transaction_type: Yup.string().required('Transaction type is required'),
  bank: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Bank is required'),
  }),
  ledger: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Ledger is required'),
  }),
  from_account_id: Yup.string().required('From account is required'),
  to_account_id: Yup.string().required('To account is required'),
  cheque_number: Yup.string().required('Cheque number is required'),
  currency: Yup.string().required('Currency is required'),
  amount: Yup.number().when('currency', {
    is: (val) => !!val && val !== '',
    then: (schema) =>
      schema.required('Amount is required').positive('Amount must be positive'),
    otherwise: (schema) => schema.notRequired(),
  }),
  commissionType: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Commission type is required'),
  }),
  commissionPercentage: Yup.number().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Commission percentage is required'),
  }),
  commissionAmount: Yup.number().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Commission amount is required'),
  }),
  country: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Country is required'),
  }),
});

export const currencyTransferValidationSchema = Yup.object().shape({
  debitLedger: Yup.string().required('Debit Ledger is required'),
  debitAccount: Yup.string().when('debitLedger', {
    is: (val) => !!val && val !== '',
    then: (schema) => schema.required('Debit Account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  creditLedger: Yup.string().required('Credit Ledger is required'),
  creditAccount: Yup.string().when('creditLedger', {
    is: (val) => !!val && val !== '',
    then: (schema) => schema.required('Credit Account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const inwardPaymentOrderValidationSchema = Yup.object().shape({
  account_ledger: Yup.string().required('Ledger is required'),
  account_id: Yup.string().when('account_ledger', {
    is: (val) => !!val && val !== '',
    then: (schema) => schema.required('Account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  office: Yup.string(),
  vatType: Yup.string().required('VAT Type is required'),
  vat_terms: Yup.string(),
  vat_terms_id: Yup.string().when('vatType', {
    is: (vatType) => vatType === 'variable',
    then: (schema) =>
      schema.required('VAT % is required when VAT type is variable'),
    otherwise: (schema) => schema.notRequired(),
  }),
  vat_amount: Yup.number().when('vatType', {
    is: (vatType) => vatType === 'variable',
    then: (schema) =>
      schema
        .typeError('VAT Amount must be a number')
        .required('VAT Amount is required when VAT type is variable')
        .min(0, 'VAT Amount cannot be negative'),
    otherwise: (schema) => schema,
  }),
  vat_terms_percentage: Yup.number(),
  vat_terms_type: Yup.string(),
});

export const mainFormValidationSchema = Yup.object().shape({
  debite_note_number: Yup.string().required('Debit Note Number is required'),
  date: Yup.date().required('Date is required'),
  account: Yup.string().required('Account is required'),
  ledger: Yup.string().required('Ledger is required'),
  mode: Yup.string().required('Mode is required'),
  account_select: Yup.string().required('Account selection is required'),
  pay_type: Yup.string().required('Pay Type is required'),
  order_amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Order Amount is required')
    .positive('Amount must be positive'),
  ref_no: Yup.string().required('Reference Number is required'),
  balance_amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Balance Amount is required'),
  beneficiary: Yup.string().required('Beneficiary is required'),
  contact_no: Yup.string()
    .matches(/^\d+$/, 'Contact number must contain only digits')
    .min(8, 'Contact number must be at least 8 digits')
    .required('Contact number is required'),
  vat_type: Yup.string().required('VAT Type is required'),
  vat_terms: Yup.string().required('VAT Terms is required'),
  id_detail: Yup.string().required('ID Detail is required'),
  settle_date: Yup.date().required('Settle Date is required'),
  place_of_issue: Yup.string().required('Place of Issue is required'),
  sender: Yup.string().required('Sender is required'),
  due_date: Yup.date().required('Due Date is required'),
  nationality: Yup.string().required('Nationality is required'),
  commission: Yup.number()
    .typeError('Commission must be a number')
    .min(0, 'Commission cannot be negative'),
  vat_amount: Yup.number()
    .typeError('VAT Amount must be a number')
    .min(0, 'VAT Amount cannot be negative')
    .required('VAT Amount is required'),
  net_total: Yup.number()
    .typeError('Net Total must be a number')
    .required('Net Total is required'),
  narration: Yup.string().required('Narration is required'),
});

export const inwardPayValidationSchema = Yup.object().shape({
  // Required fields
  walkin_id: Yup.string().required('Beneficiary is required'),
  purpose_id: Yup.string().required('Purpose is required'),

  // Ledger and Account - conditional validation (account required immediately when ledger is selected)
  ledger_account: Yup.string().required('Ledger is required'),
  account_id: Yup.string().when('ledger_account', {
    is: (val) => val !== undefined && val !== null && val !== '', // if ledger_account has any value
    then: (schema) => schema.required('Account is required'),
    otherwise: (schema) => schema,
  }),

  // Mode - required only when ledger is GL (general)
  mode: Yup.string().when('ledger_account', {
    is: 'general',
    then: (schema) => schema.required('Mode is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Settle Date - always required
  settle_date: Yup.date().required('Settle Date is required'),

  // Amount - always required
  amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .positive('Amount must be positive'),

  // Cheque Number - required only when Mode is Bank or PDC
  cheque_id: Yup.string().when('mode', {
    is: (mode) => mode === 'Bank' || mode === 'PDC',
    then: (schema) => schema.required('Cheque Number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Due Date - required only when Mode is Bank or PDC
  due_date: Yup.date().when('mode', {
    is: (mode) => mode === 'Bank' || mode === 'PDC',
    then: (schema) => schema.required('Due Date is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // VAT Terms - required only when commission is applied
  vat_terms_id: Yup.string().when('commission', {
    is: (commission) => {
      const hasCommission = parseFloat(commission) > 0;
      return hasCommission;
    },
    then: (schema) => schema.required('VAT is required '),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Optional fields (not required)
  vat_type: Yup.string(),
  commission: Yup.number()
    .typeError('Commission must be a number')
    .min(0, 'Commission cannot be negative'),
  net_total: Yup.number().typeError('Net Total must be a number'),
  narration: Yup.string(),
  origin_id: Yup.string(),
  sender_nationality_id: Yup.string().notRequired(),
});

export const vatOutOfScopeValidationSchema = Yup.object().shape({
  out_of_scope: Yup.string()
    .required('Reason is required')
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});
export const specialCommissionValidationSchema = Yup.object().shape({
  commission: Yup.number()
    .required('Commission percentage is required')
    .min(0, 'Commission percentage must be greater than or equal to 0')
    .max(100, 'Commission percentage must be less than or equal to 100'),
  total_commission: Yup.number()
    .required('Commission amount is required')
    .min(0, 'Commission amount must be greater than 0'),
});
export const accountToAccountvalidationSchema = Yup.object().shape({
  debitLedger: Yup.string().required('Debit ledger is required'),
  debitAccount: Yup.string().when('debitLedger', {
    is: (val) => !!val && val !== '',
    then: (schema) => schema.required('Debit account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  creditLedger: Yup.string().required('Credit ledger is required'),
  creditAccount: Yup.string().when('creditLedger', {
    is: (val) => !!val && val !== '',
    then: (schema) => schema.required('Credit account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  chequeNumber: Yup.string().when('showChequeNumber', {
    is: true,
    then: (schema) => schema.required('Cheque number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  currency: Yup.string().required('Currency is required'),
  fcAmount: Yup.number().when('currency', {
    is: (val) => !!val && val !== '',
    then: (schema) =>
      schema
        .positive('FC Amount must be positive')
        .required('FC Amount is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  // comment: Yup.string().trim(),
});
export const holdingCommentValidationSchema = Yup.object().shape({
  comment: Yup.string()
    .required('Holding Comment is required')
    .min(10, 'Holding Comment must be at least 10 characters')
    .max(500, 'Holding Comment cannot exceed 500 characters'),
});
export const outwardRemittanceValidationSchema = (baseCurrency = 'LC') =>
  Yup.object().shape({
    ledger: Yup.string().required('Ledger is required'),
    account_id: Yup.string().when('ledger', {
      is: (ledger) => ledger && ledger !== '',
      then: (schema) => schema.required('Account is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    send_fc_id: Yup.string().required('Send FC is required'),
    send_amount: Yup.string().when('send_fc_id', {
      is: (send_fc_id) => send_fc_id && send_fc_id !== '',
      then: (schema) => schema.required('Send Amount is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    rate: Yup.string().required('Rate is required'),
    currency_charges: Yup.number()
      .nullable()
      .typeError('Currency Charges must be a number'),
    net_total: Yup.string().required('Net Total is required'),
    base_rate: Yup.string().notRequired(),
    lcy_amount: Yup.string().required(`${baseCurrency} Amount is required`),
    settle_thru: Yup.string().required('Settle Thru is required'),
    against_currency_id: Yup.string().required('Against Currency is required'),
    against_amount: Yup.string().when('against_currency_id', {
      is: (against_currency_id) =>
        against_currency_id && against_currency_id !== '',
      then: (schema) => schema.required('Against Amount is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    vat_terms_id: Yup.string().when(['currency_charges', 'vat_percentage'], {
      is: (currency_charges, vat_percentage) =>
        currency_charges !== null &&
        currency_charges !== '' &&
        Number(currency_charges) > 0 &&
        (vat_percentage === null || vat_percentage === ''),
      then: (schema) =>
        schema.required('VAT % is required when charges are entered'),
      otherwise: (schema) => schema.notRequired(),
    }),
    vat_amount: Yup.string().when('currency_charges', {
      is: (val) => val !== null && val !== '' && Number(val) > 0,
      then: (schema) =>
        schema.required('VAT Amount is required when charges are entered'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

//Reports

// Settled
export const pdcProcessPSValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  processing_type: Yup.string().required('Process Type is required'),
});
// Cancelled
export const pdcProcessPCValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
});
export const generateJournalReportValidationSchema = Yup.object().shape({
  transaction_type: Yup.string().required('Transaction Type is required'),
  transaction_no_from: Yup.string().when('transaction_type', {
    is: (val) => val !== 'all',
    then: (schema) => schema.required('Transaction No. From is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  transaction_no_to: Yup.string().when('transaction_type', {
    is: (val) => val !== 'all',
    then: (schema) => schema.required('Transaction No. To is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  ledger: Yup.string().required('Ledger is required'),
  account_id: Yup.string().when('ledger', {
    is: (val) => val !== 'all',
    then: (schema) => schema.required('Account is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  currency_id: Yup.string().required('Currency is required'),
  fcy_amount_from: Yup.string().required('FCy Amount From is required'),
  fcy_amount_to: Yup.string().required('FCy Amount To is required'),
  transaction_date_from: Yup.date().required(
    'Transaction Date From is required'
  ),
  transaction_date_to: Yup.date().required('Transaction Date To is required'),
  entry_date_from: Yup.date().required('Entry Date From is required'),
  entry_date_to: Yup.date().required('Entry Date To is required'),
  user_id: Yup.string().required('User ID is required'),
  attachments: Yup.string().required('Attachments is required'),
  mark_type: Yup.string().required('Mark Type is required'),
});

export const generateWalkinCustomerStatementValidationSchema =
  Yup.object().shape({
    account_id: Yup.string().required('Account is required'),
    currency_id: Yup.string().required('Currency is required'),
    period_range_from: Yup.date().required('From Date is required'),
    period_range_to: Yup.date().required('To Date is required'),
  });

export const generateVatReportValidationSchema = Yup.object().shape({
  period_from: Yup.string().required('Period from is required'),
  period_to: Yup.string().required('Period to is required'),
});

export const budgetReportValidationSchema = Yup.object().shape({
  date_from: Yup.date().required('From Date is required'),
  date_to: Yup.date().required('To Date is required'),
  report_type: Yup.string().required('Report Type is required'),
});

export const groupClassificationValidationSchema = Yup.object().shape({
  group_name: Yup.string().required('Group Name is required'),
  ledger: Yup.string().required('Ledger is required'),
});

export const unlockAccountingPeriodRequestValidationSchema = Yup.object().shape(
  {
    start_date: Yup.date().required('Start Date is required'),
    end_date: Yup.date().required('End Date is required'),
    reason: Yup.string().required('Unlocking Reason is required'),
  }
);
// PDC Process //
// Receivables //

// Open
export const pdcProcessROValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  bank_account_id: Yup.string().required('Bank Account is required'),
  processing_type: Yup.string().required('Process Type is required'),
});
// Open - cancelled on due date
export const pdcProcessROValidationSchemaCancelled = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  processing_type: Yup.string().required('Process Type is required'),
});
// Open - Discounted Collection
export const pdcProcessRODiscountedCollectionValidationSchema =
  Yup.object().shape({
    date: Yup.date().required('Date is required'),
    bank_account_id: Yup.string().required('Bank Account is required'),
    discounted_amount: Yup.number()
      .typeError('Amount must be a number')
      .required('Discounted Amount is required'),
    collection_account_id: Yup.string().required(
      'Collection Account is required'
    ),
    collection_amount: Yup.number()
      .typeError('Amount must be a number')
      .required('Collection Amount is required'),
    commission_account_id: Yup.string().required(
      'Commission Account is required'
    ),
    commission_amount: Yup.number()
      .typeError('Amount must be a number')
      .required('Commission Amount is required'),
    // lbd_number: Yup.string().required('LBD Number is required'),
  });
// Settled - Recall - Cancel
export const pdcProcessRSValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  processing_type: Yup.string().required('Process Type is required'),
});
// Discounted Collection - Settled
export const pdcProcessRDSettledValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
});
// Discounted Collection - Cancelled
export const pdcProcessRDCancelledValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
});
// Collection - Settled
export const pdcProcessRCSettledValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  bank_account_id: Yup.string().required('Bank Account is required'),
  collection_account_id: Yup.string().required(
    'Collection Account is required'
  ),
});
// Collection - Open
export const pdcProcessRCOpenValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
});
// Cancelled - Recall
export const pdcProcessRCRecallValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  processing_type: Yup.string().required('Process Type is required'),
});

// Payables //
// Open - Settled
export const pdcProcessPOSettledValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  bank_account_id: Yup.string().required('Bank Account is required'),
});
// Open - Cancelled
export const pdcProcessPOCancelledValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  processing_type: Yup.string().required('Process Type is required'),
});

export const fiscalPeriodSchema = Yup.object().shape({
  start_date: Yup.string().required('Start Date is required'),
  end_date: Yup.string().required('End Date is required'),
});
export const makeFiscalPeriodSchema = (periodPreference = 'Monthly') => {
  const monthsDiffInclusive = (startMonthStr, endMonthStr) => {
    const [startY, startM] = (startMonthStr || '')
      .split('-')
      .map((v) => parseInt(v, 10));
    const [endY, endM] = (endMonthStr || '')
      .split('-')
      .map((v) => parseInt(v, 10));
    if (!startY || !startM || !endY || !endM) return NaN;
    const months = (endY - startY) * 12 + (endM - startM);
    return months + 1; // inclusive
  };

  return Yup.object().shape({
    start_date: Yup.string()
      .required('Start month is required.')
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid format. Use YYYY-MM'),

    end_date: Yup.string()
      .required('End month is required.')
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid format. Use YYYY-MM')
      // ensure end is same or after start
      .test(
        'order',
        'End month must be same or after start month.',
        function (value) {
          const { start_date } = this.parent;
          if (!start_date || !value) return true;
          return monthsDiffInclusive(start_date, value) >= 1;
        }
      )
      // enforce period preference constraints
      .test('granularity', function (value) {
        const { start_date } = this.parent;
        if (!start_date || !value) return true;
        const months = monthsDiffInclusive(start_date, value);

        if (periodPreference === 'Monthly') {
          // Allow any month range for Monthly preference (1 or multiple months)
          return true;
        }

        if (periodPreference === 'Quarterly') {
          // Allow any range divisible by 3 months (3, 6, 9, 12, etc.)
          if (months % 3 === 0) return true;
          return this.createError({
            message: 'Quarterly period must be in multiples of 3 months.',
          });
        }

        if (periodPreference === 'Yearly') {
          // Allow any range divisible by 12 months (12, 24, 36, etc.)
          if (months % 12 === 0) return true;
          return this.createError({
            message: 'Yearly period must be in multiples of 12 months.',
          });
        }

        return true;
      }),
  });
};

export const bankTransactionValidationSchema = Yup.object().shape({
  transaction_type: Yup.string().required('Transaction type is required'),
  from_account_id: Yup.string().when(['transaction_type', 'ledger'], {
    is: (transactionType, ledger) => {
      // For inward_tt, only require from_account_id if ledger is filled
      if (transactionType === 'inward_tt') {
        return !!ledger;
      }
      // For other transaction types, always require from_account_id
      return true;
    },
    then: (schema) => schema.required('Account is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  cheque_number: Yup.mixed().nullable(),
  to_account_id: Yup.string().when('transaction_type', {
    is: (type) => type !== 'inward_tt',
    then: (schema) => schema.required('To account is required'),
  }),
  currency: Yup.string().required('Currency is required'),
  amount: Yup.number().test(
    'amount-required-after-currency',
    'Amount is required',
    function (value) {
      // Only validate amount if currency is filled
      const currency = this.parent.currency;
      if (!currency) {
        return true; // Skip amount validation if no currency
      }
      return (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !isNaN(value) &&
        value > 0
      );
    }
  ),
  narration: Yup.string().nullable(),

  // Inward TT specific validations
  ledger: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Ledger is required'),
  }),
  bank: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) => schema.required('Bank is required'),
  }),
  commissionType: Yup.string().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) =>
      schema.when('commissionAmount', {
        is: (commissionAmount) => commissionAmount && commissionAmount > 0,
        then: (schema) => schema.required('Commission Type is required '),
        otherwise: (schema) => schema.nullable(),
      }),
    otherwise: (schema) => schema.nullable(),
  }),
  commissionPercentage: Yup.number().when(
    ['transaction_type', 'commissionType'],
    {
      is: (transaction_type, commissionType) => {
        return transaction_type === 'inward_tt' && !!commissionType;
      },
      then: (schema) =>
        schema
          .required('Commission is required')
          .min(0, 'Commission percentage must be at least 0')
          .max(100, 'Commission percentage cannot exceed 100%'),
      otherwise: (schema) => schema.nullable(),
    }
  ),
  commissionAmount: Yup.number().when('transaction_type', {
    is: 'inward_tt',
    then: (schema) =>
      schema.when('commissionType', {
        is: (commissionType) => !!commissionType,
        then: (schema) =>
          schema
            .required('Commission amount is required')
            .min(0, 'Commission amount must be positive'),
        otherwise: (schema) => schema.nullable(),
      }),
    otherwise: (schema) => schema.nullable(),
  }),
});
export const postingDetailsSchema = Yup.object().shape({
  ledger: Yup.string().required('Ledger is required'),
  account_id: Yup.string().required('Account is required'),
});
