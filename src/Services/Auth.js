import axiosInstance from '../Config/axiosConfig';

// Business
export const loginUser = async (credentials) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/auth/login',
      credentials
    );
    const {
      data: {
        detail: { token, role, user },
        status,
      },
    } = response;
    return { token, role, user, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/user-api/auth/logout');

    if (!response.data.status) {
      throw new Error('Error logging out', response);
    }
    // return { token, role, user, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const signUpUser = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/auth/register',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error logging out', response);
    }
    // return { token, role, user, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const sendVerificationCodeId = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/id-recovery/verify-email-user-id',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error sending Verification code', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const verifyVerificationCodeId = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/id-recovery/verify-code-user-id',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error verifiying code', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const sendVerificationCode = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/password-recovery/verify-email',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error sending Verification code', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const verifyVerificationCode = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/password-recovery/verify-code',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error verifiying code', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const setNewPassword = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/password-recovery/update-password',
      formData
    );

    if (!response.data.status) {
      throw new Error('Error verifiying code', response);
    }
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const setUserId = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/auth/suggest-user-ids?user_id=${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Admin
export const loginAdmin = async (credentials) => {
  try {
    const response = await axiosInstance.post(
      '/admin-api/auth/login',
      credentials
    );
    const {
      data: {
        detail: { token, role, user },
        status,
      },
    } = response;
    return { token, role, user, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const logoutAdmin = async () => {
  try {
    const response = await axiosInstance.post('/admin-api/auth/logout');

    if (!response.data.status) {
      throw new Error('Error logging out', response);
    }
    // return { token, role, user, status }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
