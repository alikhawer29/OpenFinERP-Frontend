import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// TTR Register Service - Updated with updateTTRConfirmation and deleteTTRConfirmation

// GET TTR CONFIRMATION VOUCHER NUMBER
export const getTTRVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TTR CONFIRMATION BY SEARCH
export const getTTRConfirmationBySearch = async (search) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/confirmation/show?search=${search}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS // TTR REGISTER
// ADD
export const addTTRRegisterAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/ttr-register/attachments/${id}`,
      payload
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TTR REGISTER ATTACHMENT
export const getTTRRegisterAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE TTR REGISTER ATTACHMENT
export const deleteTTRRegisterAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/ttr-register/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DEAL REGISTER LISTING
export const getTTRListing = async (params, type = null) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register?type=${type}`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ALLOCATION LISTING
export const getTTRAllocationListing = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/allocations`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET New Allocations LISTING
export const getTTRnewAllocations = async (params, type = null) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/new-allocations?type=${type}`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DETAILS
export const getTTRDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/ttr-register/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DETAILS ALLOCATION
export const viewTTRAllocation = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/new-allocations/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// PRINT BANK
export const printBankDetails = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/bank-details/print`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// PRINT ALLOCATION
export const printAllocation = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/allocation/print`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// PRINT CONFIRMATION
export const printConfirmation = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/confirmation/print`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE BANK DETAILS
export const deleteBankDetails = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/ttr-register/bank-details/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE ALLOCATION
export const deleteAllocation = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/ttr-register/allocation/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CANCEL UNALLOCATED
export const cancelUnallocated = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.get(
      `/user-api/ttr-register/cancel-unallocated/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CANCEL UNCONFIRMED
export const cancelUnconfirmed = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.get(
      `/user-api/ttr-register/cancel-unconfirmed/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET DETAILS CONFIRMATION
export const viewTTRConfirmation = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/confirmation/show?search=${params}`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getTTRDocuments = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/ttr-register/doc-type`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getPartyAccounts = async () => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/account?type=party`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE BANK DETAILS
export const createBankDetailsDeal = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/ttr-register`,
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE Allocations
export const createAllocations = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/ttr-register/allocation`,
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE Confirmation
export const createConfirmation = async (id, payload) => {
  try {
    const formData = new FormData();
    buildFormData(formData, payload);
    const response = await axiosInstance.post(
      `/user-api/ttr-register/confirmation/${id}`,
      formData
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE CONFIRMATION
export const updateTTRConfirmation = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/ttr-register/update/confirmation/${id}`,
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE CONFIRMATION
export const deleteTTRConfirmation = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/ttr-register/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//GET BANK DETAILS
export const getTTRBankDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/ttr-register/${id}/bank-details`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE BANK DETAILS
export const updateAllocation = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/ttr-register/update/allocation/${id}`,
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE BANK DETAILS
export const updateBankDetailsDeal = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/ttr-register/${id}`,
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
