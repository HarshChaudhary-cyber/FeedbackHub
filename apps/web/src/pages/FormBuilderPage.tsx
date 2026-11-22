import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  AlignLeft,
  Star,
  CheckCircle2,
  List,
  CheckSquare,
  ToggleLeft,
  Settings,
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { FormsApiClient } from '../utils/formsApi';
import type {
  FeedbackForm,
  FormQuestion,
  QuestionType,
  FeedbackAudience,
  AnonymityMode,
} from '@feedbackhub/types';

interface FormBuilderPageProps {
  isNew?: boolean;
}

export const FormBuilderPage: React.FC<FormBuilderPageProps> = ({ isNew = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Form State
  const [formId, setFormId] = useState<string | null>(id || null);
  const [internalName, setInternalName] = useState('');
  const [title, setTitle] = useState(isNew ? 'Untitled Feedback Form' : '');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome! We appreciate you taking a few moments to share your thoughts.');
  const [thankYouMessage, setThankYouMessage] = useState('Thank you! Your feedback has been successfully submitted.');
  const [audienceType, setAudienceType] = useState<FeedbackAudience>('CUSTOMER');
  const [anonymityMode, setAnonymityMode] = useState<AnonymityMode>('ANONYMOUS_ONLY');
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);

  // Selection & UI State
  const [selectedIndex, setSelectedIndex] = useState<number | 'form'>(0);
  const [activeMobileTab, setActiveMobileTab] = useState<'questions' | 'editor' | 'settings'>('editor');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load existing form
  useEffect(() => {
    if (isNew || !id) {
      if (questions.length === 0) {
        // Initial default question for new forms
        setQuestions([
          {
            id: crypto.randomUUID(),
            questionType: 'SHORT_TEXT',
            title: 'How can we improve our service?',
            placeholder: 'Share your thoughts here...',
            isRequired: true,
            orderIndex: 0,
          },
        ]);
      }
      return;
    }

    const loadForm = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await FormsApiClient.getForm(id);
        setFormId(data.id);
        setInternalName(data.internalName || '');
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description || '');
        setWelcomeMessage(data.welcomeMessage || '');
        setThankYouMessage(data.thankYouMessage || '');
        setAudienceType(data.audienceType);
        setAnonymityMode(data.anonymityMode);
        setAllowMultipleSubmissions(data.allowMultipleSubmissions);
        setStatus(data.status);
        setQuestions(data.questions || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load form details.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    loadForm();
  }, [id, isNew]);

  // Question Management Functions
  const handleAddQuestion = (type: QuestionType) => {
    const newQ: FormQuestion = {
      id: crypto.randomUUID(),
      questionType: type,
      title:
        type === 'RATING'
          ? 'How would you rate your overall experience?'
          : type === 'YES_NO'
          ? 'Would you recommend us to a colleague?'
          : type === 'SINGLE_CHOICE'
          ? 'Which of the following best describes your role?'
          : type === 'MULTIPLE_CHOICE'
          ? 'Which features do you find most helpful?'
          : type === 'LONG_TEXT'
          ? 'Please describe any additional details or suggestions:'
          : 'What feedback do you have for us?',
      placeholder:
        type === 'SHORT_TEXT' || type === 'LONG_TEXT' ? 'Type your answer here...' : null,
      isRequired: true,
      orderIndex: questions.length,
      validationRules:
        type === 'RATING'
          ? { minRating: 1, maxRating: 5 }
          : type === 'LONG_TEXT'
          ? { maxLength: 2000 }
          : null,
      options:
        type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE'
          ? [
              { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1', orderIndex: 0 },
              { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2', orderIndex: 1 },
              { id: crypto.randomUUID(), label: 'Option 3', value: 'option_3', orderIndex: 2 },
            ]
          : type === 'YES_NO'
          ? [
              { id: crypto.randomUUID(), label: 'Yes', value: 'yes', orderIndex: 0 },
              { id: crypto.randomUUID(), label: 'No', value: 'no', orderIndex: 1 },
            ]
          : undefined,
    };

    setQuestions((prev) => [...prev, newQ]);
    setSelectedIndex(questions.length);
    setActiveMobileTab('editor');
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.map((q, idx) => ({ ...q, orderIndex: idx }));
    });
    if (selectedIndex === index) {
      setSelectedIndex(0);
    } else if (typeof selectedIndex === 'number' && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((q, idx) => ({ ...q, orderIndex: idx }));
    });

    setSelectedIndex(targetIndex);
  };

  const updateSelectedQuestion = (fields: Partial<FormQuestion>) => {
    if (typeof selectedIndex !== 'number' || !questions[selectedIndex]) return;
    setQuestions((prev) => {
      const next = [...prev];
      next[selectedIndex] = { ...next[selectedIndex], ...fields };
      return next;
    });
  };

  // Save form
  const handleSave = async (): Promise<FeedbackForm | null> => {
    setIsSaving(true);
    setError(null);
    setSuccessNotice(null);

    const payload = {
      internalName: internalName || undefined,
      title,
      slug: slug || undefined,
      description: description || undefined,
      welcomeMessage: welcomeMessage || undefined,
      thankYouMessage: thankYouMessage || undefined,
      audienceType,
      anonymityMode,
      allowMultipleSubmissions,
      questions: questions.map((q, idx) => ({
        id: q.id,
        questionType: q.questionType,
        title: q.title,
        helpText: q.helpText,
        placeholder: q.placeholder,
        isRequired: q.isRequired,
        orderIndex: idx,
        validationRules: q.validationRules,
        options: q.options?.map((opt, optIdx) => ({
          id: opt.id,
          label: opt.label,
          value: opt.value,
          orderIndex: optIdx,
        })),
      })),
    };

    try {
      let saved: FeedbackForm;
      if (formId) {
        saved = await FormsApiClient.updateForm(formId, payload);
      } else {
        saved = await FormsApiClient.createForm(payload);
        setFormId(saved.id);
        navigate(`/dashboard/forms/${saved.id}/edit`, { replace: true });
      }
      setSlug(saved.slug);
      setStatus(saved.status);
      setSuccessNotice('Form saved successfully.');
      setTimeout(() => setSuccessNotice(null), 3000);
      return saved;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save form.';
      setError(msg);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Publish / Unpublish
  const handleTogglePublish = async () => {
    setError(null);
    if (status === 'PUBLISHED') {
      if (!formId) return;
      setIsPublishing(true);
      try {
        const res = await FormsApiClient.unpublishForm(formId);
        setStatus(res.status);
        setSuccessNotice('Form unpublished. Responses are no longer accepted.');
        setTimeout(() => setSuccessNotice(null), 3000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to unpublish.');
      } finally {
        setIsPublishing(false);
      }
    } else {
      // Must save first
      const saved = await handleSave();
      if (!saved) return;
      setIsPublishing(true);
      try {
        const res = await FormsApiClient.publishForm(saved.id);
        setStatus(res.status);
        setSuccessNotice('Form published successfully! Shareable public link is active.');
        setTimeout(() => setSuccessNotice(null), 4000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to publish form.');
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const handleCopyPublicUrl = () => {
    if (!slug) return;
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeQuestion = typeof selectedIndex === 'number' ? questions[selectedIndex] : null;

  const renderQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'SHORT_TEXT':
        return <Type className="w-4 h-4 text-sky-500" />;
      case 'LONG_TEXT':
        return <AlignLeft className="w-4 h-4 text-violet-500" />;
      case 'RATING':
        return <Star className="w-4 h-4 text-amber-500" />;
      case 'SINGLE_CHOICE':
        return <List className="w-4 h-4 text-emerald-500" />;
      case 'MULTIPLE_CHOICE':
        return <CheckSquare className="w-4 h-4 text-pink-500" />;
      case 'YES_NO':
        return <ToggleLeft className="w-4 h-4 text-teal-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-violet-600 mb-3" />
        <p className="text-sm text-slate-500">Loading form builder...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      {/* Top Action Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/forms"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form Title"
                className="font-bold text-slate-900 text-base sm:text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-violet-600 focus:outline-none transition-colors max-w-xs sm:max-w-md truncate"
              />
              {status === 'PUBLISHED' ? (
                <Badge variant="success" className="text-xs">Published</Badge>
              ) : status === 'ARCHIVED' ? (
                <Badge variant="secondary" className="text-xs">Archived</Badge>
              ) : (
                <Badge variant="warning" className="text-xs">Draft</Badge>
              )}
            </div>
            {slug && (
              <p className="text-xs text-slate-400 font-mono">/f/{slug}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {formId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/forms/${formId}/preview`)}
              className="gap-1.5"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </Button>

          <Button
            size="sm"
            variant={status === 'PUBLISHED' ? 'secondary' : 'primary'}
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className="gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>
              {isPublishing
                ? 'Processing...'
                : status === 'PUBLISHED'
                ? 'Unpublish'
                : 'Publish Form'}
            </span>
          </Button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <Alert variant="error">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {successNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <Alert variant="success">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertDescription>{successNotice}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-2 flex items-center justify-around text-xs font-semibold">
        <button
          onClick={() => setActiveMobileTab('questions')}
          className={`py-1.5 px-3 rounded-lg ${
            activeMobileTab === 'questions' ? 'bg-violet-50 text-violet-700' : 'text-slate-500'
          }`}
        >
          Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('editor')}
          className={`py-1.5 px-3 rounded-lg ${
            activeMobileTab === 'editor' ? 'bg-violet-50 text-violet-700' : 'text-slate-500'
          }`}
        >
          Active Editor
        </button>
        <button
          onClick={() => setActiveMobileTab('settings')}
          className={`py-1.5 px-3 rounded-lg ${
            activeMobileTab === 'settings' ? 'bg-violet-50 text-violet-700' : 'text-slate-500'
          }`}
        >
          Form Settings
        </button>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT PANEL: Question Outline (3 cols)                                     */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            activeMobileTab !== 'questions' ? 'hidden lg:block' : 'block'
          }`}
        >
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-600" />
                  <span>Structure</span>
                </CardTitle>
                <span className="text-xs text-slate-400 font-medium">
                  {questions.length} / 50
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {/* Form Title & Introduction item */}
              <button
                onClick={() => {
                  setSelectedIndex('form');
                  setActiveMobileTab('editor');
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  selectedIndex === 'form'
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="truncate">Form Header & Intro</span>
              </button>

              {/* Questions list */}
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setActiveMobileTab('editor');
                  }}
                  className={`group relative px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    selectedIndex === idx
                      ? 'bg-violet-50 text-violet-900 border border-violet-200 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 font-mono text-[11px] w-4 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="shrink-0">{renderQuestionTypeIcon(q.questionType)}</span>
                    <span className="truncate">{q.title || 'Untitled Question'}</span>
                    {q.isRequired && <span className="text-rose-500 font-bold">*</span>}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveQuestion(idx, 'up');
                      }}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveQuestion(idx, 'down');
                      }}
                      disabled={idx === questions.length - 1}
                      title="Move Down"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      title="Delete Question"
                      className="p-1 rounded text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Add Question Menu */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Add Question Type
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddQuestion('SHORT_TEXT')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Type className="w-3.5 h-3.5 text-sky-500" />
                  <span>Short Text</span>
                </button>
                <button
                  onClick={() => handleAddQuestion('LONG_TEXT')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-violet-500" />
                  <span>Long Text</span>
                </button>
                <button
                  onClick={() => handleAddQuestion('RATING')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rating</span>
                </button>
                <button
                  onClick={() => handleAddQuestion('SINGLE_CHOICE')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <List className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Single Choice</span>
                </button>
                <button
                  onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-pink-500" />
                  <span>Multi Choice</span>
                </button>
                <button
                  onClick={() => handleAddQuestion('YES_NO')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <ToggleLeft className="w-3.5 h-3.5 text-teal-500" />
                  <span>Yes / No</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* CENTER PANEL: Active Editor & Live Preview (6 cols)                      */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeMobileTab !== 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          {selectedIndex === 'form' ? (
            /* Form Header Editor */
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900">
                  Form Header & Welcome Text
                </CardTitle>
                <CardDescription>
                  Configure the title, description, and introductory message shown to visitors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Public Form Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Product Feedback Survey"
                    className="font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Internal Form Name (Optional)
                  </label>
                  <Input
                    type="text"
                    value={internalName}
                    onChange={(e) => setInternalName(e.target.value)}
                    placeholder="e.g. CSAT Q4 Internal Tracking"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used only for internal dashboard identification. Not visible to respondents.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Description
                  </label>
                  <Textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief overview of why this feedback is being collected..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Welcome / Introduction Text
                  </label>
                  <Textarea
                    rows={2}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome message presented before respondents start..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thank-You / Confirmation Message
                  </label>
                  <Textarea
                    rows={2}
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    placeholder="Message shown immediately after a successful response..."
                  />
                </div>
              </CardContent>
            </Card>
          ) : activeQuestion ? (
            /* Selected Question Editor */
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderQuestionTypeIcon(activeQuestion.questionType)}
                    <CardTitle className="text-base font-bold text-slate-900">
                      Question {(selectedIndex as number) + 1} Configuration
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeQuestion.isRequired}
                        onChange={(e) =>
                          updateSelectedQuestion({ isRequired: e.target.checked })
                        }
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Question Prompt / Label <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={activeQuestion.title}
                      onChange={(e) => updateSelectedQuestion({ title: e.target.value })}
                      placeholder="e.g. How likely are you to recommend us?"
                      className="font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Help Text / Description (Optional)
                    </label>
                    <Input
                      type="text"
                      value={activeQuestion.helpText || ''}
                      onChange={(e) => updateSelectedQuestion({ helpText: e.target.value })}
                      placeholder="e.g. Scale from 1 (poor) to 5 (excellent)"
                    />
                  </div>

                  {(activeQuestion.questionType === 'SHORT_TEXT' ||
                    activeQuestion.questionType === 'LONG_TEXT') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Placeholder Text
                      </label>
                      <Input
                        type="text"
                        value={activeQuestion.placeholder || ''}
                        onChange={(e) => updateSelectedQuestion({ placeholder: e.target.value })}
                        placeholder="e.g. Enter your feedback here..."
                      />
                    </div>
                  )}

                  {/* Rating Configuration */}
                  {activeQuestion.questionType === 'RATING' && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Minimum Rating
                        </label>
                        <select
                          aria-label="Minimum Rating"
                          value={activeQuestion.validationRules?.minRating ?? 1}
                          onChange={(e) =>
                            updateSelectedQuestion({
                              validationRules: {
                                ...activeQuestion.validationRules,
                                minRating: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full text-xs font-semibold border border-amber-200 rounded-lg px-2.5 py-1.5 bg-white"
                        >
                          <option value={1}>1</option>
                          <option value={0}>0</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Maximum Rating
                        </label>
                        <select
                          aria-label="Maximum Rating"
                          value={activeQuestion.validationRules?.maxRating ?? 5}
                          onChange={(e) =>
                            updateSelectedQuestion({
                              validationRules: {
                                ...activeQuestion.validationRules,
                                maxRating: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full text-xs font-semibold border border-amber-200 rounded-lg px-2.5 py-1.5 bg-white"
                        >
                          <option value={5}>5 Stars / Scale</option>
                          <option value={10}>10 Points (NPS standard)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Choices Configuration */}
                  {(activeQuestion.questionType === 'SINGLE_CHOICE' ||
                    activeQuestion.questionType === 'MULTIPLE_CHOICE') && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Choice Options
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const count = (activeQuestion.options || []).length + 1;
                            const newOpt = {
                              id: crypto.randomUUID(),
                              label: `Option ${count}`,
                              value: `option_${count}`,
                              orderIndex: count - 1,
                            };
                            updateSelectedQuestion({
                              options: [...(activeQuestion.options || []), newOpt],
                            });
                          }}
                          className="text-xs h-7 gap-1 text-violet-600 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(activeQuestion.options || []).map((opt, optIdx) => (
                          <div key={opt.id || optIdx} className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs font-mono w-4">
                              {optIdx + 1}.
                            </span>
                            <Input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const newOpts = [...(activeQuestion.options || [])];
                                newOpts[optIdx] = {
                                  ...newOpts[optIdx],
                                  label: e.target.value,
                                  value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                                };
                                updateSelectedQuestion({ options: newOpts });
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              className="text-xs font-medium"
                            />
                            <button
                              onClick={() => {
                                const newOpts = (activeQuestion.options || []).filter(
                                  (_, i) => i !== optIdx
                                );
                                updateSelectedQuestion({ options: newOpts });
                              }}
                              disabled={(activeQuestion.options || []).length <= 2}
                              title="Delete Option"
                              className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LIVE INTERACTIVE PREVIEW of Question */}
              <Card className="border-slate-200 bg-white/70 shadow-sm border-dashed">
                <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Live Question Preview</span>
                  </span>
                  <span className="text-[11px] text-slate-400 italic">As seen by respondents</span>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-1">
                        <span>{activeQuestion.title || 'Question prompt'}</span>
                        {activeQuestion.isRequired && (
                          <span className="text-rose-500 font-bold">*</span>
                        )}
                      </h4>
                      {activeQuestion.helpText && (
                        <p className="text-xs text-slate-500 mt-0.5">{activeQuestion.helpText}</p>
                      )}
                    </div>

                    {/* Question inputs */}
                    {activeQuestion.questionType === 'SHORT_TEXT' && (
                      <Input
                        type="text"
                        placeholder={activeQuestion.placeholder || 'Type your answer...'}
                        readOnly
                        className="bg-slate-50 cursor-not-allowed"
                      />
                    )}

                    {activeQuestion.questionType === 'LONG_TEXT' && (
                      <Textarea
                        rows={3}
                        placeholder={activeQuestion.placeholder || 'Type your answer...'}
                        readOnly
                        className="bg-slate-50 cursor-not-allowed"
                      />
                    )}

                    {activeQuestion.questionType === 'RATING' && (
                      <div className="flex items-center gap-2 pt-1">
                        {Array.from({
                          length: (activeQuestion.validationRules?.maxRating ?? 5) - (activeQuestion.validationRules?.minRating ?? 1) + 1,
                        }).map((_, i) => {
                          const val = (activeQuestion.validationRules?.minRating ?? 1) + i;
                          return (
                            <button
                              key={val}
                              type="button"
                              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:border-violet-500 hover:text-violet-600 font-bold text-sm text-slate-700 transition-all flex items-center justify-center shadow-sm"
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(activeQuestion.questionType === 'SINGLE_CHOICE' ||
                      activeQuestion.questionType === 'YES_NO') && (
                      <div className="space-y-2 pt-1">
                        {(activeQuestion.options || []).map((opt) => (
                          <div
                            key={opt.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 text-sm font-medium text-slate-700"
                          >
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeQuestion.questionType === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2 pt-1">
                        {(activeQuestion.options || []).map((opt) => (
                          <div
                            key={opt.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 text-sm font-medium text-slate-700"
                          >
                            <div className="w-4 h-4 rounded border border-slate-300" />
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-sm">
              Select a question from the left panel to edit its settings.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Settings & Publishing (3 cols)                              */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-3 space-y-6 ${
            activeMobileTab !== 'settings' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Shareable Link Card (active once saved/published) */}
          {slug && (
            <Card className="border-violet-100 bg-violet-50/40 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-violet-600" />
                  <span>Public Form URL</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                <div className="p-2.5 bg-white border border-violet-200 rounded-lg font-mono text-xs text-violet-900 truncate">
                  {window.location.origin}/f/{slug}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPublicUrl}
                    className="w-full text-xs font-semibold gap-1.5 h-8 bg-white border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Public Link</span>
                      </>
                    )}
                  </Button>
                  <a
                    href={`/f/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
                {status !== 'PUBLISHED' && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    Form must be published before respondents can access this link.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 pb-3">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Audience & Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Audience
                </label>
                <select
                  aria-label="Target Audience"
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value as FeedbackAudience)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                >
                  <option value="CUSTOMER">Customer Feedback</option>
                  <option value="EMPLOYEE">Employee Internal Survey</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {audienceType === 'CUSTOMER'
                    ? 'Optimized for public customer reviews and CSAT.'
                    : 'Features guaranteed anonymity protection for staff.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Anonymity Mode
                </label>
                <select
                  aria-label="Anonymity Mode"
                  value={anonymityMode}
                  onChange={(e) => setAnonymityMode(e.target.value as AnonymityMode)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                >
                  <option value="ANONYMOUS_ONLY">Anonymous Only (No PII recorded)</option>
                  <option value="IDENTIFIED_ONLY">Identified Only (Name & Email required)</option>
                  <option value="RESPONDENT_CHOICE">Respondent Choice (Optional identity)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowMultipleSubmissions}
                    onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                    className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                  />
                  <span>Allow multiple submissions from same visitor</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
