import axiosInstance from '../../Config/axiosConfig';

// GET SPECIAL RATE CURRENCY

export const getSpecialRateCurrency = async (currency, ag_fcy, date) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/remittance-rate/special-rates/list?currency=${currency}&ag_fcy=${ag_fcy}&date=${date}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE SPECIAL RATE CURRENCY
export const createSpecialRateCurrency = async (formData) => {
  try {
    const { message, status } = await axiosInstance.post(
      `/user-api/remittance-rate/special-rates/2`,
      formData
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
