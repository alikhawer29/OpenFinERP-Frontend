import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import { getBudgetSetupListing } from '../../../Services/Process/BudgetSetup';
import { showErrorToast } from '../../../Utils/Utils';

const ViewBudgetSetup = ({ setPageState, setSearchTerm }) => {
  const navigate = useNavigate();

  // Budget setup listing fetch
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['budgetSetupListing'],
    queryFn: () => getBudgetSetupListing(),
  });

  // Extract safe budgets array
  const budgets = data?.data || [];

  // Handle loading state
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

  // Handle error state
  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching budget setup listing</p>
        <CustomButton
          text="Back"
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

  return (
    <div className="d-card">
      <div className="mb-3">
        <h4>Budget Setup List</h4>
      </div>

      {budgets.length > 0 ? (
        <ul className="list-group">
          {budgets.map((item) => (
            <li key={item.id} className="list-group-item d-flex justify-content-between">
              <span>
                {item.preference?.period || '-'} | {item.fiscal_year_start} - {item.fiscal_year_end}
              </span>
              <CustomButton
                text="View"
                onClick={() => {
                  setPageState('view');
                  setSearchTerm(item.id);
                  navigate(`/process/budget-setup/view/${item.id}`);
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>No budget setups found.</p>
      )}
    </div>
  );
};

export default ViewBudgetSetup;
