import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Settings,
  Shield,
  User,
  Scale,
  KeyRound,
  Users,
  Trash2,
  UserPlus,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export function SettingsPage() {
  const { user, activeWorkspace, userRole, updateActiveWorkspace, logout } = useAuth();

  // Workspace Settings
  const [wsName, setWsName] = useState(activeWorkspace?.name || '');
  const [defaultStandard, setDefaultStandard] = useState(
    activeWorkspace?.defaultStandard || 'BIS_10500_2012'
  );
  const [lodStrategy, setLodStrategy] = useState(
    activeWorkspace?.defaultLodStrategy || 'half_lod'
  );
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSuccess, setWsSuccess] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  // Sync when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setDefaultStandard(activeWorkspace.defaultStandard || 'BIS_10500_2012');
      setLodStrategy(activeWorkspace.defaultLodStrategy || 'half_lod');
    }
  }, [activeWorkspace]);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Members
  const [members, setMembers] = useState<
    Array<{ userId: string; role: string; name: string; email: string; avatarUrl?: string }>
  >([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/members`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(json.data || []);
      }
    } catch {
      // silently fallback
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace?.id]);

  const handleSaveWorkspaceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setWsSaving(true);
    setWsSuccess(null);
    setWsError(null);

    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: wsName,
          defaultStandard,
          defaultLodStrategy: lodStrategy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update workspace settings.');
      }
      updateActiveWorkspace(data.data);
      setWsSuccess('Workspace settings saved successfully.');
    } catch (err: any) {
      setWsError(err.message || 'Error updating workspace.');
    } finally {
      setWsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword.length < 10) {
      setPwdError('New password must be at least 10 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }
      setPwdSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Error updating password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite member.');
      }
      setInviteEmail('');
      await fetchMembers();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspace || !confirm('Remove this member from the workspace?')) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchMembers();
      }
    } catch {
      // silently fallback
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This will permanently remove all your workspaces, samples, and analyses. Type DELETE to confirm:'
    );
    if (confirmation !== 'DELETE') return;

    try {
      const res = await fetch('/api/v1/auth/delete-account', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await logout();
        window.location.href = '/';
      }
    } catch (err) {
      alert('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account profile, workspace calculation defaults, team members, and security.
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-teal-400" />
            <span>User Account Profile</span>
          </CardTitle>
          <CardDescription>Your registered identity and active credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=002F18&color=ECF5EB`
              }
              alt={user?.name || 'User'}
              className="w-14 h-14 rounded-full border border-teal-500/30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-base truncate">{user?.name}</span>
                <Badge variant="outline" className="text-xs uppercase text-teal-400 border-teal-500/30">
                  {userRole}
                </Badge>
              </div>
              <p className="text-slate-400 text-xs truncate mt-0.5">{user?.email}</p>
              <p className="text-slate-500 text-[11px] mt-1 font-mono">User ID: {user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace & Scientific Calculation Preferences */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-400" />
            <span>Workspace &amp; Scientific Calculation Defaults</span>
          </CardTitle>
          <CardDescription>
            Configure the baseline regulatory standard and detection limit substitution logic for{' '}
            <strong className="text-slate-200">{activeWorkspace?.name || 'this workspace'}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveWorkspaceSettings} className="space-y-4 text-xs sm:text-sm">
            {wsSuccess && (
              <Alert variant="info" className="flex items-center gap-2 text-xs">
                <Check className="w-4 h-4 text-teal-400" />
                <span>{wsSuccess}</span>
              </Alert>
            )}
            {wsError && (
              <Alert variant="danger" className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{wsError}</span>
              </Alert>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Workspace Name</label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                disabled={userRole !== 'owner'}
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Regulatory Standard
              </label>
              <select
                value={defaultStandard}
                onChange={(e) => setDefaultStandard(e.target.value)}
                disabled={userRole !== 'owner'}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs disabled:opacity-50"
              >
                <option value="BIS_10500_2012">
                  Bureau of Indian Standards (BIS IS 10500:2012 Drinking Water Specification)
                </option>
                <option value="WHO_GDWQ_4TH">
                  World Health Organization (WHO Guidelines for Drinking-water Quality 4th Ed)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Limit of Detection (&lt;LOD) Substitution Strategy
              </label>
              <select
                value={lodStrategy}
                onChange={(e) => setLodStrategy(e.target.value as any)}
                disabled={userRole !== 'owner'}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs disabled:opacity-50"
              >
                <option value="half_lod">
                  Half LOD (0.5 × LOD) — US EPA Standard Environmental Convention
                </option>
                <option value="zero">Zero (0) — Optimistic lower bound</option>
                <option value="full_lod">Full LOD (1.0 × LOD) — Conservative upper bound</option>
              </select>
            </div>

            {userRole === 'owner' && (
              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm" disabled={wsSaving}>
                  {wsSaving ? 'Saving...' : 'Save Workspace Defaults'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Workspace Members */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span>Workspace Collaborators</span>
          </CardTitle>
          <CardDescription>
            Team members with access to this workspace's samples and audit trails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm">
          {userRole === 'owner' && (
            <form
              onSubmit={handleInviteMember}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800"
            >
              <input
                type="email"
                placeholder="colleague@laboratory.org"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="viewer">Viewer (Read only)</option>
                <option value="editor">Editor (Upload &amp; Analyze)</option>
              </select>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={inviteLoading}
                className="gap-1 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{inviteLoading ? 'Inviting...' : 'Add Member'}</span>
              </Button>
            </form>
          )}

          {inviteError && (
            <Alert variant="danger" className="text-xs">
              {inviteError}
            </Alert>
          )}

          {membersLoading ? (
            <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              <span>Loading workspace members...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
              {members.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No other members in this workspace yet.
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-900/40 text-teal-300 font-semibold flex items-center justify-center text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white text-xs">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] uppercase text-slate-300">
                        {m.role}
                      </Badge>
                      {userRole === 'owner' && m.userId !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Password Update */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span>Security &amp; Password</span>
          </CardTitle>
          <CardDescription>
            Change your account password. Requires your current password for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs sm:text-sm">
            {pwdSuccess && (
              <Alert variant="info" className="flex items-center gap-2 text-xs">
                <Check className="w-4 h-4 text-teal-400" />
                <span>{pwdSuccess}</span>
              </Alert>
            )}
            {pwdError && (
              <Alert variant="danger" className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{pwdError}</span>
              </Alert>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 10 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={pwdLoading}>
                {pwdLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-900/40 bg-rose-950/10">
        <CardHeader>
          <CardTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription className="text-rose-300/70">
            Permanently delete your account, personal workspaces, and all sample data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400 mb-4">
            Once you delete your account, there is no going back. All measurements, calculation
            histories, and generated audit dossiers will be permanently removed.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDeleteAccount}
            className="text-xs"
          >
            Delete Account Permanently
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
