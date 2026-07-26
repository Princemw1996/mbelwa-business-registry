import React, { useState, useEffect } from 'react';
import api from '../services/api';

const WardManagement = () => {
  const [wards, setWards] = useState([]);
  const [newWard, setNewWard] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/wards');
      console.log('Wards response:', response.data); // Debug log
      
      // Ensure we always have an array
      const wardsData = Array.isArray(response.data) ? response.data : [];
      setWards(wardsData);
      
      if (wardsData.length === 0) {
        console.warn('No wards found in the database');
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      setError(error.response?.data?.error || 'Failed to load wards');
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWard.trim()) {
      alert('Please enter a ward name');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/wards', { name: newWard.trim() });
      setNewWard('');
      await fetchWards(); // Refresh the list
      alert('✅ Ward added successfully!');
    } catch (error) {
      console.error('Error adding ward:', error);
      alert('❌ Error adding ward: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ward?')) return;
    
    try {
      await api.delete(`/wards/${id}`);
      await fetchWards(); // Refresh the list
      alert('✅ Ward deleted!');
    } catch (error) {
      console.error('Error deleting ward:', error);
      alert('❌ Error deleting ward: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  if (loading && wards.length === 0) {
    return <div className="text-center py-10">Loading wards...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🗺️ Manage Wards</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Ward</h2>
        <form onSubmit={handleAdd} className="flex gap-4 flex-wrap">
          <input
            type="text"
            value={newWard}
            onChange={(e) => setNewWard(e.target.value)}
            placeholder="Enter ward name (e.g., KAVUNGATI)"
            className="input-field flex-1 min-w-200"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Adding...' : 'Add Ward'}
          </button>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ward Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wards.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No wards found. Please add your first ward!
                </td>
              </tr>
            ) : (
              wards.map((ward, index) => (
                <tr key={ward.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{ward.name}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(ward.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={loading}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WardManagement;