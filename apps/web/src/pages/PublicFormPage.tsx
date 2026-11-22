/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { FormsApiClient } from '../utils/formsApi';
import type {
  PublicFeedbackForm,
  PublicSubmissionResult,
} from '@feedbackhub/types';

export const PublicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [form, setForm] = useState<PublicFeedbackForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form submission state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');

  // Submit process state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<PublicSubmissionResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchForm = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await FormsApiClient.getPublicForm(slug);
        setForm(data);
        if (data.anonymityMode === 'IDENTIFIED_ONLY') {
          setIsAnonymous(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'This feedback form is not available.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !slug) return;
    setValidationError(null);

    // Validate required questions
    for (const q of form.questions) {
      if (q.isRequired) {
        const ans = answers[q.id];
        if (
          ans === undefined ||
          ans === null ||
          ans === '' ||
          (Array.isArray(ans) && ans.length === 0)
        ) {
          setValidationError(`Please answer the required question: "${q.title}"`);
          return;
        }
      }
    }

    // Format answers array
    const formattedAnswers = Object.entries(answers).map(([questionId, val]) => {
      const q = form.questions.find((x) => x.id === questionId);
      if (!q) return { questionId };

      if (q.questionType === 'RATING') {
        return { questionId, numberValue: Number(val) };
      }
      if (q.questionType === 'MULTIPLE_CHOICE') {
        return { questionId, jsonValue: Array.isArray(val) ? val : [val] };
      }
      if (q.questionType === 'YES_NO') {
        return {
          questionId,
          booleanValue: val === 'yes' || val === true,
          textValue: String(val),
        };
      }
      return { questionId, textValue: String(val) };
    });

    setIsSubmitting(true);
    try {
      const result = await FormsApiClient.submitPublicFeedback(slug, {
        isAnonymous,
        respondentName: isAnonymous ? undefined : respondentName.trim() || undefined,
        respondentEmail: isAnonymous ? undefined : respondentEmail.trim() || undefined,
        answers: formattedAnswers,
      });
      setSubmissionResult(result);
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-violet-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full border-slate-200 text-center p-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 mb-2">Form Not Available</CardTitle>
          <CardDescription className="text-sm leading-relaxed mb-6">
            {error || 'This feedback form is not currently published or has been closed by the host organization.'}
          </CardDescription>
          <Link to="/" className="text-xs font-semibold text-violet-600 hover:text-violet-800">
            Powered by FeedbackHub
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between">
      {/* Respondent Header */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-10 pb-16 flex-1 flex flex-col justify-center">
        {submissionResult ? (
          /* Success / Thank You Screen */
          <Card className="border-slate-200 text-center py-12 px-6 shadow-md bg-white">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Feedback Submitted</h2>
              <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                {submissionResult.message || 'Thank you! Your feedback has been received.'}
              </p>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 max-w-xs mx-auto font-mono">
                Receipt: {submissionResult.submissionToken.slice(0, 16)}...
              </div>

              {form.audienceType === 'EMPLOYEE' && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold pt-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Your privacy and anonymity are cryptographically guaranteed.</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Active Form */
          <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
            {/* Top Branding Accent Bar */}
            <div
              className="p-8 border-b border-slate-100"
              style={{ borderTop: `6px solid ${form.brandColorHex || '#8B5CF6'}` }}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  <span>{form.companyName}</span>
                </div>
                {form.anonymityMode === 'ANONYMOUS_ONLY' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Anonymous Mode</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {form.title}
              </h1>

              {form.welcomeMessage && (
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">{form.welcomeMessage}</p>
              )}
              {form.description && (
                <p className="text-slate-400 mt-1 text-xs">{form.description}</p>
              )}
            </div>

            {/* Questions Form */}
            <form onSubmit={handleSubmit} noValidate className="p-8 space-y-8">
              {validationError && (
                <Alert variant="error">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {/* Respondent Identity Section (if respondent choice or identified only) */}
              {form.anonymityMode !== 'ANONYMOUS_ONLY' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Respondent Identity
                    </span>
                    {form.anonymityMode === 'RESPONDENT_CHOICE' && (
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                        />
                        <span>Submit Anonymously</span>
                      </label>
                    )}
                  </div>

                  {!isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Jane Doe"
                          value={respondentName}
                          onChange={(e) => setRespondentName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          value={respondentEmail}
                          onChange={(e) => setRespondentEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Questions */}
              {form.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <label className="block">
                    <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1">
                      <span>{idx + 1}. {q.title}</span>
                      {q.isRequired && <span className="text-rose-500 font-bold">*</span>}
                    </span>
                    {q.helpText && (
                      <span className="block text-xs text-slate-500 mt-0.5">{q.helpText}</span>
                    )}
                  </label>

                  {/* SHORT TEXT */}
                  {q.questionType === 'SHORT_TEXT' && (
                    <Input
                      type="text"
                      placeholder={q.placeholder || 'Type your response here...'}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      required={q.isRequired}
                      className="bg-white"
                    />
                  )}

                  {/* LONG TEXT */}
                  {q.questionType === 'LONG_TEXT' && (
                    <Textarea
                      rows={4}
                      placeholder={q.placeholder || 'Type your detailed feedback here...'}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      required={q.isRequired}
                      className="bg-white"
                    />
                  )}

                  {/* RATING */}
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
                                ? 'bg-violet-600 text-white border-violet-600 shadow-md ring-2 ring-violet-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-violet-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SINGLE CHOICE or YES/NO */}
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
                                ? 'bg-violet-50 border-violet-400 text-violet-900 shadow-sm ring-1 ring-violet-400'
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

                  {/* MULTIPLE CHOICE */}
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
                                ? 'bg-violet-50 border-violet-400 text-violet-900 shadow-sm ring-1 ring-violet-400'
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

              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full gap-2 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Submitting Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/50">
        <span>Powered by </span>
        <Link to="/" className="font-bold text-violet-600 hover:underline">
          FeedbackHub
        </Link>
        <span> — Multi-tenant Customer & Employee Insights</span>
      </footer>
    </div>
  );
};
