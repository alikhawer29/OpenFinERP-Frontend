import { Form, Formik } from 'formik';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import { makeFiscalPeriodSchema } from '../../../Utils/Validations/ValidationSchemas';
import { checkBudgetPreference } from '../../../Services/Process/BudgetSetup';

const NewBudgetSetup = ({ setPageState, saveFormValues }) => {
  const navigate = useNavigate();
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showFiscalPeriodModal, setShowFiscalPeriodModal] = useState(false);
  const [periodPreference, setPeriodPreference] = useState('');

  const {
    data: preferenceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['budgetPreference'],
    queryFn: checkBudgetPreference,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (preferenceData) {
      if (preferenceData.has_preference) {
        setPeriodPreference(
          preferenceData.preference.charAt(0).toUpperCase() +
          preferenceData.preference.slice(1)
        );
        setShowFiscalPeriodModal(true);
      } else {
        setShowPeriodModal(true);
      }
    }
  }, [preferenceData]);

  const monthOptions = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];
  const monthLabelByValue = monthOptions.reduce(
    (acc, m) => ({ ...acc, [m.value]: m.label }),
    {}
  );
  const monthShortByValue = monthOptions.reduce(
    (acc, m) => ({ ...acc, [m.value]: m.label.slice(0, 3) }),
    {}
  );

  // const buildFiscalYearLabels = (startDateStr, endDateStr) => {
  //   const startDate = new Date(startDateStr);
  //   const endDate = new Date(endDateStr);
  //   const startLabel = `${
  //     monthLabelByValue[
  //       `${(startDate.getMonth() + 1).toString().padStart(2, '0')}`
  //     ]
  //   }, ${startDate.getFullYear()}`;
  //   const endLabel = `${
  //     monthLabelByValue[
  //       `${(endDate.getMonth() + 1).toString().padStart(2, '0')}`
  //     ]
  //   }, ${endDate.getFullYear()}`;
  //   return { startLabel, endLabel };
  // };

  const buildFiscalYearLabels = (startDateStr, endDateStr) => {
    const parseYearMonth = (ym) => {
      if (!ym) return { year: null, monthValue: null };
      const parts = ym.split('-');
      if (parts.length < 2) return { year: null, monthValue: null };
      const year = parseInt(parts[0], 10);
      const monthValue = parts[1].padStart(2, '0');
      return { year, monthValue };
    };

    const { year: startYear, monthValue: startMonth } = parseYearMonth(startDateStr);
    const { year: endYear, monthValue: endMonth } = parseYearMonth(endDateStr);

    const startLabel = startYear && startMonth ? `${monthLabelByValue[startMonth]}, ${startYear}` : '';
    const endLabel = endYear && endMonth ? `${monthLabelByValue[endMonth]}, ${endYear}` : '';

    return { startLabel, endLabel };
  };

  const fiscalPeriodSchema = makeFiscalPeriodSchema(
    periodPreference || 'Monthly'
  );

  const handleCancel = () => {
    setShowPeriodModal(false);
    setShowFiscalPeriodModal(false);
    setPageState('list');
  };

  const generatePeriods = (periodPreference, startDateStr, endDateStr) => {
    if (periodPreference === 'Monthly') {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const months = [];
      let current = new Date(start);
      while (current <= end) {
        const label =
          monthLabelByValue[
          `${(current.getMonth() + 1).toString().padStart(2, '0')}`
          ];
        months.push(label);
        current.setMonth(current.getMonth() + 1);
      }
      return months;
    }
    // if (periodPreference === 'Quarterly') {
    //   const start = new Date(startDateStr);
    //   const end = new Date(endDateStr);
    //   const quarters = [];

    //   // Start quarters from the provided start date (rolling 3-month windows)
    //   const current = new Date(start.getFullYear(), start.getMonth(), 1);
    //   while (current <= end) {
    //     const qStartMonth = (current.getMonth() + 1).toString().padStart(2, '0');
    //     const qEndDate = new Date(current.getFullYear(), current.getMonth() + 2, 1);
    //     // If qEndDate goes beyond `end`, still show the label up to the qEndDate month/year
    //     const qEndMonth = (qEndDate.getMonth() + 1).toString().padStart(2, '0');
    //     const label = `${monthLabelByValue[qStartMonth]} - ${monthLabelByValue[qEndMonth]} ${current.getFullYear()}`;
    //     quarters.push(label);
    //     // advance by 3 months from the current quarter start
    //     current.setMonth(current.getMonth() + 3);
    //   }
    //   return quarters;
    // }
    if (periodPreference === 'Quarterly') {
      // parse YYYY-MM inputs to avoid Date-string timezone issues
      const parseYearMonth = (ym) => {
        const parts = (ym || '').split('-');
        const year = parseInt(parts[0], 10);
        const monthIndex = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
        return { year: isNaN(year) ? null : year, monthIndex: isNaN(monthIndex) ? 0 : monthIndex };
      };

      const { year: sYear, monthIndex: sMonth } = parseYearMonth(startDateStr);
      const { year: eYear, monthIndex: eMonth } = parseYearMonth(endDateStr);
      if (!sYear || !eYear) return [];

      const start = new Date(sYear, sMonth, 1);
      const end = new Date(eYear, eMonth, 1);
      const quarters = [];

      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current <= end) {
        const qStartMonth = (current.getMonth() + 1).toString().padStart(2, '0');
        const qStartYear = current.getFullYear();
        const qEndDate = new Date(current.getFullYear(), current.getMonth() + 2, 1);
        const qEndMonth = (qEndDate.getMonth() + 1).toString().padStart(2, '0');
        const qEndYear = qEndDate.getFullYear();

        let label;
        if (qStartYear === qEndYear) {
          // short form like "Jan-Mar 2025"
          label = `${monthShortByValue[qStartMonth]} - ${monthShortByValue[qEndMonth]}`;
        } else {
          // cross-year like "Nov 2024 - Jan 2025"
          label = `${monthShortByValue[qStartMonth]} - ${monthShortByValue[qEndMonth]}`;
        }

        quarters.push(label);
        current.setMonth(current.getMonth() + 3);
      }

      return quarters;
    }
    if (periodPreference === 'Yearly') {
      return [new Date(startDateStr).getFullYear().toString()];
    }
    return [];
  };

  return (
    <>
      {isLoading && <p className="text-center">Checking preference...</p>}
      {isError && <p className="text-danger">{error?.message}</p>}

      <CustomModal show={showPeriodModal} close={handleCancel} hideClose>
        <div className="p-3 pt-5">
          <h4 className="modalTitle mb-4">Period Preference</h4>
          <div className="radio-group mb-4 justify-content-between">
            {['Monthly', 'Quarterly', 'Yearly'].map((p) => (
              <label key={p}>
                <input
                  type="radio"
                  name="inputType"
                  value={p}
                  checked={periodPreference === p}
                  onChange={(e) => setPeriodPreference(e.target.value)}
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
          <div className="my-2">
            Please ensure that you select the correct preference, as it cannot
            be changed once it has been set.
          </div>
          <div className="beechMein gap-2 flex-wrap">
            <CustomButton
              text="Set Preference"
              disabled={!periodPreference}
              onClick={() => {
                setShowPeriodModal(false);
                setShowFiscalPeriodModal(true);
              }}
            />
            <CustomButton
              text="Cancel"
              variant="secondaryButton"
              onClick={handleCancel}
            />
          </div>
        </div>
      </CustomModal>

      <CustomModal show={showFiscalPeriodModal} close={handleCancel}>
        <div className="p-3">
          <h4 className="modalTitle mb-4">Fiscal Period</h4>
          <Formik
            initialValues={{ start_date: '', end_date: '' }}
            validationSchema={fiscalPeriodSchema}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              setFieldValue,
              validateField,
              isValid,
            }) => (
              <Form>
                <CustomInput
                  name="start_date"
                  type="month"
                  required
                  label="Start Date"
                  value={values.start_date}
                  onChange={(e) => {
                    setFieldValue('start_date', e.target.value);
                    validateField('start_date');
                  }}
                  onBlur={handleBlur}
                  error={touched.start_date && errors.start_date}
                />
                <CustomInput
                  name="end_date"
                  type="month"
                  required
                  label="End Date"
                  value={values.end_date}
                  onChange={(e) => {
                    setFieldValue('end_date', e.target.value);
                    validateField('end_date');
                  }}
                  onBlur={handleBlur}
                  error={touched.end_date && errors.end_date}
                />

                <div className="beechMein gap-2 mt-3">
                  <CustomButton
                    text="Next"
                    type="button"
                    disabled={
                      !(values.start_date && values.end_date && isValid)
                    }
                    onClick={() => {
                      const { startLabel, endLabel } = buildFiscalYearLabels(
                        values.start_date,
                        values.end_date
                      );
                      const periods = generatePeriods(
                        periodPreference,
                        values.start_date,
                        values.end_date
                      );
                      saveFormValues('budget_setup', {
                        ...values,
                        periodPreference,
                        startLabel,
                        endLabel,
                        periods, // save periods list
                      });

                      setShowFiscalPeriodModal(false);
                      navigate('/process/budget-setup/new-account');
                    }}
                  />
                  <CustomButton
                    text="Cancel"
                    variant="secondaryButton"
                    onClick={handleCancel}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default NewBudgetSetup;
