// 📝 CREATE EVENT FORM - Dark Theme Edition
// Fixed TypeScript types and styled for dark theme

'use client';

import { FormEvent, ChangeEvent, useState, useCallback } from 'react';
import { CreateEventFormInput, FormState, FormErrors } from '@/lib/types/form';
import { validateField, validateEventForm } from '@/lib/validation/eventSchema';
import { cn } from '@/lib/utils';

const INITIAL_FORM_STATE: FormState = {
  isLoading: false,
  isSubmitting: false,
  errors: {},
  successMessage: null,
  formData: {},
};

export default function CreateEventForm() {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 📝 Handle text field changes
  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setFormState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          [name]: value,
        },
      }));

      // Real-time validation
      if (formState.errors[name as keyof FormErrors]) {
        const validation = validateField(
          name as keyof CreateEventFormInput,
          value
        );

        if (validation.isValid) {
          setFormState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              [name]: undefined,
            },
          }));
        }
      }
    },
    [formState.errors]
  );

  // 📸 Handle image file selection
  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];

    if (file) {
      const validation = validateField('image', file);

      if (!validation.isValid) {
        setFormState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            image: validation.error,
          },
        }));
        return;
      }

      setFormState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          image: file,
        },
        errors: {
          ...prev.errors,
          image: undefined,
        },
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 📋 Handle dynamic array fields
  const handleArrayItemChange = useCallback(
    (field: 'agenda' | 'tags', index: number, value: string) => {
      setFormState((prev) => {
        const currentArray = (prev.formData[field] || []) as string[];
        const newArray = [...currentArray];
        newArray[index] = value;

        return {
          ...prev,
          formData: {
            ...prev.formData,
            [field]: newArray,
          },
        };
      });
    },
    []
  );

  const addArrayItem = useCallback((field: 'agenda' | 'tags') => {
    setFormState((prev) => {
      const currentArray = (prev.formData[field] || []) as string[];
      return {
        ...prev,
        formData: {
          ...prev.formData,
          [field]: [...currentArray, ''],
        },
      };
    });
  }, []);

  const removeArrayItem = useCallback(
    (field: 'agenda' | 'tags', index: number) => {
      setFormState((prev) => {
        const currentArray = (prev.formData[field] || []) as string[];
        return {
          ...prev,
          formData: {
            ...prev.formData,
            [field]: currentArray.filter((_, i) => i !== index),
          },
        };
      });
    },
    []
  );

  // 📤 Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Step 1: Validate entire form
    const errors = validateEventForm(
      formState.formData as Partial<CreateEventFormInput>
    );

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({
        ...prev,
        errors,
      }));
      return;
    }

    // Step 2: Start submission
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      successMessage: null,
    }));

    try {
      // Step 3: Create FormData
      const submitFormData = new FormData();

      for (const [key, value] of Object.entries(formState.formData)) {
        if (key === 'image') {
          continue;
        } else if (key === 'agenda' || key === 'tags') {
          submitFormData.append(key, JSON.stringify(value));
        } else {
          submitFormData.append(key, String(value || ''));
        }
      }

      if (formState.formData.image) {
        submitFormData.append('image', formState.formData.image);
      }

      // Step 4: Send to API
      const response = await fetch('/api/events', {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      // Step 5: Handle response
      if (!response.ok) {
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          errors: result.errors || {},
          successMessage: null,
        }));
        return;
      }

      // Success!
      setFormState(INITIAL_FORM_STATE);
      setImagePreview(null);

      setFormState((prev) => ({
        ...prev,
        successMessage: 'Event created successfully! 🎉',
      }));
    } catch (error) {
      console.error('Form submission error:', error);
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errors: {
          ...prev.errors,
          submit: 'Failed to submit form. Please try again.',
        } as FormErrors,
      }));
    }
  };

  const getFieldError = (field: keyof CreateEventFormInput): string | undefined =>
    formState.errors[field];

  // 🎨 Dark theme input styling
  const inputClass = (field: keyof CreateEventFormInput) =>
    cn(
      'w-full px-4 py-2 rounded-lg transition',
      'bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500',
      'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      getFieldError(field) && 'border-red-500 bg-red-950/20'
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
        {/* 🎯 Form Header */}
        <h1 className="text-3xl font-bold text-white mb-2">Create New Event</h1>
        <p className="text-gray-400 mb-8">Fill in the details to create your event</p>

        {/* ✅ Success Message */}
        {formState.successMessage && (
          <div className="mb-6 p-4 bg-green-950/30 border border-green-700 rounded-lg">
            <p className="text-green-300 font-medium">{formState.successMessage}</p>
          </div>
        )}

        {/* ❌ Submit Error */}
        {formState.errors.submit && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-700 rounded-lg">
            <p className="text-red-300 font-medium">{formState.errors.submit}</p>
          </div>
        )}

        {/* 📝 Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ========== BASIC INFORMATION ========== */}
          <fieldset className="border-t border-gray-700 pt-6">
            <legend className="text-lg font-semibold text-white mb-4">
              Basic Information
            </legend>

            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formState.formData.title || ''}
                onChange={handleTextChange}
                placeholder="e.g., React Conference 2024"
                maxLength={100}
                className={inputClass('title')}
                disabled={formState.isSubmitting}
              />
              {getFieldError('title') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('title')}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {(formState.formData.title?.length || 0)}/100
              </p>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formState.formData.description || ''}
                onChange={handleTextChange}
                placeholder="Detailed description of your event"
                maxLength={1000}
                rows={4}
                className={cn(inputClass('description'), 'resize-none')}
                disabled={formState.isSubmitting}
              />
              {getFieldError('description') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('description')}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {(formState.formData.description?.length || 0)}/1000
              </p>
            </div>

            {/* Overview */}
            <div className="mb-4">
              <label htmlFor="overview" className="block text-sm font-medium text-gray-200 mb-2">
                Overview <span className="text-red-400">*</span>
              </label>
              <textarea
                id="overview"
                name="overview"
                value={formState.formData.overview || ''}
                onChange={handleTextChange}
                placeholder="Brief overview of the event"
                maxLength={500}
                rows={3}
                className={cn(inputClass('overview'), 'resize-none')}
                disabled={formState.isSubmitting}
              />
              {getFieldError('overview') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('overview')}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {(formState.formData.overview?.length || 0)}/500
              </p>
            </div>
          </fieldset>

          {/* ========== IMAGE UPLOAD ========== */}
          <fieldset className="border-t border-gray-700 pt-6">
            <legend className="text-lg font-semibold text-white mb-4">Event Image</legend>

            <div className="mb-4">
              <label htmlFor="image" className="block text-sm font-medium text-gray-200 mb-2">
                Upload Image <span className="text-red-400">*</span>
              </label>

              {imagePreview && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormState((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          image: undefined,
                        },
                      }));
                    }}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/webp"
                className={cn(
                  'w-full px-4 py-2 rounded-lg cursor-pointer transition',
                  'bg-gray-800 border-2 border-dashed border-gray-600 text-gray-300',
                  'hover:border-blue-500 hover:bg-gray-800/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  getFieldError('image') && 'border-red-500'
                )}
                disabled={formState.isSubmitting}
              />

              {getFieldError('image') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('image')}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">JPEG, PNG, or WebP (Max 5MB)</p>
            </div>
          </fieldset>

          {/* ========== LOCATION & TIME ========== */}
          <fieldset className="border-t border-gray-700 pt-6">
            <legend className="text-lg font-semibold text-white mb-4">Location & Schedule</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-200 mb-2">
                  Venue <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formState.formData.venue || ''}
                  onChange={handleTextChange}
                  placeholder="Convention Center"
                  maxLength={100}
                  className={inputClass('venue')}
                  disabled={formState.isSubmitting}
                />
                {getFieldError('venue') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('venue')}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-200 mb-2">
                  Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formState.formData.location || ''}
                  onChange={handleTextChange}
                  placeholder="San Francisco, CA"
                  maxLength={100}
                  className={inputClass('location')}
                  disabled={formState.isSubmitting}
                />
                {getFieldError('location') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('location')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-200 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formState.formData.date || ''}
                  onChange={handleTextChange}
                  className={inputClass('date')}
                  disabled={formState.isSubmitting}
                />
                {getFieldError('date') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('date')}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-200 mb-2">
                  Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formState.formData.time || ''}
                  onChange={handleTextChange}
                  className={inputClass('time')}
                  disabled={formState.isSubmitting}
                />
                {getFieldError('time') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('time')}</p>
                )}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-200 mb-2">
                Event Mode <span className="text-red-400">*</span>
              </label>
              <select
                id="mode"
                name="mode"
                value={formState.formData.mode || ''}
                onChange={handleTextChange}
                className={cn(
                  inputClass('mode'),
                  'appearance-none bg-gray-900 pr-8 cursor-pointer'
                )}
                disabled={formState.isSubmitting}
              >
                <option value="">Select event mode...</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {getFieldError('mode') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('mode')}</p>
              )}
            </div>
          </fieldset>

          {/* ========== DETAILS ========== */}
          <fieldset className="border-t border-gray-700 pt-6">
            <legend className="text-lg font-semibold text-white mb-4">Details</legend>

            {/* Audience */}
            <div className="mb-4">
              <label htmlFor="audience" className="block text-sm font-medium text-gray-200 mb-2">
                Target Audience <span className="text-red-400">*</span>
              </label>
              <textarea
                id="audience"
                name="audience"
                value={formState.formData.audience || ''}
                onChange={handleTextChange}
                placeholder="Describe who this event is for"
                maxLength={200}
                rows={3}
                className={cn(inputClass('audience'), 'resize-none')}
                disabled={formState.isSubmitting}
              />
              {getFieldError('audience') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('audience')}</p>
              )}
            </div>

            {/* Organizer */}
            <div className="mb-4">
              <label htmlFor="organizer" className="block text-sm font-medium text-gray-200 mb-2">
                Organizer <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                value={formState.formData.organizer || ''}
                onChange={handleTextChange}
                placeholder="Organization or person name"
                maxLength={100}
                className={inputClass('organizer')}
                disabled={formState.isSubmitting}
              />
              {getFieldError('organizer') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('organizer')}</p>
              )}
            </div>

            {/* Agenda */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Agenda <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {((formState.formData.agenda || []) as string[]).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        handleArrayItemChange('agenda', index, e.target.value)
                      }
                      placeholder={`Agenda item ${index + 1}`}
                      maxLength={200}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-lg transition',
                        'bg-gray-800 border border-gray-700 text-white placeholder-gray-500',
                        'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      disabled={formState.isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('agenda', index)}
                      className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg transition disabled:opacity-50"
                      disabled={formState.isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('agenda')}
                className="mt-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-blue-100 rounded-lg transition disabled:opacity-50"
                disabled={formState.isSubmitting}
              >
                + Add Agenda Item
              </button>
              {getFieldError('agenda') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('agenda')}</p>
              )}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tags <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {((formState.formData.tags || []) as string[]).map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayItemChange('tags', index, e.target.value)}
                      placeholder={`Tag ${index + 1}`}
                      maxLength={20}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-lg transition',
                        'bg-gray-800 border border-gray-700 text-white placeholder-gray-500',
                        'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      disabled={formState.isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg transition disabled:opacity-50"
                      disabled={formState.isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="mt-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-blue-100 rounded-lg transition disabled:opacity-50"
                disabled={formState.isSubmitting}
              >
                + Add Tag
              </button>
              {getFieldError('tags') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('tags')}</p>
              )}
            </div>
          </fieldset>

          {/* ========== FORM ACTIONS ========== */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formState.isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span> Creating...
                </>
              ) : (
                '✓ Create Event'
              )}
            </button>

            <button
              type="reset"
              onClick={() => {
                setFormState(INITIAL_FORM_STATE);
                setImagePreview(null);
              }}
              disabled={formState.isSubmitting}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}