import { useState, useEffect } from "react"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

function WorkerNoShowCard({ worker, applicationId }: { worker: any, applicationId: string }) {
  const [reported, setReported] = useState(worker.status === 'no-show')
  const [loading, setLoading] = useState(false)

  const handleReport = async () => {
    if (!confirm(`Are you sure you want to report ${worker.name} as a no-show? This will affect their rating.`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'no-show' })
        .eq('id', applicationId)
      
      if (error) throw error
      setReported(true)
    } catch (err: any) {
      alert("Failed to report no-show: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (reported) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold grayscale opacity-70">{worker.name.charAt(0)}</div>
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
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">{worker.name.charAt(0)}</div>
        <div className="font-medium text-white">{worker.name}</div>
      </div>
      <button 
        onClick={handleReport}
        disabled={loading}
        className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-medium rounded-full hover:bg-red-500/30 transition-colors flex items-center gap-2 border border-red-500/30 disabled:opacity-50"
      >
        <AlertTriangle className="w-4 h-4" />
        {loading ? "Reporting..." : "Report"}
      </button>
    </div>
  )
}

export function ReportNoShowView() {
  const [works, setWorks] = useState<any[]>([])
  const [selectedWork, setSelectedWork] = useState<any | null>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWorks() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch works in the last 24-48 hours ideally, but for now we fetch recent active/completed ones
      const { data } = await supabase
        .from('works')
        .select('id, work_name, date_work')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      
      if (data) setWorks(data)
      setLoading(false)
    }
    loadWorks()
  }, [])

  const selectWork = async (work: any) => {
    setSelectedWork(work)
    setWorkers([])
    const { data } = await supabase
      .from('applications')
      .select(`
        id,
        worker_id,
        status,
        profiles!applications_worker_id_fkey ( username )
      `)
      .eq('work_id', work.id)
      .in('status', ['approved', 'completed', 'no-show']) // Can report approved workers who didn't show
    
    if (data) {
      setWorkers(data.map((app: any) => ({
        id: app.worker_id,
        applicationId: app.id,
        status: app.status,
        name: app.profiles?.username || "Unknown Worker"
      })))
    }
  }

  const handleBack = () => {
    setSelectedWork(null)
  }

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-2xl mx-auto mt-4">
        
        <div className="mt-8 relative z-10">
          {!selectedWork ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Report No Show</h1>
                <p className="text-sm text-zinc-400 mt-1">Select a recent work to report absent workers.</p>
              </div>

              <div className="flex flex-col gap-3">
                {loading ? <div className="text-zinc-400">Loading...</div> : works.length === 0 ? <div className="text-zinc-400">No works found.</div> : null}
                {works.map(work => (
                  <button 
                    key={work.id}
                    onClick={() => selectWork(work)}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div>
                      <div className="text-zinc-400 font-mono text-xs mb-1">WRK-{work.id.substring(0,8).toUpperCase()}</div>
                      <div className="font-medium text-white">{work.work_name}</div>
                    </div>
                    <div className="text-sm text-zinc-400">{work.date_work}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-4">
                <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Workers for {selectedWork.work_name}</h1>
                  <p className="text-sm text-zinc-400 mt-1">Mark any workers who failed to arrive for their shift.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {workers.map(worker => (
                  <WorkerNoShowCard key={worker.id} worker={worker} applicationId={worker.applicationId} />
                ))}
                
                {workers.length === 0 && (
                  <div className="text-zinc-400 text-sm text-center py-8">No approved workers found for this work.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
