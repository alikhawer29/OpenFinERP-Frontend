import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getPackageListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/packages', {
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
export const viewPackage = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/packages/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addPackage = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/admin-api/packages',
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
export const editPackage = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/packages/${id}`,
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
export const deletePackage = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/admin-api/packages/${id}`
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


// REJECT
export const rejectPackageRequest = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/packages/reject/${id}`,
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

