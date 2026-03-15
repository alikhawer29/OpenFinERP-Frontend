import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';


// GET DEAL REGISTER LISTING 
export const getDealRegisterListing = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(`/user-api/deal-register`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DEAL REGISTER SUMMARY LISTING 
export const getDealRegisterSummary = async (date, currency) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(`/user-api/deal-register/currency-summary?date=${date}&currency=${currency}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DEAL REGISTER SUMMARY LISTING 
export const getDealRegisterPositionSummary = async (date) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(`/user-api/deal-register/position-summary?date=${date}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DEAL REGISTER SUMMARY LISTING 
export const printDealRegister = async (date, currency) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/deal-register/print?date=${date}&currency=${currency}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DEAL REGISTER CURRENCY OPTIONS
export const getDealCurrencyOptions = async () => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(`/user-api/deal-register/currency`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

