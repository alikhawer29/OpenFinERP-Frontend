import { useMutation } from '@tanstack/react-query';
import { logoutAdmin, logoutUser } from '../Services/Auth';
import useUserStore from '../Stores/UserStore';
import { useNavigate } from 'react-router-dom';

export function useLogout() {
  const clearUser = useUserStore((state) => state.clearUser);
  let navigate = useNavigate();

  return useMutation({
    mutationFn: async (role) =>
      role === 'admin' ? logoutAdmin() : logoutUser(),
    onSuccess: (_, role) => {
      localStorage.setItem("role" , role)
      // clear user on logout
      clearUser();
      useUserStore.persist.clearStorage();
      // Navigate based on the role
      navigate(role === 'admin' ? '/admin/login' : '/login');
    },
    onError: (error) => {
      // Handle errors here
      console.error('Error Logging out', error);
      if (error.message === 'Please Login First.') {
        clearUser();
        useUserStore.persist.clearStorage();
      }
    },
  });
}
