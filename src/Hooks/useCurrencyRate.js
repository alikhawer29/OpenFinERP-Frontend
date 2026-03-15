import { useQuery } from '@tanstack/react-query';
import { getCurrencyRate } from '../Services/General';

/**
 * Custom hook to fetch currency rate for a given currency and date
 * @param {string|number} currencyId - The currency ID to fetch rate for
 * @param {string} date - The date for which to fetch the rate (optional)
 * @param {object} options - Additional React Query options
 * @returns {object} React Query result object with currency rate data
 */
export const useCurrencyRate = (
  currencyId,
  date = new Date().toLocaleDateString('en-CA'),
  options = {}
) => {
  return useQuery({
    queryKey: ['currencyRate', currencyId, date],
    queryFn: () => getCurrencyRate(currencyId, date),
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes after becoming unused
    refetchOnWindowFocus: false,
    enabled: !!currencyId, // Only fetch if currencyId is provided
    ...options, // Allow overriding default options
    onError: (error) => {
      console.error('Error fetching currency rate:', error);
    },
  });
};

export default useCurrencyRate;
