import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    influencer: '',
    discountAmount: 0,
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/coupons');
      setCoupons(response.data);
    } catch (err) {
      setError('Failed to fetch coupons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    try {
      setLoading(true);
      await api.post('/api/admin/coupons', newCoupon);
      setNewCoupon({ code: '', influencer: '', discountAmount: 0, isActive: true });
      fetchCoupons();
    } catch (err) {
      setError('Failed to create coupon');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCouponStatus = async (couponId, isActive) => {
    try {
      setLoading(true);
      await api.put(`/api/admin/coupons/${couponId}/status`, { isActive });
      fetchCoupons();
    } catch (err) {
      setError('Failed to update coupon status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Coupon Manager</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Coupon</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              type="text"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Influencer</label>
            <input
              type="text"
              value={newCoupon.influencer}
              onChange={(e) => setNewCoupon({...newCoupon, influencer: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Amount ($)</label>
            <input
              type="number"
              value={newCoupon.discountAmount}
              onChange={(e) => setNewCoupon({...newCoupon, discountAmount: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Active</label>
            <select
              value={newCoupon.isActive}
              onChange={(e) => setNewCoupon({...newCoupon, isActive: e.target.value === 'true'})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={createCoupon}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow hover:shadow-lg"
        >
          Create Coupon
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Influencer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Uses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {coupons.map((coupon) => (
              <tr key={coupon._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{coupon.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{coupon.influencer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${coupon.discountAmount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{coupon.uses.length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleCouponStatus(coupon._id, !coupon.isActive)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      coupon.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponManager;
