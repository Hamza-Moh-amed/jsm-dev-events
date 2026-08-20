import EventDetails from "@/components/Eventdetails";
import { Loader } from "lucide-react";
import {Suspense} from "react";

const EventDetailsPage = async ({ params }: { params: Promise<{ slug: string }>}) => {
    const slug = params.then((p) => p.slug);

    return (
        <main>
            <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Loader /></div>}>
                <EventDetails params={slug} />
            </Suspense>
        </main>
    )
}
export default EventDetailsPage