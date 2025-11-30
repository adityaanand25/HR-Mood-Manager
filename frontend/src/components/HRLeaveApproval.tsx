'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, User, FileText, Filter } from 'lucide-react';

interface LeaveRequest {
  id: number;
  employee_id: string;
  employee_name: string;
  employee_department: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_by_name?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

interface LeaveStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  status_counts: Record<string, number>;
  type_counts: Record<string, number>;
}

export default function HRLeaveApproval({ hrUserId }: { hrUserId: string }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statistics, setStatistics] = useState<LeaveStatistics | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
    fetchStatistics();
  }, [filterStatus]);

  const fetchLeaves = async () => {
    try {
      const statusParam = filterStatus === 'all' ? '' : `&status=${filterStatus}`;
      const response = await fetch(`http://localhost:8000/api/leaves?${statusParam.slice(1)}`);
      const data = await response.json();
      setLeaves(data.leaves);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/leaves/statistics');
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApproval = async (leaveId: number, status: 'approved' | 'rejected') => {
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/leaves/${leaveId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approved_by: hrUserId,
          approval_notes: approvalNotes || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Leave request ${status} successfully!`);
        setShowApprovalModal(false);
        setSelectedLeave(null);
        setApprovalNotes('');
        fetchLeaves();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      alert('Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (leave: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setShowApprovalModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-950/50';
      case 'rejected': return 'text-red-400 bg-red-950/50';
      default: return 'text-yellow-400 bg-yellow-950/50';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-300">Leave Approval Management</h2>
          <p className="text-gray-400 mt-1">Review and approve employee leave requests</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#1f1633] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 rounded-lg border border-purple-700/30">
            <div className="text-gray-400 text-sm">Total Requests</div>
            <div className="text-3xl font-bold text-purple-300 mt-2">{statistics.total}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 p-4 rounded-lg border border-yellow-700/30">
            <div className="text-gray-400 text-sm">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-300 mt-2">{statistics.pending}</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 p-4 rounded-lg border border-green-700/30">
            <div className="text-gray-400 text-sm">Approved</div>
            <div className="text-3xl font-bold text-green-300 mt-2">{statistics.approved}</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 p-4 rounded-lg border border-red-700/30">
            <div className="text-gray-400 text-sm">Rejected</div>
            <div className="text-3xl font-bold text-red-300 mt-2">{statistics.rejected}</div>
          </div>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg border border-purple-700/30 overflow-hidden">
        <div className="p-4 border-b border-purple-700/30">
          <h3 className="text-xl font-semibold text-purple-300">Leave Requests</h3>
        </div>
        
        <div className="overflow-x-auto">
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No leave requests found</p>
              <p className="text-sm mt-2">
                {filterStatus === 'all' ? 'No leave requests yet' : `No ${filterStatus} requests`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-purple-900/20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Dates</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-purple-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-700/20">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-purple-900/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-purple-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-200">{leave.employee_name}</div>
                          <div className="text-xs text-gray-400">{leave.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-300">
                        {getLeaveTypeLabel(leave.leave_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {calculateDays(leave.start_date, leave.end_date)} days
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs">
                      <div className="truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status === 'approved' && <CheckCircle size={14} />}
                        {leave.status === 'rejected' && <XCircle size={14} />}
                        {leave.status === 'pending' && <Clock size={14} />}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center">
                          By {leave.approved_by_name || leave.approved_by}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1633] border border-purple-700/50 rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold text-purple-300 mb-4">
              Review Leave Request
            </h3>
            
            <div className="space-y-3 mb-6 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Employee:</span>
                <span className="font-medium">{selectedLeave.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Leave Type:</span>
                <span className="font-medium">{getLeaveTypeLabel(selectedLeave.leave_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="font-medium">
                  {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}
                  ({calculateDays(selectedLeave.start_date, selectedLeave.end_date)} days)
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Reason:</span>
                <span className="font-medium text-right max-w-md">{selectedLeave.reason}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Notes (Optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-4 py-2 bg-[#2d1b4e] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                placeholder="Add any notes or comments..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleApproval(selectedLeave.id, 'approved')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                {loading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleApproval(selectedLeave.id, 'rejected')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedLeave(null);
                  setApprovalNotes('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
