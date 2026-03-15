import { useQuery } from '@tanstack/react-query';
import { fetchNationalities, fetchStatesForCountry } from '../Services/General';
import { fetchCountries } from '../Services/Masters/CountryRegister';

export const useNationalities = () => {
  return useQuery({
    queryKey: ['nationalities'],
    queryFn: fetchNationalities,
    staleTime: 10 * 60 * 1000, // Cache data for 10 minutes
    onError: (error) => {
      console.error('Error fetching nationalities:', error);
    },
  });
};

export const useStates = (countryId) => {
  return useQuery({
    queryKey: ['states', countryId],
    queryFn: () => fetchStatesForCountry({ country_id: countryId }),
    enabled: !!countryId, // Only fetch states if a countryId is provided
    staleTime: 10 * 60 * 1000, // Cache data for 10 minutes
    onError: (error) => {
      console.error('Error fetching states:', error);
    },
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    select: (data) =>
      data.map((country) => ({
        value: country?.id,
        label: country?.country,
      })),
    onError: (error) => {
      console.error('Error fetching countries:', error);
    },
  });
};
