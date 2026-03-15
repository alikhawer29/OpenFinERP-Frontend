import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withModal from '../../../HOC/withModal';
import withPagination from '../../../HOC/withPagination';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getBudgetSetupListing } from '../../../Services/Process/BudgetSetup';
import useFormStore from '../../../Stores/FormStore';
import { budgetSetupHeaders, budgetSetupHeadersAccess } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import EditBudgetSetup from './EditBudgetSetup';
import NewBudgetSetup from './NewBudgetSetup';
import ViewBudgetSetup from './ViewBudgetSetup';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions } from '../../../Utils/Helpers';

const BudgetSetup = ({ pagination, updatePagination , filters , setFilters }) => {
  usePageTitle('Budget Setup');
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();

  const [pageState, setPageState] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

      const permissions = useModulePermissions("process" , "budget_setup");
  const {create_budget , edit_budget} = permissions;

  const {
    saveFormValues,
    hasFormValues,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();

  useEffect(() => {
    if (state?.pageState) {
      setPageState(state.pageState);
    }
    if (state?.searchTerm) {
      setSearchTerm(state.searchTerm);
    }
  }, [state]);

  useEffect(() => {
    if (id) {
      setPageState('edit');
      setSearchTerm(id);
    }
  }, [id]);

  useEffect(() => {
    const lastPage = getLastVisitedPage('budget_setup_accounts');
    if (lastPage === 'new-account' && hasFormValues('budget_setup_accounts')) {
      clearLastVisitedPage('budget_setup_accounts');
    }
  }, []);

  const renderPageContent = () => {
    const pageComponents = {
      new: (
        <NewBudgetSetup
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          saveFormValues={saveFormValues}
        />
      ),
      edit: (
        <EditBudgetSetup
          searchTerm={searchTerm}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          saveFormValues={saveFormValues}
        />
      ),
      view: (
        <ViewBudgetSetup
          searchTerm={searchTerm}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
        />
      ),
      list: (
        <BudgetSetupList
          pagination={pagination}
          filters={filters}
          setFilters={setFilters}
          updatePagination={updatePagination}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };

  return (
    <section>
      <div
        style={{ height: 43 }}
        className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-4"
      >
        <div>
          {(pageState === 'view' || pageState === 'edit') && (
            <BackButton
              onClick={() => {
                setPageState('list');
                setSearchTerm('');
                navigate('/process/budget-setup');
              }}
            />
          )}
          <h2 className="screen-title mb-0">Budget Setup</h2>
        </div>
        {pageState === 'list' && create_budget && (
          <CustomButton
            text={'Setup Budget'}
            onClick={() => setPageState('new')}
          />
        )}
      </div>

      {renderPageContent()}
    </section>
  );
};

// 🔧 Helper: flatten all account.details into rows
const flattenBudgetData = (budgets) => {
  return budgets.map((budget) => ({
    budget_id: budget.id,
    fiscal_period: `${budget.fiscal_year_start} → ${budget.fiscal_year_end}`,
    budget_amount: parseFloat(budget.total_budgeted_amount || 0),
    start_date: budget.fiscal_year_start,
    end_date: budget.fiscal_year_end,
  }));
};

const BudgetSetupList = ({
  pagination,
  filters,
  setFilters,
  updatePagination,
  setPageState,
  setSearchTerm,
}) => {
  const navigate = useNavigate();

  const {
    data: { data: budgets = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'budgetSetupListing',
    filters,
    updatePagination,
    getBudgetSetupListing
  );

  useEffect(() => {
    if (isError) {
      showErrorToast(
        error?.message || 'Something went wrong while fetching data'
      );
    }
  }, [isError, error]);

  const budgetSetupData = flattenBudgetData(budgets);

      const permissions = useModulePermissions("process" , "budget_setup");
  const {create_budget , edit_budget} = permissions;

  console.log("check  " , permissions)

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          filters={filters}
          setFilters={setFilters}
          hasFilters={false}
          headers={edit_budget ? budgetSetupHeaders : budgetSetupHeadersAccess}
          pagination={pagination}
          isLoading={isLoading}
        >
          {(budgetSetupData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={budgetSetupHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {budgetSetupData?.map((item, index) => (
                <tr key={index}>
                  <td>{item.fiscal_period}</td>
                  <td>{item.budget_amount}</td>{' '}
                  { edit_budget && <td>
                    <TableActionDropDown
                        actions={
                          [
                            {
                          name: 'Edit',
                          icon: HiOutlinePencilSquare,
                          onClick: () => {
                            setSearchTerm(item.budget_id);
                            setPageState('edit');
                            navigate(
                              `/process/budget-setup/edit/${item.budget_id}`
                            );
                          },
                          className: 'edit',
                          disabled: new Date(item.end_date) < new Date(),
                        },
                          ]}
                      />
                  </td>}
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withPagination(withModal(BudgetSetup));
