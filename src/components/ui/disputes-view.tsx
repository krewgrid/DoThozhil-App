import { useState, useRef } from "react"
import { ArrowLeft, AlertTriangle, Upload, CheckCircle2, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data representing client no-show reports against this worker
const noShowReports = [
  { 
    id: "REP-99X2", 
    workId: "WRK-Z7X9Y", 
    workName: "VIP Lounge Security", 
    clientName: "Global Summits Inc.",
    date: "Yesterday, 8:00 PM",
    status: "Action Required"
  }
]

function DisputeForm({ report, onCancel, onSubmit }: { report: any, onCancel: () => void, onSubmit: () => void }) {
  const [reason, setReason] = useState("")
  const [proofImage, setProofImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setProofImage(imageUrl)
    }
  }

  return (
    <div className="mt-4 p-4 border border-white/20 bg-black/40 rounded-xl">
      <h4 className="text-white font-semibold mb-3">File a Dispute</h4>
      <p className="text-xs text-zinc-400 mb-4">
        If you believe this report is incorrect, provide your reasoning and upload photographic proof that you were present at the venue.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Reason for dispute</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this No-Show report is invalid..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none min-h-24"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Photographic Proof (Required)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative",
              proofImage ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/20 bg-white/5 hover:bg-white/10"
            )}
          >
            {proofImage ? (
              <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                <span className="text-sm text-zinc-400">Click to upload image</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-2">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-zinc-400 text-sm font-medium hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onSubmit}
            disabled={!reason.trim() || !proofImage}
            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
          >
            Submit Dispute
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: any }) {
  const [isDisputing, setIsDisputing] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (isSubmitted) {
    return (
      <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-medium text-white line-through opacity-70">{report.workName}</div>
            <div className="text-sm text-emerald-300 font-medium">Dispute Filed Successfully</div>
            <div className="text-xs text-emerald-300/70 mt-0.5">Our team will review your proof shortly.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-xs text-red-400 font-bold tracking-wider uppercase mb-1">No-Show Reported</div>
            <div className="font-bold text-white text-lg">{report.workName}</div>
            <div className="flex items-center gap-1 text-sm text-zinc-300 mt-1">
              <Building2 className="w-4 h-4" /> {report.clientName}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Reported on: {report.date}</div>
          </div>
        </div>
        {!isDisputing && (
          <button 
            onClick={() => setIsDisputing(true)}
            className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors border border-white/10"
          >
            File Dispute
          </button>
        )}
      </div>

      {isDisputing && (
        <DisputeForm 
          report={report} 
          onCancel={() => setIsDisputing(false)} 
          onSubmit={() => setIsSubmitted(true)} 
        />
      )}
    </div>
  )
}

export function DisputesView() {
  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-3xl mx-auto mt-4">
        

        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Disputes</h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              View reports against your profile and file disputes if you have proof of attendance.
            </p>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-8">
            {noShowReports.length > 0 ? (
              noShowReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <div className="text-center py-20">
                <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">You have no active reports against you.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
