import { notFound } from "next/navigation"


const BASE_URL = process.env.NEXT_PUBLIC_API_URL

const EventDetails = async ({params}: {params: Promise<{slug: string}>}) => {
    const {slug} = await params

    const request = await fetch(`${BASE_URL}/api/events/${slug}`)
    const event = await request.json()

    if(!event) return notFound()

  return (
    <section>
     <h1>
        Event Details: <br /> {slug}
     </h1>    
    </section>
  )
}

export default EventDetails