import axiosInstance from '../Config/axiosConfig';
import { buildFormData } from '../Utils/Utils';

export const fetchNationalities = async () => {
  try {
    const response = await axiosInstance.get(`/user-api/general/countries`);
    return response.data.detail.map((country) => ({
      label: country.name,
      value: country.id,
    }));
  } catch (error) {
    console.error('Failed to fetch nationalities:', error);
    return [];
  }
};
export const fetchStatesForCountry = async (params) => {
  try {
    const response = await axiosInstance.get(`/user-api/general/states`, {
      params,
    });
    return response.data.detail.map((state) => ({
      label: state.name,
      value: state.id,
    }));
  } catch (error) {
    console.error('Failed to fetch states:', error);
    return [];
  }
};

export const fetchCountries = async () => {
  try {
    const response = await axiosInstance.get(
      `/user-api/general/country-register`
    );
    return response.data.detail.map((country) => ({
      label: country.country,
      value: country.id,
    }));
  } catch (error) {
    console.error('Failed to fetch counrties:', error);
    return [];
  }
};

export const fetchCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/general/currencies`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getClassificationsWithType = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/general/classification-type',
      {
        params,
      }
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getClassificationsType = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/classification-type', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const sendSupportForm = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post('/user-api/contact-us', payload);

    if (!response.data.status) {
      throw new Error('Error submitting form', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getSupportType = async () => {
  try {
    const { data } = await axiosInstance.get('/user-api/contact-us');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// USERS
export const getAllUsers = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/branch/users`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY RATE
export const getCurrencyRate = async (currency_id, date = null) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/rates?currency_id=${currency_id}&date=${date}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getCurrencyRatesPair = async (
  currency_one,
  currency_two,
  date,
  type
) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/dual-currency?currency_one=${currency_one}&currency_two=${currency_two}&date=${date}&type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Banks
export const getAllBanks = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/general/banks`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Bank TRQ
export const getBanksTRQ = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/modes?type=bank`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Doc Types
export const getDocTypes = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/modes?type=doc`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET Cities
export const getCities = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/modes?type=city`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// getAccountBalances
export const getAccountBalances = async (accountId, accountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/general/account-balances`,
      {
        params: {
          account_id: accountId,
          account_type: accountType,
        },
      }
    );
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// Get Exchange Rate Service
export const getExchangeRates = async (inverse) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/remittance-rate/exchange-rates?inverse=${inverse}`,
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Unknown error occurred' };
  }
};

export const pairReleased = async (pair_id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/remittance-rate/pair-released/${pair_id}`);
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
