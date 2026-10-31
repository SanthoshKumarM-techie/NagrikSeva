import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, KeyRound, User, AlertCircle, UserPlus, Mail, Phone, MapPin, Briefcase, ArrowLeft, Building2, Wrench, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { checkRoleMatchesExpected } from '../../utils/userHelpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ThemeToggle from '../../components/layout/ThemeToggle';
import lookupsApi from '../../api/lookups.api';

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get('portal'); // 'citizen' | 'worker' | 'officer' | 'admin'

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine active portal context
  const activePortal = portalParam || 'citizen';

  // Form interaction guard: keeps inputs readOnly while untouched to block automated browser autofill
  // Unlocks immediately when user moves mouse over the form, focuses, clicks, or touches it
  const [isFormInteractive, setIsFormInteractive] = useState(false);
  const formRef = useRef(null);

  const enableInteraction = () => {
    setIsFormInteractive(true);
  };

  // Login form state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regRole, setRegRole] = useState(activePortal === 'worker' ? 'FIELD_WORKER' : 'CITIZEN');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAddress, setRegAddress] = useState('');
  const [regDeptId, setRegDeptId] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('Roads & Pothole Repair');
  const [departments, setDepartments] = useState([]);

  // Clean reset functions - ensures credentials never persist across roles or gates
  const clearCredentials = () => {
    setUserId('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setSuccessMsg('');
    setIsFormInteractive(false);
  };

  const clearRegisterFields = () => {
    setRegFullName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setShowRegPassword(false);
    setRegAddress('');
    setRegDeptId('');
    setError('');
    setSuccessMsg('');
    setIsFormInteractive(false);
  };

  // Clear inputs and suppress background autofill whenever the user switches roles or gates
  useEffect(() => {
    clearCredentials();
    clearRegisterFields();
    setIsFormInteractive(false);

    if (formRef.current) {
      try {
        formRef.current.reset();
      } catch (_) {}
    }

    if (activePortal === 'worker') {
      setRegRole('FIELD_WORKER');
    } else {
      setRegRole('CITIZEN');
    }
  }, [activePortal, location.search]);

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
          title: 'Contractor & Crew Operations Gate',
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
      const res = await login(userId, password, activePortal);
      setLoading(false);

      if (res.success) {
        const userRole = res.user.role;
        const userRawRole = res.user.rawRole;

        // Categorize role access: strictly reject if user role does not match this specific gate
        const isRoleValid = checkRoleMatchesExpected(userRole, userRawRole, activePortal);
        if (!isRoleValid) {
          setError(
            `Role Access Denied: This portal only accepts ${portalInfo.expectedRole} credentials. Your account is categorized under '${userRole}'.`
          );
          return;
        }

        // Navigate to the verified dashboard
        if (userRole === ROLES.CITIZEN) navigate('/citizen');
        else if (userRole === ROLES.OFFICER) navigate('/officer');
        else if (userRole === ROLES.WORKER) navigate('/worker');
        else if (userRole === ROLES.ADMIN) navigate('/admin');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please verify credentials.');
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
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/"
            onClick={() => {
              clearCredentials();
              clearRegisterFields();
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  NagrikSeva
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Gov-Tech Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Digital Citizen Grievance & Municipal Resolution Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={() => {
                clearCredentials();
                clearRegisterFields();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch Municipal Gate</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>
      </header>

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
          <div
            className="gov-card p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-md"
            onMouseEnter={enableInteraction}
            onTouchStart={enableInteraction}
          >
            {/* Mode Tabs if registration is allowed for this gate */}
            {portalInfo.allowRegister && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearCredentials();
                  }}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    clearRegisterFields();
                  }}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
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
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span>{error}</span>
                  {(error.includes('Access Denied') || error.includes('Role') || error.includes('categorized') || error.includes('gate') || error.includes('portal')) && (
                    <div className="pt-1">
                      <Link
                        to="/"
                        onClick={() => {
                          clearCredentials();
                          clearRegisterFields();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-200 underline hover:no-underline"
                      >
                        Switch to another Municipal Gate &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form
                key={`login-form-${activePortal}`}
                ref={formRef}
                name={`login_${activePortal}_form`}
                onSubmit={handleLoginSubmit}
                onMouseEnter={enableInteraction}
                onTouchStart={enableInteraction}
                className="space-y-4"
              >
                <Input
                  label="Email or Official ID"
                  id={`${activePortal}_username`}
                  name={`${activePortal}_username`}
                  icon={User}
                  placeholder="e.g. your email or User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="username"
                  required
                />

                <Input
                  label="Password"
                  id={`${activePortal}_password`}
                  name={`${activePortal}_password`}
                  type="password"
                  icon={KeyRound}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isPasswordVisible={showPassword}
                  onTogglePasswordVisibility={setShowPassword}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between text-xs -mt-1 mb-1">
                  <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Show password</span>
                  </label>
                </div>

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
              <form
                key={`register-form-${activePortal}`}
                name={`register_${activePortal}_form`}
                onSubmit={handleRegisterSubmit}
                onMouseEnter={enableInteraction}
                onTouchStart={enableInteraction}
                className="space-y-3"
              >
                <Input
                  label="Full Name"
                  id={`regFullName-${activePortal}`}
                  name={`${activePortal}_fullname`}
                  icon={User}
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="name"
                  required
                />

                <Input
                  label="Email Address"
                  id={`regEmail-${activePortal}`}
                  name={`${activePortal}_reg_email`}
                  type="email"
                  icon={Mail}
                  placeholder="name@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Phone Number"
                  id={`regPhone-${activePortal}`}
                  name={`${activePortal}_phone`}
                  type="tel"
                  icon={Phone}
                  placeholder="+91 98450 12345"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="tel"
                />

                <Input
                  label="Password"
                  id={`regPassword-${activePortal}`}
                  name={`${activePortal}_reg_password`}
                  type="password"
                  icon={KeyRound}
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  isPasswordVisible={showRegPassword}
                  onTogglePasswordVisibility={setShowRegPassword}
                  readOnly={!isFormInteractive}
                  onFocus={enableInteraction}
                  onMouseDown={enableInteraction}
                  onMouseEnter={enableInteraction}
                  onTouchStart={enableInteraction}
                  autoComplete="new-password"
                  required
                />

                <div className="flex items-center justify-between text-xs -mt-1 mb-1">
                  <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Show password</span>
                  </label>
                </div>

                {regRole === 'CITIZEN' ? (
                  <Input
                    label="Residential Address / Ward"
                    id={`regAddress-${activePortal}`}
                    name={`${activePortal}_address`}
                    icon={MapPin}
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    autoComplete="street-address"
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
                      id={`regSpecialization-${activePortal}`}
                      name={`${activePortal}_specialization`}
                      icon={Briefcase}
                      placeholder="e.g. Asphalt Paving, Water Pipeline, Electrical"
                      value={regSpecialization}
                      onChange={(e) => setRegSpecialization(e.target.value)}
                      autoComplete="off"
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
