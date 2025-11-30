'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

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

export default function LeaveManagement({ userId }: { userId: string }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statistics, setStatistics] = useState<LeaveStatistics | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchStatistics();
  }, [userId]);

  const fetchLeaves = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/leaves?employee_id=${userId}`);
      const data = await response.json();
      setLeaves(data.leaves);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/leaves/statistics?employee_id=${userId}`);
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: userId,
          ...formData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Leave request submitted successfully!');
        setFormData({
          leave_type: 'casual',
          start_date: '',
          end_date: '',
          reason: ''
        });
        setShowApplyForm(false);
        fetchLeaves();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leaveId: number) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/leaves/${leaveId}?user_id=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Leave request deleted');
        fetchLeaves();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      alert('Failed to delete leave request');
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-300">Leave Management</h2>
          <p className="text-gray-400 mt-1">Apply for leave and track your requests</p>
        </div>
        
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all"
        >
          <Plus size={20} />
          Apply for Leave
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 rounded-lg border border-purple-700/30">
            <div className="text-gray-400 text-sm">Total Requests</div>
            <div className="text-3xl font-bold text-purple-300 mt-2">{statistics.total}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 p-4 rounded-lg border border-yellow-700/30">
            <div className="text-gray-400 text-sm">Pending</div>
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

      {/* Apply Leave Form */}
      {showApplyForm && (
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 rounded-lg border border-purple-700/30">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">Apply for Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1f1633] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="personal">Personal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1f1633] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1f1633] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f1633] border border-purple-700/30 rounded-lg text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                placeholder="Please provide a brief reason for your leave..."
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg border border-purple-700/30 overflow-hidden">
        <div className="p-4 border-b border-purple-700/30">
          <h3 className="text-xl font-semibold text-purple-300">Your Leave Requests</h3>
        </div>
        
        <div className="overflow-x-auto">
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No leave requests yet</p>
              <p className="text-sm mt-2">Click "Apply for Leave" to submit your first request</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-purple-900/20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Dates</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">Applied On</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-purple-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-700/20">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-purple-900/10 transition-colors">
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
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                      {leave.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status === 'approved' && <CheckCircle size={14} />}
                        {leave.status === 'rejected' && <XCircle size={14} />}
                        {leave.status === 'pending' && <Clock size={14} />}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {leave.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(leave.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete request"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="text-gray-600 text-xs">
                          {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.approved_by_name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
