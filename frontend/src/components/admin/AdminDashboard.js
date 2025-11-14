import React, { useState, useEffect } from 'react';
import Navigation from '../common/Navigation';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import EquipmentManagement from './EquipmentManagement';
import ProcessRequests from './ProcessRequests';
import ReportsPage from './ReportsPage';
import MaintenanceLog from './MaintenanceLog';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

// 🟢 MODERN IMPORTS
import { motion } from 'framer-motion';
import { 
  Users, 
  Package, 
  Clock, 
  Shield, 
  Activity, 
  PackageCheck,
  Wrench,
  ShieldAlert,
  Archive,
  CalendarClock,
  BatteryWarning
} from 'lucide-react';

import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    'dashboard',
    'userManagement',
    'equipmentManagement',
    'processRequests',
    'reports',
    'maintenanceLog'
  ];

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMainContent = () => {
    if (loading && activeSection === 'dashboard') {
      return (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading dashboard...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardStats data={dashboardData} setActiveSection={setActiveSection} />;
      case 'userManagement':
        return <UserManagement />;
      case 'equipmentManagement':
        return <EquipmentManagement />;
      case 'processRequests':
        return <ProcessRequests />;
      case 'reports':
        return <ReportsPage />;
      case 'maintenanceLog':
        return <MaintenanceLog />;
      default:
        return <DashboardStats data={dashboardData} setActiveSection={setActiveSection} />;
    }
  };

  if (user && user.role !== 'admin') {
     return (
        <div className="loading-state">
            <h3>Access Denied</h3>
            <p>You do not have permission to view this page.</p>
        </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Navigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sections={sections}
      />

      <div className="main-content">
        {/* Redundant Header Removed */}
        <div className="content-body">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------
// 🟢 MODERNIZED DASHBOARD STATS COMPONENT
// ----------------------------------------------
const DashboardStats = ({ data, setActiveSection }) => {
  if (!data) return null;

  // Animation variants for "Apple-like" feel
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Safe access for stats
  const stats = data.stats || {};
  const pendingRequestsValue = stats.pendingRequests || 0;
  const maintenanceItems = stats.maintenanceItems || 0;
  const lostItems = stats.lostItems || 0;
  const isUrgent = pendingRequestsValue > 10;

  // Use real data if available, otherwise fall back to placeholders for layout
  const lowStockItems = data.lowStockItems || [];
  const overdueItems = data.overdueItems || [];
  const recentRequests = data.recentRequests || [];

  return (
    <div className="dashboard-overview">
      {/* 1. Top Level Stat Cards (All Clickable) */}
      <motion.div 
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} onClick={() => setActiveSection('userManagement')} style={{ cursor: 'pointer' }} title="Go to User Management">
          <StatCard icon={<Users />} title="Total Users" value={stats.totalUsers || 0} subtitle={`${stats.totalOfficers || 0} officers`} color="blue" />
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => setActiveSection('equipmentManagement')} style={{ cursor: 'pointer' }} title="Go to Equipment Management">
          <StatCard icon={<Shield />} title="Total Equipment" value={stats.totalEquipment || 0} subtitle={`${stats.availableEquipment || 0} available`} color="green" />
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => setActiveSection('processRequests')} style={{ cursor: 'pointer' }} title="Go to Process Requests">
          <StatCard icon={<Clock />} title="Pending Requests" value={pendingRequestsValue} subtitle={`${stats.requestsThisMonth || 0} this month`} color="orange" urgent={isUrgent} />
        </motion.div>

        <motion.div variants={itemVariants} onClick={() => setActiveSection('reports')} style={{ cursor: 'pointer' }} title="Go to Reports">
          <StatCard icon={<PackageCheck />} title="Issued Equipment" value={stats.issuedEquipment || 0} subtitle="Currently in use" color="primary" />
        </motion.div>
      </motion.div>
      
      {/* 2. Main Dashboard Content Area (3 Columns) */}
      <motion.div 
        className="dashboard-sections"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* === COLUMN 1: ALERTS & LOW STOCK === */}
        <motion.div variants={itemVariants} className="dashboard-column">
          <div className="dashboard-card">
            <h3><a onClick={() => setActiveSection('maintenanceLog')} style={{cursor: 'pointer'}}>System Alerts</a> <ShieldAlert size={20} className="icon" /></h3>
            <div className="alert-list">
              <div className="alert-item" onClick={() => setActiveSection('maintenanceLog')} title="Go to Maintenance Log">
                <div className="alert-icon maintenance"><Wrench size={20} /></div>
                <div className="alert-info">
                  <span className="alert-info-title">{maintenanceItems} Items in Maintenance</span>
                  <span className="alert-info-subtitle">Awaiting repair or service</span>
                </div>
              </div>
              <div className="alert-item" onClick={() => setActiveSection('maintenanceLog')} title="Go to Maintenance Log">
                <div className="alert-icon lost"><ShieldAlert size={20} /></div>
                <div className="alert-info">
                  <span className="alert-info-title">{lostItems} Items Reported Lost</span>
                  <span className="alert-info-subtitle">Pending investigation</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <h3><a onClick={() => setActiveSection('equipmentManagement')} style={{cursor: 'pointer'}}>Low Stock Items</a> <BatteryWarning size={20} className="icon" /></h3>
            <div className="data-list">
              {lowStockItems.length > 0 ? lowStockItems.map(item => (
                <div key={item._id} className="data-item" onClick={() => setActiveSection('equipmentManagement')}>
                  <div className="data-item-main">
                    <div className="data-item-title">{item.poolName}</div>
                    <div className="data-item-subtitle">{Math.round((item.availableCount / item.totalQuantity) * 100)}% remaining</div>
                  </div>
                  <div className="data-item-side">
                    <span className="data-item-highlight warning">{item.availableCount}</span>
                  </div>
                </div>
              )) : <p className="no-data-text">No low stock items.</p>}
            </div>
          </div>
        </motion.div>

        {/* === COLUMN 2: RECENT ACTIVITY === */}
        <motion.div variants={itemVariants} className="dashboard-card">
          <h3><a onClick={() => setActiveSection('processRequests')} style={{cursor: 'pointer'}}>Recent Activity</a> <Activity size={20} className="icon" /></h3>
          {recentRequests.length > 0 ? (
            <div className="recent-requests">
              {recentRequests.map((request) => (
                <div key={request._id} className="request-item">
                  <div className="request-info">
                    <div className="request-title">{request.poolId?.poolName || 'Unknown Item'}</div>
                    <div className="request-meta">{request.requestedBy?.fullName} • {request.requestType}</div>
                  </div>
                  <div className="request-status">
                    <span className={`status-badge status-${request.status.toLowerCase()}`}>{request.status}</span>
                    <span className="request-date">{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-text">No recent requests found.</p>
          )}
        </motion.div>

        {/* === COLUMN 3: ACCOUNTABILITY & BREAKDOWN === */}
        <motion.div variants={itemVariants} className="dashboard-column">
          <div className="dashboard-card">
            <h3><a onClick={() => setActiveSection('reports')} style={{cursor: 'pointer'}}>Overdue Equipment</a> <CalendarClock size={20} className="icon" /></h3>
            <div className="data-list">
              {overdueItems.length > 0 ? overdueItems.map(item => (
                <div key={item._id} className="data-item" onClick={() => setActiveSection('reports')}>
                  <div className="data-item-main">
                    <div className="data-item-title">{item.poolName}</div>
                    <div className="data-item-subtitle">Issued to: {item.officerName}</div>
                  </div>
                  <div className="data-item-side">
                    <span className="data-item-highlight">{item.daysOverdue}d</span>
                  </div>
                </div>
              )) : <p className="no-data-text">No items are overdue.</p>}
            </div>
          </div>
          
          {data.equipmentCategories && data.equipmentCategories.length > 0 && (
            <div className="dashboard-card">
              <h3><a onClick={() => setActiveSection('equipmentManagement')} style={{cursor: 'pointer'}}>Inventory Breakdown</a> <Archive size={20} className="icon" /></h3>
              <div className="category-grid">
                {data.equipmentCategories.map((category) => (
                  <div key={category._id} className="category-item">
                    <span className="category-name">{category._id}</span>
                    <span className="category-count">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

// StatCard Helper
const StatCard = ({ icon, title, value, subtitle, color, urgent }) => (
  <div className={`stat-card ${color} ${urgent ? 'urgent' : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  </div>
);

// Title Formatter
const formatSectionTitle = (section) => {
  const titles = {
    dashboard: 'Dashboard Overview',
    userManagement: 'User Management',
    equipmentManagement: 'Equipment Management',
    processRequests: 'Process Requests',
    reports: 'Reports & Analytics',
    maintenanceLog: 'Maintenance Log'
  };
  return titles[section] || section;
};

export default AdminDashboard;