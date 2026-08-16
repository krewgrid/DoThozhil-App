import { useState } from "react"
import { ArrowLeft, Star, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

const myPastWorks = [
  { id: "WRK-A1B2C", name: "Stage Setup for Concert", date: "Oct 24", clientName: "EventMaster Pro", completed: true },
  { id: "WRK-X9Y8Z", name: "Registration Desk", date: "Oct 21", clientName: "Global Summits Inc.", completed: true },
]

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

function ClientReviewCard({ clientName }: { clientName: string }) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-medium text-white">{clientName}</div>
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
    <div className="p-4 border border-white/10 bg-white/5 rounded-xl flex flex-col gap-4 mt-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="font-medium text-white">{clientName}</div>
      </div>
      <div>
        <div className="text-sm text-zinc-400 mb-2">Rating</div>
        <StarRating rating={rating} setRating={setRating} />
      </div>
      <div>
        <div className="text-sm text-zinc-400 mb-2">Write about the client (optional)</div>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="How was your experience working with this client?"
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

export function ReviewClientsView({ onBack }: { onBack: () => void }) {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)

  const handleBack = () => {
    if (selectedWorkId) {
      setSelectedWorkId(null)
    } else {
      onBack()
    }
  }

  const selectedWork = myPastWorks.find(w => w.id === selectedWorkId)

  return (
    <div className="flex w-full min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-sm md:p-8 relative">
        <button 
          onClick={handleBack}
          className="absolute top-8 left-8 text-zinc-400 hover:text-white transition-colors z-20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="mt-8 relative z-10">
          {!selectedWorkId ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Review Clients</h1>
                <p className="text-sm text-zinc-400 mt-1">Select a past work to leave a review for the client.</p>
              </div>

              <div className="flex flex-col gap-3">
                {myPastWorks.map(work => (
                  <button 
                    key={work.id}
                    onClick={() => setSelectedWorkId(work.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div>
                      <div className="text-zinc-400 font-mono text-xs mb-1">{work.id}</div>
                      <div className="font-medium text-white">{work.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {work.clientName}
                      </div>
                    </div>
                    <div className="text-sm text-zinc-400">{work.date}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Review Client</h1>
                <p className="text-sm text-zinc-400 mt-1">For work: <span className="text-white font-medium">{selectedWork?.name}</span> ({selectedWorkId})</p>
              </div>

              {selectedWork && (
                <ClientReviewCard clientName={selectedWork.clientName} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
