import { useState } from "react"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data representing works in the last 24 hours
const recentWorks = [
  { id: "WRK-Z7X9Y", name: "VIP Lounge Security", date: "Today, 10:00 AM", completed: false },
  { id: "WRK-B2C3D", name: "Main Stage Lighting", date: "Yesterday, 8:00 PM", completed: false },
]

const workersByWork: Record<string, any[]> = {
  "WRK-Z7X9Y": [
    { id: "W6", name: "Arjun Desai", avatar: "https://i.pravatar.cc/150?u=f", reported: false },
    { id: "W7", name: "Sunita Rao", avatar: "https://i.pravatar.cc/150?u=g", reported: false }
  ],
  "WRK-B2C3D": [
    { id: "W8", name: "Karan Mehta", avatar: "https://i.pravatar.cc/150?u=h", reported: false },
    { id: "W9", name: "Anita Joshi", avatar: "https://i.pravatar.cc/150?u=i", reported: false },
    { id: "W10", name: "Ravi Verma", avatar: "https://i.pravatar.cc/150?u=j", reported: false }
  ]
}

function WorkerNoShowCard({ worker }: { worker: any }) {
  const [reported, setReported] = useState(worker.reported)

  if (reported) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full object-cover grayscale opacity-70" />
          <div>
            <div className="font-medium text-white/70 line-through">{worker.name}</div>
            <div className="text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Reported as No Show
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border border-white/10 bg-white/5 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="font-medium text-white">{worker.name}</div>
      </div>
      <button 
        onClick={() => setReported(true)}
        className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-medium rounded-full hover:bg-red-500/30 transition-colors flex items-center gap-2 border border-red-500/30"
      >
        <AlertTriangle className="w-4 h-4" />
        Report
      </button>
    </div>
  )
}

export function ReportNoShowView() {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)

  const handleBack = () => {
    if (selectedWorkId) {
      setSelectedWorkId(null)
    } else {
      onBack()
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-2xl mx-auto mt-4">
        

        <div className="mt-8 relative z-10">
          {!selectedWorkId ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Report No Show</h1>
                <p className="text-sm text-zinc-400 mt-1">Select an active work from the last 24 hours to report absent workers.</p>
              </div>

              <div className="flex flex-col gap-3">
                {recentWorks.map(work => (
                  <button 
                    key={work.id}
                    onClick={() => setSelectedWorkId(work.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div>
                      <div className="text-zinc-400 font-mono text-xs mb-1">{work.id}</div>
                      <div className="font-medium text-white">{work.name}</div>
                    </div>
                    <div className="text-sm text-zinc-400">{work.date}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Workers for {selectedWorkId}</h1>
                <p className="text-sm text-zinc-400 mt-1">Mark any workers who failed to arrive for their shift.</p>
              </div>

              <div className="flex flex-col gap-4">
                {workersByWork[selectedWorkId]?.map(worker => (
                  <WorkerNoShowCard key={worker.id} worker={worker} />
                ))}
                
                {(!workersByWork[selectedWorkId] || workersByWork[selectedWorkId].length === 0) && (
                  <div className="text-zinc-400 text-sm text-center py-8">No workers found for this work.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
