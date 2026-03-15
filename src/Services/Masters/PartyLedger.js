import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getPartyLedgerListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/party-ledger', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET POSTING ACCOUNTS
export const getPostingAccounts = async (type) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/party-ledger/posting-accounts?type=${type}`);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DETAILS
export const viewPartyLedger = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/party-ledger/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addPartyLedger = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/party-ledger',
      formData
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
// ADD ACCOUNT CODE PREFERNECES
export const accountCodePreferences = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/party-ledger/account_code',
      formData
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

// UPDATE
export const editPartyLedger = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/party-ledger/${id}`,
      formData
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE
export const deletePartyLedger = async (id) => {
  try {
    const response = await axiosInstance.delete(`/user-api/party-ledger/${id}`);
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS
// GET
export const getPartyLedgerAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/party-ledger/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// ADD
export const addPartyLedgerAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/party-ledger/attachments/${id}`,
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
// Delete
export const deletePartyLedgerAttachment = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/party-ledger/attachments/${id}`
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

// GET OFFICE LOCATION
export const getOfficeLocations = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/party-ledger/office_location'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CLASSIFICATIONS
// GET
export const getPartyLedgerClassifications = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/party-ledger/get-classifications'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// Add
export const addPartyLedgerClassification = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/party-ledger/add-classification',
      formData
    );
    const {
      data: { message, status, detail },
    } = response;
    return { detail, message, status }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Central Bank Group
// GET
export const getCBGroups = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/party-ledger/cb-classification'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ID TYPES
// GET
export const getPartyLedgerIDTypes = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/party-ledger/id_type?type=ID Types'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
