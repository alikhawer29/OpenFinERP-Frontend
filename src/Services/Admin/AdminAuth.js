import axiosInstance from "../../Config/axiosConfig";

export const AdminSendVerificationCode = async (formData) => {
    try {
      const response = await axiosInstance.post(
        '/admin-api/password-recovery/verify-email',
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
  export const AdminVerifyVerificationCode = async (formData) => {
    try {
      const response = await axiosInstance.post(
        '/admin-api/password-recovery/verify-code',
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
  export const AdminSetNewPassword = async (formData) => {
    try {
      const response = await axiosInstance.post(
        '/admin-api/password-recovery/update-password',
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