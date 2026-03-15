import axios from 'axios';
import useUserStore from '../Stores/UserStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_MILESTONE_BASE_URL,
  // timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("accessToken");

    const token = document.cookie
      ?.split('; ')
      ?.find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the response status is 401 and the message is "Please Login First."
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.message === 'Please Login First.'
    ) {
      // Clear the user data from Zustand store
      const clearUser = useUserStore.getState().clearUser;
      clearUser();

      // Redirect to login page
      window.location.href = '/milestone-frontend/login'; // Update path as per your routing setup
    }

    // Return the error to be handled elsewhere if needed
    return Promise.reject(error);
  }
);
