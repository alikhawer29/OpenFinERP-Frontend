import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getSupportLogListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/feedback', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const updateSupportStatus = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/feedback/status/${id}`,
      formData
    );
    const {
      data: { message, status },
    } = response;
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


// DETAILS
export const viewSupport = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/feedback/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TYPES
export const getSupportTypes = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/feedback/types');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// USER BRANCHES
export const getUserBranches = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/users/branches/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET USER LISTING
export const getUserListingForSupport = async () => {
  try {
    const { data } = await axiosInstance.get('/admin-api/feedback/user-listing');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET SUPPORT TYPES LIST  
export const getSupportTypesList = async () => {
  try {
    const { data } = await axiosInstance.get('/admin-api/feedback/support-types');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
  
// SEND NEW SUPPORT FORM 
// export const sendNewSupportForm = async (formData) => {
//   try {
//     const response = await axiosInstance.post('/admin-api/feedback/new-request', formData);
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : { message: 'Unknown error occurred' };
//   }
// };
// CREATE
export const sendNewSupportForm = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      '/admin-api/feedback/new-request',
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
// GET
export const getSupportManagementListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/support-type', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addSupportType = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/admin-api/support-type',
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
export const editSupportType = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/support-type/${id}`,
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
export const deleteSupportType = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/admin-api/support-type/${id}`
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
