import React from 'react';
import { formatNumberForDisplay } from '../../Utils/Utils';
import './accountBalanceCard.css';
import { formatNumberWithCommas } from '../../Utils/Helpers';

const AccountBalanceCard = ({
  heading = 'Account Balance',
  accountName = '',
  balances = [],
  loading = false,
  error = '',
  className = '',
}) => {
  // Filter out balances with zero amount (hide currencies with 0 balance)
  const filteredBalances =
    balances?.filter((balance) => {
      const balanceValue = balance.balance ?? balance.amount;
      // Convert to number and check if it's not zero
      const numValue = parseFloat(balanceValue);
      return !isNaN(numValue) && numValue !== 0;
    }) || [];

  return (
    <>
      {heading && <h6 className="account-balance-card-heading">{heading}</h6>}
      <div className={`d-card mb-4 account-balance-card ${className}`}>
        <div className="mb-3 account-name w-100">{accountName}</div>
        <table className="w-100">
          <thead>
            <tr className="account-balance-card-table-header">
              <th className="account-balance-card-th">FCy</th>
              <th className="account-balance-card-th">Balance</th>
              <th className="account-balance-card-th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="account-balance-card-loading">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="3" className="account-balance-card-error">
                  {error}
                </td>
              </tr>
            ) : filteredBalances && filteredBalances.length > 0 ? (
              filteredBalances.map((balance, index) => (
                <tr key={index}>
                  <td
                    className={
                      balance.type == 'Dr.'
                        ? 'account-balance-card-td-dr'
                        : 'account-balance-card-td-cr'
                    }
                  >
                    {balance.currency}
                  </td>
                  <td className="account-balance-card-td">
                    {balance.balance ?? balance.amount}
                  </td>
                  <td className="account-balance-card-td">{balance.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="account-balance-card-empty">
                  No balance data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AccountBalanceCard;
