import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getDocumentRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/document-register', {
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
export const viewDocumentRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/document-register/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addDocumentRegister = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      '/admin-api/document-register',
      payload
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
export const editDocumentRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/document-register/${id}`,
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
export const deleteDocumentRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/admin-api/document-register/${id}`
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
export const getDocumentRegisterAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/document-register/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// ADD
export const addDocumentRegisterAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/admin-api/document-register/attachments/${id}`,
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
export const deleteDocumentRegisterAttachment = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/admin-api/document-register/attachments/${id}`
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

// GET ALL GROUPS
export const getGroups = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/document-register/groups`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TYPES
export const getGroupTypes = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/document-register/classifications?type=${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
