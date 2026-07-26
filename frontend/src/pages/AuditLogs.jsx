import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', action: '', user_id: '' });
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchUserActivity();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.action) params.append('action', filters.action);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      const response = await api.get(`/audit?${params}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/audit/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await api.get('/audit/user-activity');
      setUserActivity(response.data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchData();
  };

  const resetFilters = () => {
    setFilters({ search: '', action: '', user_id: '' });
    setTimeout(fetchData, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJSON = (data) => {
    if (!data) return '—';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '—';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'User', 'Action', 'Table', 'Record ID', 'New Data'];
    const rows = logs.map(log => [
      formatDate(log.created_at),
      log.user_name || '—',
      log.action,
      log.table_name || '—',
      log.record_id || '—',
      log.new_data ? JSON.stringify(log.new_data) : '—'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-10">Loading logs...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 System Logs</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'logs' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'users' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 User Activity
        </button>
      </div>

      {activeTab === 'logs' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total_logs || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-2xl font-bold text-green-700">{stats.total_creates || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Updated</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.total_updates || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Deleted</p>
              <p className="text-2xl font-bold text-red-700">{stats.total_deletes || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Logins</p>
              <p className="text-2xl font-bold text-purple-700">{stats.total_logins || 0}</p>
            </div>
          </div>

          {/* Filters */}
          <form onSubmit={applyFilters} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by user or action..."
              value={filters.search}
              onChange={handleFilterChange}
              className="input-field flex-1 min-w-200"
            />
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="input-field flex-shrink-0"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
            </select>
            <button type="submit" className="btn-primary">
              Filter
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="btn-gray"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="btn-primary"
              style={{ backgroundColor: '#6b7280' }}
            >
              📥 Export CSV
            </button>
          </form>

          {/* Logs Table */}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-4">No logs found</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">{formatDate(log.created_at)}</td>
                      <td className="font-semibold">{log.user_name || '—'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.table_name || '—'}</td>
                      <td>{log.record_id || '—'}</td>
                      <td className="text-xs">
                        {log.new_data ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600">View Data</summary>
                            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto max-w-xs">
                              {formatJSON(log.new_data)}
                            </pre>
                          </details>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">👥 User Activity Summary</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Businesses Registered</th>
                    <th>Businesses Updated</th>
                    <th>Businesses Deleted</th>
                    <th>Total Actions</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 py-4">No user activity found</td>
                    </tr>
                  ) : (
                    userActivity.map((user, index) => (
                      <tr key={index}>
                        <td className="font-semibold">{user.user_name || 'Unknown'}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.businesses_registered > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {user.businesses_registered || 0}
                          </span>
                        </td>
                        <td>{user.businesses_updated || 0}</td>
                        <td>{user.businesses_deleted || 0}</td>
                        <td>{user.total_actions || 0}</td>
                        <td className="text-sm">{user.last_activity ? formatDate(user.last_activity) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogs;