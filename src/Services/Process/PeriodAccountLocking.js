import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
// INDEX
export const getPeriodAccountLocking = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/periodic-account-locking'
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET SYSTEM DATES
export const getSystemDates = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/periodic-account-locking/system-dates',
      { params }
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST LOCK
export const lockPeriodAccount = async (formData) => {
  try {
    const { data } = await axiosInstance.post(
      '/user-api/periodic-account-locking/lock',
      formData
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST UNLOCK REQUEST
export const unlockAccountingPeriodRequest = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      '/user-api/periodic-account-locking/unlock-request',
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
