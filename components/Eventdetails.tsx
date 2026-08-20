import BookEvent from "@/components/BookEvent"
import EventCard from "@/components/EventCard"
import { IEvent } from "@/database"
import { getSimilarEventsBySlug } from "@/lib/actions/event-actions"
import Image from "next/image"


const BASE_URL = process.env.NEXT_PUBLIC_API_URL

const EventDetailItem = ({icon, alt, lable}: {icon: string, alt: string, lable: string, }) => (
  <div className="flex-row-gap-2 items-center">
    <Image
    src={icon}
    alt={alt}
    width={17}
    height={17}
    />
    <p>
      {lable}
    </p>
    </div>
)

const EventAgenda = ({agendaItems}: {agendaItems: string[]}) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item, index) => (
        <li key={index}>
            {item}
        </li>
      ))}
    </ul>
  </div>
)

const EventTags = ({tags}: {tags: string[]}) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <div key={tag} className="pill">
          {tag}
        </div>
      ))}
    
  </div>
)

const EventDetails = async ({ params }: { params: Promise<string> }) => {
    
    const slug = await params;

    const request = await fetch(`${BASE_URL}/api/events/${slug}`)
    const {event} = await request.json()
    const {description, overview, image, location, date, time, mode, audience, agenda, organizer, tags} = event

  const bookings = 10
  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug)

  return (
    <section id="event">

      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">

        <div className="content">
          <Image
          src={image}
          alt="event banner"
          width={800}
          height={800}
          className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" lable={date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" lable={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" lable={location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" lable={mode} />
            <EventDetailItem icon="/icons/audience.svg" alt="audience" lable={audience} />
          </section>

          <EventAgenda agendaItems={agenda} />


          <section className="flex-col-gap-2">
            <h2>About the Orginzer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />

        </div>

        
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p> 
            )
              : (
                <p>
                  Be the fisrt to book your spot
              </p>
              )
            }

            <BookEvent eventId={event._id} slug={event.slug} />
          </div>
        </aside>
      </div>
      
      <div className="flex w-full flex-col gap-4 pt-20">
            <h2>Similar Events</h2>
            <div className="events">
              {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                <EventCard key={similarEvent.title} {...similarEvent} />
              ))}
            </div>
      </div>


    </section>
  )
}

export default EventDetails