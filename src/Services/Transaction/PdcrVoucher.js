import axiosInstance from '../../Config/axiosConfig';

// CREATE
export const createPdcrVoucher = async (formData) => {
  // const payload = new FormData();
  //  buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      '/user-api/pdcp-issues',
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

export const updatePdcrVoucher = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/pdcp-issues/${id}`,
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

export const getPdcrListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/pdcp-issues`, {
      params,
    });

    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getPDCRoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/pdcp-issues/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE RECEIPT VOUCHER
export const deletePdcrVoucher = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/pdcp-issues/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const addPdcrVoucherAttachment = async (id, formData) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/pdcp-issues/attachments/${id}`, formData);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const deletePdcrVoucherAttachment = async (id) => {
  try {
    const { data } = await axiosInstance.delete(`/user-api/pdcp-issues/attachments/${id}`);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};