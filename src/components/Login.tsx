import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import logoImage from '../assets/logo.jpeg';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'password' | 'create-password' | 'forgot-password' | 'reset-password';

// ─── Component ────────────────────────────────────────────────────────────────
export function Login() {
  const { checkEmail, login, createPassword, resetPassword, requestPasswordReset } = useAuth();

  // Step state
  const [step, setStep] = useState<Step>('email');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Password strength for create-password step ─────────────────────────────
  const validations = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password !== '' && password === confirmPassword,
  };
  const isPasswordValid = Object.values(validations).every(Boolean);

  // ── Step 1: Check email ────────────────────────────────────────────────────
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await checkEmail(email);

    if (!result.exists) {
      setError(result.error || 'No account found for this email address.');
      setLoading(false);
      return;
    }

    if (result.isFirstLogin) {
      setStep('create-password');
    } else {
      setStep('password');
    }

    setLoading(false);
  };

  // ── Step 2a: Normal login ──────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const response = await login(email, password);

    if (response.requiresPasswordCreation) {
      setStep('create-password');
    } else if (!response.success) {
      setError(response.error || 'Incorrect password. Please try again.');
    }

    setLoading(false);
  };

  // ── Step 2b: First-time password creation ─────────────────────────────────
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setError('');
    setLoading(true);

    try {
      const success = await createPassword(email, password);
      if (!success) {
        setError('Failed to create password. Please try again.');
      }
      // On success, onAuthStateChanged fires → sets user in context → LoginPage redirects
    } catch {
      setError('An unexpected error occurred.');
    }

    setLoading(false);
  };

  // ── Step 3a: Forgot password (request reset) ──────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await checkEmail(email);
    if (!result.exists) {
      setError('Account not found.');
      setLoading(false);
      return;
    }

    // Send Firebase password reset email
    const sent = await requestPasswordReset(email);
    if (sent) {
      setStep('reset-password');
    } else {
      setError('Failed to send reset email. Please try again.');
    }
    setLoading(false);
  };

  // ── Step 3b: Reset password (submit new) ──────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setError('');
    setLoading(true);

    try {
      const success = await resetPassword(email, password);
      if (!success) {
        setError('Failed to reset password. Please try again.');
      }
      // On success, onAuthStateChanged keeps user in context → LoginPage redirects
    } catch {
      setError('An unexpected error occurred.');
    }

    setLoading(false);
  };



  // ── Helpers ────────────────────────────────────────────────────────────────
  const goBack = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-purple-500 via-purple-600 to-amber-400" />

          <div className="p-8">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <img src={logoImage} alt="Kidz Vision Logo" className="w-20 h-20 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-gray-900">Kidz Vision School of Education</h1>
              <p className="text-gray-500 text-sm mt-1">School Management System</p>
            </div>

            {/* ── Step indicator ── */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={step === 'email' || step === 'forgot-password'} done={step !== 'email' && step !== 'forgot-password'} label="Email" />
              <div className="flex-1 h-px bg-gray-200" />
              <StepDot
                active={step === 'password' || step === 'create-password' || step === 'reset-password'}
                done={false}
                label={step === 'create-password' || step === 'reset-password' ? 'Set Password' : 'Password'}
              />
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 1 — Email
            ════════════════════════════════════════════ */}
            {step === 'email' && (
              <form onSubmit={handleEmailContinue} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════════
                STEP 2a — Password (returning user)
            ════════════════════════════════════════════ */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                {/* Locked email display */}
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-800 flex-1">{email}</span>
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setPassword(''); setConfirmPassword(''); setError(''); setStep('create-password'); }}
                    className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                  >
                    First time? Set up password
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep('forgot-password')}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════════
                STEP 2b — Create Password (first-time login)
            ════════════════════════════════════════════ */}
            {step === 'create-password' && (
              <form onSubmit={handleCreatePassword} className="space-y-5">
                {/* Info banner */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <p className="font-medium mb-0.5">👋 Welcome! First-time login detected.</p>
                  <p className="text-xs text-amber-700">Please create a password for your account to continue.</p>
                </div>

                {/* Locked email display */}
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-800">{email}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      placeholder="Create a strong password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <Req ok={validations.length} text="At least 8 characters" />
                  <Req ok={validations.number} text="Contains a number" />
                  <Req ok={validations.special} text="Contains a special character" />
                  <Req ok={validations.match} text="Passwords match" />
                </div>

                <button
                  type="submit"
                  disabled={!isPasswordValid || loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Create Password & Sign In'}
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════════
                STEP 3a — Forgot Password (Request)
            ════════════════════════════════════════════ */}
            {step === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-900">
                  <p className="font-medium mb-0.5">Password Recovery</p>
                  <p className="text-xs text-purple-700 opacity-80">We'll send a password recovery code to your registered email address.</p>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Recovery Code'}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════════
                STEP 3b — Reset Password (Submit)
            ════════════════════════════════════════════ */}
            {step === 'reset-password' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  <p className="font-medium mb-0.5">Recovery Email Sent!</p>
                  <p className="text-xs text-green-700">Check your inbox for a password reset link from Firebase. You can also set a new password below if you're already signed in.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      placeholder="Enter new password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <Req ok={validations.length} text="At least 8 characters" />
                  <Req ok={validations.number} text="Contains a number" />
                  <Req ok={validations.special} text="Contains a special character" />
                  <Req ok={validations.match} text="Passwords match" />
                </div>

                <button
                  type="submit"
                  disabled={!isPasswordValid || loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password & Sign In'}
                </button>
              </form>
            )}


          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Kidz Vision School of Education · All rights reserved
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
          ${done ? 'bg-green-100 text-green-600 border-2 border-green-400' :
            active ? 'bg-purple-600 text-white shadow-md shadow-purple-300' :
              'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : active ? '●' : '○'}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-purple-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function Req({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
      <span className={ok ? 'text-gray-800' : 'text-gray-400'}>{text}</span>
    </div>
  );
}

// Returns a Tailwind color class set for the given role badge
function roleBadge(role: string): string {
  const map: Record<string, string> = {
    'Super Admin': 'bg-purple-100 text-purple-700',
    'School Admin': 'bg-blue-100 text-blue-700',
    'Teacher': 'bg-green-100 text-green-700',
    'Accountant': 'bg-amber-100 text-amber-700',
    'Parent': 'bg-pink-100 text-pink-700',
    'Student': 'bg-cyan-100 text-cyan-700',
  };
  return map[role] ?? 'bg-gray-100 text-gray-600';
}