// ⚠️ API Route: Production-ready with proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';
import { validateEventForm } from '@/lib/validation/eventSchema';

/**
 * ✅ Cloudinary configuration
 * 🔐 Ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is in .env.local
 */
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  console.warn(
    '⚠️ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not found. Extract from CLOUDINARY_URL if needed.'
  );
}

/**
 * POST /api/events
 * Create a new event with image upload to Cloudinary
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Connect to database
    await connectDB();

    // Step 2: Parse FormData
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      return NextResponse.json(
        {
          message: 'Invalid form data',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Step 3: Extract and validate image
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          message: 'Image file is required',
          status: 400,
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          message: 'Image must be under 5MB',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Step 4: Convert FormData to object
    const eventData: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key !== 'image') {
        // Parse JSON arrays
        if (key === 'agenda' || key === 'tags') {
          try {
            eventData[key] = JSON.parse(String(value));
          } catch {
            eventData[key] = value;
          }
        } else {
          eventData[key] = value;
        }
      }
    }

    // Step 5: Validate all fields
    const validationErrors = validateEventForm({
      ...eventData,
      image: file,
    } as any);

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: validationErrors,
          status: 422,
        },
        { status: 422 }
      );
    }

    // Step 6: Upload image to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult: { secure_url: string } | null = null;

    try {
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'jsm-event',
            max_file_size: 5242880, // 5MB
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        );

        stream.end(buffer);
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return NextResponse.json(
        {
          message: 'Image upload failed',
          status: 500,
        },
        { status: 500 }
      );
    }

    if (!uploadResult?.secure_url) {
      return NextResponse.json(
        {
          message: 'Image upload failed',
          status: 500,
        },
        { status: 500 }
      );
    }

    // Step 7: Create event document
    const eventPayload = {
      ...eventData,
      image: uploadResult.secure_url,
    };

    const createdEvent = await Event.create(eventPayload);

    // Step 8: Return success response
    return NextResponse.json(
      {
        message: 'Event created successfully',
        data: createdEvent,
        status: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Event creation error:', error);

    // Distinguish error types
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('validation') || message.includes('unique')) {
        return NextResponse.json(
          {
            message: 'Invalid event data',
            status: 400,
          },
          { status: 400 }
        );
      }

      if (message.includes('connect')) {
        return NextResponse.json(
          {
            message: 'Database connection failed',
            status: 503,
          },
          { status: 503 }
        );
      }
    }

    // 🚨 Always return valid JSON
    return NextResponse.json(
      {
        message: 'Event creation failed',
        status: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 * Fetch all events
 */
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Events fetched successfully',
        data: events,
        status: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Event fetching error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch events',
        status: 500,
      },
      { status: 500 }
    );
  }
}