// Convert Chart of Accounts to dropdown options
export function convertCOAAccountsToDropdownOptions(data) {
  const options = [];
  function traverse(node) {
    // Add the current node to the options array
    options.push({
      label: `${node.account_code} - ${node.account_name}`,
      value: node.id,
      ...(node.account_code.length < 2 && { isDisabled: true }),
    });

    // Recursively process children, if any
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  // Start the traversal for each root node in the data array
  data.forEach(traverse);

  return options;
}

export const canModify = (user) => {
  return user?.has_subscription_full_access === 'full_access' || user?.has_subscription_full_access === 'restricted_access' ? true : false;
  // return user?.has_subscription_full_access === 'full_access' ? true : false;;
};

const getLedgerInitials = (ledger) => {
  let map = {
    general: 'GL',
    party: 'PL',
    walkin: 'WIC',
  };
  return map[ledger];
};
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
export const transformSpecialCommission = (data) => {
  return {
    date: data.date,
    transaction_no: Number(data.transaction_no),
    account: {
      value: data.account_id,
      label:
        data.account_details?.title ||
        data.account_details?.account_name ||
        data.account_name ||
        data.account_title ||
        '',
      id: data.account_details?.id || data.account_id,
      title:
        data.account_details?.title ||
        data.account_details?.account_name ||
        data.account_name ||
        data.account_title ||
        '',
      type: null,
    },
    currency: {
      value: data.amount_type?.id,
      label: data.amount_type?.currency_code,
    },
    amount: data.amount,
    commission_type: capitalize(data.commission_type),
    ledger: {
      label: getLedgerInitials(data.account_type),
      value: data.account_type,
    },
    ledger_name: getLedgerInitials(data.account_type),
    account_id: data.account_id,
    currency_id: data.amount_type?.id,
    commission: parseFloat(data.commission),
    total_commission: parseFloat(data.total_commission),
    description: data.description,
    distributions: Array.isArray(data.commission_distribution)
      ? data.commission_distribution.map((dist) => ({
        ledger: dist.ledger,
        credit_account_id: dist.credit_account_id,
        narration: dist.narration,
        percentage: dist.percentage,
        amount: parseFloat(dist.amount),
      }))
      : [],
  };
};

export const formatDateString = (dateString) => {
  if (!dateString) return '';
  return dateString.split('-').reverse().join('/');
};


/**
 * Filter headers based on visibility config
 * @param {Array} headers - Array of header strings or objects
 * @param {Object|Array} visibility - Keys/indices to hide
 * @returns {Array} - Filtered headers
 */
export const filterHeaders = (headers, visibility = {}) => {
  if (Array.isArray(visibility)) {
    return headers.filter(h => !visibility.includes(h.key || h));
  }
  return headers.filter(h => visibility[h.key || h] !== false);
};


/**
 * Filter table actions based on permissions
 * @param {Array} actions - Array of action objects
 * @param {Object} permissions - Permissions object from useModulePermissions
 * @returns {Array} - Filtered actions based on permissions
 * 
 * Example permissions object:
 * {
 *   create: true,
 *   view: true,
 *   edit: false,
 *   delete: false,
 *   print: false
 * }
 */
export const filterActions = (actions, permissions = {}) => {
  const permissionMap = {
    view: permissions.view,
    edit: permissions.edit,
    delete: permissions.delete,
    attachments: true, // Always show attachments if no permission specified
  };

  return actions.filter(action => {
    const actionName = action.name?.toLowerCase();

    // If action has explicit permission check
    if (permissionMap.hasOwnProperty(actionName)) {
      return permissionMap[actionName] !== false;
    }

    // Default: show action
    return true;
  });
};
export const formatNumberWithCommas = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '';
  }
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
export const formatNumberTwoDecimals = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '';
  }
  return numValue.toFixed(2);
};

/**
 * Format rate value to 8 decimal places with commas
 * @param {string|number} value - The value to format
 * @returns {string} - Formatted value (e.g., "4,999.00000000")
 */
export const formatRateValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '';
  }
  const formatted = numValue.toFixed(8);
  const [intPart, decimalPart] = formatted.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${decimalPart}`;
};

/**
 * Format amount value to 2 decimal places with commas
 * @param {string|number} value - The value to format
 * @returns {string} - Formatted value (e.g., "4,000.00")
 */
export const formatAmountValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '';
  }
  const formatted = numValue.toFixed(2);
  const [intPart, decimalPart] = formatted.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${decimalPart}`;
};

/**
 * Format number with commas for display during typing (preserves decimal part as typed)
 * @param {string} value - The value to format
 * @returns {string} - Formatted value with commas (e.g., "4,999" or "4,999.5")
 */
export const formatNumberWithCommasForDisplay = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  if (value === '.') return '.';
  
  const parts = value.toString().split('.');
  const intPart = parts[0] || '';
  const decimalPart = parts[1];
  
  // Add commas to integer part
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Return with decimal part if present
  return decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;
};

/**
 * Validate and limit decimal places for rate fields (max 8 decimals)
 * @param {string} value - The input value
 * @returns {string} - Sanitized value with max 8 decimal places
 */
export const sanitizeRateInput = (value) => {
  if (value === '' || value === '.') return value;
  
  // Remove commas and sanitize
  let sanitized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 8 decimal places
  if (parts.length === 2 && parts[1].length > 8) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 8);
  }
  
  return sanitized;
};

/**
 * Validate and limit decimal places for amount fields (max 2 decimals)
 * @param {string} value - The input value
 * @returns {string} - Sanitized value with max 2 decimal places
 */
export const sanitizeAmountInput = (value) => {
  if (value === '' || value === '.') return value;
  
  // Remove commas and sanitize
  let sanitized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return sanitized;
};

/**
 * Detect if a field is a rate field based on name, className, or placeholder
 * @param {string} name - Field name
 * @param {string} className - Field className
 * @param {string} placeholder - Field placeholder (optional)
 * @returns {boolean}
 */
export const isRateField = (name, className, placeholder) => {
  const nameLower = (name || '').toLowerCase();
  const classLower = (className || '').toLowerCase();
  const placeholderLower = (placeholder || '').toLowerCase();
  const placeholderCleaned = placeholderLower.replace(/separate/g, '');
  return nameLower.includes('rate') || classLower.includes('rate') || placeholderCleaned.includes('rate');
};

/**
 * Detect if a field is an amount field based on name, className, or placeholder
 * @param {string} name - Field name
 * @param {string} className - Field className
 * @param {string} placeholder - Field placeholder (optional)
 * @returns {boolean}
 */
export const isAmountField = (name, className, placeholder) => {
  const nameLower = (name || '').toLowerCase();
  const classLower = (className || '').toLowerCase();
  const placeholderLower = (placeholder || '').toLowerCase();
  // Exclude rate fields that might contain "amount" in their name
  if (isRateField(name, className, placeholder)) return false;
  return nameLower.includes('amount') || classLower.includes('amount') || placeholderLower.includes('amount');
};