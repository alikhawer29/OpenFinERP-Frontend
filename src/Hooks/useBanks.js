import { useQuery } from '@tanstack/react-query';
import { getAllBanks } from '../Services/General';

/**
 * Custom hook for fetching Banks and generating formatted options
 * @param {Object} options - Configuration options
 * @param {boolean} options.refetchOnWindowFocus - Whether to refetch on window focus (default: false)
 * @param {number} options.retry - Number of retry attempts (default: 1)
 * @returns {Object} Banks data, formatted options, and utility functions
 */
export const useBanks = (options = {}) => {
  const { refetchOnWindowFocus = false, retry = 1 } = options;

  const {
    data: banks,
    isLoading: isLoadingBanks,
    isError: isErrorBanks,
    error: errorBanks,
  } = useQuery({
    queryKey: ['banks'],
    queryFn: getAllBanks,
    refetchOnWindowFocus,
    retry,
  });

  /**
   * Get formatted Bank options for dropdown/select components
   * @returns {Array} Array of formatted options with loading/error states
   */
  const getBankOptions = () => {
    if (isLoadingBanks)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];

    if (isErrorBanks) {
      console.error('Unable to fetch Banks', errorBanks);
      return [{ label: 'Unable to fetch Banks', value: null }];
    }

    return (
      banks?.map((item) => ({
        id: item.id,
        label: item.account_name,
        value: item.id,
      })) || []
    );
  };

  return {
    // Raw data
    banks,

    // Loading and error states
    isLoadingBanks,
    isErrorBanks,
    errorBanks,

    // Formatted options
    bankOptions: getBankOptions(),

    // Utility function
    getBankOptions,
  };
};


