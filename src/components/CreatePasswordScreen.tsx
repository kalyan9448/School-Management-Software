import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../contexts/AuthContext';
import { GraduationCap, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreatePasswordScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { createPassword, user } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Email passed from login screen state
    const email = location.state?.email;

    if (!email) {
        // If somehow accessed directly without email state, go to login
        navigate('/login');
        return null;
    }

    const validations = {
        length: password.length >= 8,
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        match: password !== '' && password === confirmPassword
    };

    const isFormValid = Object.values(validations).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setError('');
        setLoading(true);

        try {
            const success = await createPassword(email, password);
            if (success) {
                // Find user role, it might be undefined immediately if state hasn't caught up,
                // but createPassword returns success so we know it worked.
                // Get the updated user state after creation, or default to admin
                const finalRole = user?.role || 'admin';
                navigate(getRoleDashboardPath(finalRole), { replace: true });
            } else {
                setError('Failed to create password. Please try again or contact support.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during password creation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* App Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 backdrop-blur-sm">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome to Kidz Vision</h2>
                    <p className="text-purple-200">Set up your account password to get started</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6 p-4 bg-purple-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Setting password for</p>
                                <p className="font-semibold text-gray-900">{email}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Create Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>

                            {/* Password Requirements Map */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                                    Password requirements
                                </p>
                                <Requirement satisfied={validations.length} text="At least 8 characters long" />
                                <Requirement satisfied={validations.number} text="Contains at least one number" />
                                <Requirement satisfied={validations.special} text="Contains a special character" />
                                <Requirement satisfied={validations.match} text="Passwords match" />
                            </div>

                            <button
                                type="submit"
                                disabled={!isFormValid || loading}
                                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${isFormValid && !loading
                                    ? 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                                    : 'bg-purple-300 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? 'Saving...' : 'Create Password & Login'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Requirement = ({ satisfied, text }: { satisfied: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className={`w-4 h-4 ${satisfied ? 'text-green-500' : 'text-gray-300'}`} />
        <span className={satisfied ? 'text-gray-900' : 'text-gray-500'}>{text}</span>
    </div>
);
