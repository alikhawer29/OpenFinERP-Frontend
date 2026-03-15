import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import CustomSelect from '../../../Components/CustomSelect';
import withModal from '../../../HOC/withModal';
import { dateRangeSelectBudgetOptions } from '../../../Utils/Constants/SelectOptions';
import useThemeStore from '../../../Stores/ThemeStore';
import { themeDictionary } from '../../../Utils/Constants/ColorConstants';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getChartsData } from '../../../Services/Reports/BudgetingReportService';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const BudgetingReportGraph = () => {
  usePageTitle('Budgeting Graph');

  const { theme } = useThemeStore();
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  // ✅ Empty Chart Structure
  const emptyChartData = {
    labels: [],
    datasets: [],
  };

  const [revenueChartData, setRevenueChartData] = useState(emptyChartData);
  const [expenseChartData, setExpenseChartData] = useState(emptyChartData);
  const [netProfitChartData, setNetProfitChartData] = useState(emptyChartData);

  //  mutation to get charts data
  const { mutate: chartsData, isPending: chartsLoading, data: budgetChartData } = useMutation({
    mutationFn: getChartsData,
    retry: 1,
    onSuccess: () => {
    },
    onError: (error) => {
      showToast(`Error: ${error}`, "error");
    }
  });

  useEffect(() => {
    const labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // Revenue
    setRevenueChartData({
      labels: budgetChartData?.revenue?.periods,
      datasets: [
        {
          label: 'Budget',
          data: budgetChartData?.revenue?.budgeted,
          backgroundColor: themeDictionary[theme][0],
        },
        {
          label: 'Actual',
          data: budgetChartData?.revenue?.actual,
          backgroundColor: themeDictionary[theme][1],
        },
      ],
    });

    // Expense (fixed colors)
    setExpenseChartData({
      labels: budgetChartData?.expense?.periods,
      datasets: [
        {
          label: 'Budget',
          data: budgetChartData?.expense?.budgeted,
          backgroundColor: themeDictionary[theme][0],
        },
        {
          label: 'Actual',
          data: budgetChartData?.expense?.actual,
          backgroundColor: themeDictionary[theme][1],
        },
      ],
    });

    // Net Profit
    setNetProfitChartData({
      labels: budgetChartData?.net_profit?.periods,
      datasets: [
        {
          label: 'Budget',
          data: budgetChartData?.net_profit?.budgeted,
          backgroundColor: themeDictionary[theme][0],
        },
        {
          label: 'Actual',
          data: budgetChartData?.net_profit?.actual,
          backgroundColor: themeDictionary[theme][1],
        },
      ],
    });
  }, [theme, budgetChartData]);

  // ✅ Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const handleDateRangeSelect = (graph, e) => {
  };

  useEffect(() => {
    chartsData(urlData)
  }, [])

  return (
    <div>
      <BackButton />
      <h2 className="d-card-title mb-4">Budgeting Report</h2>
      <div className="row">
        {/* Revenue */}
        <div className="col-12 mb-4">
          <div className="d-card chart-padding">
            <div className="d-flex justify-content-between mb-3">
              <h4 className="d-card-title">Revenue</h4>
              {/* <CustomSelect
                name="6 Months"
                options={dateRangeSelectBudgetOptions}
                firstIsLabel={false}
                className="gray"
                onChange={(e) => handleDateRangeSelect('revenue', e)}
              /> */}
            </div>
            <div
              className="dashboardChart"
              style={{ width: '100%', height: '400px' }}
            >
              {revenueChartData.datasets.length > 0 && (
                <Bar data={revenueChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Expense */}
        <div className="col-12 mb-4">
          <div className="d-card chart-padding">
            <div className="d-flex justify-content-between mb-3">
              <h4 className="d-card-title">Expense</h4>
              {/* <CustomSelect
                name="6 Months"
                options={dateRangeSelectBudgetOptions}
                firstIsLabel={false}
                className="gray"
                onChange={(e) => handleDateRangeSelect('expense', e)}
              /> */}
            </div>
            <div
              className="dashboardChart"
              style={{ width: '100%', height: '400px' }}
            >
              {expenseChartData.datasets.length > 0 && (
                <Bar data={expenseChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="col-12 mb-4">
          <div className="d-card chart-padding">
            <div className="d-flex justify-content-between mb-3">
              <h4 className="d-card-title">Net Profit</h4>
              {/* <CustomSelect
                name="6 Months"
                options={dateRangeSelectBudgetOptions}
                firstIsLabel={false}
                className="gray"
                onChange={(e) => handleDateRangeSelect('netProfit', e)}
              /> */}
            </div>
            <div
              className="dashboardChart"
              style={{ width: '100%', height: '400px' }}
            >
              {netProfitChartData.datasets.length > 0 && (
                <Bar data={netProfitChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withModal(BudgetingReportGraph);
