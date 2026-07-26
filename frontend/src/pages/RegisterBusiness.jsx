import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const RegisterBusiness = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerSuggestions, setOwnerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAnother, setShowAnother] = useState(false);
  const searchTimeout = useRef(null);

  const ownerData = location.state?.ownerData || {};

  const [formData, setFormData] = useState({
    registration_number: '',
    business_name: '',
    owner_name: ownerData.owner_name || '',
    owner_phone: ownerData.owner_phone || '',
    owner_email: ownerData.owner_email || '',
    business_type: '',
    category: 'A', // Default to 'A'
    license_fee: '',
    ward_id: '',
    physical_address: '',
    licence_number: '',
    registration_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
  });

  useEffect(() => {
    fetchWards();
    if (ownerData.owner_name) {
      alert(`ℹ️ Adding business for: ${ownerData.owner_name}`);
    }
  }, []);

  const fetchWards = async () => {
    try {
      const response = await api.get('/wards');
      setWards(response.data);
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'owner_name' && showAnother) {
      setShowAnother(false);
    }
  };

  // Owner search with debounce
  const handleOwnerSearch = async (value) => {
    setFormData({ ...formData, owner_name: value });
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim().length < 2) {
      setOwnerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await api.get(`/businesses/owners/search?q=${encodeURIComponent(value)}`);
        setOwnerSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      } catch (error) {
        console.error('Error searching owners:', error);
        setOwnerSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectOwner = (owner) => {
    setFormData({
      ...formData,
      owner_name: owner.owner_name,
      owner_phone: owner.owner_phone || '',
      owner_email: owner.owner_email || '',
    });
    setOwnerSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/businesses', formData);
      
      setShowAnother(true);
      
      setFormData({
        ...formData,
        registration_number: '',
        business_name: '',
        business_type: '',
        category: 'A',
        license_fee: '',
        ward_id: '',
        physical_address: '',
        licence_number: '',
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
      });
      
      alert('✅ Business registered successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      alert('❌ Error registering business: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAnother = () => {
    setFormData({
      ...formData,
      registration_number: '',
      business_name: '',
      business_type: '',
      category: 'A',
      license_fee: '',
      ward_id: '',
      physical_address: '',
      licence_number: '',
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
    });
    setShowAnother(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetOwner = () => {
    setFormData({
      ...formData,
      owner_name: '',
      owner_phone: '',
      owner_email: '',
    });
    setShowAnother(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">➕ Register New Business</h1>
      
      {showAnother && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-bold">✅ Business registered!</span>
            <span className="ml-2">Register another business for <strong>{formData.owner_name}</strong>?</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRegisterAnother}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Yes, Register Another
            </button>
            <button
              onClick={() => navigate('/businesses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              View All Businesses
            </button>
            <button
              onClick={handleResetOwner}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              New Owner
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="Optional - e.g., MB/2026/001"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={(e) => handleOwnerSearch(e.target.value)}
              placeholder="Start typing owner name..."
              className="input-field"
              required
              autoComplete="off"
            />
            {showSuggestions && ownerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                {ownerSuggestions.map((owner, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => selectOwner(owner)}
                  >
                    <div className="font-medium">{owner.owner_name}</div>
                    <div className="text-sm text-gray-500">
                      {owner.owner_phone && <span>📞 {owner.owner_phone}</span>}
                      {owner.owner_email && <span className="ml-2">✉️ {owner.owner_email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="absolute right-3 top-9 text-gray-400 text-sm">Searching...</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
            <input
              type="text"
              name="owner_phone"
              value={formData.owner_phone}
              onChange={handleChange}
              placeholder="+265 888 123 456"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
            <input
              type="email"
              name="owner_email"
              value={formData.owner_email}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
            <input
              type="text"
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              placeholder="e.g., Retail, Services, Manufacturing"
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
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
              value={formData.license_fee}
              onChange={handleChange}
              placeholder="e.g., 50000"
              className="input-field"
              required
              min="0"
              step="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
            <select
              name="ward_id"
              value={formData.ward_id}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select Ward</option>
              {wards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence Number</label>
            <input
              type="text"
              name="licence_number"
              value={formData.licence_number}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
            <input
              type="text"
              name="physical_address"
              value={formData.physical_address}
              onChange={handleChange}
              placeholder="Plot 5, Boma"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label>
            <input
              type="date"
              name="registration_date"
              value={formData.registration_date}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-success"
          >
            {loading ? 'Registering...' : '✅ Register Business'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/businesses')}
            className="btn-gray"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterBusiness;