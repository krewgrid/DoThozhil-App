import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/interfaces-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function LocationAutocomplete({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3 || query === value) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=` + encodeURIComponent(query) + `&limit=5&addressdetails=1`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Geocoding error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: any) => {
    setQuery(item.display_name);
    onChange(item.display_name);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input 
        type="text" 
        value={query} 
        onChange={(e) => {
           setQuery(e.target.value);
           if (!e.target.value) onChange('');
        }} 
        onFocus={() => { if(results.length > 0) setShowDropdown(true); }}
        placeholder={placeholder} 
      />
      {loading && <div className="absolute right-3 top-2.5 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md bg-zinc-900 border border-zinc-800 shadow-lg text-sm">
          {results.map((item, i) => (
            <li 
              key={i} 
              className="px-3 py-2 cursor-pointer hover:bg-zinc-800 text-zinc-300 border-b border-zinc-800/50 last:border-0"
              onClick={() => handleSelect(item)}
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [hour, setHour] = useState("10")
  const [minute, setMinute] = useState("00")
  const [ampm, setAmpm] = useState("AM")

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":")
      let hourNum = parseInt(h, 10)
      if (hourNum >= 12) {
        setAmpm("PM")
        if (hourNum > 12) hourNum -= 12
      } else {
        setAmpm("AM")
        if (hourNum === 0) hourNum = 12
      }
      setHour(hourNum.toString().padStart(2, '0'))
      setMinute(m)
    }
  }, [value])

  const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
    let h = parseInt(newHour, 10)
    if (newAmpm === "PM" && h < 12) h += 12
    if (newAmpm === "AM" && h === 12) h = 0
    onChange(`${h.toString().padStart(2, '0')}:${newMinute}`)
  }

  // Ensure initial value is set if empty
  useEffect(() => {
    if (!value) {
      updateTime(hour, minute, ampm)
    }
  }, [])

  return (
    <div className="flex gap-2">
      <select 
        value={hour} 
        onChange={(e) => { 
          setHour(e.target.value); 
          updateTime(e.target.value, minute, ampm); 
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
          <option key={h} value={h.toString().padStart(2, '0')} className="bg-zinc-900">{h.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <select 
        value={minute} 
        onChange={(e) => { 
          setMinute(e.target.value); 
          updateTime(hour, e.target.value, ampm); 
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {Array.from({length: 60}, (_, i) => i).map(m => (
          <option key={m} value={m.toString().padStart(2, '0')} className="bg-zinc-900">{m.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <select 
        value={ampm} 
        onChange={(e) => { 
          setAmpm(e.target.value); 
          updateTime(hour, minute, e.target.value); 
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="AM" className="bg-zinc-900">AM</option>
        <option value="PM" className="bg-zinc-900">PM</option>
      </select>
    </div>
  )
}

export function PostWorkView() {
  const [requirePhoto, setRequirePhoto] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Form State
  const [workName, setWorkName] = useState("")
  const [instruction, setInstruction] = useState("")
  const [slots, setSlots] = useState("1")
  const [days, setDays] = useState("1")
  const [dateWork, setDateWork] = useState("")
  const [location, setLocation] = useState("")
  const [reportingTime, setReportingTime] = useState("")
    const [workDuration, setWorkDuration] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentCredit, setPaymentCredit] = useState("")

  const handleBroadcast = async () => {
    setLoading(true)
    setErrorMsg("")
    setSuccess(false)

    if (!workName || !instruction || !slots || !days || !dateWork || !location || !reportingTime || !workDuration || !paymentAmount || !paymentCredit) {
      setErrorMsg("All fields are required. Please fill in all the details.")
      setLoading(false)
      return
    }

    if (new Date(paymentCredit) < new Date(dateWork)) {
      setErrorMsg("Payment credit date cannot be before the date of work.")
      setLoading(false)
      return
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workDateObj = new Date(dateWork);
    // When parsing YYYY-MM-DD, it might parse as UTC midnight, which could shift timezone. 
    // To be safe, we parse the date string parts to local midnight:
    const [year, month, day] = dateWork.split('-');
    const localWorkDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (localWorkDate < today) {
      setErrorMsg("Date of work cannot be in the past.")
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("You must be logged in to post work.")
      }

      const { error } = await supabase.from('works').insert({
        client_id: user.id,
        work_name: workName,
        instruction: instruction,
        slots: parseInt(slots) || 1,
        days: parseInt(days) || 1,
        date_work: dateWork,
        location: location,
        reporting_time: reportingTime,
        completion_time: workDuration ? `${workDuration} hrs` : "",
        payment_amount: parseFloat(paymentAmount) || 0,
        payment_credit: paymentCredit,
        require_photo: requirePhoto,
        require_approval: requireApproval
      })

      if (error) throw error

      setSuccess(true)
      // Reset form
      setWorkName("")
      setInstruction("")
      setSlots("1")
      setDays("1")
      setDateWork("")
      setLocation("")
      setReportingTime("")
      setWorkDuration("")
      setPaymentAmount("")
      setPaymentCredit("")
      setRequirePhoto(false)
      setRequireApproval(false)
      
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">
      <div className="w-full max-w-3xl mx-auto mt-4">
        

        <FieldGroup className="mt-8">
          <FieldSet>
            <div>
              <FieldLegend>Post a work</FieldLegend>
              <FieldDescription>Fill in the details to broadcast your event requirement to workers</FieldDescription>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                <FieldLabel htmlFor="work-name">Work Name</FieldLabel>
                <FieldContent>
                    <Input id="work-name" value={workName} onChange={(e) => setWorkName(e.target.value)} placeholder="E.g., Stage Setup, Registration Desk" />
                </FieldContent>
                </Field>
                <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <FieldContent>
                  <LocationAutocomplete value={location} onChange={setLocation} placeholder="Search venue location..." />
                </FieldContent>
                </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="work-instruction">Work Instruction</FieldLabel>
              <FieldContent>
                <Textarea id="work-instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Provide detailed instructions for the workers..." className="min-h-24 resize-none" />
              </FieldContent>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="total-slots">Total Number of Slots</FieldLabel>
                <FieldContent>
                  <Input id="total-slots" value={slots} onChange={(e) => setSlots(e.target.value)} type="number" placeholder="5" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="num-days">Number of Days</FieldLabel>
                <FieldContent>
                  <Input id="num-days" value={days} onChange={(e) => setDays(e.target.value)} type="number" placeholder="1" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-work">Date of Work</FieldLabel>
                <FieldContent>
                  <Input id="date-work" value={dateWork} onChange={(e) => setDateWork(e.target.value)} type="date" />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="reporting-time">Starting Time</FieldLabel>
                    <FieldContent>
                      <CustomTimePicker value={reportingTime} onChange={setReportingTime} />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="work-duration">Work Duration (Hours)</FieldLabel>
                    <FieldContent>
                    <Input id="work-duration" value={workDuration} onChange={(e) => setWorkDuration(e.target.value)} type="number" placeholder="e.g. 5" />
                    </FieldContent>
                </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="payment-amount">Payment Amount (₹)</FieldLabel>
                    <FieldContent>
                    <Input id="payment-amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" placeholder="1000" />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="payment-credit">Payment will Credit on</FieldLabel>
                    <FieldContent>
                    <Input id="payment-credit" value={paymentCredit} onChange={(e) => setPaymentCredit(e.target.value)} type="date" />
                    </FieldContent>
                </Field>
            </div>
            
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <div>
              <FieldLegend>Requirements</FieldLegend>
              <FieldDescription>
                Additional criteria for workers to apply
              </FieldDescription>
            </div>

            <Field orientation="horizontal">
              <Checkbox
                id="require-photo"
                checked={requirePhoto}
                onCheckedChange={(checked) => setRequirePhoto(checked === true)}
              />
              <FieldLabel htmlFor="require-photo">Require worker photo</FieldLabel>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="require-approval"
                checked={requireApproval}
                onCheckedChange={(checked) => setRequireApproval(checked === true)}
              />
              <FieldLabel htmlFor="require-approval">Require My Approval</FieldLabel>
            </Field>

            {errorMsg && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 mt-4">
                {errorMsg}
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-500/15 text-emerald-400 text-sm p-3 rounded-md border border-emerald-500/20 mt-4">
                Work posted successfully!
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row mt-4">
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 w-full disabled:opacity-50"
              >
                {loading ? "Broadcasting..." : "Broadcast work"}
              </button>
            </div>
          </FieldSet>
        </FieldGroup>
      </div>
    </div>
  )
}
