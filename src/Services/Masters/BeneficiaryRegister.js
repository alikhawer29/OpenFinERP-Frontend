import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getBeneficiaryRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/beneficiary-register', {
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
export const viewBeneficiaryRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/beneficiary-register/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addBeneficiaryRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/beneficiary-register',
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

// UPDATE
export const editBeneficiaryRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/beneficiary-register/${id}`,
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
export const deleteBeneficiaryRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/beneficiary-register/${id}`
    );
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
export const getBeneficiaryRegisterAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/beneficiary-register/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// ADD
export const addBeneficiaryRegisterAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/beneficiary-register/attachments/${id}`,
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
export const deleteBeneficiaryRegisterAttachment = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/beneficiary-register/attachments/${id}`
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

// GET ACCOUNT TYPE
export const getAccountType = async (type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/beneficiary-register/type?type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
