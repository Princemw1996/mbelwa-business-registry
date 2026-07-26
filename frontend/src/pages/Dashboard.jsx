import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, wards: 0 });
  const [wardData, setWardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wardsRes, businessesRes, reportsRes] = await Promise.all([
        api.get('/wards'),
        api.get('/businesses'),
        api.get('/reports/businesses-per-ward')
      ]);
      
      // ✅ Ensure we always have arrays
      const wards = Array.isArray(wardsRes.data) ? wardsRes.data : [];
      const businesses = Array.isArray(businessesRes.data?.businesses) 
        ? businessesRes.data.businesses 
        : [];
      const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
      
      setStats({
        wards: wards.length,
        total: businesses.length
      });
      setWardData(reports);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to empty arrays so the component doesn't crash
      setWardData([]);
      setStats({ total: 0, wards: 0 });
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: wardData.map(w => w.name || 'Unknown'),
    datasets: [
      {
        label: 'Businesses per Ward',
        data: wardData.map(w => parseInt(w.total) || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Total Wards</p>
          <p className="text-3xl font-bold text-blue-600">{stats.wards}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Total Businesses</p>
          <p className="text-3xl font-bold text-green-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">System Status</p>
          <p className="text-2xl font-bold text-green-500">🟢 Online</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Business Distribution by Ward</h2>
        <div className="h-80">
          <Bar 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;