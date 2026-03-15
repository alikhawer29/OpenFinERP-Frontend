import React, { useState } from 'react';
import { formatNumberForDisplay } from '../../Utils/Utils';
import './exchnageRatesCard.css';
const ExchangeRatesCard = ({ rates = [], loading = false, error = false, onInverseChange }) => {
  const [isInverse, setIsInverse] = useState(false);
  
  // Convert rates object to array format for display
  const convertRatesToArray = (ratesData) => {
    if (!ratesData || typeof ratesData !== 'object') return [];
    
    // If it's already an array, return it
    if (Array.isArray(ratesData)) return ratesData;
    
    // If it has the new structure with base_currency and rates
    if (ratesData.base_currency && ratesData.rates) {
      return Object.entries(ratesData.rates).map(([currency, rate]) => ({
        currency,
        rate: rate.toString(),
        change: '+0%', // Default change value since API doesn't provide this
        isPositive: true // Default positive since API doesn't provide this
      }));
    }
    
    // If it's a simple object with currency: rate pairs
    return Object.entries(ratesData).map(([currency, rate]) => ({
      currency,
      rate: rate.toString(),
      change: '+0%',
      isPositive: true
    }));
  };
  
  const safeRates = convertRatesToArray(rates);

  return (
    <div>
      <h6 className="mb-2">Live Exchange Rates Against Base Currency</h6>
      <div className="d-card account-balance-card">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center account-name w-100">
            <label
              htmlFor="inverse"
              className={`${
                isInverse ? 'text-info' : 'text-black'
              } me-2 fw-bold`}
            >
              Inverse
            </label>
            <div className="d-inline-flex align-items-center">
              <label className="toggle-switch inverse-switch">
                <input
                  type="checkbox"
                  name="inverse"
                  id="inverse"
                  checked={isInverse}
                  onChange={(e) => {
                    const newInverse = e.target.checked;
                    setIsInverse(newInverse);
                    if (onInverseChange) {
                      onInverseChange(newInverse);
                    }
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        <table className="exchangeRatesTable w-100">
          <thead>
            <tr>
              <th>FCy</th>
              <th width="100px">Rates</th>
              <th>Change (24h)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading exchange rates...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="3" className="text-center py-3 text-danger">
                  Failed to load exchange rates
                </td>
              </tr>
            ) : safeRates.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-3 text-muted">
                  No exchange rates available
                </td>
              </tr>
            ) : (
              safeRates.map((rate, index) => (
                <tr key={index}>
                  <td style={{ padding: '8px 0' }}>{rate.currency}</td>
                  <td style={{ padding: '8px 0' }}>
                    {isInverse
                      ? formatNumberForDisplay(1 / parseFloat(rate.rate), 8)
                      : formatNumberForDisplay(rate.rate, 8)}
                  </td>
                  <td
                    style={{
                      padding: '8px 0',
                      color: rate.isPositive ? '#22C55E' : '#EF4444',
                    }}
                  >
                    {rate.change}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExchangeRatesCard;
