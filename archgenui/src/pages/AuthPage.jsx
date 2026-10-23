// src/pages/AuthPage.jsx — Full-page Login/Registration with white professional UI
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PROFESSIONAL_OPTIONS = [
  'Architect',
  'Interior Designer',
  'Civil Engineer',
  'Structural Engineer',
  'Real Estate Developer',
  'Construction Manager',
  'Student',
  'Hobbyist',
  'Other',
];

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { user, login, register, loginWithGoogle, resetPassword } = useAuth();

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [regForm, setRegForm] = useState({
    fullName: '', email: '', username: '', mobile: '',
    password: '', confirmPassword: '', professionalInfo: '',
    company: '', country: '',
  });

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email.trim(), loginForm.password);
      navigate('/');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes or reset your password.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact support.');
      } else {
        setError(err.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '') || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: regForm.email,
        password: regForm.password,
        fullName: regForm.fullName,
        username: regForm.username,
        mobile: regForm.mobile,
        professionalInfo: regForm.professionalInfo,
        company: regForm.company,
        country: regForm.country,
      });
      navigate('/');
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '') || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginForm.email?.trim();
    if (!email) {
      setError('Please enter your email address in the email field first');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
      setTimeout(() => setResetSent(false), 8000);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes before trying again');
      } else {
        setError(err.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '') || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialPlaceholder = (platform) => {
    setError(`${platform} login coming soon!`);
    setTimeout(() => setError(''), 3000);
  };

  return (
    <div className="auth-page-v2">
      {/* Left: Branding Panel */}
      <div className="auth-brand-v2">
        <div className="auth-brand-v2__inner">
          {/* Blueprint grid decoration */}
          <div className="auth-brand-v2__grid" aria-hidden="true" />

          <div className="auth-brand-v2__content">
            <h1 className="auth-brand-v2__title">ArchGen 3D</h1>
            <p className="auth-brand-v2__tagline">
              Transform any floor plan into an immersive 3D experience — instantly.
            </p>
            <div className="auth-brand-v2__features">
              <div className="auth-brand-v2__feature">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>97% wall-detection accuracy</span>
              </div>
              <div className="auth-brand-v2__feature">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>AR & VR immersive viewing</span>
              </div>
              <div className="auth-brand-v2__feature">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>No CAD experience needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="auth-form-panel-v2">
        <div className="auth-form-wrapper-v2">

          {/* Tab Switcher */}
          <div className="auth-tabs-v2">
            <button className={`auth-tab-v2 ${!isRegister ? 'auth-tab-v2--active' : ''}`} onClick={() => { setIsRegister(false); setError(''); }}>
              Login
            </button>
            <button className={`auth-tab-v2 ${isRegister ? 'auth-tab-v2--active' : ''}`} onClick={() => { setIsRegister(true); setError(''); }}>
              Register
            </button>
          </div>

          {error && <div className="auth-msg auth-msg--error">{error}</div>}
          {resetSent && <div className="auth-msg auth-msg--success">Password reset email sent! Check your inbox and <strong>spam/junk folder</strong> (from: ArchGen3D@archgen-3d.firebaseapp.com).</div>}

          {/* ===== LOGIN FORM ===== */}
          {!isRegister && (
            <form onSubmit={handleLogin} className="auth-form-v2">
              <div className="contact-form-group">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" type="email" placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="contact-form-group">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div className="auth-forgot-v2">
                <button type="button" onClick={handleForgotPassword} className="auth-forgot-v2__link">
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="auth-submit-v2" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <div className="auth-divider-v2"><span>or continue with</span></div>
              <div className="auth-social-row-v2">
                <button type="button" onClick={handleGoogleLogin} className="auth-social-btn-v2">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button type="button" onClick={() => handleSocialPlaceholder('GitHub')} className="auth-social-btn-v2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  GitHub
                </button>
              </div>
            </form>
          )}

          {/* ===== REGISTER FORM ===== */}
          {isRegister && (
            <form onSubmit={handleRegister} className="auth-form-v2">
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="reg-fullname">Full Name *</label>
                  <input id="reg-fullname" type="text" placeholder="John Doe"
                    value={regForm.fullName} onChange={(e) => setRegForm(p => ({ ...p, fullName: e.target.value }))} required />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="reg-username">Username *</label>
                  <input id="reg-username" type="text" placeholder="johndoe"
                    value={regForm.username} onChange={(e) => setRegForm(p => ({ ...p, username: e.target.value }))} required />
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="reg-email">Email *</label>
                <input id="reg-email" type="email" placeholder="john@example.com"
                  value={regForm.email} onChange={(e) => setRegForm(p => ({ ...p, email: e.target.value }))} required />
              </div>

              <div className="contact-form-group">
                <label htmlFor="reg-mobile">Mobile Number *</label>
                <input id="reg-mobile" type="tel" placeholder="+91 98765 43210"
                  value={regForm.mobile} onChange={(e) => setRegForm(p => ({ ...p, mobile: e.target.value }))} required />
              </div>

              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="reg-password">Password *</label>
                  <input id="reg-password" type="password" placeholder="Min 6 characters"
                    value={regForm.password} onChange={(e) => setRegForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="reg-confirm">Confirm Password *</label>
                  <input id="reg-confirm" type="password" placeholder="Re-enter password"
                    value={regForm.confirmPassword} onChange={(e) => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="reg-professional">Professional Info *</label>
                <select id="reg-professional" value={regForm.professionalInfo}
                  onChange={(e) => setRegForm(p => ({ ...p, professionalInfo: e.target.value }))} required>
                  <option value="" disabled>Select your role</option>
                  {PROFESSIONAL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="reg-company">Company</label>
                  <input id="reg-company" type="text" placeholder="Optional"
                    value={regForm.company} onChange={(e) => setRegForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="reg-country">Country</label>
                  <input id="reg-country" type="text" placeholder="India"
                    value={regForm.country} onChange={(e) => setRegForm(p => ({ ...p, country: e.target.value }))} />
                </div>
              </div>

              <button type="submit" className="auth-submit-v2" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="auth-divider-v2"><span>or register with</span></div>
              <div className="auth-social-row-v2">
                <button type="button" onClick={handleGoogleLogin} className="auth-social-btn-v2">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button type="button" onClick={() => handleSocialPlaceholder('GitHub')} className="auth-social-btn-v2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  GitHub
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
