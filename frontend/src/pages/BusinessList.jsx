import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const BusinessList = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [expandedOwners, setExpandedOwners] = useState({});
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/businesses?${params}`);
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchBusinesses();
  };

  // Group businesses by owner
  const groupByOwner = () => {
    const groups = {};
    businesses.forEach(biz => {
      const key = biz.owner_name;
      if (!groups[key]) {
        groups[key] = {
          owner_name: biz.owner_name,
          owner_phone: biz.owner_phone || '',
          owner_email: biz.owner_email || '',
          businesses: []
        };
      }
      groups[key].businesses.push(biz);
    });
    return Object.values(groups);
  };

  const ownerGroups = groupByOwner();

  const toggleExpand = (ownerName) => {
    setExpandedOwners(prev => ({
      ...prev,
      [ownerName]: !prev[ownerName]
    }));
  };

  useEffect(() => {
    if (ownerGroups.length > 0 && Object.keys(expandedOwners).length === 0) {
      const firstOwner = ownerGroups[0]?.owner_name;
      if (firstOwner) {
        setExpandedOwners({ [firstOwner]: true });
      }
    }
  }, [ownerGroups]);

  const handleAddBusinessForOwner = (owner) => {
    navigate('/businesses/register', {
      state: {
        ownerData: {
          owner_name: owner.owner_name,
          owner_phone: owner.owner_phone || '',
          owner_email: owner.owner_email || '',
        }
      }
    });
  };

  const handleEditClick = (business) => {
    setEditingBusiness(business);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingBusiness(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/businesses/${editingBusiness.id}`, editingBusiness);
      alert('✅ Business updated successfully!');
      setShowEditModal(false);
      setEditingBusiness(null);
      fetchBusinesses();
    } catch (error) {
      alert('❌ Error updating business: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingBusiness({ ...editingBusiness, [name]: value });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return `MWK ${Number(amount).toLocaleString()}`;
  };

  if (loading) {
    return <div className="text-center py-10">Loading businesses...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 Businesses</h1>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          name="search"
          placeholder="Search by business name, owner, or registration..."
          value={filters.search}
          onChange={handleFilterChange}
          className="input-field flex-1 min-w-200"
        />
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
        <button type="submit" className="btn-primary">
          Search
        </button>
        <button 
          type="button" 
          onClick={() => { setFilters({ search: '', status: '' }); fetchBusinesses(); }}
          className="btn-gray"
        >
          Clear
        </button>
      </form>

      <div className="mb-4 text-sm text-gray-500">
        Showing {businesses.length} business{ businesses.length !== 1 ? 'es' : '' } 
        across {ownerGroups.length} owner{ ownerGroups.length !== 1 ? 's' : '' }
      </div>

      {/* Grouped Business List */}
      <div className="space-y-4">
        {ownerGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No businesses found. Register your first business!
          </div>
        ) : (
          ownerGroups.map((group) => (
            <div key={group.owner_name} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Owner Header */}
              <div 
                className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition"
                onClick={() => toggleExpand(group.owner_name)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xl font-bold text-gray-700">{group.owner_name}</span>
                  <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                    {group.businesses.length} business{group.businesses.length > 1 ? 'es' : ''}
                  </span>
                  {group.owner_phone && (
                    <span className="text-sm text-gray-500">📞 {group.owner_phone}</span>
                  )}
                  {group.owner_email && (
                    <span className="text-sm text-gray-500">✉️ {group.owner_email}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddBusinessForOwner(group);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
                  >
                    ➕ Add Business
                  </button>
                  <span className="text-gray-400 text-2xl">
                    {expandedOwners[group.owner_name] ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Businesses List */}
              {expandedOwners[group.owner_name] && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ward</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.businesses.map((biz) => (
                        <tr key={biz.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{biz.registration_number || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{biz.business_name}</td>
                          <td className="px-4 py-3 text-sm">{biz.business_type || '—'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              biz.category === 'A' ? 'bg-green-100 text-green-800' :
                              biz.category === 'B' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {biz.category || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {formatCurrency(biz.license_fee)}
                          </td>
                          <td className="px-4 py-3 text-sm">{biz.ward_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={
                              biz.status === 'active' ? 'badge badge-active' :
                              biz.status === 'suspended' ? 'badge badge-suspended' :
                              'badge badge-closed'
                            }>
                              {biz.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditClick(biz)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                title="Edit this business"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">✏️ Edit Business</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={editingBusiness.registration_number || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_name"
                    value={editingBusiness.business_name || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={editingBusiness.owner_name || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                  <input
                    type="text"
                    name="owner_phone"
                    value={editingBusiness.owner_phone || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                  <input
                    type="email"
                    name="owner_email"
                    value={editingBusiness.owner_email || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <input
                    type="text"
                    name="business_type"
                    value={editingBusiness.business_type || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={editingBusiness.category || 'A'}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Fee (MWK) *</label>
                  <input
                    type="number"
                    name="license_fee"
                    value={editingBusiness.license_fee || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    name="physical_address"
                    value={editingBusiness.physical_address || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Licence Number</label>
                  <input
                    type="text"
                    name="licence_number"
                    value={editingBusiness.licence_number || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
                  <select
                    name="ward_id"
                    value={editingBusiness.ward_id || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Ward</option>
                    {[...new Set(businesses.map(b => b.ward_id))].map(id => {
                      const ward = businesses.find(b => b.ward_id === id);
                      return ward && (
                        <option key={id} value={id}>{ward.ward_name}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label>
                  <input
                    type="date"
                    name="registration_date"
                    value={editingBusiness.registration_date || ''}
                    onChange={handleEditChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={editingBusiness.expiry_date || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editingBusiness.status || 'active'}
                    onChange={handleEditChange}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-gray"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessList;