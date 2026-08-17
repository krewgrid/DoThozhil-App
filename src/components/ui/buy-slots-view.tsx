import { useState } from "react"
import GlassRadioGroup from "./glass-radio-group"

export function BuySlotsView() {
  const [plan, setPlan] = useState("silver")

  const details: Record<string, { price: string; slots: string; theme: string }> = {
    silver: { 
      price: "200rs", 
      slots: "10 slots",
      theme: "text-zinc-300"
    },
    gold: { 
      price: "500rs", 
      slots: "30 slots",
      theme: "text-yellow-400"
    },
    platinum: { 
      price: "750rs", 
      slots: "50 slots",
      theme: "text-sky-300"
    },
  }

  const selectedDetails = details[plan]

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-md mx-auto mt-4 text-center">
        
        <div className="mt-8 relative z-10 mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Buy Slots</h1>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Choose the tier that best fits your workflow.
          </p>
        </div>

        <div className="flex justify-center mb-10 w-full overflow-x-auto pb-4">
          <GlassRadioGroup value={plan} onChange={setPlan} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden transition-all duration-500">
           {/* Subtle glow effect behind the card based on plan */}
           <div className={`absolute inset-0 opacity-20 transition-all duration-500 ${plan === 'gold' ? 'bg-yellow-400' : plan === 'platinum' ? 'bg-sky-400' : 'bg-zinc-400'} blur-3xl rounded-full scale-150 -z-10`} />

           <h2 className={`text-2xl font-bold mb-2 capitalize ${selectedDetails.theme}`}>{plan}</h2>
           <div className="text-5xl font-extrabold text-white mb-2">{selectedDetails.price}</div>
           <div className="text-lg font-semibold text-zinc-300 mb-8">{selectedDetails.slots}</div>

           <button className="w-full py-4 rounded-xl font-bold bg-white text-black transition-transform hover:scale-105 active:scale-95 shadow-lg">
             Proceed to Payment
           </button>
        </div>
      </div>
    </div>
  )
}
