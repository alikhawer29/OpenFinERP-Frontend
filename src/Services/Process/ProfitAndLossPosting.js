import axiosInstance from '../../Config/axiosConfig';
import { rateRevaluationData } from '../../Mocks/MockData';

// GET
export const getRateReValuationListing = async (filters) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/profit-loss` ,{
      params:filters
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getRateReValuationAccounts = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/profit-loss/accounts`);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getProfitAndLossAccounts = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/profit-loss/capital-accounts`);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const postRateReValuationAccounts = async (payload) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/profit-loss/post` , payload);
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const generateRateReValuationAccounts = async (payload) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/profit-loss/generate` , payload);
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const reCalculateRateReValuationAccounts = async (payload) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/profit-loss/recalculate-closing-rates` , payload);
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const convertProfitAndLossBalances = async (payload) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/profit-loss/convert-balances` , payload);
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const postProfitAndLossAccount = async (payload) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/profit-loss/close-accounts` , payload);
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
