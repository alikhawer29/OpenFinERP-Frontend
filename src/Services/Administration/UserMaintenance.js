import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getUserMaintenanceListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('user-api/user-maintenance', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// VIEW USER
export const viewUserMaintenance = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/user-maintenance/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CHANGE USER STATUS
export const changeUserStatus = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.post(
      `/user-api/user-maintenance/status/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE
export const deleteUser = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/user-maintenance/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ACCESS RIGHTS OTHERS
export const getAccessRights = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/user-maintenance/access-rights/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//ACCOUNT PERMISSIONS
export const getAccountPermissions = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/user-maintenance/account-permissions/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ACCESS RIGHTS
export const getAccessRightsGeneral = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/user-maintenance/access-rights`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addUser = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/user-maintenance',
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

// UPDATE
export const editUser = async (id, formData) => {
  try {

    const response = await axiosInstance.post(
      `/user-api/user-maintenance/${id}`,
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
