import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../contexts/AuthContext';
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
import logoImage from '../assets/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'password' | 'create-password';

// ─── Component ────────────────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const { checkEmail, login, createPassword } = useAuth();

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
      if (success) {
        // createPassword auto-logs the user in; look up role to navigate
        const allUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
        const found = allUsers.find((u: any) => u.email === email);
        const role = found?.role || 'admin';
        navigate(getRoleDashboardPath(role), { replace: true });
      } else {
        setError('Failed to create password. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    }

    setLoading(false);
  };

  // ── Demo accounts list ─────────────────────────────────────────────────────
  const demoAccounts: { email: string; role: string }[] = [
    { email: 'superadmin@platform.com', role: 'Super Admin' },
    { email: 'admin@school.com', role: 'School Admin' },
    { email: 'teacher@school.com', role: 'Teacher' },
    { email: 'accountant@school.com', role: 'Accountant' },
    { email: 'parent@school.com', role: 'Parent' },
  ];

  // Demo accounts — skip email step, jump straight to password (all are returning users)
  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setConfirmPassword('');
    setError('');
    setStep('password'); // bypass Step 1 — demo accounts never need first-time password creation
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
              <StepDot active={step === 'email'} done={step !== 'email'} label="Email" />
              <div className="flex-1 h-px bg-gray-200" />
              <StepDot
                active={step === 'password' || step === 'create-password'}
                done={false}
                label={step === 'create-password' ? 'Create Password' : 'Password'}
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

                <div className="flex items-center justify-end">
                  <a href="#" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                    Forgot password?
                  </a>
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

            {/* ── Demo Accounts ── */}
            {step === 'email' && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-3 uppercase tracking-wide font-medium">
                  Demo Accounts — click to login instantly
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => fillDemo(a.email)}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 rounded-lg transition-colors text-left group"
                    >
                      <span className="text-xs text-gray-700 group-hover:text-gray-900">{a.email}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadge(a.role)}`}>
                        {a.role}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Password: <strong>demo123</strong></p>
              </div>
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