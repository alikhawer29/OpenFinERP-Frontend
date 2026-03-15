import axiosInstance from '../../Config/axiosConfig';

// GET
export const getCurrencyRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/currency-register', {
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
export const viewCurrencyRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-register/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addCurrencyRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/currency-register',
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
export const editCurrencyRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/currency-register/${id}`,
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
export const deleteCurrencyRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/currency-register/${id}`
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

// GET ALL CURRENCY CODES
export const getCurrencyCodes = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-register/list`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY NAME
export const getCurrencyName = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-register/list/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ALL CURRENCY REGISTER GROUPS
export const getCurrencyGroups = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-register/groups`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
