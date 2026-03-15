import { useMutation } from '@tanstack/react-query';

const useDataMutations = ({
  onDeleteSuccessCallback,
  onDeleteErrorCallback,
  onEditSuccessCallback,
  onEditErrorCallback,
}) => {
  const handleApiError = (error, errorCallback) => {
    console.error('API Error:', error.message || error);
    if (errorCallback) errorCallback(error || 'An error occurred');
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ serviceFunction, id }) => {
      return await serviceFunction(id);
    },
    onSuccess: () => {
      if (onDeleteSuccessCallback) onDeleteSuccessCallback();
      // Optional: Show success toast/modal
    },
    onError: (error) => {
      handleApiError(error, onDeleteErrorCallback);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ serviceFunction, id, formData }) => {
      return await serviceFunction(id, formData);
    },
    onSuccess: () => {
      if (onEditSuccessCallback) onEditSuccessCallback();
      // Optional: Show success toast/modal
    },
    onError: (error) => {
      handleApiError(error, onEditErrorCallback);
    },
  });

  return { deleteMutation, editMutation };
};

export default useDataMutations;
