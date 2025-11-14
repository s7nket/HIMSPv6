import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { Eye, Trash2 } from 'lucide-react';

// 🟢 VALIDATION IMPORTS
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentPoolSchema } from '../../utils/validationSchemas';

// Formats dates or returns 'N/A'
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
};

const EquipmentManagement = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [showPoolDetailsModal, setShowPoolDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);

  const [liveSearchTerm, setLiveSearchTerm] = useState('');
  const [liveCategoryFilter, setLiveCategoryFilter] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedCategoryFilter, setDebouncedCategoryFilter] = useState('');

  const categories = [
    'Firearm', 'Ammunition', 'Protective Gear', 'Communication Device',
    'Vehicle', 'Tactical Equipment', 'Less-Lethal Weapon', 'Forensic Equipment',
    'Medical Supplies', 'Office Equipment', 'Other'
  ];

  const designations = [
    'Director General of Police (DGP)', 'Superintendent of Police (SP)',
    'Deputy Commissioner of Police (DCP)', 'Deputy Superintendent of Police (DSP)',
    'Police Inspector (PI)', 'Sub-Inspector (SI)',
    'Police Sub-Inspector (PSI)', 'Head Constable (HC)', 'Police Constable (PC)'
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(liveSearchTerm);
      setDebouncedCategoryFilter(liveCategoryFilter);
    }, 500);
    return () => clearTimeout(handler);
  }, [liveSearchTerm, liveCategoryFilter]);

  useEffect(() => {
    fetchPools();
  }, [debouncedSearchTerm, debouncedCategoryFilter]);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getEquipmentPools({
        search: debouncedSearchTerm,
        category: debouncedCategoryFilter
      });

      if (response.data.success) {
        setPools(response.data.data.pools);
      }
    } catch (error) {
      console.error('Fetch pools error:', error);
      toast.error('Failed to fetch equipment pools');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleCloseModals = () => {
    setShowCreatePoolModal(false);
    setShowPoolDetailsModal(false);
    setShowDeleteModal(false);
    setSelectedPool(null);
  };

  const handleViewPoolDetails = async (pool) => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getEquipmentPoolDetails(pool._id);
      if (response.data.success) {
        setSelectedPool(response.data.data.pool);
        setShowPoolDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch pool details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (pool) => {
    setSelectedPool(pool);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPool) return;
    try {
      await equipmentAPI.deleteEquipmentPool(selectedPool._id);
      toast.success('Equipment pool deleted successfully');
      handleCloseModals();
      fetchPools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete equipment pool');
      handleCloseModals();
    }
  };
  
  const handleRefresh = () => {
      handleCloseModals();
      fetchPools();
  };

  if (loading && isInitialLoad) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading equipment pools...</p>
      </div>
    );
  }

  return (
    <div className="um-container">
      <div className="um-header">
        <h2>Equipment Pool Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreatePoolModal(true)}
        >
          + Add Equipment Pool
        </button>
      </div>

      <div className="um-controls">
        <input
          type="text"
          placeholder="Search pools by name, model, manufacturer..."
          value={liveSearchTerm}
          onChange={(e) => setLiveSearchTerm(e.target.value)}
          className="um-search-input"
        />
        <select
          value={liveCategoryFilter}
          onChange={(e) => setLiveCategoryFilter(e.target.value)}
          className="um-filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {pools.length === 0 && !loading ? (
        <div className="um-empty-state">
          <p>No equipment pools found.</p>
        </div>
      ) : (
        <div className={`um-table-wrapper ${loading ? 'um-loading' : ''}`}>
          <table className="um-table">
            <thead>
              <tr>
                <th>Pool Name</th>
                <th>Category</th>
                <th>Model</th>
                <th>Total</th>
                <th>Available</th>
                <th>Issued</th>
                <th>Utilization</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pools.map(pool => (
                <tr key={pool._id}>
                  <td><strong>{pool.poolName}</strong></td>
                  <td><span className="um-badge um-badge-blue">{pool.category}</span></td>
                  <td>{pool.model}</td>
                  <td>{pool.totalQuantity}</td>
                  <td><span className="um-badge um-badge-green">{pool.availableCount}</span></td>
                  <td><span className="um-badge um-badge-warn">{pool.issuedCount}</span></td>
                  <td>{pool.utilizationRate}%</td>
                  <td>{pool.location}</td>
                  <td className="um-actions-cell">
                    <button
                      className="btn-action btn-action-secondary"
                      onClick={() => handleViewPoolDetails(pool)}
                      title="View Details"
                    >
                      <Eye size={16} /> View
                    </button>
                    <button
                      className="btn-action btn-action-danger"
                      onClick={() => handleDeleteClick(pool)}
                      title="Delete Pool"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreatePoolModal && (
        <CreatePoolModal 
          categories={categories}
          designations={designations}
          onClose={handleCloseModals}
          onSuccess={handleRefresh}
        />
      )}

      {/* Pool Details Modal (Read-Only) */}
      {showPoolDetailsModal && selectedPool && (
        <PoolDetailsModal 
            selectedPool={selectedPool}
            onClose={handleCloseModals}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPool && (
        <div className="um-modal-overlay" onClick={handleCloseModals}>
          <div className="um-modal-content um-modal-content-small" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-body-centered">
              <Trash2 className="icon" />
              <h3>Are you sure?</h3>
              <p>
                This will permanently remove the <strong>{selectedPool.poolName}</strong> pool and all {selectedPool.totalQuantity} of its items. This action cannot be undone.
              </p>
            </div>
            <div className="um-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModals}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Yes, Remove Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🟢 UPDATED: CreatePoolModal with Explicit Error Messages
const CreatePoolModal = ({ categories, designations, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Inline error style for consistency
  const errorStyle = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' };

  const { 
    register, 
    handleSubmit, 
    watch,
    setValue, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(equipmentPoolSchema),
    mode: "onChange", // Validate as you type
    defaultValues: {
      authorizedDesignations: [],
      prefix: '',
      totalQuantity: ''
    }
  });

  const currentDesignations = watch('authorizedDesignations') || [];

  const handleDesignationToggle = (designation) => {
    const newDesignations = currentDesignations.includes(designation)
      ? currentDesignations.filter(d => d !== designation)
      : [...currentDesignations, designation];
    setValue('authorizedDesignations', newDesignations, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await equipmentAPI.createEquipmentPool(data);
      if (response.data.success) {
        toast.success(`Equipment pool created with ${data.totalQuantity} items!`);
        onSuccess();
      }
    } catch (error) {
      console.error('Create pool error:', error);
      toast.error(error.response?.data?.message || 'Failed to create equipment pool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Add Equipment Pool</h3>
          <button className="um-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="um-modal-form">
          <div className="um-form-section">
            <h4>Basic Information</h4>
            <div className="um-form-group">
              <label>Pool Name *</label>
              <input 
                type="text" 
                placeholder="e.g., Glock 17 (9mm)" 
                className={errors.poolName ? "error" : ""}
                {...register("poolName")}
              />
              {/* 🔴 Explicit Error Message */}
              {errors.poolName && <span style={errorStyle}>{errors.poolName.message}</span>}
            </div>
            
            <div className="um-form-row">
              <div className="um-form-group">
                <label>Category *</label>
                <select className={errors.category ? "error" : ""} {...register("category")}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {/* 🔴 Explicit Error Message */}
                {errors.category && <span style={errorStyle}>{errors.category.message}</span>}
              </div>
              <div className="um-form-group">
                <label>Sub-Category</label>
                <input type="text" placeholder="e.g., Service Pistol" {...register("subCategory")} />
                {/* 🔴 Explicit Error Message */}
                {errors.subCategory && <span style={errorStyle}>{errors.subCategory.message}</span>}
              </div>
            </div>
            
            <div className="um-form-row">
              <div className="um-form-group">
                <label>Model *</label>
                <input type="text" placeholder="e.g., Glock 17 Gen 5" className={errors.model ? "error" : ""} {...register("model")} />
                {/* 🔴 Explicit Error Message */}
                {errors.model && <span style={errorStyle}>{errors.model.message}</span>}
              </div>
              <div className="um-form-group">
                <label>Manufacturer</label>
                <input type="text" placeholder="e.g., Glock GmbH" {...register("manufacturer")} />
                {/* 🔴 Explicit Error Message */}
                {errors.manufacturer && <span style={errorStyle}>{errors.manufacturer.message}</span>}
              </div>
            </div>
          </div>

          <div className="um-form-section">
            <h4>Quantity & ID Generation</h4>
            <div className="um-form-row">
              <div className="um-form-group">
                <label>Total Quantity *</label>
                <input type="number" placeholder="e.g., 50" min="1" className={errors.totalQuantity ? "error" : ""} {...register("totalQuantity")} />
                {/* 🔴 Explicit Error Message */}
                {errors.totalQuantity && <span style={errorStyle}>{errors.totalQuantity.message}</span>}
              </div>
              <div className="um-form-group">
                <label>ID Prefix *</label>
                <input 
                  type="text" 
                  placeholder="e.g., GLK" 
                  maxLength="5" 
                  style={{ textTransform: 'uppercase' }}
                  className={errors.prefix ? "error" : ""}
                  {...register("prefix")}
                />
                <span className="um-field-hint">2-5 chars. Generates: {watch('prefix') || 'PFX'}-001...</span>
                {/* 🔴 Explicit Error Message */}
                {errors.prefix && <span style={errorStyle}>{errors.prefix.message}</span>}
              </div>
            </div>
          </div>

          <div className="um-form-section">
            <h4>Authorized Designations *</h4>
            <span className="um-field-hint">Select which officer designations can access this equipment.</span>
            <div className="um-designation-grid">
              {designations.map(designation => (
                <label key={designation} className="um-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={currentDesignations.includes(designation)} 
                    onChange={() => handleDesignationToggle(designation)} 
                  />
                  <span>{designation}</span>
                </label>
              ))}
            </div>
            {/* 🔴 Explicit Error Message */}
            {errors.authorizedDesignations && <span style={errorStyle}>{errors.authorizedDesignations.message}</span>}
          </div>

          <div className="um-form-section">
            <h4>Additional Details</h4>
            <div className="um-form-group">
              <label>Location *</label>
              <input type="text" placeholder="e.g., Central Armory - Section A" className={errors.location ? "error" : ""} {...register("location")} />
              {/* 🔴 Explicit Error Message */}
              {errors.location && <span style={errorStyle}>{errors.location.message}</span>}
            </div>
            
            <div className="um-form-row">
              <div className="um-form-group">
                <label>Purchase Date</label>
                <input type="date" {...register("purchaseDate")} />
                {/* 🔴 Explicit Error Message */}
                {errors.purchaseDate && <span style={errorStyle}>{errors.purchaseDate.message}</span>}
              </div>
              <div className="um-form-group">
                <label>Total Cost</label>
                <input type="number" placeholder="e.g., 2500000" min="0" {...register("totalCost")} />
                {errors.totalCost && <span style={errorStyle}>{errors.totalCost.message}</span>}
              </div>
            </div>
            
            <div className="um-form-group">
              <label>Supplier</label>
              <input type="text" placeholder="e.g., Government Arms Procurement" {...register("supplier")} />
              {/* 🔴 Explicit Error Message */}
              {errors.supplier && <span style={errorStyle}>{errors.supplier.message}</span>}
            </div>
            
            <div className="um-form-group">
              <label>Notes</label>
              <textarea placeholder="Additional notes about this equipment pool..." rows="3" {...register("notes")} />
              {/* 🔴 Explicit Error Message */}
              {errors.notes && <span style={errorStyle}>{errors.notes.message}</span>}
            </div>
          </div>

          <div className="um-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Equipment Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PoolDetailsModal = ({ selectedPool, onClose }) => {
  return (
    <div className="um-modal-overlay" onClick={onClose}>
        <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal-header">
            <h3>{selectedPool.poolName}</h3>
            <button className="um-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="um-modal-form">
            <div className="um-form-section">
            <h4>Statistics</h4>
            <div className="um-stats-grid">
                <div className="um-stat-item"><span>Total</span> <strong>{selectedPool.totalQuantity}</strong></div>
                <div className="um-stat-item success"><span>Available</span> <strong>{selectedPool.availableCount}</strong></div>
                <div className="um-stat-item warn"><span>Issued</span> <strong>{selectedPool.issuedCount}</strong></div>
                <div className="um-stat-item info"><span>Utilization</span> <strong>{selectedPool.utilizationRate}%</strong></div>
                <div className="um-stat-item danger"><span>Lost</span> <strong>{selectedPool.lostCount || 0}</strong></div>
                <div className="um-stat-item gray"><span>In Maint.</span> <strong>{selectedPool.maintenanceCount || 0}</strong></div>
            </div>
            </div>
            
            <div className="um-form-section">
            <h4>Pool Information</h4>
            <div className="um-details-grid">
                <div className="um-detail-item">
                <span className="um-detail-label">Category</span>
                <span className="um-detail-value">{selectedPool.category}</span>
                </div>
                <div className="um-detail-item">
                <span className="um-detail-label">Model</span>
                <span className="um-detail-value">{selectedPool.model}</span>
                </div>
                <div className="um-detail-item">
                <span className="um-detail-label">Manufacturer</span>
                <span className="um-detail-value">{selectedPool.manufacturer || 'N/A'}</span>
                </div>
                <div className="um-detail-item">
                <span className="um-detail-label">Location</span>
                <span className="um-detail-value">{selectedPool.location}</span>
                </div>
            </div>
            </div>
            
            <div className="um-form-section">
            <h4>Procurement Details</h4>
            <div className="um-details-grid">
                <div className="um-detail-item">
                <span className="um-detail-label">Purchase Date</span>
                <span className="um-detail-value">{formatDate(selectedPool.purchaseDate)}</span>
                </div>
                <div className="um-detail-item">
                <span className="um-detail-label">Supplier</span>
                <span className="um-detail-value">{selectedPool.supplier || 'N/A'}</span>
                </div>
                <div className="um-detail-item">
                <span className="um-detail-label">Total Cost</span>
                <span className="um-detail-value">{selectedPool.totalCost ? `₹${selectedPool.totalCost.toLocaleString('en-IN')}` : 'N/A'}</span>
                </div>
            </div>
            </div>

            <div className="um-form-section">
            <h4>Authorized Designations</h4>
            <div className="um-badge-list">
                {selectedPool.authorizedDesignations.map(designation => (
                <span key={designation} className="um-badge um-badge-blue">
                    {designation}
                </span>
                ))}
            </div>
            </div>

            <div className="um-form-section">
            <h4>Items in Pool (Showing first 20)</h4>
            <div className="um-item-list-container">
                {selectedPool.items.length === 0 ? (
                <p>No individual items found.</p>
                ) : (
                selectedPool.items.slice(0, 20).map(item => (
                    <div key={item.uniqueId} className="um-item-row">
                    <div className="um-item-details">
                        <code>{item.uniqueId}</code>
                        <span className={`um-badge ${
                        item.status === 'Available' ? 'um-badge-green' :
                        item.status === 'Issued' ? 'um-badge-warn' :
                        item.status === 'Lost' ? 'um-badge-red' :
                        'um-badge-gray'
                        }`}>
                        {item.status}
                        </span>
                    </div>
                    <span className="um-item-issued-to">
                        {item.currentlyIssuedTo ? `→ ${item.currentlyIssuedTo.officerName}` : 'In Stock'}
                    </span>
                    </div>
                ))
                )}
                {selectedPool.items.length > 20 && (
                <p className="um-item-list-footer">... and {selectedPool.items.length - 20} more items</p>
                )}
            </div>
            </div>
            
        </div>

        <div className="um-modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        </div>
    </div>
  );
};

export default EquipmentManagement;