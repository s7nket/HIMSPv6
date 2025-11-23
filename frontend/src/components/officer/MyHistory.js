import React, { useState, useEffect, useMemo } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  LayoutDashboard, Clock, Shield, AlertTriangle, CheckCircle, 
  FileText, ChevronDown 
} from 'lucide-react';

// --- High Contrast / Visible Theme ---
const THEME = {
  textMain: '#0f172a',    
  textSub: '#475569',     
  accent: '#2563eb',      
  success: '#16a34a',     
  warning: '#d97706',     
  danger: '#dc2626',      
  purple: '#7c3aed',      
  bg: {
    main: '#f8fafc',      
    card: '#ffffff',
    border: '#cbd5e1',    
    hover: '#f1f5f9'
  }
};

// --- SHARED CUSTOM TOOLTIP COMPONENT ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Limit displayed IDs to avoid a huge list
    const maxIdsToShow = 5;
    const ids = data.ids || [];
    const displayIds = ids.slice(0, maxIdsToShow);
    const remaining = ids.length - maxIdsToShow;

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${THEME.bg.border}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '200px',
        zIndex: 1000
      }}>
        <p style={{ fontWeight: '700', color: THEME.textMain, marginBottom: '4px' }}>
          {data.name}
        </p>
        <p style={{ color: THEME.accent, fontWeight: '600', marginBottom: '8px' }}>
          Count: {data.value}
        </p>
        
        {ids.length > 0 && (
          <div style={{ borderTop: `1px solid ${THEME.bg.border}`, paddingTop: '8px' }}>
            <p style={{ fontSize: '12px', color: THEME.textSub, fontWeight: '700', marginBottom: '4px' }}>
              Associated IDs:
            </p>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: THEME.textSub }}>
              {displayIds.map((id, idx) => (
                <li key={idx}>{id}</li>
              ))}
            </ul>
            {remaining > 0 && (
              <p style={{ fontSize: '11px', color: THEME.textSub, marginTop: '4px', fontStyle: 'italic' }}>
                ...and {remaining} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const MyHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  // --- ANALYTICS ENGINE (Updated for both Charts) ---
  const { statusData, weaponUsageData } = useMemo(() => {
    // 1. Setup buckets for Status Chart
    const statusBuckets = {
      'Total': { count: 0, ids: new Set(), color: THEME.textMain },
      'Active': { count: 0, ids: new Set(), color: THEME.warning },
      'Returned': { count: 0, ids: new Set(), color: THEME.success },
      'Maint.': { count: 0, ids: new Set(), color: THEME.purple },
      'Lost': { count: 0, ids: new Set(), color: THEME.danger },
    };

    // 2. Setup map for Weapon Usage Chart
    const usageMap = {};

    history.forEach(entry => {
      const uniqueId = entry.itemUniqueId;
      const name = entry.equipmentPoolName || 'Unknown Equipment';

      // --- Logic for Status Chart ---
      // Add to Total
      statusBuckets['Total'].count += 1;
      if (uniqueId) statusBuckets['Total'].ids.add(uniqueId);

      const isReturned = entry.status === 'Completed' || !!entry.returnedDate;
      const remarks = (entry.remarks || '').toLowerCase();
      const condition = (entry.conditionAtReturn || '').toLowerCase();

      if (!isReturned) {
        // Active
        statusBuckets['Active'].count += 1;
        if (uniqueId) statusBuckets['Active'].ids.add(uniqueId);
      } else if (condition.includes('lost') || remarks.includes('lost') || remarks.includes('fir')) {
        // Lost
        statusBuckets['Lost'].count += 1;
        if (uniqueId) statusBuckets['Lost'].ids.add(uniqueId);
      } else if (condition.includes('poor') || condition.includes('damage') || remarks.includes('maintenance')) {
        // Maintenance
        statusBuckets['Maint.'].count += 1;
        if (uniqueId) statusBuckets['Maint.'].ids.add(uniqueId);
      } else {
        // Returned (Good/Regular)
        statusBuckets['Returned'].count += 1;
        if (uniqueId) statusBuckets['Returned'].ids.add(uniqueId);
      }

      // --- Logic for Weapon Usage Chart ---
      if (!usageMap[name]) {
        usageMap[name] = { count: 0, ids: new Set() };
      }
      usageMap[name].count += 1;
      if (uniqueId) {
        usageMap[name].ids.add(uniqueId);
      }
    });

    // Transform Status Buckets to Array
    const sData = Object.keys(statusBuckets).map(key => ({
      name: key,
      value: statusBuckets[key].count,
      color: statusBuckets[key].color,
      ids: Array.from(statusBuckets[key].ids) // Convert Set to Array
    }));

    // Transform Usage Map to Array
    const wData = Object.keys(usageMap)
      .map(key => ({ 
        name: key, 
        value: usageMap[key].count,
        ids: Array.from(usageMap[key].ids) 
      }))
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
      marginBottom: '16px' 
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
      margin: '0 auto', 
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

      <div style={styles.chartsGrid}>
        {/* Bar Chart (Status) - NOW WITH ID TOOLTIP */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>Status Overview</div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: THEME.textSub, fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: THEME.textSub, fontSize: 13 }} />
                
                {/* Applied CustomTooltip Here */}
                <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    content={<CustomTooltip />}
                />
                
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Weapon Usage) - ALREADY HAD ID TOOLTIP */}
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
                  {/* CustomTooltip Applied Here */}
                  <RechartsTooltip content={<CustomTooltip />} />
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
                {history.slice(0, visibleCount).map((item) => {
                  const issueDT = formatDateTime(item.issuedDate);
                  const returnDT = formatDateTime(item.returnedDate);
                  
                  const isReturned = item.status === 'Completed' || !!item.returnedDate;
                  const isLost = (item.remarks || '').toLowerCase().includes('lost') || (item.conditionAtReturn || '').toLowerCase().includes('lost');
                  const isMaint = (item.remarks || '').toLowerCase().includes('maintenance') || (item.conditionAtReturn || '').toLowerCase().includes('poor');

                  return (
                    <tr key={item._id} style={{ backgroundColor: 'white', borderBottom: `1px solid ${THEME.bg.border}` }}>
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
                      <td style={styles.td}>
                         <StatusBadge status={item.status} isLost={isLost} isMaint={isMaint} />
                      </td>
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