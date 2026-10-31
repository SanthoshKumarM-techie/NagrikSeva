import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, KeyRound, User, AlertCircle, UserPlus, Sparkles, Mail, Phone, MapPin, Briefcase, ArrowLeft, Building2, Wrench, Shield, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_CREDENTIALS, ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ThemeToggle from '../../components/layout/ThemeToggle';
import LanguageSelector from '../../components/layout/LanguageSelector';
import lookupsApi from '../../api/lookups.api';

export const Login = () => {
  const { login, register, requestPasswordResetOtp, resetPasswordWithOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get('portal'); // 'citizen' | 'worker' | 'officer' | 'admin'

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset'
  const [forgotId, setForgotId] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotId.trim()) {
      setError('Please provide your Email or Official User ID.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await requestPasswordResetOtp(forgotId.trim());
      setLoading(false);
      if (res.success) {
        setForgotMaskedEmail(res.data?.maskedEmail || 'your email');
        setForgotStep('reset');
        setResendCooldown(60);
        setSuccessMsg(res.data?.message || 'Verification OTP dispatched to your email.');
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Failed to dispatch verification code.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await resetPasswordWithOtp({
        identifier: forgotId.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPass
      });
      setLoading(false);

      if (res.success) {
        setSuccessMsg('Password updated successfully! Please sign in with your new password.');
        setUserId(forgotId.trim());
        setPassword('');
        setForgotOtp('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setMode('login');
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Failed to reset password.');
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
        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <ThemeToggle />
        </div>
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
            {/* Mode Tabs if registration is allowed for this gate and not in forgot password mode */}
            {mode !== 'forgot' && portalInfo.allowRegister && (
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

            {mode === 'forgot' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      OTP
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        Self-Service Password Recovery
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {forgotStep === 'request' ? 'Step 1 of 2: Dispatch OTP to Registered Mail' : 'Step 2 of 2: Enter OTP & Set New Password'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  >
                    Back to Sign In
                  </button>
                </div>

                {forgotStep === 'request' ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Enter your registered <strong>Email Address</strong> or official <strong>User ID</strong> (e.g. <code>OFF001</code>, <code>WRK001</code>, <code>CIT001</code>). Department officers, field staff, and citizens can reset their password independently.
                    </p>

                    <Input
                      label="Email or Official ID"
                      id="forgotId"
                      icon={User}
                      placeholder="e.g. name@bbmp.gov.in or OFF001"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={loading}
                      icon={Mail}
                      className="w-full mt-2"
                    >
                      Send OTP to Registered Mail
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                      Verification code dispatched to <strong>{forgotMaskedEmail}</strong>. Valid for 10 minutes.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        6-Digit Verification Code (OTP)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <div className="flex items-center justify-between text-[11px] mt-1.5 px-0.5">
                        <span className="text-slate-500">Didn't receive the code?</span>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || loading}
                          onClick={() => handleRequestOtp()}
                          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>

                    <Input
                      label="New Password"
                      id="forgotNewPass"
                      type="password"
                      icon={Lock}
                      placeholder="Minimum 6 characters"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      id="forgotConfirmPass"
                      type="password"
                      icon={KeyRound}
                      placeholder="Re-enter your new password"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={loading}
                      icon={CheckCircle2}
                      className="w-full mt-3"
                    >
                      Confirm & Update Password
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : mode === 'login' ? (
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

                <div>
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
                  <div className="flex items-center justify-between text-xs pt-1.5 px-0.5">
                    <span className="text-slate-400">Can't remember password?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                        setSuccessMsg('');
                        setForgotStep('request');
                        setForgotId(userId || '');
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
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
                    Staff & Department Officer accounts can update their password independently using Mail OTP.
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



