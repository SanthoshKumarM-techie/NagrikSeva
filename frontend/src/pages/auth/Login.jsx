import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, KeyRound, User, AlertCircle, UserPlus, Sparkles, Mail, Phone, MapPin, Briefcase, ArrowLeft, Building2, Wrench, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_CREDENTIALS, ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ThemeToggle from '../../components/layout/ThemeToggle';
import lookupsApi from '../../api/lookups.api';

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get('portal'); // 'citizen' | 'worker' | 'officer' | 'admin'

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine active portal context
  const activePortal = portalParam || 'citizen';

  // Login form state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState(activePortal === 'worker' ? 'FIELD_WORKER' : 'CITIZEN');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDeptId, setRegDeptId] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('Roads & Pothole Repair');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (activePortal === 'worker') {
      setRegRole('FIELD_WORKER');
    } else {
      setRegRole('CITIZEN');
    }
  }, [activePortal]);

  useEffect(() => {
    lookupsApi.getDepartments()
      .then(res => {
        if (Array.isArray(res)) setDepartments(res);
      })
      .catch(() => {});
  }, []);

  const getPortalInfo = () => {
    switch (activePortal) {
      case 'worker':
        return {
          title: 'Field Worker Operations Gate',
          subtitle: 'Maintenance specialist & contractor portal',
          icon: Wrench,
          color: 'amber',
          allowRegister: true,
          expectedRole: ROLES.WORKER
        };
      case 'officer':
        return {
          title: 'Department Officer Gate',
          subtitle: 'Municipal engineering & complaint assignment desk',
          icon: Building2,
          color: 'purple',
          allowRegister: false,
          expectedRole: ROLES.OFFICER
        };
      case 'admin':
        return {
          title: 'Supervisor Administration Gate',
          subtitle: 'Municipal governance, transfer approvals & oversight',
          icon: Shield,
          color: 'rose',
          allowRegister: false,
          expectedRole: ROLES.ADMIN
        };
      case 'citizen':
      default:
        return {
          title: 'Citizen Grievance Gate',
          subtitle: 'Public civic complaint filing & resolution tracking',
          icon: User,
          color: 'blue',
          allowRegister: true,
          expectedRole: ROLES.CITIZEN
        };
    }
  };

  const portalInfo = getPortalInfo();
  const PortalIcon = portalInfo.icon;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Please provide both User ID / Email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await login(userId, password);
      setLoading(false);

      if (res.success) {
        const targetRole = res.user.role;
        // Verify role belongs to gate or redirect appropriately
        if (targetRole === ROLES.CITIZEN) navigate('/citizen');
        else if (targetRole === ROLES.OFFICER) navigate('/officer');
        else if (targetRole === ROLES.WORKER) navigate('/worker');
        else if (targetRole === ROLES.ADMIN) navigate('/admin');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setError('Full Name, Email, and Password are required.');
      return;
    }

    if (regRole === 'FIELD_WORKER' && !regDeptId) {
      setError('Please select a department for the field worker profile.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await register({
        role: regRole,
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phoneNumber: regPhone.trim() || undefined,
        password: regPassword,
        address: regAddress.trim() || undefined,
        departmentId: regRole === 'FIELD_WORKER' ? regDeptId : undefined,
        specialization: regRole === 'FIELD_WORKER' ? regSpecialization : undefined
      });

      setLoading(false);

      if (res.success) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (regRole === 'CITIZEN') navigate('/citizen');
          else navigate('/worker');
        }, 600);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top bar with back to portals and logo */}
      <div className="flex items-center justify-between p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Switch Municipal Gate
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
              <PortalIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {portalInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {portalInfo.subtitle}
            </p>
          </div>

          {/* Form Card */}
          <div className="gov-card p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-md">
            {/* Mode Tabs if registration is allowed for this gate */}
            {portalInfo.allowRegister && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                    mode === 'login'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                    mode === 'register'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Email or Official ID"
                  id="userId"
                  icon={User}
                  placeholder="e.g. your email or User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  id="password"
                  type="password"
                  icon={KeyRound}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  icon={LogIn}
                  className="w-full mt-2"
                >
                  Sign In to {portalInfo.expectedRole} Desk
                </Button>

                {!portalInfo.allowRegister && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    Staff & Department Officer accounts are centrally provisioned by the Central Supervisor Admin.
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <Input
                  label="Full Name"
                  icon={User}
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  placeholder="name@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  icon={Phone}
                  placeholder="+91 98450 12345"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  icon={KeyRound}
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />

                {regRole === 'CITIZEN' ? (
                  <Input
                    label="Residential Address / Ward"
                    icon={MapPin}
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                  />
                ) : (
                  <>
                    <Select
                      label="Assigned Maintenance Department"
                      value={regDeptId}
                      onChange={(e) => setRegDeptId(e.target.value)}
                      options={[
                        { value: '', label: '-- Select Department Wing --' },
                        ...departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))
                      ]}
                      required
                    />

                    <Input
                      label="Trade Specialization / Skills"
                      icon={Briefcase}
                      placeholder="e.g. Asphalt Paving, Water Pipeline, Electrical"
                      value={regSpecialization}
                      onChange={(e) => setRegSpecialization(e.target.value)}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  icon={UserPlus}
                  className="w-full mt-3"
                >
                  Create & Launch Dashboard
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Digital Citizen Services &mdash; Ministry of Municipal Administration
      </div>
    </div>
  );
};

export default Login;



