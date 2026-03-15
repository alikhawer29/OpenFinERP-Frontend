import React from 'react';
import Administration from '../../assets/images/sidebar/administration.svg?react';
import Dashboard from '../../assets/images/sidebar/dashboard.svg?react';
import Masters from '../../assets/images/sidebar/masters.svg?react';
import Process from '../../assets/images/sidebar/process.svg?react';
import Transactions from '../../assets/images/sidebar/transactions.svg?react';
import Styles from '../Sidebar/Sidebar.module.css';

const StaticSidebar = () => {
  return (
    <div className={`${Styles.sidebar}`} id="sidebar">
      <div className={Styles['sidebar-title-wrapper']}>
        <h2 className={Styles['sidebar-title']}>Milestone</h2>
      </div>
      <div className={Styles['dropdown-container']}>
        <div className={Styles['menu-item-container']}>
          <button className={Styles['menu-item']}>
            <Dashboard className={Styles.icon} />
            <p className="m-0">Dashboard</p>
          </button>
        </div>
        <div className={Styles['menu-item-container']}>
          <button className={Styles['menu-item']}>
            <Masters className={Styles.icon} />
            <p className="m-0">Masters</p>
          </button>
        </div>
        <div className={Styles['menu-item-container']}>
          <button className={Styles['menu-item']}>
            <Transactions className={Styles.icon} />
            <p className="m-0">Transactions</p>
          </button>
        </div>
        <div className={Styles['menu-item-container']}>
          <button className={Styles['menu-item']}>
            <Process className={Styles.icon} />
            <p className="m-0">Process</p>
          </button>
        </div>
        <div className={Styles['menu-item-container']}>
          <button className={Styles['menu-item']}>
            <Administration className={Styles.icon} />
            <p className="m-0">Administration</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaticSidebar;