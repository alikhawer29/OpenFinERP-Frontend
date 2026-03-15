import axiosInstance from '../../Config/axiosConfig';

// GET
export const getBranchSelectionList = async () => {
  try {
    const { data } = await axiosInstance.get(
      'user-api/user-maintenance/branch-selection'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DETAILS
export const getBranchDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/user-maintenance/branch-selection/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE
export const updateSelectedBranch = async (id) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/user-maintenance/branch-selection/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
