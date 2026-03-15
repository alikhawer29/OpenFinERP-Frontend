import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET CURRENCIES
export const getCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-posting/currency`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET OFFICES
export const getOffices = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-posting/office`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNTS BY TYPE -- party,walkin,general
export const getAccountsbyType = async (AccountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-posting/account?type=${AccountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET SUSPENSE POSTINGS LISTING AND DETAILS
export const getSuspensePostingListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/suspense-posting`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE
export const updateSuspensePosting = async (id, newStatus, formData = {}) => {
  let payload;

  if (newStatus === 3) {
    payload = new FormData();
    buildFormData(payload, formData); // you already have this function
  } else {
    payload = {}; // or use null if backend accepts
  }

  try {
    const response = await axiosInstance.post(
      `/user-api/suspense-posting/${id}/${newStatus}`,
      payload
    );

    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

