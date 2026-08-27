import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Scale, Ban, ShieldCheck, ChevronRight, Eye, CheckCircle, XCircle, ArrowLeft, Star, Briefcase, Phone, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Overview Tab ───────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState({ openDisputes: 0, pendingNoShows: 0, bannedUsers: 0, activeUsers: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        // Fetch counts
        const [disputesRes, noShowsRes, bannedRes, activeRes] = await Promise.all([
          supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'no-show'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'banned'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'banned'),
        ]);

        setStats({
          openDisputes: disputesRes.count || 0,
          pendingNoShows: noShowsRes.count || 0,
          bannedUsers: bannedRes.count || 0,
          activeUsers: activeRes.count || 0,
        });

        // Fetch recent disputes
        const { data: recentDisputes } = await supabase
          .from('disputes')
          .select(`
            id, reason, status, created_at,
            profiles!disputes_worker_id_fkey ( username ),
            applications ( works ( work_name ) )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent no-shows
        const { data: recentNoShows } = await supabase
          .from('applications')
          .select(`
            id, created_at,
            profiles!applications_worker_id_fkey ( username ),
            works ( work_name, profiles ( username ) )
          `)
          .eq('status', 'no-show')
          .order('created_at', { ascending: false })
          .limit(5);

        const activity = [];
        (recentDisputes || []).forEach(d => {
          activity.push({
            type: 'dispute',
            user: d.profiles?.username || 'Unknown',
            target: d.applications?.works?.work_name || 'Unknown Work',
            reason: d.reason?.substring(0, 60) + (d.reason?.length > 60 ? '...' : ''),
            time: new Date(d.created_at).toLocaleDateString(),
            status: d.status,
          });
        });
        (recentNoShows || []).forEach(n => {
          activity.push({
            type: 'no-show',
            user: n.works?.profiles?.username || 'Unknown Client',
            target: n.profiles?.username || 'Unknown Worker',
            reason: `No-show reported for "${n.works?.work_name || 'Unknown Work'}"`,
            time: new Date(n.created_at).toLocaleDateString(),
          });
        });
        activity.sort((a, b) => new Date(b.time) - new Date(a.time));
        setRecentActivity(activity.slice(0, 10));
      } catch (err) {
        console.error('Admin overview error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const statCards = [
    { label: "Open Disputes", value: stats.openDisputes, icon: <Scale className="w-5 h-5 text-zinc-400" /> },
    { label: "Pending No-Shows", value: stats.pendingNoShows, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    { label: "Banned Users", value: stats.bannedUsers, icon: <Ban className="w-5 h-5 text-red-500" /> },
    { label: "Active Users", value: stats.activeUsers, icon: <Users className="w-5 h-5 text-zinc-400" /> },
  ];

  if (loading) return <div className="p-8 text-zinc-400">Loading overview...</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 max-h-[400px]">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No recent activity.</div>
          ) : (
            recentActivity.map((activity, i) => (
              <div key={i} className="p-4 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'dispute' ? 'bg-zinc-800 text-zinc-300' : 'bg-amber-500/20 text-amber-500'}`}>
                    {activity.type === 'dispute' ? <Scale className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {activity.user} <ChevronRight className="w-3 h-3 text-zinc-500" /> {activity.target}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{activity.reason}</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 font-medium shrink-0 ml-4">
                  {activity.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Disputes Tab ───────────────────────────────────────────────
function DisputesTab() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofModal, setProofModal] = useState(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    setLoading(true);
    const { data } = await supabase
      .from('disputes')
      .select(`
        id, reason, proof_url, status, created_at, application_id,
        profiles!disputes_worker_id_fkey ( username ),
        applications ( id, works ( work_name, profiles ( username ) ) )
      `)
      .order('created_at', { ascending: false });

    setDisputes(data || []);
    setLoading(false);
  }

  const handleAction = async (disputeId, applicationId, action) => {
    try {
      // Update dispute status
      await supabase.from('disputes').update({ status: action }).eq('id', disputeId);

      // If resolved, restore worker's application to approved
      if (action === 'resolved') {
        await supabase.from('applications').update({ status: 'approved' }).eq('id', applicationId);
      }

      loadDisputes();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading disputes...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">All Disputes</h2>
        <span className="text-sm text-zinc-400">{disputes.length} total</span>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No disputes filed yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {disputes.map(d => (
            <div key={d.id} className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Worker</div>
                  <div className="font-medium text-white">{d.profiles?.username || 'Unknown'}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Work: {d.applications?.works?.work_name || 'Unknown'} • Client: {d.applications?.works?.profiles?.username || 'Unknown'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border uppercase tracking-wider ${
                  d.status === 'open' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                  d.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {d.status}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-lg text-sm text-zinc-300 mb-3">
                <span className="text-xs text-zinc-500 block mb-1">Reason:</span>
                {d.reason}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setProofModal(d.proof_url)}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Eye className="w-4 h-4" /> View Proof Photo
                </button>

                {d.status === 'open' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(d.id, d.application_id, 'rejected')}
                      className="px-4 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-md hover:bg-red-500/20 transition-colors"
                    >
                      Reject Dispute
                    </button>
                    <button
                      onClick={() => handleAction(d.id, d.application_id, 'resolved')}
                      className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-md hover:bg-emerald-500/30 transition-colors"
                    >
                      Resolve (Restore Worker)
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-500 mt-3">Filed: {new Date(d.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Photo Modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setProofModal(null)}>
          <div className="max-w-2xl max-h-[80vh] rounded-xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <img src={proofModal} alt="Dispute Proof" className="w-full h-full object-contain" />
            <button onClick={() => setProofModal(null)} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── No-Shows Tab ───────────────────────────────────────────────
function NoShowsTab() {
  const [noShows, setNoShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNoShows();
  }, []);

  async function loadNoShows() {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select(`
        id, created_at,
        profiles!applications_worker_id_fkey ( username ),
        works ( work_name, date_work, profiles ( username ) )
      `)
      .eq('status', 'no-show')
      .order('created_at', { ascending: false });

    setNoShows(data || []);
    setLoading(false);
  }

  const handleDismiss = async (appId) => {
    if (!confirm('Dismiss this no-show report? The worker\'s status will be restored to approved.')) return;
    try {
      await supabase.from('applications').update({ status: 'approved' }).eq('id', appId);
      loadNoShows();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading no-shows...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">No-Show Reports</h2>
        <span className="text-sm text-zinc-400">{noShows.length} total</span>
      </div>

      {noShows.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No pending no-show reports.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {noShows.map(ns => (
            <div key={ns.id} className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{ns.profiles?.username || 'Unknown Worker'}</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Work: {ns.works?.work_name || 'Unknown'} • Date: {ns.works?.date_work || 'N/A'}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Reported by: {ns.works?.profiles?.username || 'Unknown Client'} • {new Date(ns.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(ns.id)}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 shrink-0 ml-4"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, contact, slots, created_at')
      .order('created_at', { ascending: false });

    setUsers(data || []);
    setLoading(false);
  }

  const handleBan = async (userId, currentRole) => {
    if (currentRole === 'admin') {
      alert('Cannot ban admin accounts.');
      return;
    }
    if (!confirm('Are you sure you want to ban this user? They will lose access to all features.')) return;
    try {
      await supabase.from('profiles').update({ role: 'banned' }).eq('id', userId);
      loadUsers();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleUnban = async (userId) => {
    if (!confirm('Restore this user? They will regain access as a worker.')) return;
    try {
      // Default to worker role on unban
      await supabase.from('profiles').update({ role: 'worker' }).eq('id', userId);
      loadUsers();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (u.username || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="p-8 text-zinc-400">Loading users...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">All Users</h2>
        <span className="text-sm text-zinc-400">{users.length} total</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username or role..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 p-4 border-b border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          <div className="col-span-3">Username</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-1">Slots</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col max-h-[500px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No users found.</div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="grid grid-cols-12 p-4 border-b border-white/5 text-sm items-center hover:bg-white/5 transition-colors">
                <div className="col-span-3 font-medium text-white truncate">{user.username || 'N/A'}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    user.role === 'client' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    user.role === 'worker' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    user.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="col-span-2 text-zinc-400 truncate">{user.contact || '—'}</div>
                <div className="col-span-1 text-zinc-400">{user.slots ?? 0}</div>
                <div className="col-span-2 text-zinc-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</div>
                <div className="col-span-2 text-right">
                  {user.role === 'banned' ? (
                    <button
                      onClick={() => handleUnban(user.id)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-md hover:bg-emerald-500/30 transition-colors"
                    >
                      Unban
                    </button>
                  ) : user.role !== 'admin' ? (
                    <button
                      onClick={() => handleBan(user.id, user.role)}
                      className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded-md hover:bg-red-500/20 transition-colors"
                    >
                      Ban
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">Protected</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Listen for tab changes from parent Layout via custom events
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('admin-tab-change', handler);
    return () => window.removeEventListener('admin-tab-change', handler);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {activeTab === 'overview' ? 'Overview' : activeTab === 'disputes' ? 'Disputes' : activeTab === 'no-shows' ? 'No-Show Reports' : 'User Management'}
          </h1>
          <p className="text-zinc-400 mt-1">Platform moderation and system health.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" /> Admin
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 lg:hidden">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'disputes', label: 'Disputes' },
          { id: 'no-shows', label: 'No-Shows' },
          { id: 'users', label: 'Users' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'disputes' && <DisputesTab />}
      {activeTab === 'no-shows' && <NoShowsTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  );
}
