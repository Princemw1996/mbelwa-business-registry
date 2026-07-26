import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reports = () => {
  const [businesses, setBusinesses] = useState([]);
  const [userBusinesses, setUserBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ward_id: '', category: '', status: '' });
  const [wards, setWards] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedUsers, setExpandedUsers] = useState({});
  const [totals, setTotals] = useState({
    totalBusinesses: 0,
    totalFees: 0,
    categoryA: 0,
    categoryB: 0,
    categoryC: 0
  });

  useEffect(() => {
    fetchData();
    fetchWards();
    fetchUserBusinesses();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.ward_id) params.append('ward_id', filters.ward_id);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/businesses?${params}`);
      let data = response.data.businesses || [];
      
      if (filters.category) {
        data = data.filter(b => b.category === filters.category);
      }
      
      setBusinesses(data);
      
      const totalFees = data.reduce((sum, b) => sum + (Number(b.license_fee) || 0), 0);
      const categoryA = data.filter(b => b.category === 'A').length;
      const categoryB = data.filter(b => b.category === 'B').length;
      const categoryC = data.filter(b => b.category === 'C').length;
      
      setTotals({
        totalBusinesses: data.length,
        totalFees: totalFees,
        categoryA: categoryA,
        categoryB: categoryB,
        categoryC: categoryC
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBusinesses = async () => {
    try {
      const response = await api.get('/businesses/by-user');
      console.log('User businesses response:', response.data);
      setUserBusinesses(response.data);
      // Auto-expand first user
      if (response.data.length > 0) {
        setExpandedUsers({ [response.data[0].user_id]: true });
      }
    } catch (error) {
      console.error('Error fetching user businesses:', error);
      setUserBusinesses([]);
    }
  };

  const fetchWards = async () => {
    try {
      const response = await api.get('/wards');
      setWards(response.data);
    } catch (error) {
      console.error('Error fetching wards:', error);
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
    setFilters({ ward_id: '', category: '', status: '' });
    setTimeout(fetchData, 100);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return `MWK ${Number(amount).toLocaleString()}`;
  };

  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const exportToCSV = () => {
    if (businesses.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Registration Number',
      'Business Name',
      'Owner',
      'Business Type',
      'Category',
      'License Fee (MWK)',
      'Ward',
      'Status',
      'Registration Date'
    ];

    const rows = businesses.map(b => [
      b.registration_number || '—',
      b.business_name,
      b.owner_name,
      b.business_type || '—',
      b.category || '—',
      Number(b.license_fee) || 0,
      b.ward_name || '—',
      b.status || '—',
      new Date(b.registration_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-10">Loading report data...</div>;
  }

  return (
    <div className="report-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Business Reports</h1>
        <div className="flex gap-2 no-print">
          <button onClick={exportToCSV} className="btn-primary">📥 Export CSV</button>
          <button onClick={printReport} className="btn-primary" style={{ backgroundColor: '#6b7280' }}>🖨️ Print</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'all' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 All Businesses
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'users' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 By User
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          <form onSubmit={applyFilters} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 no-print">
            <select
              name="ward_id"
              value={filters.ward_id}
              onChange={handleFilterChange}
              className="input-field flex-shrink-0"
            >
              <option value="">All Wards</option>
              {wards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input-field flex-shrink-0"
            >
              <option value="">All Categories</option>
              <option value="A">Category A</option>
              <option value="B">Category B</option>
              <option value="C">Category C</option>
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field flex-shrink-0"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
            <button type="submit" className="btn-primary">Apply Filters</button>
            <button type="button" onClick={resetFilters} className="btn-gray">Reset</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Businesses</p>
              <p className="text-2xl font-bold text-blue-700">{totals.totalBusinesses}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Total License Fees</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.totalFees)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Category A</p>
              <p className="text-2xl font-bold text-purple-700">{totals.categoryA}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Category B</p>
              <p className="text-2xl font-bold text-yellow-700">{totals.categoryB}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Category C</p>
              <p className="text-2xl font-bold text-red-700">{totals.categoryC}</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reg #</th>
                  <th>Business Name</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>License Fee</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-gray-500 py-4">No businesses found</td>
                  </tr>
                ) : (
                  businesses.map((biz, index) => (
                    <tr key={biz.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{biz.registration_number || '—'}</td>
                      <td className="font-semibold">{biz.business_name}</td>
                      <td>{biz.owner_name}</td>
                      <td>{biz.business_type || '—'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          biz.category === 'A' ? 'bg-green-100 text-green-800' :
                          biz.category === 'B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {biz.category || '—'}
                        </span>
                      </td>
                      <td className="font-medium">{formatCurrency(biz.license_fee)}</td>
                      <td>{biz.ward_name}</td>
                      <td>
                        <span className={
                          biz.status === 'active' ? 'badge badge-active' :
                          biz.status === 'suspended' ? 'badge badge-suspended' :
                          'badge badge-closed'
                        }>
                          {biz.status}
                        </span>
                      </td>
                      <td>{new Date(biz.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {businesses.length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan="6" className="px-4 py-3 text-right">TOTALS:</td>
                    <td className="px-4 py-3 text-green-700">{formatCurrency(totals.totalFees)}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          {/* Summary Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <p className="text-sm text-gray-500">
              👥 Showing <strong>{userBusinesses.length}</strong> user{userBusinesses.length > 1 ? 's' : ''} who have registered businesses.
              Total businesses registered: <strong>{userBusinesses.reduce((sum, u) => sum + u.total_businesses, 0)}</strong>
            </p>
          </div>

          <div className="space-y-4">
            {userBusinesses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <p className="text-lg">No businesses registered by users yet.</p>
                <p className="text-sm mt-2">Make sure businesses have a valid <code>created_by</code> user ID.</p>
              </div>
            ) : (
              userBusinesses.map((user) => (
                <div key={user.user_id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* User Header */}
                  <div
                    className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition"
                    onClick={() => toggleUserExpand(user.user_id)}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xl font-bold text-gray-700">👤 {user.user_name}</span>
                      <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                        {user.total_businesses} business{user.total_businesses > 1 ? 'es' : ''}
                      </span>
                      {/* Total License Fee for this user */}
                      <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        Total Fee: {formatCurrency(
                          user.businesses.reduce((sum, b) => sum + (Number(b.license_fee) || 0), 0)
                        )}
                      </span>
                    </div>
                    <span className="text-gray-400 text-2xl">
                      {expandedUsers[user.user_id] ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Businesses List (Expandable) */}
                  {expandedUsers[user.user_id] && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ward</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {user.businesses && user.businesses.map((biz, index) => (
                            <tr key={biz.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{index + 1}</td>
                              <td className="px-4 py-3 text-sm">{biz.registration_number || '—'}</td>
                              <td className="px-4 py-3 text-sm font-semibold">{biz.business_name}</td>
                              <td className="px-4 py-3 text-sm">{biz.owner_name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  biz.category === 'A' ? 'bg-green-100 text-green-800' :
                                  biz.category === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {biz.category || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">{formatCurrency(biz.license_fee)}</td>
                              <td className="px-4 py-3 text-sm">{biz.ward_name || '—'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={
                                  biz.status === 'active' ? 'badge badge-active' :
                                  biz.status === 'suspended' ? 'badge badge-suspended' :
                                  'badge badge-closed'
                                }>
                                  {biz.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{new Date(biz.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-medium">
                          <tr>
                            <td colSpan="5" className="px-4 py-2 text-right">Total Fee:</td>
                            <td className="px-4 py-2 text-green-700 font-bold">
                              {formatCurrency(
                                user.businesses.reduce((sum, b) => sum + (Number(b.license_fee) || 0), 0)
                              )}
                            </td>
                            <td colSpan="3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-container { padding: 20px; }
          .table-wrapper { box-shadow: none !important; }
          .table th { background-color: #f3f4f6 !important; }
          .badge { print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default Reports;