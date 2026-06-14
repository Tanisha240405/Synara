'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';

export default function SettingsPage() {
  const { auditLogs, addAuditLog, addNotification } = useAppStore();

  const handleExportLogs = () => {
    if (auditLogs.length === 0) return;
    
    const headers = ['Timestamp', 'Action', 'Details'];
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => `"${new Date(log.timestamp).toLocaleString()}","${log.action}","${log.details}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'audit_logs.csv';
    link.click();
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Active Devices State ---
  const [activeDevices, setActiveDevices] = useState([
    { id: '1', os: 'MacBook / iMac', browser: 'Apple Safari', ip: '192.168.1.5', location: 'San Francisco, CA', lastActive: 'Active Now', isCurrent: true },
    { id: '2', os: 'Apple iPhone', browser: 'Apple Safari', ip: '10.0.0.4', location: 'San Francisco, CA', lastActive: '2 hours ago', isCurrent: false },
    { id: '3', os: 'Windows Desktop', browser: 'Google Chrome', ip: '104.28.192.1', location: 'New York, NY', lastActive: '3 days ago', isCurrent: false },
  ]);

  const handleLogOutDevice = (id: string) => {
    setActiveDevices(prev => prev.filter(d => d.id !== id));
    addAuditLog({ action: 'Device Logged Out', details: `Terminated session for device ID ${id}` });
    addNotification({ title: 'Session Terminated', message: 'The selected device has been logged out.' });
  };

  const handleLogOutAllOther = () => {
    setActiveDevices(prev => prev.filter(d => d.isCurrent));
    addAuditLog({ action: 'All Devices Logged Out', details: 'Terminated all other active sessions' });
    addNotification({ title: 'Sessions Terminated', message: 'All other devices have been securely logged out.' });
  };

  // --- Login History State ---
  const [loginHistory] = useState([
    { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), ip: '192.168.1.5', device: 'MacBook / Safari', status: 'Success' },
    { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), ip: '10.0.0.4', device: 'iPhone / Safari', status: 'Success' },
    { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), ip: '185.199.108.153', device: 'Unknown Browser', status: 'Failed (Bad Password)' },
    { id: 4, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), ip: '104.28.192.1', device: 'Windows / Chrome', status: 'Success' },
  ]);

  // --- Security Alerts State ---
  const [alerts, setAlerts] = useState({
    newDevice: true,
    pwdChange: true,
    exportData: false,
  });

  const handleAlertChange = (key: keyof typeof alerts) => {
    setAlerts(prev => {
      const next = { ...prev, [key]: !prev[key] };
      addAuditLog({ action: 'Security Alert Toggled', details: `${key} set to ${next[key]}` });
      addNotification({ title: 'Alert Preferences Saved', message: 'Your security alert preferences have been updated.' });
      return next;
    });
  };

  // --- API Key State ---
  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Production App', key: 'sk_live_51Mxxxxx...', lastUsed: 'Just now' },
    { id: 'key_2', name: 'Zapier Integration', key: 'sk_live_89Zxxxxx...', lastUsed: '5 days ago' },
  ]);

  const handleGenerateKey = () => {
    const newKey = { id: `key_${Date.now()}`, name: 'New API Key', key: `sk_live_${Math.random().toString(36).substring(2, 10)}...`, lastUsed: 'Never' };
    setApiKeys([...apiKeys, newKey]);
    addAuditLog({ action: 'API Key Generated', details: `Created a new API key` });
    addNotification({ title: 'Key Generated', message: 'A new API key has been securely generated.' });
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    addAuditLog({ action: 'API Key Revoked', details: `Revoked API key ${id}` });
    addNotification({ title: 'Key Revoked', message: 'The API key has been permanently revoked and can no longer be used.' });
  };

  if (!isMounted) return null;

  return (
    <div className="pt-8 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-xl flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Settings & Security</h2>
          <p className="text-on-surface-variant mt-xs">Manage active sessions, security alerts, and API access.</p>
        </div>
      </div>

      <div className="flex flex-col gap-xl">
        
        {/* Active Devices Section */}
        <section className="glass-card p-lg rounded-xl">
          <div className="flex items-center justify-between mb-md border-b border-outline-variant/30 pb-xs">
            <h3 className="font-headline-sm text-on-surface">Active Devices</h3>
            {activeDevices.length > 1 && (
              <button 
                onClick={handleLogOutAllOther}
                className="text-xs bg-error/10 text-error border border-error/20 hover:bg-error/20 px-3 py-1.5 rounded transition-colors font-bold"
              >
                Log out of all other devices
              </button>
            )}
          </div>
          <div className="flex flex-col gap-sm">
            {activeDevices.map(device => (
              <div key={device.id} className="flex items-start justify-between p-md bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                <div className="flex items-start gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                    <span className="material-symbols-outlined text-[20px]">
                      {device.os.includes('Phone') || device.os.includes('iPhone') ? 'smartphone' : 'laptop_mac'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface flex items-center gap-2 text-md">
                      {device.os} — {device.browser}
                      {device.isCurrent && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase ml-2 tracking-wider">Current</span>}
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-1">{device.location} (IP: {device.ip})</p>
                    <p className="text-xs text-on-surface-variant mt-1 opacity-70">Last active: {device.lastActive}</p>
                  </div>
                </div>
                {!device.isCurrent && (
                  <button onClick={() => handleLogOutDevice(device.id)} className="text-xs text-on-surface-variant hover:text-error border border-outline-variant/50 px-4 py-2 rounded transition-colors">
                    Log out
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          {/* Security Alerts */}
          <section className="glass-card p-lg rounded-xl">
            <h3 className="font-headline-sm text-on-surface mb-md border-b border-outline-variant/30 pb-xs">Security Alerts</h3>
            <div className="flex flex-col gap-md">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">New device logins</p>
                  <p className="text-xs text-on-surface-variant">Notify me when my account is accessed from a new device.</p>
                </div>
                <input type="checkbox" checked={alerts.newDevice} onChange={() => handleAlertChange('newDevice')} className="accent-primary w-4 h-4" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Password or Email changes</p>
                  <p className="text-xs text-on-surface-variant">Notify me immediately if my credentials are updated.</p>
                </div>
                <input type="checkbox" checked={alerts.pwdChange} onChange={() => handleAlertChange('pwdChange')} className="accent-primary w-4 h-4" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Data Export</p>
                  <p className="text-xs text-on-surface-variant">Notify me when large customer segments are exported.</p>
                </div>
                <input type="checkbox" checked={alerts.exportData} onChange={() => handleAlertChange('exportData')} className="accent-primary w-4 h-4" />
              </label>
            </div>
          </section>

          {/* API Keys */}
          <section className="glass-card p-lg rounded-xl">
            <div className="flex items-center justify-between mb-md border-b border-outline-variant/30 pb-xs">
              <h3 className="font-headline-sm text-on-surface">API Keys</h3>
              <button onClick={handleGenerateKey} className="text-xs bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary border border-outline-variant/50 px-3 py-1.5 rounded transition-colors font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span> Generate
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No API keys generated.</p>
              ) : apiKeys.map(key => (
                <div key={key.id} className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{key.name}</p>
                    <code className="text-xs text-primary font-mono bg-primary/10 px-1 rounded">{key.key}</code>
                    <p className="text-[10px] text-on-surface-variant mt-1">Last used: {key.lastUsed}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors" title="Regenerate">
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                    </button>
                    <button onClick={() => handleRevokeKey(key.id)} className="w-7 h-7 rounded hover:bg-error/20 flex items-center justify-center text-error transition-colors" title="Revoke">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Login History Section */}
        <section className="glass-card p-lg rounded-xl">
          <h3 className="font-headline-sm text-on-surface mb-md border-b border-outline-variant/30 pb-xs">Login History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-label-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                  <th className="p-sm">Timestamp</th>
                  <th className="p-sm">Device</th>
                  <th className="p-sm">IP Address</th>
                  <th className="p-sm">Status</th>
                </tr>
              </thead>
              <tbody className="text-body-sm">
                {loginHistory.map((login) => (
                  <tr key={login.id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest transition-colors">
                    <td className="p-sm text-tertiary">{new Date(login.timestamp).toLocaleString()}</td>
                    <td className="p-sm font-bold text-on-surface">{login.device}</td>
                    <td className="p-sm text-on-surface-variant font-mono">{login.ip}</td>
                    <td className="p-sm">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${login.status.includes('Failed') ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>
                        {login.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Logs Section */}
        <section className="glass-card p-lg rounded-xl">
          <div className="flex items-center justify-between mb-md border-b border-outline-variant/30 pb-xs">
            <h3 className="font-headline-sm text-on-surface">Audit Logs</h3>
            <button 
              onClick={handleExportLogs}
              className="flex items-center gap-xs text-sm font-bold bg-surface-variant text-on-surface px-md py-sm rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left relative">
              <thead className="sticky top-0 bg-surface-container/90 backdrop-blur">
                <tr className="text-label-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                  <th className="p-sm">Timestamp</th>
                  <th className="p-sm">Action</th>
                  <th className="p-sm">Details</th>
                </tr>
              </thead>
              <tbody className="text-body-sm">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-xl text-center text-on-surface-variant">No actions recorded yet.</td>
                  </tr>
                ) : (
                  [...auditLogs].reverse().map((log) => (
                    <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest transition-colors">
                      <td className="p-sm text-tertiary">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-sm font-bold text-on-surface">{log.action}</td>
                      <td className="p-sm text-on-surface-variant">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
