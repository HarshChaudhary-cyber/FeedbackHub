/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { FormsApiClient } from '../utils/formsApi';
import type { PublicFeedbackForm } from '@feedbackhub/types';

export const FormPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<PublicFeedbackForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulated answers
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await FormsApiClient.getPreview(id);
        setForm(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load form preview.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPreview();
  }, [id]);

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-violet-600 mb-3" />
        <p className="text-sm text-slate-500">Loading form preview...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Alert variant="error" className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error || 'Form preview not available.'}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/dashboard/forms')}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Persistent Preview Banner */}
      <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Eye className="w-4 h-4 text-amber-900 shrink-0" />
          <span>Preview Mode — Submissions are simulated and will not be recorded in database.</span>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/dashboard/forms/${id}/edit`)}
              className="bg-white/90 hover:bg-white text-xs h-7 border-amber-600 text-amber-950 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Editor</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form Respondent Container */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        {submitted ? (
          <Card className="border-slate-200 text-center py-12 px-6 shadow-sm">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
              <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                {form.thankYouMessage || 'Your feedback has been received. Thank you for your contribution!'}
              </p>
              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Reset Preview Form
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            {/* Form Branded Header */}
            <div
              className="p-8 border-b border-slate-100"
              style={{ borderTop: `6px solid ${form.brandColorHex || '#8B5CF6'}` }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>{form.companyName}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{form.title}</h1>
              {form.welcomeMessage && (
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">{form.welcomeMessage}</p>
              )}
              {form.description && (
                <p className="text-slate-400 mt-1 text-xs">{form.description}</p>
              )}
            </div>

            {/* Questions Form */}
            <form onSubmit={handleSimulatedSubmit} className="p-8 space-y-8">
              {form.questions.filter((q) => q.isActive !== false).map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <label className="block">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <span>{idx + 1}. {q.title}</span>
                      {q.isRequired && <span className="text-rose-500 font-bold">*</span>}
                    </span>
                    {q.helpText && (
                      <span className="block text-xs text-slate-500 mt-0.5">{q.helpText}</span>
                    )}
                  </label>

                  {/* Input Rendering based on Question Type */}
                  {q.questionType === 'SHORT_TEXT' && (
                    <Input
                      type="text"
                      placeholder={q.placeholder || 'Your answer...'}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      required={q.isRequired}
                      className="bg-white"
                    />
                  )}

                  {q.questionType === 'LONG_TEXT' && (
                    <Textarea
                      rows={4}
                      placeholder={q.placeholder || 'Type your detailed response here...'}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      required={q.isRequired}
                      className="bg-white"
                    />
                  )}

                  {q.questionType === 'RATING' && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {Array.from({
                        length:
                          (q.validationRules?.maxRating ?? 5) -
                          (q.validationRules?.minRating ?? 1) +
                          1,
                      }).map((_, i) => {
                        const val = (q.validationRules?.minRating ?? 1) + i;
                        const isSelected = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [q.id]: val })}
                            className={`w-11 h-11 rounded-xl border font-bold text-sm transition-all flex items-center justify-center ${
                              isSelected
                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-violet-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'YES_NO') && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt) => {
                        const isSelected = answers[q.id] === opt.value;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                            className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-violet-50 border-violet-300 text-violet-900 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-violet-600 bg-violet-600' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt) => {
                        const currentSelections: string[] = answers[q.id] || [];
                        const isSelected = currentSelections.includes(opt.value);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => {
                              const next = isSelected
                                ? currentSelections.filter((v) => v !== opt.value)
                                : [...currentSelections, opt.value];
                              setAnswers({ ...answers, [q.id]: next });
                            }}
                            className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-violet-50 border-violet-300 text-violet-900 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button type="submit" size="lg" className="w-full gap-2 font-bold">
                  <Send className="w-4 h-4" />
                  <span>Submit Simulated Feedback</span>
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
