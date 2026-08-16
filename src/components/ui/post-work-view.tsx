import { useState } from "react"
import { ArrowLeft } from "lucide-react"

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

export function PostWorkView({ onBack }: { onBack: () => void }) {
  const [requirePhoto, setRequirePhoto] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)

  // generate a fake id
  const workId = "WRK-" + Math.random().toString(36).substring(2, 9).toUpperCase()

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl rounded-3xl border bg-background p-6 shadow-sm md:p-8 relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <FieldGroup className="mt-8">
          <FieldSet>
            <div>
              <FieldLegend>Post a work</FieldLegend>
              <FieldDescription>Fill in the details to broadcast your event requirement to workers</FieldDescription>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                <FieldLabel htmlFor="work-id">Work ID</FieldLabel>
                <FieldContent>
                    <Input id="work-id" defaultValue={workId} readOnly className="bg-muted text-muted-foreground" />
                </FieldContent>
                </Field>

                <Field>
                <FieldLabel htmlFor="work-name">Work Name</FieldLabel>
                <FieldContent>
                    <Input id="work-name" placeholder="E.g., Stage Setup, Registration Desk" />
                </FieldContent>
                </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="work-instruction">Work Instruction</FieldLabel>
              <FieldContent>
                <Textarea id="work-instruction" placeholder="Provide detailed instructions for the workers..." className="min-h-24 resize-none" />
              </FieldContent>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="total-slots">Total Number of Slots</FieldLabel>
                <FieldContent>
                  <Input id="total-slots" type="number" placeholder="5" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="num-days">Number of Days</FieldLabel>
                <FieldContent>
                  <Input id="num-days" type="number" placeholder="1" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-work">Date(s) of Work</FieldLabel>
                <FieldContent>
                  <Input id="date-work" placeholder="e.g. 24 Oct - 26 Oct" />
                </FieldContent>
              </Field>
            </div>

            <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <FieldContent>
                  <Input id="location" placeholder="Full address of the venue" />
                </FieldContent>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="reporting-time">Reporting Time</FieldLabel>
                    <FieldContent>
                    <Input id="reporting-time" type="time" />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="completion-time">Completion Time</FieldLabel>
                    <FieldContent>
                    <Input id="completion-time" type="time" />
                    </FieldContent>
                </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="payment-amount">Payment Amount (₹)</FieldLabel>
                    <FieldContent>
                    <Input id="payment-amount" type="number" placeholder="1000" />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="payment-credit">Payment will Credit on</FieldLabel>
                    <FieldContent>
                    <Input id="payment-credit" placeholder="e.g. Within 2 days of completion" />
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

            <div className="flex flex-col gap-3 sm:flex-row mt-4">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 w-full"
              >
                Broadcast work
              </button>
            </div>
          </FieldSet>
        </FieldGroup>
      </div>
    </div>
  )
}
