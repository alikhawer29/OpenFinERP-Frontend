import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET CARD
export const getDashboardData = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/account/home', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET USER CHART
export const getUserChart = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/admin-api/charts/user?role=user&type=${params}`);
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET EARNING CHART
export const getEarningChart = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/admin-api/charts/payment?type=${params}`);
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


// GET Upcoming Subscription Renewal
export const getUpcomingSubscriptionRenewal = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/subscription/upcoming-subscription-renewal');
    return data.data; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Pending Requests
export const getPendingRequests = async (type) => {
  try {
    const { data } = await axiosInstance.get(`/admin-api/subscription/pending-request?type=${type}`);
    return data.data; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//create function for send reminder with id
export const sendReminder = async (id) => {
  try {
    const { data } = await axiosInstance.post(`/admin-api/subscription/send-reminder/${id}`);
    return data; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

