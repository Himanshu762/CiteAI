import React, { useState } from 'react';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { PageHeader } from '../components/ui/components';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';

export default function UserSettings() {
  const { user, updateUserPassword, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password. You may need to sign in again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Profile Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profile Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-slate-900 dark:text-white">{user?.email || 'Not available'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Display Name</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-slate-900 dark:text-white">{user?.displayName || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Change Password
          </h3>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Sign Out</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Sign out of your account on this device.</p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg font-medium text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}