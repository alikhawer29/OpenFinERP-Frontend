import { useQuery } from '@tanstack/react-query';
import { getVATType } from '../Services/Transaction/ReceiptVoucher';

export const useVATTypes = (options = {}) => {
  const {
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  // Get VAT Type
  const {
    data: vatType,
    isLoading: isLoadingVatType,
    isError: isErrorVatType,
    error: errorVatType,
  } = useQuery({
    queryKey: ['vatType'],
    queryFn: getVATType,
    refetchOnWindowFocus,
    retry,
  });

  /**
   * Get formatted VAT terms options for dropdown/select components
   * @returns {Array} Array of formatted options with loading/error states
   */
  const getVATTermsOptions = () => {
    if (isLoadingVatType)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];
    
    if (isErrorVatType) {
      console.error('Unable to fetch VAT Terms', errorVatType);
      return [{ label: 'Unable to fetch VAT Terms', value: null }];
    }
    
    return vatType?.vats?.map((item) => ({
      id: item.id,
      label: `${item.title}${
        !isNaN(parseFloat(item.percentage)) ? ' - ' + item.percentage + '%' : ''
      }`,
      value: item.id,
      title: item.title, // Include the title for VAT condition checks
      percentage: item.percentage, // Keep original percentage (can be text or number)
      percentageNumeric: parseFloat(item.percentage), // Numeric version for calculations
    })) || [];
  };

  return {
    // Raw data
    vatType,
    
    // Loading and error states
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
    
    // Formatted options
    vatTermsOptions: getVATTermsOptions(),
    
    // Utility function
    getVATTermsOptions,
  };
}; 