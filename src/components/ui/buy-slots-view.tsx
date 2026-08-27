import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import GlassRadioGroup from "./glass-radio-group"

export function BuySlotsView() {
  const [plan, setPlan] = useState("silver")
  const [currentSlots, setCurrentSlots] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  const details: Record<string, { price: number; slots: number; theme: string }> = {
    silver: { 
      price: 200, 
      slots: 10,
      theme: "text-zinc-300"
    },
    gold: { 
      price: 500, 
      slots: 30,
      theme: "text-yellow-400"
    },
    platinum: { 
      price: 750, 
      slots: 50,
      theme: "text-sky-300"
    },
  }

  useEffect(() => {
    async function fetchSlots() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('slots')
        .eq('id', user.id)
        .single()

      if (data) setCurrentSlots(data.slots || 0)
      setLoading(false)
    }
    fetchSlots()
  }, [])

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("Please log in.")

      const slotsToAdd = details[plan].slots
      const newTotal = currentSlots + slotsToAdd

      const { error } = await supabase
        .from('profiles')
        .update({ slots: newTotal })
        .eq('id', user.id)

      if (error) throw error

      setCurrentSlots(newTotal)
      alert(`Successfully added ${slotsToAdd} slots! You now have ${newTotal} slots.`)
    } catch (err: any) {
      alert("Purchase failed: " + err.message)
    } finally {
      setPurchasing(false)
    }
  }

  const selectedDetails = details[plan]

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-md mx-auto mt-4 text-center">
        
        {/* Current Slots Banner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8">
          <p className="text-sm text-zinc-400 mb-1">Your Available Slots</p>
          <div className="text-5xl font-extrabold text-white">
            {loading ? "..." : currentSlots}
          </div>
        </div>

        <div className="mt-4 relative z-10 mb-10">
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
           <div className="text-5xl font-extrabold text-white mb-2">₹{selectedDetails.price}</div>
           <div className="text-lg font-semibold text-zinc-300 mb-2">{selectedDetails.slots} slots</div>
           <div className="text-sm text-zinc-500 mb-8">New balance: {currentSlots + selectedDetails.slots} slots</div>

           <button 
             onClick={handlePurchase}
             disabled={purchasing}
             className="w-full py-4 rounded-xl font-bold bg-white text-black transition-transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {purchasing ? "Processing..." : "Proceed to Payment"}
           </button>
        </div>
      </div>
    </div>
  )
}

