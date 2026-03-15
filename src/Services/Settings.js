import axiosInstance from '../Config/axiosConfig';

export const getSettings = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/settings`);
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Failed to fetch settings: Unknown error' };
  }
};

export const updatePrint = async (voucherType, value) => {
  try {
    const { data } = await axiosInstance.post(
      '/user-api/settings/voucher-setting',
      { key: voucherType, value }
    );
    const { detail, status, message } = data;
    return { detail, status, message }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Failed to update voucher settings: Unknown error' };
  }
};

export const updateAccountBalance = async (voucherType, value) => {
  try {
    const { data } = await axiosInstance.post(
      '/user-api/settings/voucher-setting',
      { key: `account_balance_${voucherType}`, value }
    );
    const { detail, status, message } = data;
    return { detail, status, message }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Failed to update voucher settings: Unknown error' };
  }
};

export const updateBackToBack = async (voucherType, value) => {
  try {
    const { data } = await axiosInstance.post(
      '/user-api/settings/voucher-setting',
      { key: `back_to_back_${voucherType}`, value }
    );
    const { detail, status, message } = data;
    return { detail, status, message }; // Assume this returns the user object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Failed to update voucher settings: Unknown error' };
  }
};