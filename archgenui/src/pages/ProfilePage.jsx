// src/pages/ProfilePage.jsx — Professional white profile page
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const PROFESSIONAL_OPTIONS = [
  'Architect', 'Interior Designer', 'Civil Engineer', 'Structural Engineer',
  'Real Estate Developer', 'Construction Manager', 'Student', 'Hobbyist', 'Other',
];

export default function ProfilePage() {
  const { user, userData, updateUserProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: userData?.fullName || '',
    username: userData?.username || '',
    mobile: userData?.mobile || '',
    professionalInfo: userData?.professionalInfo || '',
    company: userData?.company || '',
    country: userData?.country || '',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateUserProfile(form);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: userData?.fullName || '',
      username: userData?.username || '',
      mobile: userData?.mobile || '',
      professionalInfo: userData?.professionalInfo || '',
      company: userData?.company || '',
      country: userData?.country || '',
    });
    setEditing(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateUserProfile({ avatar: reader.result });
        setMessage({ type: 'success', text: 'Avatar updated!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch {
        setMessage({ type: 'error', text: 'Failed to update avatar' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await changePassword(passwordForm.newPassword);
      setShowPasswordForm(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password. You may need to re-login first.' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const avatarSrc = userData?.avatar || '';
  const initials = (userData?.fullName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="pf-page">

      {/* ── Banner ── */}
      <div className="pf-banner">
        <div className="pf-banner__grid" aria-hidden="true" />
      </div>

      {/* ── Main content ── */}
      <div className="pf-body">
        <div className="pf-container">

          {/* ── Avatar + Name Card (overlaps banner) ── */}
          <div className="pf-card pf-hero-card">
            <div className="pf-hero-card__top">
              <div className="pf-hero-card__left">
                <div className="pf-avatar" onClick={() => fileInputRef.current?.click()}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" />
                  ) : (
                    <span className="pf-avatar__initials">{initials}</span>
                  )}
                  <div className="pf-avatar__overlay">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 1.5l3.5 3.5M1 11.5V15h3.5L13 6.5 9.5 3 1 11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />

                <div className="pf-hero-card__info">
                  <h1 className="pf-name">{userData?.fullName || 'User'}</h1>
                  <p className="pf-email">{user?.email}</p>
                  {userData?.professionalInfo && (
                    <span className="pf-badge">{userData.professionalInfo}</span>
                  )}
                </div>
              </div>

              <div className="pf-hero-card__actions">
                {!editing ? (
                  <button className="pf-btn pf-btn--primary" onClick={() => setEditing(true)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 1.5l3.5 3.5M1 11.5V15h3.5L13 6.5 9.5 3 1 11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pf-btn pf-btn--primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="pf-btn pf-btn--secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Status Messages ── */}
          {message.text && (
            <div className={`pf-alert pf-alert--${message.type}`}>
              {message.type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>
              )}
              {message.text}
            </div>
          )}

          {/* ── Personal Information ── */}
          <div className="pf-card">
            <div className="pf-card__header">
              <h2 className="pf-card__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Personal Information
              </h2>
            </div>
            <div className="pf-fields">
              <div className="pf-field">
                <label>Full Name</label>
                {editing ? (
                  <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
                ) : (
                  <span>{userData?.fullName || '—'}</span>
                )}
              </div>
              <div className="pf-field">
                <label>Email</label>
                <span className="pf-field--readonly">{user?.email}</span>
              </div>
              <div className="pf-field">
                <label>Username</label>
                {editing ? (
                  <input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" />
                ) : (
                  <span>{userData?.username || '—'}</span>
                )}
              </div>
              <div className="pf-field">
                <label>Mobile</label>
                {editing ? (
                  <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
                ) : (
                  <span>{userData?.mobile || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Professional Information ── */}
          <div className="pf-card">
            <div className="pf-card__header">
              <h2 className="pf-card__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                Professional Information
              </h2>
            </div>
            <div className="pf-fields">
              <div className="pf-field">
                <label>Role</label>
                {editing ? (
                  <select name="professionalInfo" value={form.professionalInfo} onChange={handleChange}>
                    <option value="">Select role</option>
                    {PROFESSIONAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <span>{userData?.professionalInfo || '—'}</span>
                )}
              </div>
              <div className="pf-field">
                <label>Company / Organization</label>
                {editing ? (
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Your company name" />
                ) : (
                  <span>{userData?.company || '—'}</span>
                )}
              </div>
              <div className="pf-field">
                <label>Country</label>
                {editing ? (
                  <input name="country" value={form.country} onChange={handleChange} placeholder="India" />
                ) : (
                  <span>{userData?.country || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Account Settings ── */}
          <div className="pf-card">
            <div className="pf-card__header">
              <h2 className="pf-card__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Account Settings
              </h2>
            </div>

            {!showPasswordForm ? (
              <div className="pf-settings-actions">
                <button className="pf-btn pf-btn--secondary" onClick={() => setShowPasswordForm(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Change Password
                </button>
                <button className="pf-btn pf-btn--danger" onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Logout
                </button>
              </div>
            ) : (
              <form className="pf-password-form" onSubmit={handleChangePassword}>
                <div className="pf-fields" style={{ maxWidth: 400 }}>
                  <div className="pf-field">
                    <label>New Password</label>
                    <input type="password" value={passwordForm.newPassword} placeholder="Min 6 characters"
                      onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} required />
                  </div>
                  <div className="pf-field">
                    <label>Confirm New Password</label>
                    <input type="password" value={passwordForm.confirmPassword} placeholder="Re-enter password"
                      onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="submit" className="pf-btn pf-btn--primary">Update Password</button>
                  <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* ── Member Since ── */}
          <p className="pf-footer-info">
            Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </p>

        </div>
      </div>

      <Footer />
    </div>
  );
}
