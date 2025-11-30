'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle,
  XCircle,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { taskApi, authApi, type Task, type TaskCreateRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface TaskManagementProps {
  isHRView?: boolean;
}

export function TaskManagement({ isHRView = false }: TaskManagementProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statistics, setStatistics] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState<TaskCreateRequest>({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium'
  });

  const fetchTasks = async () => {
    try {
      const filters: any = {};
      if (!isHRView && user) {
        filters.user_id = user.user_id;
      }
      if (statusFilter) filters.status = statusFilter;
      
      const response = await taskApi.getTasks(filters);
      setTasks(response.tasks || []);
      
      // Get statistics
      const statsResponse = await taskApi.getTaskStatistics(
        !isHRView && user ? user.user_id : undefined
      );
      setStatistics(statsResponse.statistics);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (isHRView) {
      try {
        const response = await authApi.getUsers('employee');
        setEmployees(response.users || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [statusFilter, priorityFilter, isHRView, user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskApi.createTask(formData);
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium'
      });
      fetchTasks();
      alert('✅ Task created successfully!');
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.detail || 'Failed to create task'}`);
    }
  };

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      fetchTasks();
      alert(`✅ Task status updated to ${newStatus}!`);
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.detail || 'Failed to update task'}`);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskApi.deleteTask(taskId);
      fetchTasks();
      alert('✅ Task deleted successfully!');
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.detail || 'Failed to delete task'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  });

  if (showCreateForm && isHRView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create New Task</h2>
          <Button
            onClick={() => setShowCreateForm(false)}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Back to Tasks
          </Button>
        </div>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Assign To *
                  </label>
                  <select
                    required
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" className="bg-slate-800">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.user_id} value={emp.user_id} className="bg-slate-800">
                        {emp.full_name} ({emp.user_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low" className="bg-slate-800">Low</option>
                    <option value="medium" className="bg-slate-800">Medium</option>
                    <option value="high" className="bg-slate-800">High</option>
                    <option value="urgent" className="bg-slate-800">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isHRView ? 'Task Management' : 'My Tasks'}
          </h2>
          <p className="text-slate-400">
            {isHRView ? 'Assign and track tasks for employees' : 'View and update your assigned tasks'}
          </p>
        </div>
        {isHRView && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{statistics.total || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Pending</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">In Progress</p>
                  <p className="text-2xl font-bold text-white">{statistics.in_progress || 0}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Completed</p>
                  <p className="text-2xl font-bold text-white">{statistics.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-300">Filters:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-800">All Status</option>
              <option value="pending" className="bg-slate-800">Pending</option>
              <option value="in_progress" className="bg-slate-800">In Progress</option>
              <option value="completed" className="bg-slate-800">Completed</option>
              <option value="cancelled" className="bg-slate-800">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-800">All Priority</option>
              <option value="urgent" className="bg-slate-800">Urgent</option>
              <option value="high" className="bg-slate-800">High</option>
              <option value="medium" className="bg-slate-800">Medium</option>
              <option value="low" className="bg-slate-800">Low</option>
            </select>

            <span className="text-sm text-slate-400">
              Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-slate-300">Loading tasks...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No tasks found</h3>
              <p className="text-slate-300 mb-4">
                {isHRView ? 'Create your first task to get started.' : 'No tasks have been assigned to you yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.toUpperCase()}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-300 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {isHRView && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(task.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Assigned by: {task.assigned_by_name}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isHRView && task.status !== 'completed' && task.status !== 'cancelled' && (
                        <>
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                            >
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(task.id, 'completed')}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs"
                            >
                              Complete
                            </Button>
                          )}
                        </>
                      )}
                      
                      {isHRView && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-400 border-red-400/30 hover:bg-red-500/20 text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}