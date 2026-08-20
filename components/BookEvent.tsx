"use client"

import { createBooking } from "@/lib/actions/booking-actions"
import { useState } from "react"

const BookEvent = ({eventId, slug}: {eventId: string, slug: string}) => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    const {success} = await createBooking({eventId, slug, email})
    if(success) {
      setSubmitted(true)
    } else {
      console.error("Failed to create Booking")
    }    
  }


  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up!</p>
      ): (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">
              Email Address
            </label>
            <input
            type="email"
            placeholder="Enter Your Email Address"
            id="email"
            value={email}
            onChange={((e) => setEmail(e.target.value))}
            />         
          </div>
          <button type="submit" className="button-submit">
            Submit
          </button>
        </form>
      )}

    </div>
  )
}

export default BookEvent