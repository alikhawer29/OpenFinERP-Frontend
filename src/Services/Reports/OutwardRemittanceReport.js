import axiosInstance from '../../Config/axiosConfig';

// GET - Get outward remittance filters
export const getOutwardRemittanceFilters = async () => {
  try {
    const data = await axiosInstance.get(
      `/user-api/reports/outward-remittance-filters`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST - Get outward remittance report data
export const getOutwardRemittanceReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/outward-remittance-report', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get deal register report data
export const getDealRegisterReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/deal-register-report', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get outward remittance enquiry report data
export const getOutwardRemittanceEnquiryReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/outward-remittance-enquiry', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get trial balance report data
export const getTrialBalanceReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/trial-balance-report', {
      params,
    });
    return data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


// Get profit and loss statement data
export const profitAndLossStatementReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/profit-loss-statement', {
      params,
    });
    return data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get balance sheet report data
export const getBalanceSheetReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/balance-sheet', {
      params,
    });
    return data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get exchnage profit and loss data
export const getEchangeProfitAndLossData = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/exchange-profit-loss', {
      params,
    });
    return data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get daily transaction summary data for a currency
export const getDailyTransactionSummaryData = async (params) => {
  try {
    const { currency_id, period_from, period_to } = params;
    const response = await axiosInstance.get(`/user-api/exchange-profit-loss/currency/${currency_id}`, {
      params: {
        period_from,
        period_to
      }
    });

    // Transform the API response to match the expected structure
    const apiData = response.data.data;

    return {
      currency: apiData.currency.code,
      period_from: apiData.period_from,
      period_to: apiData.period_to,
      data: apiData.daily_summary.map(item => ({
        id: `daily-${item.date}`,
        date: item.date,
        opening: item.opening_bal,
        avg_open_rate: item.avg_opening_rate,
        buy: item.buy,
        avg_buy_rate: item.avg_buy_rate,
        sell: item.sell,
        avg_sell_rate: item.avg_sell_rate,
        closing: item.closing,
        avg_closing_rate: item.avg_closing_rate,
        sale_value_in_dhs: item.sale_value_in_base_currency,
        cost_of_sale_in_dhs: item.cost_of_sale_in_base_currency,
        difference: item.difference,
      })),
      grand_total: {
        total_opening: apiData.daily_summary[0]?.opening_bal || 0,
        total_buy: apiData.summary_total.total_buy,
        total_sell: apiData.summary_total.total_sell,
        total_closing: apiData.daily_summary[apiData.daily_summary.length - 1]?.closing || 0,
        total_sale_value_in_dhs: apiData.summary_total.total_sale_value_in_base_currency,
        total_cost_of_sale_in_dhs: apiData.summary_total.total_cost_of_sale_in_base_currency,
        total_difference: apiData.summary_total.total_difference,
      },
    };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Generate dummy data for daily transaction summary
const generateDummyDailyTransactionSummary = (params) => {
  const { currency_id, period_from, period_to } = params;

  // Generate dates between period_from and period_to
  let dates = generateDateRange(period_from, period_to);

  // Ensure at least 2 rows of data
  if (dates.length < 2) {
    // If no dates or only one date, create at least 2 sample dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    dates = dates.length === 0
      ? [formatDate(yesterday), formatDate(today)]
      : [dates[0], formatDate(today)];
  }

  // Create data with at least 2 rows, some with buy/sell data
  const data = dates.map((date, index) => {
    // First row: Only opening/closing (no buy/sell)
    if (index === 0) {
      return {
        id: `daily-${date}`,
        date,
        opening: 2931473.00,
        avg_open_rate: 26.40391070,
        buy: null,
        avg_buy_rate: null,
        sell: null,
        avg_sell_rate: null,
        closing: 2931473.00,
        avg_closing_rate: 26.40391070,
        sale_value_in_dhs: null,
        cost_of_sale_in_dhs: null,
        difference: null,
      };
    }
    // Second row: With buy/sell data
    else if (index === 1) {
      return {
        id: `daily-${date}`,
        date,
        opening: 2931473.00,
        avg_open_rate: 26.40391070,
        buy: 50000.00,
        avg_buy_rate: 26.50000000,
        sell: 30000.00,
        avg_sell_rate: 26.45000000,
        closing: 2951473.00,
        avg_closing_rate: 26.45000000,
        sale_value_in_dhs: 793500.00,
        cost_of_sale_in_dhs: 795000.00,
        difference: -1500.00,
      };
    }
    // Other rows: Mix of data
    else {
      return {
        id: `daily-${date}`,
        date,
        opening: 2931473.00,
        avg_open_rate: 26.40391070,
        buy: index % 2 === 0 ? 25000.00 : null,
        avg_buy_rate: index % 2 === 0 ? 26.48000000 : null,
        sell: index % 2 === 1 ? 20000.00 : null,
        avg_sell_rate: index % 2 === 1 ? 26.42000000 : null,
        closing: 2931473.00,
        avg_closing_rate: 26.40391070,
        sale_value_in_dhs: index % 2 === 1 ? 528400.00 : null,
        cost_of_sale_in_dhs: index % 2 === 1 ? 529600.00 : null,
        difference: index % 2 === 1 ? -1200.00 : null,
      };
    }
  });

  // Calculate grand totals
  const totalBuy = data.reduce((sum, item) => sum + (item.buy || 0), 0);
  const totalSell = data.reduce((sum, item) => sum + (item.sell || 0), 0);
  const totalSaleValue = data.reduce((sum, item) => sum + (item.sale_value_in_dhs || 0), 0);
  const totalCostOfSale = data.reduce((sum, item) => sum + (item.cost_of_sale_in_dhs || 0), 0);
  const totalDifference = data.reduce((sum, item) => sum + (item.difference || 0), 0);

  return {
    currency: currency_id || 'RUB',
    period_from,
    period_to,
    data,
    grand_total: {
      total_opening: 2931473.00,
      total_buy: totalBuy > 0 ? totalBuy : null,
      total_sell: totalSell > 0 ? totalSell : null,
      total_closing: 2931473.00,
      total_sale_value_in_dhs: totalSaleValue > 0 ? totalSaleValue : null,
      total_cost_of_sale_in_dhs: totalCostOfSale > 0 ? totalCostOfSale : null,
      total_difference: totalDifference !== 0 ? totalDifference : null,
    },
  };
};

// Helper function to generate date range
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    dates.push(`${day}/${month}/${year}`);
  }

  return dates;
};