import { Link, useLocation } from 'react-router-dom';
import Administration from '../../assets/images/sidebar/administration.svg?react';
import Dashboard from '../../assets/images/sidebar/dashboard.svg?react';
import Masters from '../../assets/images/sidebar/masters.svg?react';
import Process from '../../assets/images/sidebar/process.svg?react';
import Reports from '../../assets/images/sidebar/reports.svg?react';
import SubscriptionLogs from '../../assets/images/sidebar/subscriptionLog.svg?react';
import SubscriptionManagement from '../../assets/images/sidebar/subscriptionManagement.svg?react';
import Support from '../../assets/images/sidebar/support.svg?react';
import SupportLogs from '../../assets/images/sidebar/supportLog.svg?react';
import Transactions from '../../assets/images/sidebar/transactions.svg?react';
import User from '../../assets/images/sidebar/user.svg?react';

import { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { HiLockOpen } from 'react-icons/hi2';
import useUserStore from '../../Stores/UserStore';
import { isNullOrEmpty } from '../../Utils/Utils';
import Styles from './Sidebar.module.css';
import useSidebarModuleAccess from '../../Hooks/useSidebarPermissions';
import { frontendToBackendKey } from './RenderLinks';

const menuItems = [
  {
    roles: ['employee', 'user'],
    id: '1',
    label: 'Dashboard',
    link: '/dashboard',
    icon: Dashboard,
  },
  {
    roles: ['admin'],
    id: 'admin-dashboard',
    label: 'Dashboard',
    link: '/admin/dashboard',
    icon: Dashboard,
  },
  {
    roles: ['admin'],
    id: 'user-mgmt',
    label: 'Client Management',
    link: '/admin/client-management',
    icon: User,
  },
  {
    roles: ['admin'],
    id: 'document-register',
    label: 'Document Register',
    link: '/admin/document-register',
    icon: SubscriptionLogs,
  },
  {
    roles: ['admin'],
    id: 'unlock-req',
    label: 'Unlock Req Management',
    link: '/admin/unlock-req-management',
    icon: HiLockOpen,
  },
  {
    roles: ['admin'],
    id: 'subscription-mgmt',
    label: 'Subscription Management',
    link: '/admin/subscription-management',
    icon: SubscriptionManagement,
  },
  {
    roles: ['admin'],
    id: 'subscription-logs',
    label: 'Subscription Logs',
    link: '/admin/subscription-logs',
    icon: SubscriptionLogs,
  },
  {
    roles: ['admin'],
    id: 'support-type-mgmt',
    label: 'Support Type Management',
    link: '/admin/support-type-management',
    icon: Support,
  },
  {
    roles: ['admin'],
    id: 'support-logs',
    label: 'Support Logs',
    link: '/admin/support-logs',
    icon: SupportLogs,
  },
  {
    roles: ['employee', 'user'],
    id: '2',
    label: 'Masters',
    link: '/masters',
    icon: Masters,
    subItems: [
      { name: 'Chart of Accounts', link: '/masters/chart-of-accounts' },
      // { name: 'General Ledger', link: '/masters/general-ledger' },
      { name: 'Party Ledger', link: '/masters/party-ledger' },
      { name: 'WIC Register', link: '/masters/walk-in-customer' },
      { name: 'Teller Register', link: '/masters/teller-register' },
      {
        name: 'Classification Register',
        link: '/masters/classification-master',
      },
      { name: 'Warehouse Register', link: '/masters/warehouse-master' },
      {
        name: 'CB Classification Register',
        link: '/masters/CB-classification-master',
      },
      { name: 'Beneficiary Register', link: '/masters/beneficiary-register' },
      { name: 'Document Register', link: '/masters/document-register' },
      { name: 'Salesman Register', link: '/masters/salesman-register' },
      // { name: 'Employee Register', link: '/masters/employee-master' },
      { name: 'Commission Register', link: '/masters/commission-master' },
      { name: 'Currency Register', link: '/masters/currency-register' },
      { name: 'Country Register', link: '/masters/country-register' },
      {
        name: 'Office Location Register',
        link: '/masters/office-location-master',
      },
      { name: 'Group Register', link: '/masters/group-master' },
      { name: 'Cost Center Register', link: '/masters/cost-center-register' },
    ],
  },
  {
    roles: ['employee', 'user'],
    id: '3',
    label: 'Transactions',
    icon: Transactions,
    link: '/transactions',
    subItems: [
      { name: 'Accounting Transactions' },
      { name: 'Journal Voucher', link: '/transactions/journal-voucher' },
      { name: 'Receipt Voucher', link: '/transactions/receipt-voucher' },
      { name: 'Payment Voucher', link: '/transactions/payment-voucher' },
      {
        name: 'Internal Payment Voucher',
        link: '/transactions/internal-payment-voucher',
      },
      { name: 'Bank Transactions', link: '/transactions/bank-transactions' },
      { name: 'Account to Account', link: '/transactions/account-to-account' },
      {
        name: 'PDCR Payment Voucher',
        link: '/transactions/pdcr-issue-as-pdcp',
      },
      {
        name: 'Suspense Voucher',
        link: '/transactions/suspense-voucher',
      },
      {
        name: 'Suspense Posting',
        link: '/transactions/suspense-posting',
      },
      // Remittance Deals
      { name: 'Remittance Deals' },
      {
        name: 'Foreign Currency Deal',
        link: '/transactions/foreign-currency-deal',
      },
      {
        name: 'TMN Currency Deal',
        link: '/transactions/tmn-currency-deal',
      },
      {
        name: 'Currency Transfer Request',
        link: '/transactions/currency-transfer',
      },
      {
        name: 'Deal Register',
        link: '/transactions/deal-registry',
      },
      { name: 'TTR Register', link: '/transactions/ttr-register' },
      // Outward Remittance
      { name: 'Outward Remittance' },
      { name: 'Outward Remittance', link: '/transactions/outward-remittance' },
      {
        name: 'Outward Remittance Register',
        link: '/transactions/outward-remittance-register',
      },
      {
        name: 'Application Printing',
        link: '/transactions/application-printing',
      },
      {
        name: 'Inward Remittance',
      },
      {
        name: 'Inward Payment Order',
        link: '/transactions/inward-payment-order',
      },
      {
        name: 'Inward Payment',
        link: '/transactions/inward-payment',
      },
      {
        name: 'Inward Payment Cancellation',
        link: '/transactions/inward-payment-cancellation',
      },
      {
        name: 'Rate of Exchange',
      },
      {
        name: 'Rate of Exchange',
        link: '/transactions/remittance-rate-of-exchange',
      },
    ],
  },
  {
    id: '4',
    roles: ['employee', 'user'],
    label: 'Process',
    icon: Process,
    link: '/process',
    subItems: [
      { name: 'P.D.C Process', link: '/process/pdc-processing' },
      { name: 'PDCR Payment Posting', link: '/process/pdcr-payment-posting' },
      { name: 'Profit & Loss Posting', link: '/process/profit-loss-posting' },
      {
        name: 'Periodic Accounts Locking',
        link: '/process/periodic-accounts-closing',
      },
      { name: 'Balance Write-off', link: '/process/balance-write-off' },
      { name: 'Transaction Approval', link: '/process/transaction-approval' },
      // { name: 'Transaction Reversal', link: '/process/transaction-reversal' },
      { name: 'Transaction Lock', link: '/process/transaction-lock' },
      { name: 'Budget Setup', link: '/process/budget-setup' },
    ],
  },
  {
    id: '5',
    roles: ['employee', 'user'],
    label: 'Reports',
    icon: Reports,
    link: '/reports',
    subItems: [
      // Account Reports
      { name: 'Accounting Reports' },
      { name: 'Statement of Accounts', link: '/reports/statement-of-accounts' },
      {
        name: 'Outstanding Balance Report',
        link: '/reports/outstanding-balance-report',
      },
      { name: 'Journal Report', link: '/reports/journal-report' },
      {
        name: 'WIC Statement',
        link: '/reports/walk-in-customer-statement',
      },
      {
        name: 'WIC Outstanding Balance Report',
        link: '/reports/walk-in-customer-outstanding-balance-report',
      },
      {
        name: 'Expense Journal',
        link: '/reports/expense-journal-report',
      },
      {
        name: 'Post Dated Cheques Report',
        link: '/reports/post-dated-cheque-report',
      },
      {
        name: 'Account Enquiry',
        link: '/reports/account-enquiry',
      },
      {
        name: 'Account Turnover Report',
        link: '/reports/account-turnover-report',
      },
      // Tax Reports
      { name: 'Vat Reports' },
      {
        name: 'VAT Report',
        link: '/reports/vat-report',
      },
      // {
      //   name: 'Corporate Tax Report',
      //   link: '/reports/corporate-tax-report',
      // },
      // Remittance Reports
      { name: 'Remittance Reports' },
      {
        name: 'Inward Remittance Report',
        link: '/reports/inward-remittance-report',
      },
      {
        name: 'Outward Remittance Report',
        link: '/reports/outward-remittance-report',
      },
      {
        name: 'TRQ Report',
        link: '/reports/currency-transfer-register-report',
      },
      {
        name: 'Deal Register Report',
        link: '/reports/deal-register-report',
      },
      {
        name: 'Outward Remittance Enquiry',
        link: '/reports/outward-remittance-enquiry',
      },
      // Financial Reports
      { name: 'Financial Reports' },
      { name: 'Trial Balance', link: '/reports/trial-balance' },
      {
        name: 'Profit & Loss Statement',
        link: '/reports/profit-and-loss-statement',
      },
      { name: 'Balance Sheet', link: '/reports/balance-sheet' },
      {
        name: 'Exchange Profit & Loss Report',
        link: '/reports/exchange-profit-loss-report',
      },
      {
        name: 'Cash & Bank Balance Position',
        link: '/reports/cash-bank-balance-position',
      },
      // Budgeting & Forecasting Report
      {
        name: 'Budgeting Report',
      },
      {
        name: 'Budgeting Report',
        link: '/reports/budgeting-report',
      },
    ],
  },
  {
    roles: ['employee', 'user'],
    id: '6',
    label: 'Administration',
    icon: Administration,
    link: '/administration',
    subItems: [
      { name: 'User Maintenance', link: '/administration/user-maintenance' },
      { name: 'Cheque Register', link: '/administration/cheque-register' },
      {
        name: 'System Integrity Check',
        link: '/administration/system-integrity-check',
      },
      {
        name: 'Deal Register Updation',
        link: '/administration/deal-register-updation',
      },
      { name: 'Subscription Logs', link: '/administration/subscription-logs' },
      { name: 'Password Reset', link: '/administration/password-reset' },
      {
        name: 'Transaction Number Register',
        link: '/administration/transaction-number-register',
      },
      { name: 'Branch Management', link: '/administration/branch-management' },
      { name: 'Branch Selection', link: '/administration/branch-selection' },
      { name: 'Maturity Alert', link: '/administration/maturity-alert' },
      { name: 'Transaction Logs', link: '/administration/transaction-logs' },
      { name: 'User Logs', link: '/administration/user-logs' },
      {
        name: 'Unlock Request Logs',
        link: '/administration/unlock-request-logs',
      },
    ],
  },
];

// ---------------- SIDEBAR COMPONENT ----------------
const Sidebar = ({ sideBarClass, disable = false, onHoverChange }) => {
  const location = useLocation();
  const [openItem, setOpenItem] = useState(null);
  const isCollapsed = sideBarClass === 'collapsed';
  const { role } = useUserStore();

  // ---------------- ACCESS KEYS ----------------
  // Dynamic mapping: Create a map of frontend names to their module types based on menu structure
  const frontendNameToModuleType = menuItems.reduce((acc, menuItem) => {
    if (!menuItem.subItems) return acc;

    // Map menu IDs to module types (must match backend parent values)
    const moduleTypeMap = {
      2: 'master', // Masters
      3: 'transactions', // Transactions
      4: 'process', // Process
      5: 'reports', // Reports (backend uses 'reports' plural)
      6: 'administration', // Administration
    };

    const moduleType = moduleTypeMap[menuItem.id];
    if (!moduleType) return acc;

    // Map all sub-item names to their module type
    menuItem.subItems.forEach((sub) => {
      if (sub.name) {
        acc[sub.name] = moduleType;
      }
    });

    return acc;
  }, {});

  const accessKeys = Object.entries(frontendToBackendKey).reduce(
    (acc, [frontendName, backendKey]) => {
      let moduleType = '';

      // First check if the frontend name exists in our dynamic mapping (most reliable)
      if (frontendNameToModuleType[frontendName]) {
        moduleType = frontendNameToModuleType[frontendName];
      } else if (
        backendKey.includes('voucher') ||
        backendKey.includes('transaction') ||
        backendKey.includes('transactions')
      )
        moduleType = 'transactions';
      else if (
        backendKey.includes('register') ||
        backendKey.includes('ledger') ||
        backendKey.includes('master')
      )
        moduleType = 'master';
      else if (
        backendKey.includes('report') ||
        backendKey.includes('statement') ||
        backendKey.includes('balance') ||
        backendKey.includes('enquiry') ||
        backendKey.includes('trial') ||
        backendKey.includes('sheet') ||
        backendKey.includes('journal') ||
        backendKey.includes('vat')
      )
        moduleType = 'reports'; // Backend uses 'reports' (plural)
      else if (
        backendKey.includes('process') ||
        backendKey.includes('pdc_process') ||
        backendKey.includes('posting') ||
        backendKey.includes('locking') ||
        backendKey.includes('write') ||
        backendKey.includes('approval') ||
        backendKey.includes('lock') ||
        backendKey.includes('budget')
      )
        moduleType = 'process';
      else if (backendKey.includes('chart')) moduleType = 'master';
      else moduleType = 'administration';

      acc[backendKey] = useSidebarModuleAccess(moduleType, backendKey);

      return acc;
    },
    {}
  );

  const toggleItem = (id) => setOpenItem(openItem === id ? null : id);

  useEffect(() => {
    if (isCollapsed || sideBarClass) setOpenItem(null);
  }, [isCollapsed, sideBarClass]);

  // ---------------- FILTER MENU BASED ON ACCESS ----------------
  const filteredMenu = menuItems
    .map((item) => {
      if (item.subItems) {
        // Filter sub-items based on access
        const subItems = item.subItems.filter((sub) => {
          // Keep headings (sub-items without link) - they will be filtered later if needed
          if (!sub.link) {
            return true;
          }

          const backendKey = frontendToBackendKey[sub.name];
          if (backendKey) {
            // For employee role: check if access is noAccess
            if (role === 'employee') {
              const accessKey = accessKeys[backendKey];
              // Only hide if explicitly noAccess, otherwise show (handles undefined case)
              return accessKey !== 'noAccess';
            }
            // For non-employee roles (admin, user), always show
            return true;
          }
          // If no backendKey mapping exists, show for all roles
          return true;
        });

        // For employee: remove headings (sub-items without link) if there are no accessible sub-items under that category
        const finalSubItems = subItems
          .map((sub, i, arr) => {
            if (!sub.link && role === 'employee') {
              // Check if there is any accessible item after this heading
              const hasAccessibleItem = arr.slice(i + 1).some((s) => {
                if (!s.link) return false; // Skip headings
                const sBackendKey = frontendToBackendKey[s.name];
                if (sBackendKey) {
                  const sAccessKey = accessKeys[sBackendKey];
                  return sAccessKey !== 'noAccess';
                }
                return true; // If no backendKey, show it
              });
              return hasAccessibleItem ? sub : null;
            }
            return sub;
          })
          .filter(Boolean);

        return finalSubItems.length > 0
          ? { ...item, subItems: finalSubItems }
          : null;
      }
      return item; // Items without subItems remain
    })
    .filter(Boolean); // Remove nulls

  const renderLink = (to, children, key) =>
    disable ? (
      <div key={key} className={Styles.disabledLink}>
        {children}
      </div>
    ) : (
      <Link key={key} to={to}>
        {children}
      </Link>
    );

  return (
    <div
      className={`${Styles.sidebar} ${Styles[sideBarClass]} ${disable ? Styles.disabled : ''
        }`}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {disable && <div className={Styles.overlay}></div>}
      <div className={Styles['sidebar-title-wrapper']}>
        {renderLink(
          '/dashboard',
          <h2 className={Styles['sidebar-title']}>
            M{!sideBarClass && 'ileStone'}
          </h2>
        )}
      </div>
      <div className={Styles['dropdown-container']}>
        {filteredMenu.map(
          (item) =>
            role &&
            item.roles.includes(role) && (
              <div key={item.id} className={Styles['menu-item-container']}>
                {item.subItems ? (
                  <>
                    <button
                      className={`${Styles['menu-item']} ${location.pathname.includes(item.link) ? Styles.active : ''
                        }`}
                      onClick={() => {
                        if (!disable) toggleItem(item.id);
                      }}
                      aria-expanded={openItem === item.id}
                    >
                      {item.icon && <item.icon className={Styles.icon} />}
                      <p className="m-0">{item.label}</p>
                      <FaChevronDown
                        className={`${Styles.chevron} ${openItem === item.id ? Styles.open : ''
                          }`}
                      />
                    </button>
                    <div
                      id={`submenu-${item.id}`}
                      className={`${Styles.submenu} ${openItem === item.id ? Styles.open : ''
                        }`}
                    >
                      {item.subItems.map((sub, i) =>
                        sub.link ? (
                          renderLink(
                            sub.link,
                            <div
                              className={`${Styles['submenu-item']} ${i === item.subItems.length - 1
                                ? Styles['last-item']
                                : ''
                                } ${location.pathname === sub.link
                                  ? Styles.active
                                  : ''
                                }`}
                            >
                              {sub.name}
                            </div>,
                            sub.link
                          )
                        ) : (
                          <div
                            key={sub.name}
                            className={`${Styles['submenu-item']} ${i === 0 ? '' : 'mt-3'
                              }`}
                          >
                            <p className="mb-0 fw-bold fst-italic">{sub.name}</p>
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  // For items without subItems (like admin menu items), render as link
                  renderLink(
                    item.link,
                    <div
                      className={`${Styles['menu-item']} ${location.pathname === item.link ? Styles.active : ''
                        }`}
                    >
                      {item.icon && <item.icon className={Styles.icon} />}
                      <p className="m-0">{item.label}</p>
                    </div>
                  )
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
