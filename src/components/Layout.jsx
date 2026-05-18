import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ userData }) => {
  return (
    <div className="app-container">
      <Sidebar userData={userData} />
      <main className="main-content">
        <Outlet context={userData} />
      </main>
    </div>
  );
};

export default Layout;
