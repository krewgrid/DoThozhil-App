import { ArrowLeft, Mail, Phone, Clock, MapPin } from "lucide-react"

export function ContactUsView() {
  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-2xl mx-auto mt-4">
        

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
