import axiosInstance from "../../Config/axiosConfig";

// Business
export const profileUpdate = async (credentials) => {
  try {
    const response = await axiosInstance.post(
      '/admin-api/account',
      credentials
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Business
export const passwordUpdate = async (credentials) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/account/change-password',
      credentials
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
