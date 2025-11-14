import React, { useState, useEffect, useMemo } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  LayoutDashboard, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

// --- High Contrast / Visible Theme ---
const THEME = {
  textMain: '#0f172a',    // Slate 900
  textSub: '#475569',     // Slate 600
  accent: '#2563eb',      // Blue 600
  success: '#16a34a',     // Green 600
  warning: '#d97706',     // Amber 600
  danger: '#dc2626',      // Red 600
  purple: '#7c3aed',      // Violet 600
  bg: {
    main: '#f8fafc',      // Slate 50
    card: '#ffffff',
    border: '#cbd5e1',    // Slate 300
    hover: '#f1f5f9'
  }
};

const MyHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  // 1. State to control how many items are visible
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getMyHistory();
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error("History fetch error:", error);
      toast.error('Failed to load history data.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handler to load more items
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  // --- Analytics Engine ---
  const { statusData, weaponUsageData } = useMemo(() => {
    let counts = { requested: history.length, issued: 0, returned: 0, maintenance: 0, lost: 0 };
    const usageMap = {};

    history.forEach(entry => {
      const isReturned = entry.status === 'Completed' || !!entry.returnedDate;
      const remarks = (entry.remarks || '').toLowerCase();
      const condition = (entry.conditionAtReturn || '').toLowerCase();

      if (!isReturned) {
        counts.issued += 1;
      } else if (condition.includes('lost') || remarks.includes('lost') || remarks.includes('fir')) {
        counts.lost += 1;
      } else if (condition.includes('poor') || condition.includes('damage') || remarks.includes('maintenance')) {
        counts.maintenance += 1;
      } else {
        counts.returned += 1;
      }

      const name = entry.equipmentPoolName || 'Unknown Equipment';
      usageMap[name] = (usageMap[name] || 0) + 1;
    });

    const sData = [
      { name: 'Total', value: counts.requested, color: THEME.textMain },
      { name: 'Active', value: counts.issued, color: THEME.warning },
      { name: 'Returned', value: counts.returned, color: THEME.success },
      { name: 'Maint.', value: counts.maintenance, color: THEME.purple },
      { name: 'Lost', value: counts.lost, color: THEME.danger },
    ];

    const wData = Object.keys(usageMap)
      .map(key => ({ name: key, value: usageMap[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        color: [THEME.accent, '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7'][index % 5]
      }));

    return { statusData: sData, weaponUsageData: wData };
  }, [history]);

  // Helper: Format Date & Time
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  // --- Styles ---
  const styles = {
    container: {
      padding: '24px',
      backgroundColor: THEME.bg.main,
      minHeight: '100vh',
      fontFamily: '"Inter", sans-serif',
      color: THEME.textMain
    },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' },
    subtitle: { color: THEME.textSub, fontSize: '16px' },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    card: {
      backgroundColor: THEME.bg.card,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      border: `1px solid ${THEME.bg.border}`,
      display: 'flex',
      flexDirection: 'column'
    },
    cardHeader: { fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: THEME.textMain },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '12px',
      border: `1px solid ${THEME.bg.border}`,
      marginBottom: '16px' // Space for button
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '15px',
      backgroundColor: THEME.bg.card
    },
    th: {
      textAlign: 'left', 
      padding: '20px 24px', 
      backgroundColor: '#f1f5f9',
      borderBottom: `2px solid ${THEME.bg.border}`,
      color: THEME.textSub,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: '13px',
      letterSpacing: '0.05em'
    },
    td: {
      textAlign: 'left', 
      padding: '20px 24px', 
      borderBottom: `1px solid ${THEME.bg.border}`,
      verticalAlign: 'top',
      color: THEME.textMain
    },
    loadMoreBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: '0 auto', // Center it
      padding: '12px 24px',
      backgroundColor: 'white',
      border: `1px solid ${THEME.bg.border}`,
      borderRadius: '8px',
      color: THEME.accent,
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px'
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="spinner"></div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <LayoutDashboard size={32} color={THEME.accent} />
          My Equipment Dashboard
        </h1>
        <p style={styles.subtitle}>
          Detailed analytics of equipment requests, returns, and usage patterns.
        </p>
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>Status Overview</div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: THEME.textSub, fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: THEME.textSub, fontSize: 13 }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Most Used Equipment</div>
          <div style={{ width: '100%', height: 320 }}>
             {weaponUsageData.length === 0 ? (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color: THEME.textSub}}>No data available</div>
             ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={weaponUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {weaponUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
                </PieChart>
              </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div style={styles.card}>
        <div style={{...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Transaction History</span>
            <span style={{fontSize: '14px', color: THEME.textSub, fontWeight: '500'}}>
                Showing {Math.min(visibleCount, history.length)} of {history.length} Records
            </span>
        </div>
        
        <div style={styles.tableContainer}>
            <table style={styles.table}>
              <colgroup>
                <col style={{ width: '25%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '40%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={styles.th}>Equipment Detail</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Transaction Context</th>
                </tr>
              </thead>
              <tbody>
                {/* 3. Slice the history based on visibleCount */}
                {history.slice(0, visibleCount).map((item) => {
                  const issueDT = formatDateTime(item.issuedDate);
                  const returnDT = formatDateTime(item.returnedDate);
                  
                  const isReturned = item.status === 'Completed' || !!item.returnedDate;
                  const isLost = (item.remarks || '').toLowerCase().includes('lost') || (item.conditionAtReturn || '').toLowerCase().includes('lost');
                  const isMaint = (item.remarks || '').toLowerCase().includes('maintenance') || (item.conditionAtReturn || '').toLowerCase().includes('poor');

                  return (
                    <tr key={item._id} style={{ backgroundColor: 'white', borderBottom: `1px solid ${THEME.bg.border}` }}>
                      
                      {/* Equipment Detail */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: '700', color: THEME.textMain, fontSize: '16px', lineHeight: '1.4' }}>
                                {item.equipmentPoolName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', color: THEME.textSub, fontSize: '14px' }}>
                                <Shield size={16} />
                                <span>ID: {item.itemUniqueId}</span>
                            </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: THEME.textSub, fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                                    Issued
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ fontWeight: '600', color: THEME.textMain, fontSize: '15px' }}>
                                        {issueDT.date}
                                    </div>
                                    <div style={{ fontSize: '13px', color: THEME.textSub, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                        <Clock size={14} /> {issueDT.time}
                                    </div>
                                </div>
                            </div>
                            
                            {isReturned && (
                                <div>
                                    <div style={{ fontSize: '12px', color: THEME.success, fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                                        Returned
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: '600', color: THEME.textMain, fontSize: '15px' }}>
                                            {returnDT.date}
                                        </div>
                                        <div style={{ fontSize: '13px', color: THEME.textSub, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <Clock size={14} /> {returnDT.time}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                         <StatusBadge status={item.status} isLost={isLost} isMaint={isMaint} />
                      </td>

                      {/* Transaction Context */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                            <div style={{ width: '100%' }}>
                                <div style={{ fontSize: '12px', color: THEME.textSub, fontWeight: '700', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'6px', marginBottom: '4px' }}>
                                    Issue Purpose
                                </div>
                                <div style={{ fontSize: '15px', color: THEME.textMain, lineHeight: '1.5', fontWeight: '500' }}>
                                    {item.purpose || "No reason provided."}
                                </div>
                            </div>

                            {isReturned && (
                                <div style={{ 
                                    width: '100%',
                                    padding: '12px', 
                                    backgroundColor: isLost ? '#fef2f2' : (isMaint ? '#f5f3ff' : '#f0fdf4'), 
                                    borderRadius: '8px',
                                    border: `1px solid ${isLost ? '#fca5a5' : (isMaint ? '#c4b5fd' : '#86efac')}`
                                }}>
                                    <div style={{ fontSize: '12px', color: isLost ? THEME.danger : (isMaint ? THEME.purple : THEME.success), fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Return Note
                                    </div>
                                    <div style={{ fontSize: '15px', color: THEME.textMain, fontStyle: 'italic', lineHeight: '1.5' }}>
                                        "{item.remarks || 'Returned in good condition.'}"
                                    </div>
                                </div>
                            )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
        
        {/* 4. Load More Button */}
        {visibleCount < history.length && (
            <button 
                onClick={handleLoadMore} 
                style={{...styles.loadMoreBtn, ':hover': { backgroundColor: '#f8fafc' }}}
            >
                Load More <ChevronDown size={16} />
            </button>
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Badge ---
const StatusBadge = ({ status, isLost, isMaint }) => {
  let bg = '#e2e8f0';
  let color = '#475569';
  let text = status;
  let icon = null;

  if (status === 'Pending Return') {
    bg = '#fff7ed'; color = '#ea580c'; text = 'Active Loan'; 
    icon = <Clock size={14} />;
  } else if (isLost) {
    bg = '#fef2f2'; color = '#dc2626'; text = 'Lost / Stolen';
    icon = <AlertTriangle size={14} />;
  } else if (isMaint) {
    bg = '#f5f3ff'; color = '#7c3aed'; text = 'Maintenance';
    icon = <FileText size={14} />;
  } else if (status === 'Completed') {
    bg = '#f0fdf4'; color = '#16a34a'; text = 'Returned';
    icon = <CheckCircle size={14} />;
  }

  return (
    <div style={{ 
      backgroundColor: bg, 
      color: color, 
      padding: '8px 12px', 
      borderRadius: '6px', 
      fontSize: '13px', 
      fontWeight: '700', 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px',
      whiteSpace: 'nowrap',
      border: `1px solid ${color}30`
    }}>
      {icon}
      {text}
    </div>
  );
};

export default MyHistory;