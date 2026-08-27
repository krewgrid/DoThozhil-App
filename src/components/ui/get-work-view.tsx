import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, Search, MapPin, Calendar, IndianRupee, SlidersHorizontal, Check, X, Clock, FileText, AlertTriangle, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export function GetWorkView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"none" | "nearestDate" | "highPayment">("none")

  const [availableWorks, setAvailableWorks] = useState<any[]>([])
  const [appliedWorkIds, setAppliedWorkIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [workerSlots, setWorkerSlots] = useState(0)

  // Modal State
  const [selectedWork, setSelectedWork] = useState<any | null>(null)
  const [slotsTaken, setSlotsTaken] = useState(1)
  const [coWorkerNames, setCoWorkerNames] = useState<string[]>([])
  const [isApplying, setIsApplying] = useState(false)

  // Handle slot change to resize the names array
  const handleSlotChange = (newSlots: number) => {
    setSlotsTaken(newSlots)
    if (newSlots > 1) {
      // Resize array to match (newSlots - 1)
      setCoWorkerNames(prev => {
        const newArr = [...prev]
        while (newArr.length < newSlots - 1) newArr.push("")
        return newArr.slice(0, newSlots - 1)
      })
    } else {
      setCoWorkerNames([])
    }
  }

  const handleNameChange = (index: number, value: string) => {
    setCoWorkerNames(prev => {
      const newArr = [...prev]
      newArr[index] = value
      return newArr
    })
  }

  useEffect(() => {
    async function fetchWorks() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Fetch open works with client username and all details
        const { data: worksData, error: worksError } = await supabase
          .from('works')
          .select(`
            id,
            work_name,
            location,
            date_work,
            payment_amount,
            slots,
            instruction,
            days,
            reporting_time,
            completion_time,
            profiles (
              username
            )
          `)
          .eq('status', 'open')

        if (worksError) throw worksError

        // Fetch user's applications to know what they already applied to
        if (user) {
          const { data: appsData } = await supabase
            .from('applications')
            .select('work_id')
            .eq('worker_id', user.id)
          
          if (appsData) {
            setAppliedWorkIds(new Set(appsData.map(a => a.work_id)))
          }

          // Fetch worker's available slots
          const { data: profileData } = await supabase
            .from('profiles')
            .select('slots')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setWorkerSlots(profileData.slots || 0)
          }
        }

        const formattedWorks = (worksData || []).map((w: any) => ({
          id: w.id,
          name: w.work_name,
          client: w.profiles?.username || "Unknown Client",
          location: w.location,
          date: w.date_work,
          payment: w.payment_amount,
          slots: w.slots,
          instruction: w.instruction,
          days: w.days,
          reportingTime: w.reporting_time,
          completionTime: w.completion_time
        }))
        
        setAvailableWorks(formattedWorks)
      } catch (err: any) {
        console.error("Error fetching works:", err)
        alert("Debug Error: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchWorks()
  }, [])

  const submitApplication = async () => {
    if (!selectedWork) return;

    if (slotsTaken > workerSlots) {
      alert(`You don't have enough slots. You have ${workerSlots} slot(s) available. Please buy more slots first.`)
      return;
    }

    if (slotsTaken > 1) {
      if (coWorkerNames.some(name => !name.trim())) {
        alert("Please fill in the names of all your co-workers.")
        return;
      }
    }

    setIsApplying(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to apply.")
        setIsApplying(false)
        return
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          work_id: selectedWork.id,
          worker_id: user.id,
          slots_taken: slotsTaken,
          co_worker_names: slotsTaken > 1 ? coWorkerNames.join(", ") : null
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert("You have already applied for this work.")
        } else if (error.code === '42703') { // Column does not exist
          alert("Database needs update. Please run the provided SQL script to add slots_taken and co_worker_names columns.")
        } else {
          throw error
        }
      } else {
        // Deduct slots from worker's profile
        const newSlots = workerSlots - slotsTaken
        await supabase
          .from('profiles')
          .update({ slots: newSlots })
          .eq('id', user.id)
        
        setWorkerSlots(newSlots)
        setAppliedWorkIds(prev => new Set(prev).add(selectedWork.id))
        closeModal()
      }
    } catch (err: any) {
      console.error("Apply error:", err)
      alert("Failed to apply: " + err.message)
    } finally {
      setIsApplying(false)
    }
  }

  const openModal = (work: any) => {
    setSelectedWork(work)
    setSlotsTaken(1)
    setCoWorkerNames([])
  }

  const closeModal = () => {
    setSelectedWork(null)
  }

  // Extract unique locations for the filter
  const locations = ["All", ...Array.from(new Set(availableWorks.map(w => w.location)))]

  // Filter and sort logic
  const filteredAndSortedWorks = useMemo(() => {
    let result = [...availableWorks]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(w => w.name.toLowerCase().includes(q))
    }

    if (locationFilter !== "All") {
      result = result.filter(w => w.location === locationFilter)
    }

    if (sortBy === "nearestDate") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === "highPayment") {
      result.sort((a, b) => b.payment - a.payment)
    }

    return result
  }, [searchQuery, locationFilter, sortBy, availableWorks])

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-5xl mx-auto mt-4">
        <div className="relative z-10 flex-shrink-0">
          <div className="text-center mb-8 pl-12 md:pl-0">
            <h1 className="text-3xl font-bold text-white mb-2">Available Works</h1>
            <p className="text-sm text-zinc-400">Find and apply for event jobs that match your skills.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search by work name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            
            <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="appearance-none pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer min-w-[140px]"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc} className="bg-zinc-900">{loc}</option>
                  ))}
                </select>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                <button 
                  onClick={() => setSortBy(sortBy === "nearestDate" ? "none" : "nearestDate")}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors", sortBy === "nearestDate" ? "bg-white text-black" : "text-zinc-400 hover:text-white")}
                >
                  <Calendar className="w-3 h-3" /> Nearest Date
                </button>
                <button 
                  onClick={() => setSortBy(sortBy === "highPayment" ? "none" : "highPayment")}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors", sortBy === "highPayment" ? "bg-white text-black" : "text-zinc-400 hover:text-white")}
                >
                  <IndianRupee className="w-3 h-3" /> High Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar relative z-10">
          <div className="grid gap-4">
            {filteredAndSortedWorks.map(work => (
              <div key={work.id} className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{work.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">{work.client}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-500" /> {work.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-zinc-500" /> {new Date(work.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2">
                  <div className="text-xl font-bold text-emerald-400 flex items-center">
                    <IndianRupee className="w-5 h-5 mr-0.5" />{work.payment}
                  </div>
                  {appliedWorkIds.has(work.id) ? (
                    <button disabled className="px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-bold rounded-full flex items-center gap-2 cursor-not-allowed">
                      <Check className="w-4 h-4" /> Applied
                    </button>
                  ) : (
                    <button onClick={() => openModal(work)} className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95">
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredAndSortedWorks.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No works found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedWork.name}</h2>
                <p className="text-sm text-zinc-400">Posted by {selectedWork.client}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Job Details Section */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MapPin className="w-4 h-4" /> Location
                  </div>
                  <div className="font-medium">{selectedWork.location}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" /> Date & Days
                  </div>
                  <div className="font-medium">{selectedWork.date} • {selectedWork.days} Day(s)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" /> Timing
                  </div>
                  <div className="font-medium">{selectedWork.reportingTime} - {selectedWork.completionTime}</div>
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

              {/* Slot Selection Section */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                  <Users className="w-5 h-5 text-zinc-400" /> Application Details
                </h3>

                {/* Slot Balance */}
                <div className="bg-white/5 p-4 rounded-xl mb-6 flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Your Available Slots</span>
                  <span className={`text-xl font-bold ${workerSlots > 0 ? 'text-white' : 'text-red-400'}`}>{workerSlots}</span>
                </div>

                {workerSlots === 0 ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm text-center">
                    You have no slots available. Please buy slots first before applying.
                  </div>
                ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      How many slots do you want to take? (Max: {Math.min(selectedWork.slots, workerSlots)})
                    </label>
                    <select
                      value={slotsTaken}
                      onChange={(e) => handleSlotChange(Number(e.target.value))}
                      className="w-full sm:w-1/2 p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                    >
                      {Array.from({ length: Math.min(selectedWork.slots, workerSlots) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num} className="bg-zinc-900">{num} Slot{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-zinc-500 mt-2">After applying: {workerSlots - slotsTaken} slot(s) remaining</p>
                  </div>

                  {slotsTaken > 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        <label className="block text-sm text-zinc-400">
                          Names of the other {slotsTaken - 1} worker(s)
                        </label>
                        {Array.from({ length: slotsTaken - 1 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <input 
                              type="text"
                              value={coWorkerNames[idx] || ""}
                              onChange={(e) => handleNameChange(idx, e.target.value)}
                              placeholder={`Worker ${idx + 1} Name`}
                              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3 items-start bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-500 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Responsibility Disclaimer:</strong> By claiming multiple slots, you confirm that you are bringing {slotsTaken - 1} additional worker(s). It is solely your responsibility to ensure that they arrive on time and complete the work correctly. Any no-shows or disputes from your team will affect your profile rating.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button 
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                disabled={isApplying}
              >
                Cancel
              </button>
              <button 
                onClick={submitApplication}
                disabled={isApplying}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isApplying ? "Applying..." : "Confirm Application"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
