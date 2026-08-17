import { ArrowLeft, Check, Sparkles } from "lucide-react"

export function BuySlotsView() {
  const tiers = [
    {
      name: "Silver",
      price: "₹200",
      slots: "10 Slots",
      description: "Perfect for getting started with occasional jobs.",
      features: ["10 Job Applications", "Standard visibility", "Basic support"],
      color: "text-zinc-300",
      bg: "bg-zinc-300/10",
      border: "border-zinc-300/20",
      buttonBg: "bg-zinc-300",
      buttonText: "text-black",
      popular: false
    },
    {
      name: "Gold",
      price: "₹500",
      slots: "30 Slots",
      description: "Great for active workers looking for regular gigs.",
      features: ["30 Job Applications", "Priority visibility", "Faster support", "Profile highlighting"],
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/30",
      buttonBg: "bg-yellow-400",
      buttonText: "text-black",
      popular: true
    },
    {
      name: "Platinum",
      price: "₹750",
      slots: "50 Slots",
      description: "The best value for full-time event professionals.",
      features: ["50 Job Applications", "Top visibility", "24/7 Priority support", "Premium profile badge"],
      color: "text-sky-300",
      bg: "bg-sky-300/10",
      border: "border-sky-300/20",
      buttonBg: "bg-sky-300",
      buttonText: "text-black",
      popular: false
    }
  ]

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-5xl mx-auto mt-4">
        

        <div className="mt-8 relative z-10 text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Buy Slots</h1>
          <p className="text-base text-zinc-400 max-w-lg mx-auto">
            Purchase slots to apply for premium event jobs. Choose the tier that best fits your workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl ${tier.border} ${tier.popular ? 'bg-white/10' : 'bg-white/5'}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={`text-xl font-bold ${tier.color} mb-2`}>{tier.name}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                </div>
                <div className="text-lg font-semibold text-white mb-2">{tier.slots}</div>
                <p className="text-sm text-zinc-400">{tier.description}</p>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-grow">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className={`w-5 h-5 shrink-0 ${tier.color}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 ${tier.buttonBg} ${tier.buttonText}`}>
                Select {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
