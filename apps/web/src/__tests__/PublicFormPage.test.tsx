/** @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import '../test-setup';
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicFormPage } from '../pages/PublicFormPage';
import { FormsApiClient } from '../utils/formsApi';

vi.mock('../utils/formsApi', () => ({
  FormsApiClient: {
    getPublicForm: vi.fn(),
    submitPublicFeedback: vi.fn(),
  },
}));

describe('PublicFormPage Component', () => {
  const mockPublicForm = {
    id: 'form-pub-1',
    slug: 'acme-feedback',
    title: 'Acme Product Survey',
    description: 'We value your input',
    welcomeMessage: 'Welcome to Acme!',
    thankYouMessage: 'Thank you for your response!',
    audienceType: 'CUSTOMER' as const,
    anonymityMode: 'ANONYMOUS_ONLY' as const,
    companyName: 'Acme Corporation',
    companyLogoUrl: null,
    brandColorHex: '#8B5CF6',
    accentColorHex: '#EC4899',
    questions: [
      {
        id: 'q-1',
        questionType: 'SHORT_TEXT' as const,
        title: 'What feature do you use the most?',
        placeholder: 'e.g. Analytics dashboard',
        isRequired: true,
        orderIndex: 0,
        options: [],
      },
      {
        id: 'q-2',
        questionType: 'RATING' as const,
        title: 'How satisfied are you?',
        isRequired: true,
        orderIndex: 1,
        validationRules: { minRating: 1, maxRating: 5 },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (FormsApiClient.getPublicForm as any).mockResolvedValue(mockPublicForm);
    (FormsApiClient.submitPublicFeedback as any).mockResolvedValue({
      success: true,
      submissionToken: 'sub_abcdef1234567890',
      submittedAt: new Date().toISOString(),
      message: 'Thank you for your response!',
    });
  });

  it('renders company branding, title, welcome message, and questions', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/f/acme-feedback']}>
          <Routes>
            <Route path="/f/:slug" element={<PublicFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeTruthy();
      expect(screen.getByText('Acme Product Survey')).toBeTruthy();
      expect(screen.getByText('Welcome to Acme!')).toBeTruthy();
      expect(screen.getByText(/1\. What feature do you use the most\?/i)).toBeTruthy();
      expect(screen.getByText(/2\. How satisfied are you\?/i)).toBeTruthy();
    });
  });

  it('validates required fields before submitting', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/f/acme-feedback']}>
          <Routes>
            <Route path="/f/:slug" element={<PublicFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Acme Product Survey')).toBeTruthy();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Please answer the required question/i)
      ).toBeTruthy();
      expect(FormsApiClient.submitPublicFeedback).not.toHaveBeenCalled();
    });
  });

  it('submits form answers successfully and displays thank-you receipt screen', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/f/acme-feedback']}>
          <Routes>
            <Route path="/f/:slug" element={<PublicFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Acme Product Survey')).toBeTruthy();
    });

    // Fill short text answer
    const textInput = screen.getByPlaceholderText('e.g. Analytics dashboard');
    await act(async () => {
      fireEvent.change(textInput, { target: { value: 'Export to CSV' } });
    });

    // Select rating "5"
    const ratingBtn = screen.getByRole('button', { name: '5' });
    await act(async () => {
      fireEvent.click(ratingBtn);
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(FormsApiClient.submitPublicFeedback).toHaveBeenCalledWith(
        'acme-feedback',
        expect.objectContaining({
          isAnonymous: true,
          answers: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q-1', textValue: 'Export to CSV' }),
            expect.objectContaining({ questionId: 'q-2', numberValue: 5 }),
          ]),
        })
      );
      expect(screen.getByText('Feedback Submitted')).toBeTruthy();
      expect(screen.getByText('Thank you for your response!')).toBeTruthy();
    });
  });

  it('renders unavailable state when form fetch fails or is closed', async () => {
    (FormsApiClient.getPublicForm as any).mockRejectedValue(
      new Error('Form not found or is no longer accepting responses.')
    );

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/f/closed-form']}>
          <Routes>
            <Route path="/f/:slug" element={<PublicFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Form Not Available')).toBeTruthy();
      expect(
        screen.getByText(/Form not found or is no longer accepting responses/i)
      ).toBeTruthy();
    });
  });
});
