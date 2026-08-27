import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
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
  const [completionTime, setCompletionTime] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentCredit, setPaymentCredit] = useState("")

  const handleBroadcast = async () => {
    setLoading(true)
    setErrorMsg("")
    setSuccess(false)

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
        completion_time: completionTime,
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
      setCompletionTime("")
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
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Full address of the venue" />
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
                <FieldLabel htmlFor="date-work">Date(s) of Work</FieldLabel>
                <FieldContent>
                  <Input id="date-work" value={dateWork} onChange={(e) => setDateWork(e.target.value)} placeholder="e.g. 24 Oct - 26 Oct" />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="reporting-time">Reporting Time</FieldLabel>
                    <FieldContent>
                    <Input id="reporting-time" value={reportingTime} onChange={(e) => setReportingTime(e.target.value)} type="time" />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="completion-time">Completion Time</FieldLabel>
                    <FieldContent>
                    <Input id="completion-time" value={completionTime} onChange={(e) => setCompletionTime(e.target.value)} type="time" />
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
                    <Input id="payment-credit" value={paymentCredit} onChange={(e) => setPaymentCredit(e.target.value)} placeholder="e.g. Within 2 days of completion" />
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
