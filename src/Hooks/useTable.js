import { useQuery } from '@tanstack/react-query';

// Custom hook to fetch data
export const useFetchTableData = (
  name = '',
  filters = null,
  updatePagination,
  fetchService,
  options = {}
) => {
  return useQuery({
    queryKey: [name, filters],
    queryFn: async () => {
      const data = await fetchService(filters);
      updatePagination({
        showData: data.to,
        currentPage: data.current_page,
        totalRecords: data.total,
        totalPages: Math.ceil(data.total / data.per_page),
      });
      return data;
    },
    refetchOnWindowFocus: true,
    retry: 1,
    ...options,
  });
};

export const useFetchAttachmentsData = (name = '', fetchService) => {
  return useQuery({
    queryKey: [name],
    queryFn: async () => {
      return await fetchService();
    },
    refetchOnWindowFocus: false,
  });
};
