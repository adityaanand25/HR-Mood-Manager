'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, Trash2, Mail, Building, Calendar, Eye, ArrowLeft, Home, Brain } from 'lucide-react';
import { authApi } from '@/lib/api';
import UserRegistration from '@/components/UserRegistration';
import Link from 'next/link';

interface User {
  id: number;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
  department: string;
  created_at: string;
  last_login: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const response = await authApi.getUsers(roleFilter || undefined);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}" (${userId})? This action cannot be undone.`)) {
      return;
    }

    try {
      await authApi.deleteUser(userId);
      alert(`✅ User "${userName}" deleted successfully`);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete user';
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'hr' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const stats = {
    total: users.length,
    employees: users.filter(u => u.role === 'employee').length,
    hr: users.filter(u => u.role === 'hr').length,
    recentLogins: users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastLogin > dayAgo;
    }).length
  };

  if (showRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              onClick={() => setShowRegistration(false)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User List
            </Button>
          </div>
          <UserRegistration
            onSuccess={() => {
              setShowRegistration(false);
              fetchUsers();
            }}
            onCancel={() => setShowRegistration(false)}
            isAdmin={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Navigation */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-300 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
              
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              
              <div>
                <h1 className="text-lg font-bold text-white">User Management</h1>
                <p className="text-xs text-slate-400">Manage user accounts and permissions</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowRegistration(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white border-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Employees</p>
                  <p className="text-2xl font-bold text-white">{stats.employees}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">HR Managers</p>
                  <p className="text-2xl font-bold text-white">{stats.hr}</p>
                </div>
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Active (24h)</p>
                  <p className="text-2xl font-bold text-white">{stats.recentLogins}</p>
                </div>
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-sm font-medium text-slate-300">Filter by role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="bg-slate-800 text-white">All Roles</option>
                <option value="employee" className="bg-slate-800 text-white">Employees</option>
                <option value="hr" className="bg-slate-800 text-white">HR Managers</option>
              </select>
              <span className="text-sm text-slate-400">
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-slate-300">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-slate-300 mb-4">
                  {roleFilter ? `No ${roleFilter} users found.` : 'No users have been created yet.'}
                </p>
                <Button
                  onClick={() => setShowRegistration(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3 text-slate-300 font-medium">User</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Role</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Contact</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Last Login</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-white">{user.full_name}</div>
                            <div className="text-sm text-slate-400">ID: {user.user_id}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={user.role === 'hr' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'bg-blue-500/20 text-blue-300 border-blue-400/30'}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-slate-300">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.department && (
                              <div className="flex items-center gap-1 text-sm text-slate-300">
                                <Building className="h-3 w-3" />
                                {user.department}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-300 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.last_login)}
                          </div>
                          <div className="text-xs text-slate-400">
                            Joined: {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-slate-300 border-white/20 hover:bg-white/10 hover:text-white"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                              className="text-red-400 border-red-400/30 hover:bg-red-500/20 hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}