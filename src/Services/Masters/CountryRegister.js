import axiosInstance from '../../Config/axiosConfig';

// GET
export const getCountryRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/country-register', {
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
export const viewCountryRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/country-register/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addCountryRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/country-register',
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
export const editCountryRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/country-register/${id}`,
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
export const deleteCountryRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/country-register/${id}`
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

// GET ALL FOR DROPDOWN
export const fetchCountries = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/country-register/all`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
