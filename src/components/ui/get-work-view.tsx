import { useState, useMemo } from "react"
import { ArrowLeft, Search, MapPin, Calendar, IndianRupee, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const availableWorks = []

export function GetWorkView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"none" | "nearestDate" | "highPayment">("none")

  // Extract unique locations for the filter
  const locations = ["All", ...Array.from(new Set(availableWorks.map(w => w.location)))]

  // Filter and sort logic
  const filteredAndSortedWorks = useMemo(() => {
    let result = [...availableWorks]

    // 1. Filter by Name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(w => w.name.toLowerCase().includes(q))
    }

    // 2. Filter by Location
    if (locationFilter !== "All") {
      result = result.filter(w => w.location === locationFilter)
    }

    // 3. Sort
    if (sortBy === "nearestDate") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === "highPayment") {
      result.sort((a, b) => b.payment - a.payment)
    }

    return result
  }, [searchQuery, locationFilter, sortBy])

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
                  <button className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95">
                    Apply Now
                  </button>
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
    </div>
  )
}
