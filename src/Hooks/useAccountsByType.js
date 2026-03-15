import { useQuery } from '@tanstack/react-query';
// The service getAccountsbyType is same for all transactions so we can use the same service function for all transactions
import { getAccountsbyType } from '../Services/Transaction/ReceiptVoucher';

/**
 * Custom hook for fetching accounts by type
 * @param {Object} options - Configuration options
 * @param {boolean} options.refetchOnWindowFocus - Whether to refetch on window focus (default: false)
 * @param {number} options.retry - Number of retry attempts (default: 1)
 * @returns {Object} Account data and utility functions
 */
export const useAccountsByType = (options = {}) => {
  const {
    // staleTime = 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  // Party accounts query
  const {
    data: partyAccounts,
    isLoading: isLoadingParty,
    isError: isErrorParty,
    error: errorParty,
  } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    refetchOnWindowFocus,
    retry,
  });

  // General accounts query
  const {
    data: generalAccounts,
    isLoading: isLoadingGeneral,
    isError: isErrorGeneral,
    error: errorGeneral,
  } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    refetchOnWindowFocus,
    retry,
  });

  // Walkin accounts query
  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkin,
    isError: isErrorWalkin,
    error: errorWalkin,
  } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    refetchOnWindowFocus,
    retry,
  });

  // Aggregate account data
  const accountData = {
    party: {
      data: partyAccounts,
      loading: isLoadingParty,
      error: isErrorParty,
      errorMessage: errorParty,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneral,
      error: isErrorGeneral,
      errorMessage: errorGeneral,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkin,
      error: isErrorWalkin,
      errorMessage: errorWalkin,
    },
  };

  /**
   * Get account options for a specific account type
   * @param {string} accountType - The type of account ('party', 'general', 'walkin')
   * @param {string} optionToAddNew - To add new account
   * @returns {Array} Array of account options for select components
   */
  const getAccountsByTypeOptions = (
    accountType,
    optionToAddNew = true,
    banksOnly = false
  ) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      console.error('Unable to fetch Accounts', errorMessage);
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }

    let options = (data || [])
      .filter((x) => !banksOnly || x?.type === 'bank') // Only include 'bank' types if banksOnly is true
      .map((x) => ({
        value: x?.id,
        label: x?.title,
        ...x,
      }));

    if (optionToAddNew) {
      // Add "Add New" options based on account type
      switch (accountType) {
        case 'party':
          options.push({
            label: `Add New PL`,
            value: null,
          });
          break;
        case 'general':
          options.push({
            label: `Add New GL`,
            value: null,
          });
          break;
        case 'walkin':
          options.push({
            label: `Add New WIC`,
            value: null,
          });
          break;
        default:
          break;
      }
    }

    return options;
  };

  // Check if any accounts are loading
  const isLoading = isLoadingParty || isLoadingGeneral || isLoadingWalkin;

  // Check if any accounts have errors
  const hasError = isErrorParty || isErrorGeneral || isErrorWalkin;

  return {
    accountData,
    getAccountsByTypeOptions,
    isLoading,
    hasError,
    // Individual account data for direct access if needed
    partyAccounts,
    generalAccounts,
    walkinAccounts,
  };
};

export default useAccountsByType;
