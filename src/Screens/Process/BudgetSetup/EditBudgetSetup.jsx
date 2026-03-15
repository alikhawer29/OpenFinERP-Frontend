import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import { getBudgetSetupById } from '../../../Services/Process/BudgetSetup';
import { showErrorToast } from '../../../Utils/Utils';

const EditBudgetSetup = ({ setPageState, setSearchTerm, saveFormValues }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: budgetSetupData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['budgetSetupDetails', id],
    queryFn: () => getBudgetSetupById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (budgetSetupData) {
      const existingData = {
        start_date: budgetSetupData.start_date || '',
        end_date: budgetSetupData.end_date || '',
        periodPreference: budgetSetupData.periodPreference || 'Monthly',
        startLabel: budgetSetupData.startLabel || '',
        endLabel: budgetSetupData.endLabel || '',
      };

      saveFormValues('budget_setup', existingData);

      navigate(`/process/budget-setup/new-account/edit/${id}`, {
        state: { pageState: 'edit', searchTerm: id },
      });
    }
  }, [budgetSetupData, id, saveFormValues, navigate]);

  if (isLoading) {
    return (
      <div className="d-card">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    showErrorToast(error?.message || 'Error fetching details');
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching budget setup details</p>
        <CustomButton
          text="Back to List"
          variant="secondaryButton"
          onClick={() => {
            setPageState('list');
            setSearchTerm('');
            navigate('/process/budget-setup');
          }}
        />
      </div>
    );
  }

  return null;
};

export default EditBudgetSetup;
