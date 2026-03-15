import axiosInstance from '../../Config/axiosConfig';

// GET
export const getBudgetSetupListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/budget-setup', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET Check Budget Preference
export const checkBudgetPreference = async () => {
  try {
    const { data } = await axiosInstance.get("/user-api/budget-setup/preference");
    return data.detail; // 👈 sirf detail return karenge
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: "Unknown error occurred" };
  }
};
// GET Check get BudgetPreference Accounts
export const getBudgetPreferenceAccounts = async () => {
  try {
    const { data } = await axiosInstance.get("/user-api/budget-setup/accounts");
    return data.detail; // 👈 sirf detail return karenge
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: "Unknown error occurred" };
  }
};
// POST CREATE Budget Setup
export const createbudgetSetup = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/budget-setup',
      formData, // 👈 directly send JSON
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
// GET by ID Budget Setup For Edit
export const getBudgetSetupById = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/budget-setup/${id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// PUT UPDATE Budget Setup
export const updateBudgetSetup = async ({ id, payload }) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/budget-setup/${id}`,  
      payload,                          
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

