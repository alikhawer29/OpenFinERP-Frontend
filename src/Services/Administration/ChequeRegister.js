import axiosInstance from '../../Config/axiosConfig';

// GET
export const getChequeRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('user-api/cheque-register', {
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
export const addChequeBookRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/cheque-register',
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

// DELETE CHEQUE
export const deleteCheque = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/cheque-register/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE CHEQUE BOOK
export const deleteChequeBook = async (formData) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/cheque-register`,
      { data: formData }
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET REFERENCE BY BANK
export const getReference = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `user-api/cheque-register/reference/${id}`
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
