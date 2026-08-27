import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Upload, User, KeyRound, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export function ProfileView({ onBack, role }: { onBack: () => void, role: "client" | "worker" }) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [userDetails, setUserDetails] = useState({
    username: "Loading...",
    email: "Loading...",
    contactNumber: "Loading...",
    whatsappNumber: "Loading...",
    accountType: role === "client" ? "Client" : "Worker",
    joinedDate: "Loading...",
    referralCode: "Loading..."
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) throw profileError

          if (profile) {
            const date = new Date(profile.created_at)
            setUserDetails({
              username: profile.username || "User",
              email: user.email || "",
              contactNumber: profile.contact || "Not provided",
              whatsappNumber: profile.whatsapp || "Not provided",
              accountType: profile.role === "client" ? "Client" : profile.role === "worker" ? "Worker" : "Admin",
              joinedDate: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              referralCode: profile.referral_code || "None"
            })
          }
        }
      } catch (err: any) {
        console.error("Profile load error:", err)
        setUserDetails({
          username: "Error loading profile",
          email: err.message,
          contactNumber: "Error",
          whatsappNumber: "Error",
          accountType: "Error",
          joinedDate: "Error",
          referralCode: "Error"
        })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setProfilePhoto(imageUrl)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(false)
    setPasswordSuccess(true)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-2xl mx-auto mt-4">
        

        <div className="mt-8 relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group cursor-pointer mb-4" onClick={handlePhotoClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-white/5 flex items-center justify-center transition-all group-hover:border-white/30">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-zinc-500" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{userDetails.username}</h1>
            <p className="text-sm text-zinc-400 font-medium">{userDetails.accountType} Account</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1 p-4 rounded-xl border border-white/10 bg-white/5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Email Address</span>
              <span className="text-white font-medium">{userDetails.email}</span>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl border border-white/10 bg-white/5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Contact Number</span>
              <span className="text-white font-medium">{userDetails.contactNumber}</span>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl border border-white/10 bg-white/5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">WhatsApp Number</span>
              <span className="text-white font-medium">{userDetails.whatsappNumber}</span>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl border border-white/10 bg-white/5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Member Since</span>
              <span className="text-white font-medium">{userDetails.joinedDate}</span>
            </div>
          </div>
          
          {userDetails.accountType === "Worker" && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white mb-2">Referral Code</h3>
              <p className="text-sm text-zinc-400 mb-4">Share this code with friends. When they sign up, you both get 5 free slots!</p>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 max-w-sm">
                <span className="text-xl text-white font-mono font-bold tracking-widest">{userDetails.referralCode}</span>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
            
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-sm text-emerald-300">
                <Check className="w-4 h-4" /> Password updated successfully
              </div>
            )}

            {!isChangingPassword ? (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                <KeyRound className="w-4 h-4" /> Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="max-w-sm flex flex-col gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Current Password</label>
                  <Input type="password" required className="bg-black/40 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">New Password</label>
                  <Input type="password" required className="bg-black/40 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Confirm New Password</label>
                  <Input type="password" required className="bg-black/40 border-white/10 text-white" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 bg-transparent text-zinc-400 text-sm font-medium rounded-lg hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
