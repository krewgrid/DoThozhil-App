import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus, Briefcase, Calendar, CheckCircle, Users, Wallet, IndianRupee, Star, Ticket } from 'lucide-react';

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

export const ClientDashboardOverview = ({ onPostWork }: { onPostWork?: () => void }) => {
  const recentWorks: any[] = [];

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
          value="0"
          icon={Briefcase}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Works in Last 14 Days"
          value="0"
          icon={Calendar}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Slots Left"
          value="0"
          icon={CheckCircle}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Workers Hired"
          value="0"
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
                    <div key={work.id} className="grid grid-cols-4 p-4 border-b border-white/5 last:border-0 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="text-zinc-400 font-mono">{work.id}</div>
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
    </div>
  );
};

export const WorkerDashboardOverview = ({ onGetWork }: { onGetWork?: () => void }) => {
  const myWorks: any[] = [];

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
          value="0"
          icon={CheckCircle}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Credited Earnings"
          value="₹0"
          icon={Wallet}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Pending Earnings"
          value="₹0"
          icon={IndianRupee}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Average Rating"
          value="0.0"
          icon={Star}
          trendType="neutral"
        />
        <DashboardMetricCard
          title="Available Slots"
          value="0"
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
                          <div key={work.id} className="grid grid-cols-4 p-4 border-b border-white/5 last:border-0 text-sm text-white hover:bg-white/10 transition-colors">
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
    </div>
  );
};
