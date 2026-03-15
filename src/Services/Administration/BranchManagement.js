import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getBranchManagementListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('user-api/branch', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DETAILS
export const viewBranch = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/branch/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addBranch = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post('/user-api/branch', payload);
    const {
      data: {
        message,
        status,
        detail: { id },
      },
    } = response;
    return { message, status, id }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE
export const editBranch = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);

    const response = await axiosInstance.post(
      `/user-api/branch/${id}`,
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE
export const deleteBranch = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/branch/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CHANGE BRANCH STATUS
export const changeBranchStatus = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.post(
      `/user-api/branch/status/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CURRENCY
export const getCurrency = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/branch/currency`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ACCOUNTS
export const getAccounts = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/branch/accounts`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Branch Specific ACCOUNTS
export const getBranchSpecificAccounts = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/branch/accounts/after/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
