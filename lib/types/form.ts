// 📝 TYPE-SAFE form data structures
// Separated from database models to avoid MongoDB document methods

import { IEvent } from '@/database/event.model';

/**
 * Form input type - represents what the user submits
 * Uses plain objects, NOT Mongoose documents (no $, validateSync, etc.)
 */
export type CreateEventFormInput = {
  title: string;
  description: string;
  overview: string;
  image: File;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: 'online' | 'offline' | 'hybrid';
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
};

/**
 * Form state type - includes UI metadata
 */
export interface FormState {
  isLoading: boolean;
  isSubmitting: boolean;
  errors: FormErrors;
  successMessage: string | null;
  formData: Partial<CreateEventFormInput>;
}

/**
 * Field-level error tracking
 */
export type FormErrors = Partial<
  Record<keyof CreateEventFormInput | 'submit', string>
>;
/**
 * API Response type for consistent error/success handling
 */
export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
  errors?: Record<string, string>;
  status: number;
}

/**
 * Event mode enum for type-safe mode selection
 */
export const EVENT_MODES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  HYBRID: 'hybrid',
} as const;

export type EventMode = (typeof EVENT_MODES)[keyof typeof EVENT_MODES];