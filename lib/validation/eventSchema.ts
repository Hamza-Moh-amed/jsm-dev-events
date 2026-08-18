// 🔐 Validation schema - single source of truth
// Use type-safe accessors to avoid union type errors

import { CreateEventFormInput, FormErrors } from '@/lib/types/form';

/**
 * Validation rules for each field
 * Type-safe with discriminated unions
 */
type ValidationRule =
  | { type: 'text'; min: number; max: number; pattern?: RegExp }
  | { type: 'file'; maxSize: number; allowedTypes: string[] }
  | { type: 'enum'; allowedValues: string[] }
  | { type: 'array'; minItems: number; maxItems: number; itemMin: number; itemMax: number };

type ValidationRules = {
  [K in keyof CreateEventFormInput]: ValidationRule & { message: string };
};

/**
 * 🔑 Central validation rules - modify here affects both frontend AND backend
 */
const rules: ValidationRules = {
  // Text fields with length constraints
  title: {
    type: 'text',
    min: 3,
    max: 100,
    pattern: /^[a-zA-Z0-9\s&\-'(),.]*$/,
    message: 'Title must be 3-100 characters and contain only letters, numbers, and basic punctuation',
  },

  description: {
    type: 'text',
    min: 10,
    max: 1000,
    message: 'Description must be 10-1000 characters',
  },

  overview: {
    type: 'text',
    min: 10,
    max: 500,
    message: 'Overview must be 10-500 characters',
  },

  // Image file validation
  image: {
    type: 'file',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    message: 'Image must be JPEG, PNG, or WebP and under 5MB',
  },

  venue: {
    type: 'text',
    min: 2,
    max: 100,
    message: 'Venue must be 2-100 characters',
  },

  location: {
    type: 'text',
    min: 2,
    max: 100,
    message: 'Location must be 2-100 characters',
  },

  date: {
    type: 'text',
    min: 10,
    max: 10,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format',
  },

  time: {
    type: 'text',
    min: 5,
    max: 5,
    pattern: /^\d{2}:\d{2}$/,
    message: 'Time must be in HH:MM format',
  },

  mode: {
    type: 'enum',
    allowedValues: ['online', 'offline', 'hybrid'],
    message: 'Mode must be online, offline, or hybrid',
  },

  audience: {
    type: 'text',
    min: 5,
    max: 200,
    message: 'Audience description must be 5-200 characters',
  },

  agenda: {
    type: 'array',
    minItems: 1,
    maxItems: 10,
    itemMin: 5,
    itemMax: 200,
    message: 'Agenda must have 1-10 items, each 5-200 characters',
  },

  tags: {
    type: 'array',
    minItems: 1,
    maxItems: 5,
    itemMin: 2,
    itemMax: 20,
    message: 'Tags must have 1-5 items, each 2-20 characters',
  },

  organizer: {
    type: 'text',
    min: 2,
    max: 100,
    message: 'Organizer name must be 2-100 characters',
  },
};

/**
 * Validate a single field
 * 🔍 Type-safe accessor prevents "Property does not exist" errors
 */
export function validateField(
  fieldName: keyof CreateEventFormInput,
  value: unknown
): { isValid: boolean; error?: string } {
  const rule = rules[fieldName];

  try {
    switch (rule.type) {
      case 'text': {
        const str = String(value).trim();
        if (str.length < rule.min || str.length > rule.max) {
          return { isValid: false, error: rule.message };
        }
        if (rule.pattern && !rule.pattern.test(str)) {
          return { isValid: false, error: rule.message };
        }
        return { isValid: true };
      }

      case 'file': {
        const file = value as File;
        if (!file) {
          return { isValid: false, error: 'Image is required' };
        }
        if (file.size > rule.maxSize) {
          return { isValid: false, error: rule.message };
        }
        if (!rule.allowedTypes.includes(file.type)) {
          return { isValid: false, error: rule.message };
        }
        return { isValid: true };
      }

      case 'enum': {
        if (!rule.allowedValues.includes(String(value))) {
          return { isValid: false, error: rule.message };
        }
        return { isValid: true };
      }

      case 'array': {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length < rule.minItems || arr.length > rule.maxItems) {
          return { isValid: false, error: rule.message };
        }
        for (const item of arr) {
          const str = String(item).trim();
          if (str.length < rule.itemMin || str.length > rule.itemMax) {
            return { isValid: false, error: rule.message };
          }
        }
        return { isValid: true };
      }

      default:
        return { isValid: true };
    }
  } catch (error) {
    return { isValid: false, error: 'Validation error' };
  }
}

/**
 * Validate entire form
 * 🔒 Comprehensive validation before API call
 */
export function validateEventForm(
  data: Partial<CreateEventFormInput>
): FormErrors {
  const errors: FormErrors = {};

  const requiredFields: (keyof CreateEventFormInput)[] = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'agenda',
    'organizer',
    'tags',
  ];

  for (const field of requiredFields) {
    const value = data[field];

    // ✅ Check if required field is missing
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors[field] = `${String(field)} is required`;
      continue;
    }

    // ✅ Validate field-specific rules
    const validation = validateField(field, value);
    if (!validation.isValid && validation.error) {
      errors[field] = validation.error;
    }
  }

  return errors;
}