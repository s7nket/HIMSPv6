import React, { useState, useEffect } from 'react';
import { officerAPI, handleApiError } from '../../utils/api'; 
import { toast } from 'react-toastify';
import ItemHistoryModal from './ItemHistoryModal';

// 🟢 VALIDATION IMPORTS
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestEquipmentSchema } from '../../utils/validationSchemas';

const RequestEquipment = ({ onRequestSubmitted }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'Firearm', 'Ammunition', 'Protective Gear', 'Communication Device',
    'Vehicle', 'Tactical Equipment', 'Less-Lethal Weapon', 'Forensic Equipment',
    'Medical Supplies', 'Office Equipment', 'Other'
  ];

  useEffect(() => {
    fetchAuthorizedPools();
  }, [categoryFilter, searchTerm]);

  const fetchAuthorizedPools = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getAuthorizedEquipmentPools({
        category: categoryFilter,
        search: searchTerm
      });
      
      if (response.data.success) {
        setPools(response.data.data.pools);
      }
    } catch (error) {
      console.error('Error fetching authorized pools:', error);
      toast.error(handleApiError(error, 'Failed to load equipment pools.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pool) => {
    setSelectedPool(pool);
    setShowRequestModal(true);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedPool(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchAuthorizedPools();
    if (onRequestSubmitted) onRequestSubmitted();
  };

  const filteredPools = pools; 

  const PoolStatusMessage = () => {
    if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading pools...</p></div>;
    if (pools.length === 0 && !categoryFilter && !searchTerm) return <div className="no-data"><p>No equipment pools are currently authorized.</p></div>;
    if (pools.length === 0) return <div className="no-data"><p>No pools found matching your filters.</p></div>;
    return null;
  };

  return (
    <div className="request-equipment-section">
      {/* 🟢 REMOVED redundant header. Using CSS to align filters */}
      <div className="search-filters" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
          >
          <option value="">All Categories</option>
          {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
          ))}
          </select>
          
          <input
          type="text"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-search"
          />
      </div>

      <div className="equipment-pool-list" style={{ marginTop: '24px' }}>
        <PoolStatusMessage />

        {filteredPools.map(pool => (
          <div key={pool._id} className="pool-card">
            <div className="pool-info">
              <h4>{pool.poolName}</h4>
              <p className="equipment-model">{pool.model} • {pool.category}</p>
            </div>
            
            <div className="pool-summary-stats">
              <div className="stat-item available">
                <strong>{pool.availableCount}</strong> Available
              </div>
              <div className="stat-item issued">
                <strong>{pool.issuedCount}</strong> Issued
              </div>
              <div className="stat-item maintenance">
                <strong>{pool.maintenanceCount}</strong> Maint.
              </div>
              <div className="stat-item lost">
                <strong>{pool.lostCount || 0}</strong> Lost
              </div>
              <div className="stat-item total">
                <strong>{pool.totalQuantity}</strong> Total
              </div>
            </div>
            
            <div className="pool-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenModal(pool)}
                disabled={pool.availableCount === 0}
              >
                {pool.availableCount > 0 ? 'Request Equipment' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showRequestModal && selectedPool && (
        <RequestModal
          pool={selectedPool}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

// 🟢 REFACTORED: RequestModal with Validation & Red Error Messages
const RequestModal = ({ pool, onClose, onSuccess }) => {
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [showItems, setShowItems] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUniqueId, setSelectedUniqueId] = useState(null);

  // Standard Error Style
  const errorStyle = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' };

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(requestEquipmentSchema),
    mode: "onChange",
    defaultValues: {
      priority: 'Medium',
      reason: '',
      expectedDuration: ''
    }
  });

  const fetchAvailableItems = async () => {
    setLoadingDetails(true);
    try {
      const response = await officerAPI.getEquipmentDetails(pool._id);
      if (response.data.success) {
        const items = response.data.data.equipment.items;
        setAvailableItems(items.filter(item => item.status === 'Available'));
        setShowItems(true);
      } else {
        toast.error('Could not load item details.');
      }
    } catch (error) {
      toast.error('Failed to fetch item details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewHistory = (uniqueId) => {
    setSelectedUniqueId(uniqueId);
    setShowHistoryModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await officerAPI.requestEquipmentFromPool({
        poolId: pool._id,
        poolName: pool.poolName,
        ...data
      });
      toast.success('Equipment request submitted successfully!');
      onSuccess();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to submit request.');
      console.error('Submit request error:', error);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Request: {pool.poolName}</h3>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              
              <div className="form-group">
                <label>Reason / Purpose <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                  placeholder="e.g., Patrol duty, Special assignment... (min 10 characters)"
                  rows="3"
                  {...register("reason")}
                />
                {/* 🔴 Explicit Error Message */}
                {errors.reason && <span style={errorStyle}>{errors.reason.message}</span>}
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-control" {...register("priority")}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    className={`form-control ${errors.expectedDuration ? 'is-invalid' : ''}`}
                    type="text"
                    placeholder="e.g., 7 days"
                    {...register("expectedDuration")}
                  />
                  {/* 🔴 Explicit Error Message */}
                  {errors.expectedDuration && <span style={errorStyle}>{errors.expectedDuration.message}</span>}
                </div>
              </div>

              <div className="form-group">
                {!showItems ? (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={fetchAvailableItems}
                    disabled={loadingDetails}
                  >
                    {loadingDetails ? 'Loading...' : 'View Available Item History'}
                  </button>
                ) : (
                  <>
                    <label>Available Items ({availableItems.length})</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                      {availableItems.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No specific items listed.</p>
                      ) : (
                        availableItems.map(item => (
                          <div key={item.uniqueId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '13px' }}>
                              <strong>ID:</strong> {item.uniqueId} <span style={{ margin: '0 8px', color: '#ccc' }}>|</span> 
                              <strong>Cond:</strong> {item.condition}
                            </span>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewHistory(item.uniqueId)}
                            >
                              View History
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showHistoryModal && (
        <ItemHistoryModal
          poolId={pool._id}
          uniqueId={selectedUniqueId}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
};

export default RequestEquipment;