import axiosInstance from '../../Config/axiosConfig';

// GET
export const getTellerRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/teller-register', {
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
export const viewTellerRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/teller-register/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addTellerRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/teller-register',
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
export const editTellerRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/teller-register/${id}`,
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
export const deleteTellerRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/teller-register/${id}`
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

// GET EMPLOYEES
export const getEmployees = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/teller-register/employee`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CASH ACCOUNTS
export const getCashAccount = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/teller-register/cash_account`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
