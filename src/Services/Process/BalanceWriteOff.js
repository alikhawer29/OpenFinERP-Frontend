import axiosInstance from '../../Config/axiosConfig';

// GET Balance Write Off Filters
export const getBalanceWriteOffOptions = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/balance-write-off/options'
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Balance Write Off
export const getBalanceWriteOff = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/balance-write-off', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST Balance Write Off
export const postBalanceWriteOff = async (id, payload) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/balance-write-off/${id}`,
      payload
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
