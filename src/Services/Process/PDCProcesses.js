import axiosInstance from '../../Config/axiosConfig';

// Get PDC Processes (Receivables/Payables)
export const getPDCProcesses = async (type = 'receivables', params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/pdc-process', {
      params: { type, ...params },
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST PDC Process
export const postPDCProcess = async (id, type, payload) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/pdc-process/${id}`,
      payload,
      {
        params: {
          type,
        },
      }
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
