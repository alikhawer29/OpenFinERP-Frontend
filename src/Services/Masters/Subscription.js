import axiosInstance from '../../Config/axiosConfig';

// GET
export const getSubscriptionListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/subscriptions', {
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
export const getCurrentSubscription = async () => {
  try {
    const { data } = await axiosInstance.get(`/user-api/subscriptions/current`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET PACKAGES
export const getPackagesListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/packages', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE CUSTOM SUBSCRIPTION
export const customSubscriptionRequest = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/packages/custom',
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

// DETAILS
export const checkDowngrade = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/subscriptions/check-downgrade?plan_id=${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


//GET DOWNGRADE USERS
export const getDowngradeUserListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`user-api/subscriptions/downgrade?type=user`, {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//GET DOWNGRADE BRANCHES
export const getDowngradeBranchListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`user-api/subscriptions/downgrade?type=branch`, {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


// BLOCK
// export const changeDowngradeStatus = async (id, type) => {
//   try {
//     const response = await axiosInstance.post(
//       `/user-api/subscriptions/downgrade/${id}?type=${type}`);
//     const {
//       data: { message, status },
//     } = response;
//     return { message, status }; // Assume this returns the success object
//   } catch (error) {
//     throw error.response
//       ? error.response.data
//       : { message: 'Unknown error occurred' };
//   }
// };

// API Call for Changing Downgrade Status
export const changeDowngradeStatus = async (id, type) => {
  try {
    const response = await axiosInstance.post(`/user-api/subscriptions/downgrade/${id}`, { type });

    return response.data; // Return full response data
  } catch (error) {
    throw error.response?.data || { message: 'Unknown error occurred' };
  }
};


// CANCEL SUBSCRIPTION
export const cancelSubscription = async (id) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/subscriptions/cancel/${id}`
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
