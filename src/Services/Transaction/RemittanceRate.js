import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET REMITTANCE RATEs
export const getRemittanceRates = async (currency, ag_fcy, date) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/remittance-rate?currency=${currency}&ag_fcy=${ag_fcy}&date=${date}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ONLINE RATEs
export const getOnlineRates = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/remittance-rate/live-rates`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE REMITTANCE RATE
export const createRemittanceRates = async (formData) => {
  try {
    const { message, status } = await axiosInstance.post(
      `/user-api/remittance-rate/2`,
      formData
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// DELETE REMITTANCE RATE
export const deleteRemittanceRate = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/remittance-rate/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


export const copyPreviousRates = async (decision) => {
  console.log(decision, "decision");
  try {
    const { data } = await axiosInstance.post(
      `/user-api/remittance-rate/update-today-rates/1`,
      { decision }  // Send decision in payload
    );
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
