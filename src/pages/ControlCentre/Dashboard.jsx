import React, { useState } from 'react';
import { Users, AlertTriangle, Scale, Ban, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: "Open Disputes", value: "12", icon: <Scale className="w-5 h-5 text-zinc-400" /> },
    { label: "Pending No-Shows", value: "5", icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    { label: "Banned Users", value: "24", icon: <Ban className="w-5 h-5 text-red-500" /> },
    { label: "Active Users", value: "1,204", icon: <Users className="w-5 h-5 text-zinc-400" /> },
  ];

  const recentActivity = [
    { type: "dispute", user: "Client #842", target: "Worker #109", reason: "Unsatisfactory work", time: "10 mins ago" },
    { type: "no-show", user: "Client #221", target: "Worker #55", reason: "Did not arrive", time: "1 hour ago" },
    { type: "dispute", user: "Worker #44", target: "Client #12", reason: "Payment withheld", time: "3 hours ago" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Platform moderation and system health.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" /> System Healthy
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Recent Flags</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group">
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
                <div className="text-xs text-zinc-500 font-medium">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <button className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/5 text-white font-medium text-sm flex items-center justify-between transition-colors">
              Ban User By ID
              <Ban className="w-4 h-4 text-zinc-400" />
            </button>
            <button className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/5 text-white font-medium text-sm flex items-center justify-between transition-colors">
              Review Unresolved Disputes
              <Scale className="w-4 h-4 text-zinc-400" />
            </button>
            <button className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/5 text-white font-medium text-sm flex items-center justify-between transition-colors">
              Clear Cache
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
