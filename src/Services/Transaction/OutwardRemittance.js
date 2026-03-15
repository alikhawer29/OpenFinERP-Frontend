import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getOutwardRemittanceVoucherNumber = async (
  voucher_no = '',
  type
) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/voucher-number?voucher_no=${voucher_no}&type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET VOUCHER LISTING AND DETAILS
export const getOutwardRemittanceListingOrDetails = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/outward-remittance`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE
export const deleteOutwardRemittance = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/outward-remittance/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE OUTWARD REMITTANCE
export const createOutwardRemittance = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/outward-remittance`,
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

// UPDATE OUTWARD REMITTANCE
export const updateOutwardRemittance = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/outward-remittance/${id}`,
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

// CHANGE STATUS
export const changeOutwardRemittanceStatus = async (id, data) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/outward-remittance/status/${id}`,
      data // now supports { status: 'hold', reason: '...' }
    );

    const { message, status: success } = response.data;
    return { message, status: success };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE ALLOCATION
export const deteleOutwardAllocation = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/outward-remittance/allocation/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// REMITTANCE DETAILS
export const viewRemittanceRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// REMITTANCE EDIT DETAILS
export const viewRemittanceRegisterEdit = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/allocation/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET OFFICE LOCATION
export const officeLocation = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/office`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ALLOCATION OUTWARD REMITTANCE
export const allocationOutwardRemittance = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData); // Ensure this is properly flattening nested data

    const response = await axiosInstance.post(
      `/user-api/outward-remittance/allocation/${id}`,
      payload
    );

    const {
      data: { message, status, detail },
    } = response;

    return { message, status, detail };
  } catch (error) {
    const errResponse = error.response?.data || {
      message: 'Unknown error occurred',
    };
    throw errResponse;
  }
};

// UPDATE ALLOCATION OUTWARD REMITTANCE
export const updateAllocationOutwardRemittance = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData); // Ensure this is properly flattening nested data

    const response = await axiosInstance.post(
      `/user-api/outward-remittance/update/allocation/${id}`,
      payload
    );

    const {
      data: { message, status, detail },
    } = response;

    return { message, status, detail };
  } catch (error) {
    const errResponse = error.response?.data || {
      message: 'Unknown error occurred',
    };
    throw errResponse;
  }
};

// GET REGISTER LISTING
export const getOutwardRemittanceRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/register`,
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

// GET APPLICATION PRINTING LISTING
export const getApplicationPrintingListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/application-printing`,
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

// CREATE APPLICATION PRINTING
export const createApplicationPrinting = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData); // Ensure this is properly flattening nested data

    const response = await axiosInstance.post(
      `/user-api/outward-remittance/application-printing/${id}`,
      payload
    );

    const {
      data: { message, status, detail },
    } = response;

    return { message, status, detail };
  } catch (error) {
    const errResponse = error.response?.data || {
      message: 'Unknown error occurred',
    };
    throw errResponse;
  }
};

// ATTACHMENTS
// ADD
export const addOutwardRemittanceAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/outward-remittance/attachments/${id}`,
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

// DELETE
export const deleteOutwardRemittanceAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/outward-remittance/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
