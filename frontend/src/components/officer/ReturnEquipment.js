import React, { useState, useEffect } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

// 🟢 VALIDATION IMPORTS
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  lostReportSchema, 
  returnEquipmentSchema, 
  maintenanceReportSchema 
} from '../../utils/validationSchemas'; 

const ReturnEquipment = ({ onEquipmentReturned }) => {
  const { user } = useAuth();
  const [issuedEquipment, setIssuedEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    fetchIssuedEquipment();
  }, []);

  const fetchIssuedEquipment = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getIssuedEquipment();

      if (response.data.success) {
        setIssuedEquipment(response.data.data.equipment);
      }
    } catch (error) {
      toast.error('Failed to fetch issued equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = (equipment) => {
    setSelectedEquipment(equipment);
    setShowReturnModal(true);
  };
  
  const handleRefresh = () => {
    fetchIssuedEquipment();
    if (onEquipmentReturned) onEquipmentReturned();
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading your issued equipment...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 🟢 REMOVED redundant header div */}

      {issuedEquipment.length === 0 ? (
        <div className="no-data">
          <h3>No Equipment Issued</h3>
          <p>You don't have any equipment currently assigned to you.</p>
        </div>
      ) : (
        <div className="equipment-pool-list">
          {issuedEquipment.map((equipment) => (
            <IssuedEquipmentCard
              key={equipment._id}
              equipment={equipment}
              onReturn={handleReturnRequest}
              onRefresh={handleRefresh}
              policeStation={user?.policeStation}
            />
          ))}
        </div>
      )}

      {showReturnModal && selectedEquipment && (
        <ReturnModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedEquipment(null);
          }}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

// ... (Rest of the file: IssuedEquipmentCard, ReturnModal, MaintenanceModal, LostModal)
// ... (These components are unchanged as they are modals, not page headers)
const IssuedEquipmentCard = ({ equipment, onReturn, onRefresh, policeStation }) => {
  const isOverdue = equipment.issuedTo.expectedReturnDate && 
    new Date(equipment.issuedTo.expectedReturnDate) < new Date();

  const daysHeld = Math.floor(
    (new Date() - new Date(equipment.issuedTo.issuedDate)) / (1000 * 60 * 60 * 24)
  );
  
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);

  return (
    <>
      <div className={`equipment-card ${isOverdue ? 'overdue' : ''}`} style={isOverdue ? { borderColor: 'var(--color-danger)' } : {}}>
        <div className="pool-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <h4>{equipment.name}</h4>
            {isOverdue && <span className="badge badge-danger">Overdue</span>}
          </div>
          <p className="equipment-model">{equipment.model} • {equipment.category}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>Serial: {equipment.serialNumber}</p>
        </div>

        <div className="pool-summary-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-item">
            <strong>{new Date(equipment.issuedTo.issuedDate).toLocaleDateString()}</strong> Issued
          </div>
          <div className="stat-item">
            <strong>{daysHeld}</strong> Days Held
          </div>
          <div className="stat-item" style={isOverdue ? { color: 'var(--color-danger-text)' } : {}}>
            <strong style={isOverdue ? { color: 'var(--color-danger-text)' } : {}}>
                {equipment.issuedTo.expectedReturnDate ? new Date(equipment.issuedTo.expectedReturnDate).toLocaleDateString() : 'N/A'}
            </strong> Return By
          </div>
        </div>

        <div className="equipment-actions">
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              onClick={() => onReturn(equipment)}
              className={`btn btn-sm ${isOverdue ? 'btn-danger' : 'btn-primary'}`}
            >
              Return
            </button>
            <button
              onClick={() => setShowMaintModal(true)}
              className="btn btn-sm btn-secondary"
            >
              Report Issue
            </button>
            <button
              onClick={() => setShowLostModal(true)}
              className="btn btn-sm btn-danger"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              Report Lost
            </button>
          </div>
        </div>
      </div>
      
      {showMaintModal && (
        <MaintenanceModal
          equipment={equipment}
          onClose={() => setShowMaintModal(false)}
          onSuccess={() => {
            setShowMaintModal(false);
            toast.success('Maintenance request submitted successfully!');
            onRefresh(); 
          }}
        />
      )}

      {showLostModal && (
        <LostModal
          equipment={equipment}
          policeStation={policeStation}
          onClose={() => setShowLostModal(false)}
          onSuccess={() => {
            setShowLostModal(false);
            toast.success('Lost equipment report submitted successfully!');
            onRefresh();
          }}
        />
      )}
    </>
  );
};

const ReturnModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const errorStyle = { color: 'red', fontSize: '12px', display: 'block' };

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(returnEquipmentSchema),
    defaultValues: {
      priority: 'Medium',
      condition: equipment?.condition || 'Good',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await officerAPI.createRequest({
        poolId: equipment.poolId,
        uniqueId: equipment._id,
        requestType: 'Return',
        ...data 
      });
      toast.success('Return request submitted successfully');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Return submission error:', error);
      toast.error('Failed to process return.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Return Equipment</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
    
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label>Reason for Return <span style={{color:'red'}}>*</span></label>
              <textarea
                className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                placeholder="e.g., Shift ended, Assignment completed..."
                rows="3"
                {...register("reason")}
              />
              {errors.reason && <span style={errorStyle}>{errors.reason.message}</span>}
            </div>
      
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                  <label>Priority</label>
                  <select className="form-control" {...register("priority")}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
              </div>
          
              <div className="form-group">
                  <label>Condition</label>
                  <select className="form-control" {...register("condition")}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MaintenanceModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const errorStyle = { color: 'red', fontSize: '12px', display: 'block' };

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(maintenanceReportSchema),
    defaultValues: {
      priority: 'High',
      condition: 'Poor',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await officerAPI.createRequest({
        poolId: equipment.poolId,
        uniqueId: equipment._id,
        requestType: 'Maintenance',
        ...data
      });
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Issue: {equipment.name}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div style={{ backgroundColor: 'var(--bg-table-header)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong>Model:</strong> {equipment.model} <br/> 
                <strong>ID:</strong> {equipment.serialNumber}
              </p>
            </div>

            <div className="form-group">
              <label>Problem Description <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <textarea
                className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                rows="4"
                placeholder="Describe the problem in detail (e.g., 'Sight is misaligned by 2mm', 'Firing pin jams frequently')"
                {...register("reason")}
              />
              {errors.reason && <span style={errorStyle}>{errors.reason.message}</span>}
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Urgency</label>
                <select className="form-control" {...register("priority")}>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Condition</label>
                <select className="form-control" {...register("condition")}>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LostModal = ({ equipment, policeStation, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const errorStyle = { color: 'red', fontSize: '12px', display: 'block' };

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(lostReportSchema),
    mode: "onChange",
    defaultValues: {
      condition: 'Lost',
      priority: 'Urgent',
      policeStation: policeStation || '',
      dateOfLoss: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await officerAPI.createRequest({
        poolId: equipment.poolId,
        uniqueId: equipment._id,
        requestType: 'Lost',
        ...data 
      });
      toast.success('Lost report submitted successfully.');
      onSuccess();
    } catch (error) {
      console.error('Failed to submit lost report', error);
      toast.error('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Lost Item: {equipment.name}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <strong>Warning:</strong> Reporting an item as lost is a serious matter and will require an official investigation.
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Date of Loss <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  className={`form-control ${errors.dateOfLoss ? 'is-invalid' : ''}`}
                  {...register("dateOfLoss")}
                />
                {errors.dateOfLoss && <span style={errorStyle}>{errors.dateOfLoss.message}</span>}
              </div>
              <div className="form-group">
                <label>Place of Loss <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.placeOfLoss ? 'is-invalid' : ''}`}
                  placeholder="e.g., Sector 17 Market"
                  {...register("placeOfLoss")}
                />
                {errors.placeOfLoss && <span style={errorStyle}>{errors.placeOfLoss.message}</span>}
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Police Station <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.policeStation ? 'is-invalid' : ''}`}
                  placeholder="e.g., Central Station"
                  {...register("policeStation")}
                />
                {errors.policeStation && <span style={errorStyle}>{errors.policeStation.message}</span>}
              </div>
              <div className="form-group">
                <label>Duty at Time of Loss <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.dutyAtTimeOfLoss ? 'is-invalid' : ''}`}
                  placeholder="e.g., Night Patrol"
                  {...register("dutyAtTimeOfLoss")}
                />
                {errors.dutyAtTimeOfLoss && <span style={errorStyle}>{errors.dutyAtTimeOfLoss.message}</span>}
              </div>
            </div>
            
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>FIR Number <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.firNumber ? 'is-invalid' : ''}`}
                  placeholder="e.g., 123/2025"
                  {...register("firNumber")}
                />
                {errors.firNumber && <span style={errorStyle}>{errors.firNumber.message}</span>}
              </div>
              <div className="form-group">
                  <label>FIR Date <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="date"
                    className={`form-control ${errors.firDate ? 'is-invalid' : ''}`}
                    {...register("firDate")}
                  />
                  {errors.firDate && <span style={errorStyle}>{errors.firDate.message}</span>}
                </div>
            </div>
            
            <div className="form-group">
              <label>Remedial Action Taken <span style={{ color: 'red' }}>*</span></label>
              <textarea
                className={`form-control ${errors.remedialActionTaken ? 'is-invalid' : ''}`}
                rows="3"
                placeholder="Action taken immediately after loss..."
                {...register("remedialActionTaken")}
              />
              {errors.remedialActionTaken && <span style={errorStyle}>{errors.remedialActionTaken.message}</span>}
            </div>

            <div className="form-group">
              <label>Description of Incident <span style={{ color: 'red' }}>*</span></label>
              <textarea
                className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                rows="3"
                placeholder="Describe exactly how the item was lost..."
                {...register("reason")}
              />
              {errors.reason && <span style={errorStyle}>{errors.reason.message}</span>}
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Lost Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnEquipment;