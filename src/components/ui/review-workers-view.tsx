import { useState } from "react"
import { ArrowLeft, Star } from "lucide-react"
import { cn } from "@/lib/utils"

const works = [
  { id: "WRK-A1B2C", name: "Stage Setup for Concert", date: "Oct 24", completed: true },
  { id: "WRK-X9Y8Z", name: "Registration Desk", date: "Oct 21", completed: true },
  { id: "WRK-M4N5P", name: "Catering Support", date: "Oct 18", completed: true },
]

const workersByWork: Record<string, any[]> = {
  "WRK-A1B2C": [
    { id: "W1", name: "Aman Singh", avatar: "https://i.pravatar.cc/150?u=a" },
    { id: "W2", name: "Priya Patel", avatar: "https://i.pravatar.cc/150?u=b" }
  ],
  "WRK-X9Y8Z": [
    { id: "W3", name: "Rahul Kumar", avatar: "https://i.pravatar.cc/150?u=c" }
  ],
  "WRK-M4N5P": [
    { id: "W4", name: "Neha Gupta", avatar: "https://i.pravatar.cc/150?u=d" },
    { id: "W5", name: "Vikram Sharma", avatar: "https://i.pravatar.cc/150?u=e" }
  ]
}

function StarRating({ rating, setRating }: { rating: number, setRating: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star 
            className={cn("w-6 h-6", (hover || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} 
          />
        </button>
      ))}
    </div>
  )
}

function WorkerReviewCard({ worker }: { worker: any }) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="font-medium text-white">{worker.name}</div>
            <div className="text-xs text-emerald-300">Review submitted successfully</div>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border border-white/10 bg-white/5 rounded-xl flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="font-medium text-white">{worker.name}</div>
      </div>
      <div>
        <div className="text-sm text-zinc-400 mb-2">Rating</div>
        <StarRating rating={rating} setRating={setRating} />
      </div>
      <div>
        <div className="text-sm text-zinc-400 mb-2">Write about the worker (optional)</div>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="How was their performance?"
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none min-h-24"
        />
      </div>
      <button 
        onClick={() => setSubmitted(true)}
        disabled={rating === 0}
        className="self-end px-6 py-2 bg-white text-black text-sm font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
      >
        Submit Review
      </button>
    </div>
  )
}

export function ReviewWorkersView() {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)

  const handleBack = () => {
    if (selectedWorkId) {
      setSelectedWorkId(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-2xl mx-auto mt-4">
        

        <div className="mt-8 relative z-10">
          {!selectedWorkId ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Review Workers</h1>
                <p className="text-sm text-zinc-400 mt-1">Select a completed work to review the workers who participated.</p>
              </div>

              <div className="flex flex-col gap-3">
                {works.map(work => (
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
                <p className="text-sm text-zinc-400 mt-1">Please provide a 5-star rating and optional feedback for each worker.</p>
              </div>

              <div className="flex flex-col gap-4">
                {workersByWork[selectedWorkId]?.map(worker => (
                  <WorkerReviewCard key={worker.id} worker={worker} />
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
