import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Shield, Check, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import PageHeader from '../../components/layout/PageHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

import usersApi from '../../api/users.api';

export const CitizenProfile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { complaints } = useComplaints();

  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Aarav Sharma',
    email: currentUser?.email || 'citizen@example.com',
    phone: currentUser?.phone || '+91 98765 43210',
    address: currentUser?.address || '#142, 5th Cross, Indiranagar, Bengaluru - 560038',
    ward: 'Ward 80 - Hoysala Nagar',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        address: currentUser.address || prev.address
      }));
    }
  }, [currentUser]);

  const myComplaints = complaints.filter(
    (c) => c.citizenId === currentUser?.id || c.citizenId === currentUser?.userCode || c.submitted_by === currentUser?.id || (c.supporters && (c.supporters.includes(currentUser?.id) || c.supporters.includes(currentUser?.userCode)))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await usersApi.updateProfile({
        fullName: formData.name,
        phone: formData.phone,
        address: formData.address
      });
      updateUserProfile({
        name: formData.name,
        fullName: formData.name,
        phone: formData.phone,
        phoneNumber: formData.phone,
        address: formData.address
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(`Update failed: ${err.message || 'Error updating profile'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Citizen Profile"
        description="Manage your registered contact information and neighborhood zone for municipal notifications."
        tag="Verified Resident"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="gov-card p-6 text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'}
              alt={currentUser?.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20 mx-auto"
            />
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900" title="Aadhaar Verified">
              <Check className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentUser?.name || 'Aarav Sharma'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Citizen ID: {currentUser?.id || 'CIT001'}</p>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <Shield className="w-3 h-3" /> Citizen Resident
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Grievances:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{myComplaints.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Zone / Locality:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">East Bengaluru</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-semibold text-emerald-600">Active &amp; Verified</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 gov-card p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal &amp; Contact Details
          </h3>

          {saved && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profile information successfully saved to local storage!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                icon={User}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Registered Mobile Number"
                icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <Input
              label="Email Address"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Primary Residential Address"
              icon={MapPin}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <Input
              label="Designated Municipal Ward"
              value={formData.ward}
              onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              required
            />

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" variant="primary" icon={Save}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfile;

