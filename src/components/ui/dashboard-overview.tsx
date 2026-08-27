import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus, Briefcase, Calendar, CheckCircle, Users, Wallet, IndianRupee, Star, Ticket, MapPin, Clock, X, FileText } from 'lucide-react';

type IconType = React.ElementType | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
export type TrendType = 'up' | 'down' | 'neutral';

export interface DashboardMetricCardProps {
  value: string;
  title: string;
  icon?: IconType;
  trendChange?: string;
  trendType?: TrendType;
  className?: string;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  trendChange,
  trendType = 'neutral',
  className,
}) => {
  const TrendIcon = trendType === 'up' ? ArrowUp : trendType === 'down' ? ArrowDown : Minus;
  const trendColorClass =
    trendType === 'up'
      ? "text-emerald-400"
      : trendType === 'down'
      ? "text-red-400"
      : "text-zinc-400";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("cursor-pointer rounded-xl", className)}
    >
      <Card className="h-full transition-colors duration-200 bg-black/40 backdrop-blur-md border-white/10 text-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">
            {title}
          </CardTitle>
          {IconComponent && (
            <IconComponent className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{value}</div>
          {trendChange && (
            <p className={cn("flex items-center text-xs font-medium", trendColorClass)}>
              <TrendIcon className="h-3 w-3 mr-1" aria-hidden="true" />
              {trendChange} {trendType === 'up' ? "increase" : trendType === 'down' ? "decrease" : "change"}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const ClientDashboardOverview = ({ onPostWork }: { onPostWork?: () => void }) => {
  const [recentWorks, setRecentWorks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalWorks: 0,
    worksLast14Days: 0,
    slotsLeft: 0,
    workersHired: 0
  });

  const [selectedWork, setSelectedWork] = useState<any | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: worksData, error } = await supabase
        .from('works')
        .select(`
          id, 
          work_name, 
          status, 
          created_at, 
          slots,
          location,
          date_work,
          reporting_time,
          completion_time,
          payment_amount,
          instruction,
          days,
          applications ( slots_taken, status )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Dashboard fetch error:", error);
        return;
      }

      if (worksData) {
        let hired = 0;
        let totalSlots = 0;
        
        const works = worksData.map((w: any) => {
          const taken = w.applications?.reduce((sum: number, app: any) => sum + (app.slots_taken || 1), 0) || 0;
          hired += taken;
          totalSlots += w.slots;

          return {
            id: w.id.substring(0, 8).toUpperCase(),
            name: w.work_name,
            status: w.status === 'open' ? 'Active' : 'Completed',
            // Full details
            location: w.location,
            date: w.date_work,
            time: `${w.reporting_time} - ${w.completion_time}`,
            payment: w.payment_amount,
            instruction: w.instruction,
            days: w.days,
            totalSlots: w.slots,
            slotsTaken: taken,
            applications: w.applications
          };
        });

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const recentCount = worksData.filter((w: any) => new Date(w.created_at) > fourteenDaysAgo).length;

        setMetrics({
          totalWorks: worksData.length,
          worksLast14Days: recentCount,
          slotsLeft: Math.max(0, totalSlots - hired),
          workersHired: hired
        });
        
        setRecentWorks(works);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white">Dashboard Overview</h3>
        <motion.button
          onClick={onPostWork}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md py-1.5 pl-4 pr-1.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/40 hover:gap-3"
        >
          Post a work
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 transition-transform group-hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </span>
        </motion.button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Works Given"
          value={metrics.totalWorks.toString()}
          icon={Briefcase}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Works in Last 14 Days"
          value={metrics.worksLast14Days.toString()}
          icon={Calendar}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Open Slots Left"
          value={metrics.slotsLeft.toString()}
          icon={CheckCircle}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Workers Hired / Applied"
          value={metrics.workersHired.toString()}
          icon={Users}
          trendType="neutral"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Works</h3>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden shadow-xl">
            <div className="grid grid-cols-4 p-4 border-b border-white/10 text-sm font-medium text-zinc-300">
                <div>Work ID</div>
                <div className="col-span-2">Name</div>
                <div>Status</div>
            </div>
            <div className="flex flex-col">
                {recentWorks.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">No works posted yet.</div>
                ) : (
                  recentWorks.map((work) => (
                    <div 
                      key={work.id} 
                      onClick={() => setSelectedWork(work)}
                      className="grid grid-cols-4 p-4 border-b border-white/5 last:border-0 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <div className="text-zinc-400 font-mono">WRK-{work.id}</div>
                        <div className="col-span-2 font-medium">{work.name}</div>
                        <div>
                            <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium border",
                                work.status === "Active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                            )}>
                                {work.status}
                            </span>
                        </div>
                    </div>
                  ))
                )}
            </div>
        </div>
      </div>

      {/* View Work Modal (Client Side) */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedWork.name}</h2>
                <p className="text-sm text-zinc-400">ID: WRK-{selectedWork.id}</p>
              </div>
              <button onClick={() => setSelectedWork(null)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MapPin className="w-4 h-4" /> Location
                  </div>
                  <div className="font-medium text-white">{selectedWork.location}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" /> Date & Days
                  </div>
                  <div className="font-medium text-white">{selectedWork.date} • {selectedWork.days} Day(s)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" /> Timing
                  </div>
                  <div className="font-medium text-white">{selectedWork.time}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <IndianRupee className="w-4 h-4" /> Payment
                  </div>
                  <div className="font-bold text-lg text-emerald-400">₹{selectedWork.payment}</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-8">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                  <Users className="w-5 h-5 text-zinc-400" /> Slots Status
                </h3>
                <div className="bg-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Total Slots</span>
                    <span className="font-medium text-white">{selectedWork.totalSlots}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Slots Filled</span>
                    <span className="font-medium text-white">{selectedWork.slotsTaken}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Slots Remaining</span>
                    <span className="font-medium text-white">{selectedWork.totalSlots - selectedWork.slotsTaken}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-zinc-400 text-center">
                    To review specific applicants, please go to the "Review Workers" tab.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};



export const WorkerDashboardOverview = ({ onGetWork }: { onGetWork?: () => void }) => {
  const [myWorks, setMyWorks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    completed: 0,
    credited: 0,
    pending: 0,
    rating: 0,
    availableSlots: 0
  });

  const [selectedWork, setSelectedWork] = useState<any | null>(null);

  useEffect(() => {
    async function loadWorkerDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch worker's slot balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('slots')
        .eq('id', user.id)
        .single();

      const { data: appsData, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          slots_taken,
          co_worker_names,
          created_at,
          works (
            work_name,
            date_work,
            reporting_time,
            completion_time,
            payment_amount,
            location,
            instruction,
            days,
            slots,
            profiles ( username )
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Worker dashboard fetch error:", error);
        return;
      }

      if (appsData) {
        let completed = 0;
        let pendingPay = 0;
        let creditedPay = 0;

        const formattedWorks = appsData.map((app: any) => {
          const work = app.works;
          if (!work) return null;

          if (app.status === 'completed') {
            completed++;
            creditedPay += work.payment_amount;
          } else {
            pendingPay += work.payment_amount;
          }

          return {
            id: app.id,
            name: work.work_name,
            date: work.date_work,
            time: `${work.reporting_time} - ${work.completion_time}`,
            paymentStatus: app.status === 'completed' ? 'Credited' : 'Pending',
            // Full details for modal
            location: work.location,
            instruction: work.instruction,
            days: work.days,
            payment: work.payment_amount,
            client: work.profiles?.username || 'Unknown Client',
            slotsTaken: app.slots_taken,
            coWorkerNames: app.co_worker_names,
            applicationStatus: app.status
          };
        }).filter(Boolean);

        setMetrics({
          completed,
          credited: creditedPay,
          pending: pendingPay,
          rating: 0,
          availableSlots: profileData?.slots || 0
        });

        setMyWorks(formattedWorks);
      }
    }
    loadWorkerDashboard();
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white">Worker Dashboard</h3>
        <motion.button
          onClick={onGetWork}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md py-1.5 pl-4 pr-1.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/40 hover:gap-3"
        >
          Get a work
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 transition-transform group-hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </span>
        </motion.button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardMetricCard
          title="Works Completed"
          value={metrics.completed.toString()}
          icon={CheckCircle}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Credited Earnings"
          value={`₹${metrics.credited}`}
          icon={Wallet}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Pending Earnings"
          value={`₹${metrics.pending}`}
          icon={IndianRupee}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Average Rating"
          value={metrics.rating.toFixed(1)}
          icon={Star}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Available Slots"
          value={metrics.availableSlots.toString()}
          icon={Ticket}
          trendType="neutral"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4">My Works</h3>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden shadow-xl overflow-x-auto">
            <div className="min-w-[600px]">
                <div className="grid grid-cols-4 p-4 border-b border-white/10 text-sm font-medium text-zinc-300">
                    <div>Work Name</div>
                    <div>Date</div>
                    <div>Time</div>
                    <div>Payment Status</div>
                </div>
                <div className="flex flex-col">
                    {myWorks.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">No works joined yet.</div>
                    ) : (
                      myWorks.map((work) => (
                          <div 
                            key={work.id} 
                            onClick={() => setSelectedWork(work)}
                            className="grid grid-cols-4 p-4 border-b border-white/5 last:border-0 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                              <div className="font-medium">{work.name}</div>
                              <div className="text-zinc-300">{work.date}</div>
                              <div className="text-zinc-300">{work.time}</div>
                              <div>
                                  <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium border",
                                      work.paymentStatus === "Credited" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                  )}>
                                      {work.paymentStatus}
                                  </span>
                              </div>
                          </div>
                      ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* View Work Modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedWork.name}</h2>
                <p className="text-sm text-zinc-400">Posted by {selectedWork.client}</p>
              </div>
              <button onClick={() => setSelectedWork(null)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MapPin className="w-4 h-4" /> Location
                  </div>
                  <div className="font-medium text-white">{selectedWork.location}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" /> Date & Days
                  </div>
                  <div className="font-medium text-white">{selectedWork.date} • {selectedWork.days} Day(s)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" /> Timing
                  </div>
                  <div className="font-medium text-white">{selectedWork.time}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <IndianRupee className="w-4 h-4" /> Payment
                  </div>
                  <div className="font-bold text-lg text-emerald-400">₹{selectedWork.payment}</div>
                </div>
              </div>

              {selectedWork.instruction && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-white mb-3">
                    <FileText className="w-5 h-5 text-zinc-400" /> Instructions
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedWork.instruction}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-8">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                  <Users className="w-5 h-5 text-zinc-400" /> Your Application
                </h3>
                <div className="bg-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Status</span>
                    <span className="capitalize font-bold text-white">{selectedWork.applicationStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Slots Claimed</span>
                    <span className="font-medium text-white">{selectedWork.slotsTaken}</span>
                  </div>
                  {selectedWork.slotsTaken > 1 && (
                    <div className="flex justify-between items-start text-sm pt-2 border-t border-white/10">
                      <span className="text-zinc-400">Co-workers</span>
                      <span className="font-medium text-white text-right max-w-[60%]">{selectedWork.coWorkerNames}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
