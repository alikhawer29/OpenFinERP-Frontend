import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getIPOVoucherNumber = async (voucher_no = '') => {
    try {
      const { data } = await axiosInstance.get(
        `/user-api/inward-payment-order/voucher-number?voucher_no=${voucher_no}`
      );
      return data.detail; // Assume this returns success obj
    } catch (error) {
      throw error.response
        ? error.response.data
        : { message: 'Unknown error occurred' };
    }
  };
// GET ORDER LISTING AND DETAILS
export const getInwardPaymentOrderListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/inward-payment-order`, {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// CREATE
export const createInwardPaymentOrder = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      '/user-api/inward-payment-order',
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// UPDATE
export const updateInwardPaymentOrder = async (id, formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      `/user-api/inward-payment-order/${id}`,
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// DELETE INWARD PAYMENT ORDER
export const deleteInwardPaymentOrder = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/inward-payment-order/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// ATTACHMENTS
// ADD
export const addInwardPaymentOrderAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/inward-payment-order/attachments/${id}`,
      payload
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
// GET INWARD PAYMENT ORDER ATTACHMENTS
export const getInwardPaymentOrderAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/attachments/${id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// DELETE INWARD PAYMENT ORDER ATTACHMENT
export const deleteInwardPaymentOrderAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/inward-payment-order/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET ACCOUNTS BY TYPE -- party,walkin,general
export const getIPOAccountsByType = async (AccountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/account?type=${AccountType}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET WALK-IN CUSTOMERS BY ACCOUNT -- following TMN pattern for beneficiaries
export const getWalkInCustomersByAccount = async (account_id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/account?type=walkin&account=${account_id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET OFFICE LOCATIONS
export const getIPOOfficeLocations = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/office`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET CURRENCIES
export const getIPOCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/currency`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET VAT TYPE
export const getIPOVATType = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user-api/receipt-voucher/vat-type`
      );
      return data.detail;
    } catch (error) {
      throw error.response
        ? error.response.data
        : { message: 'Unknown error occurred' };
    }
  };

// GET ACCOUNT BALANCE
export const getIPOAccountBalance = async (accountId, accountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment-order/account-balance?account_id=${accountId}&account_type=${accountType}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
