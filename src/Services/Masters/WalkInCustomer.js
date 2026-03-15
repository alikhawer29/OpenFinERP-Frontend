import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

export const getWalkInCustomerListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/walk-in-customer', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const viewWalkInCustomer = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/walk-in-customer/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const editWalkInCustomer = async (id, formData) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/walk-in-customer/${id}`,
      formData
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const addWalkInCustomer = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/walk-in-customer',
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

export const deleteWalkInCustomer = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/walk-in-customer/${id}`
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

// ATTACHMENTS
// GET
export const getWalkInCustomerAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/walk-in-customer/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// ADD
export const addWalkInCustomerAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/walk-in-customer/attachments/${id}`,
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
export const deleteWalkInCustomerAttachment = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/walk-in-customer/attachments/${id}`
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
