import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css'; // Import the new CSS

// 🟢 MODERN IMPORTS
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  Clock,
  FileText,
  Wrench,
  LogOut,
  UserCircle,
  PlusSquare,
  Package,
  CornerDownLeft,
  History,
  Archive,
  ShieldCheck
} from 'lucide-react';

// --- Icon & Title Mapping ---
// This allows the component to adapt to its context (Admin vs. Officer)
const linkConfig = {
  // Admin Links
  dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  userManagement: { label: 'User Management', icon: <Users size={20} /> },
  equipmentManagement: { label: 'Equipment', icon: <Shield size={20} /> },
  processRequests: { label: 'Process Requests', icon: <Clock size={20} /> },
  reports: { label: 'Reports', icon: <FileText size={20} /> },
  maintenanceLog: { label: 'Maintenance Log', icon: <Wrench size={20} /> },
  
  // Officer Links
  requestEquipment: { label: 'Request Equipment', icon: <PlusSquare size={20} /> },
  viewInventory: { label: 'View Inventory', icon: <Package size={20} /> },
  returnEquipment: { label: 'Return Equipment', icon: <CornerDownLeft size={20} /> },
  myRequests: { label: 'My Requests', icon: <History size={20} /> },
  myHistory: { label: 'My History', icon: <Archive size={20} /> },
};

const Navigation = ({ activeSection, setActiveSection, sections }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine role for display
  const isAdmin = user?.role === 'admin';
  const roleName = isAdmin ? 'System Administrator' : 'Officer';
  const displayName = user?.fullName || roleName;

  // Animation variants
  const navListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Each link fades in 50ms after the previous
      },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <nav className="sidebar">
      {/* 1. Logo Header */}
      <div className="sidebar-header">
        <ShieldCheck className="sidebar-logo" size={36} />
        <div className="sidebar-title-wrapper">
          <span className="sidebar-title">Police Inventory</span>
          <span className="sidebar-subtitle">{isAdmin ? 'Admin Portal' : 'Officer Portal'}</span>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <motion.nav 
        className="sidebar-nav"
        variants={navListVariants}
        initial="hidden"
        animate="visible"
      >
        <ul className="nav-list">
          {sections.map((section) => {
            const config = linkConfig[section];
            if (!config) return null; // Safety check

            return (
              <motion.li key={section} variants={navItemVariants}>
                <a
                  className={`nav-link ${activeSection === section ? 'active' : ''}`}
                  onClick={() => setActiveSection(section)}
                >
                  <span className="nav-icon">{config.icon}</span>
                  {config.label}
                </a>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>

      {/* 3. Footer w/ User & Logout */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <UserCircle size={24} />
          </div>
          <div className="user-info">
            <span className="user-name" title={displayName}>{displayName}</span>
            <span className="user-role">{user?.designation || roleName}</span>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;