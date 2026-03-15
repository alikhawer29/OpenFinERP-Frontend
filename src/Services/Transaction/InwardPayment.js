import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER LISTING AND DETAILS
export const getInwardPaymentListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/inward-payment`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DETAILS
export const viewInwardPayment = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/inward-payment/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// DETAILS
export const viewInwardPaymentPayDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/inward-payment/pay/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CHANGE STATUS
export const changeInwardPaymentStatus = async (id, data) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/inward-payment/status/${id}`,
      data // now supports { status: 'hold', reason: '...' }
    );

    const { message, status: success } = response.data;
    return { message, status: success };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS
// ADD
export const addInwardPaymentAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/inward-payment/attachments/${id}`,
      payload
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE ATTACHMENT
export const deleteInwardPaymentAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/inward-payment/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// PRINT
export const printInwardPayment = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment/print-voucher/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getBeneficiaryListing = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment/beneficiary`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getWalkInCustomerListing = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment/walkinCustomer`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const payInwardPayment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/inward-payment/${id}`,
      payload
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

// DELETE INWARD PAYMENT
export const deleteInwardPayment = async (id, type) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/inward-payment/${id}/${type}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CANCELATION LISTING
export const getInwardPaymentCancelListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment/cancelation`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCIES
export const getCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/inward-payment/currency`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const createReceiptVoucher = async (formData) => {
  // const payload = new FormData();
  // buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      '/user-api/receipt-voucher',
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

// UPDATE
export const updateReceiptVoucher = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/receipt-voucher/${id}`,
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

// DELETE RECEIPT VOUCHER
export const deleteReceiptVoucher = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/receipt-voucher/${id}`
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
export const addReceiptVoucherAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/receipt-voucher/attachments/${id}`,
      payload
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE RECEIPT VOUCHER ATTACHMENT
export const deleteReceiptVoucherAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/receipt-voucher/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET VAT TYPE
export const getVATType = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/receipt-voucher/vat-type`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNTS BY TYPE -- party,walkin,general
export const getAccountsbyType = async (AccountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/receipt-voucher/account?type=${AccountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET beneficiary ACCOUNTS BY TYPE AND ACCOUNT -- party/walkin, account_id
export const getBenefeciariesByAccount = async (account_id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/receipt-voucher/account?type=beneficiary&account=${account_id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET COA ACCOUNTS BY MODE -- cash, bank, online, pdc
export const getCOAAccountsbyMode = async (modeType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/receipt-voucher/modes?type=${modeType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
