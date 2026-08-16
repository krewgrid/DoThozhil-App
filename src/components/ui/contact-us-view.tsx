import { ArrowLeft, Mail, Phone, Clock, MapPin } from "lucide-react"

export function ContactUsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex w-full min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-sm md:p-10 relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-zinc-400 hover:text-white transition-colors z-20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="mt-8 relative z-10">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Contact Us</h1>
            <p className="text-sm text-zinc-400 font-medium">We're here to help you with any questions or issues.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            
            <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Email</span>
                <a href="mailto:support@krewgrid.com" className="text-white font-medium hover:underline">support@krewgrid.com</a>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">WhatsApp</span>
                <span className="text-white font-medium">+91 98765 43210</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Working Hours</span>
                <span className="text-white font-medium block">9:00 AM - 4:00 PM</span>
                <span className="text-xs text-zinc-500 font-medium">(Mon - Fri)</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Location</span>
                <span className="text-white font-medium">Kerala, India</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
