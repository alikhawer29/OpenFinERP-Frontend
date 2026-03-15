import React from 'react';
import { formatNumberForDisplay } from '../../Utils/Utils';
import { MOCK_ACCOUNT_BALANCES } from '../../Mocks/MockData';
import './accountBalanceCard.css';
const AccountBalanceCardMode = ({ numberOfCards = 1 }) => {
  return Object.entries(MOCK_ACCOUNT_BALANCES)
    .slice(0, numberOfCards)
    .map(([key, account]) => (
      <div key={key}>
        <h6 className="mb-2">Account Balance</h6>
        <div className="d-card mb-4 account-balance-card">
          <div className="account-name">{account?.name}</div>
          <table className="w-100">
            <thead>
              <tr className="balance-table-header">
                <th className="table-cell">FCy</th>
                <th className="table-cell">Balance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {account?.balances.map((balance, index) => (
                <tr
                  key={index}
                  className="balance-row"
                  style={{ color: balance?.color }}
                >
                  <td>{balance?.currency}</td>
                  <td className="table-cell">{formatNumberForDisplay(balance?.amount, 2)}</td>
                  <td className="table-cell">{balance?.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ));
};

export default AccountBalanceCardMode;
