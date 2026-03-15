import axiosInstance from '../../Config/axiosConfig';



// GET TAB LISTING
export const getSystemIntegrityCheckListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `user-api/system-integrity-check/`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

