'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store';

export default function ProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { profilePhoto, setProfilePhoto, loadProfilePhoto, addAuditLog, addNotification } = useAppStore();

  const syncImageToBackend = async (url: string | null) => {
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });
      await update({ image: url }); // Update NextAuth session across tabs
    } catch (err) {
      console.error('Failed to sync image', err);
    }
  };

  // Load this user's photo from persistent per-user localStorage key on mount
  useEffect(() => {
    if (user?.email) loadProfilePhoto(user.email);
  }, [user?.email]);

  const [formData, setFormData] = useState({
    name: user.name || '',
    companyName: user.companyName || '',
    role: user.role || '',
    industrySegment: user.industrySegment || '',
  });

  // Password State
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  
  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  
  // Danger Zone State
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Connected Accounts
  const [connectedGoogle, setConnectedGoogle] = useState(user.password === null); // if no password, they used google

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          
          setProfilePhoto(dataUrl, user?.email);
          syncImageToBackend(dataUrl);
          addAuditLog({ action: 'Profile Photo Updated', details: `Uploaded ${file.name}` });
          addNotification({ title: 'Profile Photo Updated', message: 'Your profile picture has been successfully changed.' });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const DEMO_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=7c5cfc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=00e5ff',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=ff4081',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=4caf50'
  ];

  const handleSelectDemoAvatar = (url: string) => {
    setProfilePhoto(url, user?.email);
    syncImageToBackend(url);
    addAuditLog({ action: 'Profile Photo Updated', details: 'Selected demo avatar' });
    addNotification({ title: 'Profile Photo Updated', message: 'Your profile picture has been successfully changed.' });
  };

  const handleRemoveAvatar = () => {
    setProfilePhoto(null, user?.email);
    syncImageToBackend(null);
    addAuditLog({ action: 'Profile Photo Removed', details: 'User removed their profile picture' });
    addNotification({ title: 'Profile Photo Removed', message: 'Your profile picture has been removed.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        addAuditLog({ action: 'Profile Updated', details: `Name: ${formData.name}, Role: ${formData.role}` });
        addNotification({ title: 'Profile Updated', message: 'Your personal information has been successfully saved.' });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValidPassword = (pwd: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(pwd);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) {
      addNotification({ title: 'Error', message: 'Passwords do not match.' });
      return;
    }
    if (!isValidPassword(pwdForm.newPwd)) {
      addNotification({ title: 'Error', message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
      return;
    }
    // Mock API call
    addAuditLog({ action: 'Password Changed', details: 'User updated their password via profile settings' });
    addNotification({ title: 'Password Updated', message: 'Your password has been successfully changed.' });
    setPwdForm({ current: '', newPwd: '', confirm: '' });
  };

  const handleEnable2FA = () => {
    setIs2FAEnabled(true);
    setShow2FASetup(false);
    addAuditLog({ action: '2FA Enabled', details: 'TOTP Two-Factor Authentication enrolled' });
    addNotification({ title: 'Security Updated', message: 'Two-Factor Authentication is now enabled.' });
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    addAuditLog({ action: '2FA Disabled', details: 'TOTP Two-Factor Authentication removed' });
    addNotification({ title: 'Security Updated', message: 'Two-Factor Authentication has been disabled.' });
  };

  const handleDisconnectGoogle = () => {
    if (!user.password) {
      addNotification({ title: 'Action Denied', message: 'You cannot disconnect your only login method. Set a password first.' });
      return;
    }
    setConnectedGoogle(false);
    addAuditLog({ action: 'OAuth Disconnected', details: 'Google account unlinked' });
    addNotification({ title: 'Account Unlinked', message: 'Google has been disconnected from your profile.' });
  };

  const handleDeleteAccount = () => {
    if (deleteEmailConfirm !== user.email) return;
    addAuditLog({ action: 'Account Deleted', details: `User initiated cascade deletion for ${user.email}` });
    addNotification({ title: 'Account Deleting', message: 'Initiating cascade data deletion...' });
    setTimeout(() => {
      window.location.href = '/login'; // simulate logout
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* 1. PERSONAL INFO */}
      <form onSubmit={handleSubmit} className="glass-card p-lg rounded-xl flex flex-col gap-lg">
        <h3 className="font-headline-sm text-on-surface border-b border-outline-variant/30 pb-4">Personal Information</h3>
        <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/30">
          <div className="relative w-24 h-24 rounded-full bg-surface-container-high border-2 border-outline-variant/50 flex items-center justify-center overflow-hidden group">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-50">person</span>
            )}
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <span className="material-symbols-outlined text-white">photo_camera</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div>
            <h3 className="font-headline-md text-on-surface mb-2">Profile Picture</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Upload a new avatar or select a demo character.</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button"
                onClick={handleRemoveAvatar}
                disabled={!profilePhoto}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 border border-outline-variant/30 flex items-center gap-1 mr-2"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Remove
              </button>
              
              <div className="w-px h-6 bg-outline-variant/30 mr-2"></div>
              
              {DEMO_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectDemoAvatar(url)}
                  className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-transform hover:scale-110 ${profilePhoto === url ? 'border-primary shadow-[0_0_10px_rgba(124,92,252,0.5)]' : 'border-outline-variant/50 hover:border-primary/50'}`}
                >
                  <img src={url} alt={`Demo Avatar ${i+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">EMAIL ADDRESS (IDENTITY)</label>
            <div className="relative">
              <input 
                type="text" 
                readOnly
                value={user.email}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg pl-md pr-xl py-sm text-on-surface-variant cursor-not-allowed"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-success text-[18px]">verified</span>
            </div>
            <button type="button" className="text-xs text-primary text-left mt-1 hover:underline w-fit">Change email address...</button>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">FULL NAME *</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">COMPANY NAME</label>
            <input 
              type="text" 
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">ROLE</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select a role...</option>
              <option value="Founder">Founder</option>
              <option value="Marketer">Marketer</option>
              <option value="Growth Lead">Growth Lead</option>
              <option value="Analyst">Analyst</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-xs md:col-span-2">
            <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">INDUSTRY SEGMENT *</label>
            <select
              required
              value={formData.industrySegment}
              onChange={(e) => setFormData({...formData, industrySegment: e.target.value})}
              className={`bg-surface-container-lowest border rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none ${!user.industrySegment ? 'border-primary shadow-[0_0_10px_rgba(124,92,252,0.2)]' : 'border-outline-variant/50'}`}
            >
              <option value="" disabled>Select your industry...</option>
              <option value="E-Commerce & Retail">E-Commerce & Retail</option>
              <option value="Travel & Hospitality">Travel & Hospitality</option>
              <option value="FinTech & Banking">FinTech & Banking</option>
              <option value="Healthcare & Wellness">Healthcare & Wellness</option>
              <option value="FMCG & Grocery">FMCG & Grocery</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-sm">
          <p className="text-body-md text-tertiary h-6">{success && "Profile updated successfully!"}</p>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-on-primary px-xl py-sm rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* 2. PASSWORD MANAGEMENT */}
      <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
        <h3 className="font-headline-sm text-on-surface border-b border-outline-variant/30 pb-4">Password</h3>
        {user.password ? (
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-md items-end">
            <div className="flex flex-col gap-xs">
              <label className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">Current Password</label>
              <input 
                type="password" 
                required
                value={pwdForm.current}
                onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">New Password</label>
              <input 
                type="password" 
                required
                value={pwdForm.newPwd}
                onChange={e => setPwdForm({...pwdForm, newPwd: e.target.value})}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">Confirm New</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  required
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  className="w-full min-w-0 bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-sm text-on-surface focus:border-primary outline-none flex-1"
                />
                <button type="submit" className="shrink-0 bg-surface-container-high text-on-surface px-4 py-sm rounded-lg hover:bg-primary hover:text-on-primary transition-colors text-sm font-bold">
                  Update
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-xs md:col-span-3">
              <p className="text-[10px] text-on-surface-variant px-1">Must be at least 8 chars, with uppercase, lowercase, number, and special char.</p>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-6 h-6" />
            <span className="text-on-surface-variant text-sm">Signed in via Google. You do not have a password set.</span>
          </div>
        )}
      </div>

      {/* 3. TWO-FACTOR AUTH */}
      <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
        <h3 className="font-headline-sm text-on-surface border-b border-outline-variant/30 pb-4">Two-Factor Authentication (2FA)</h3>
        <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${is2FAEnabled ? 'text-success' : 'text-on-surface-variant'}`}>
              {is2FAEnabled ? 'shield_locked' : 'gpp_bad'}
            </span>
            <div>
              <p className="font-bold text-on-surface">{is2FAEnabled ? '2FA is Enabled' : '2FA is Disabled'}</p>
              <p className="text-xs text-on-surface-variant">Add an extra layer of security to your account using a TOTP authenticator app.</p>
            </div>
          </div>
          {is2FAEnabled ? (
            <button onClick={handleDisable2FA} className="text-xs bg-error/10 text-error border border-error/20 px-4 py-2 rounded hover:bg-error/20 font-bold transition-colors">
              Disable
            </button>
          ) : (
            <button onClick={() => setShow2FASetup(true)} className="text-xs bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded hover:bg-primary/20 font-bold transition-colors">
              Set Up
            </button>
          )}
        </div>
        
        {show2FASetup && !is2FAEnabled && (
          <div className="mt-4 p-md bg-surface-container-high border border-outline-variant/50 rounded-xl flex flex-col md:flex-row gap-lg items-center animate-in fade-in zoom-in-95">
            <div className="bg-white p-2 rounded">
              {/* Fake QR code using a placeholder or basic CSS squares */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=otpauth://totp/Synara:${user.email}?secret=JBSWY3DPEHPK3PXP&issuer=Synara`} alt="QR Code" width="120" height="120" className="rounded" />
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-on-surface-variant">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), or manually enter the key below.</p>
              <div className="flex items-center gap-2">
                <code className="bg-surface-container-lowest px-3 py-1 rounded text-primary text-sm font-data-tabular">JBSWY3DPEHPK3PXP</code>
                <span className="material-symbols-outlined text-sm text-on-surface-variant cursor-pointer hover:text-on-surface">content_copy</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Enter 6-digit code" className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-1.5 text-sm w-36 focus:border-primary outline-none" />
                <button onClick={handleEnable2FA} className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors">
                  Verify
                </button>
                <button onClick={() => setShow2FASetup(false)} className="text-on-surface-variant text-sm ml-2 hover:underline">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. CONNECTED ACCOUNTS */}
      <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
        <h3 className="font-headline-sm text-on-surface border-b border-outline-variant/30 pb-4">Connected Accounts</h3>
        <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-6 h-6 grayscale-0" />
            <div>
              <p className="font-bold text-on-surface">Google</p>
              <p className="text-xs text-on-surface-variant">{connectedGoogle ? `Connected as ${user.email}` : 'Not connected'}</p>
            </div>
          </div>
          {connectedGoogle ? (
            <button onClick={handleDisconnectGoogle} className="text-xs text-on-surface-variant hover:text-error border border-outline-variant/50 px-4 py-2 rounded transition-colors">
              Disconnect
            </button>
          ) : (
            <button onClick={() => setConnectedGoogle(true)} className="text-xs bg-surface-container-high text-on-surface px-4 py-2 rounded hover:bg-surface-variant transition-colors">
              Connect
            </button>
          )}
        </div>
      </div>

      {/* 5. DANGER ZONE */}
      <div className="glass-card border-error/30 bg-error/5 p-lg rounded-xl flex flex-col gap-md mt-lg">
        <h3 className="font-headline-sm text-error border-b border-error/20 pb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span> Danger Zone
        </h3>
        <p className="text-sm text-on-surface-variant">
          Permanently delete your account and all associated data. This action cascades and will destroy all your campaigns, segments, customers, logs, and sessions. 
          <strong className="text-error ml-1">This cannot be undone.</strong>
        </p>
        <div>
          <button onClick={() => setShowDeleteModal(true)} className="bg-error text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors">
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-surface-container-high border border-error/50 p-lg rounded-xl shadow-2xl relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display-sm text-error mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              This action cannot be undone. This will permanently delete the <strong>{user.email}</strong> account and remove all data from our servers.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs text-on-surface-variant">Please type <strong>{user.email}</strong> to confirm.</label>
              <input 
                type="text" 
                value={deleteEmailConfirm}
                onChange={e => setDeleteEmailConfirm(e.target.value)}
                className="bg-background border border-error/30 rounded-lg px-md py-sm text-sm text-on-surface outline-none focus:border-error"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteEmailConfirm !== user.email}
                className="bg-error text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I understand, delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
