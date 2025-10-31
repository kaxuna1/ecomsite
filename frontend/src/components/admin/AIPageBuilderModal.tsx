import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import {
  PagePrompt,
  GeneratePageResult,
  PageTemplate,
  CostEstimate,
  generatePageFromPrompt,
  getPageTemplates,
  estimatePageGenerationCost,
} from '../../api/aiPageBuilder';
import { useNavigate } from 'react-router-dom';

interface AIPageBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pageId: number) => void;
}

type PageType = 'landing' | 'about' | 'service' | 'product' | 'blog' | 'contact' | 'custom';
type Tone = 'professional' | 'casual' | 'friendly' | 'formal' | 'playful' | 'luxury';

const pageTypeOptions: { value: PageType; label: string; description: string; icon: string }[] = [
  {
    value: 'landing',
    label: 'Landing Page',
    description: 'High-converting promotional page',
    icon: '🎯',
  },
  {
    value: 'about',
    label: 'About Us',
    description: 'Company story and values',
    icon: '🏢',
  },
  {
    value: 'service',
    label: 'Service Page',
    description: 'Showcase specific services',
    icon: '🛠️',
  },
  {
    value: 'product',
    label: 'Product Showcase',
    description: 'Feature collection or category',
    icon: '📦',
  },
  {
    value: 'contact',
    label: 'Contact Page',
    description: 'Easy customer communication',
    icon: '📞',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Any other page type',
    icon: '✨',
  },
];

const toneOptions: { value: Tone; label: string; description: string; icon: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished, business-focused',
    icon: '💼',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Sophisticated, premium',
    icon: '✨',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable',
    icon: '🤗',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, conversational',
    icon: '😊',
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Fun, energetic',
    icon: '🎉',
  },
];

export default function AIPageBuilderModal({ isOpen, onClose, onSuccess }: AIPageBuilderModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'template' | 'customize' | 'generating' | 'success'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [pageType, setPageType] = useState<PageType>('landing');
  const [tone, setTone] = useState<Tone>('luxury');
  const [audience, setAudience] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [companyName, setCompanyName] = useState('Luxia Products');
  const [tagline, setTagline] = useState('Premium scalp & hair care');
  const [autoPublish, setAutoPublish] = useState(false);

  const [generatedPage, setGeneratedPage] = useState<GeneratePageResult | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['ai-page-templates'],
    queryFn: getPageTemplates,
  });

  // Generate page mutation
  const generateMutation = useMutation({
    mutationFn: (prompt: PagePrompt) => generatePageFromPrompt(prompt, autoPublish),
    onSuccess: (data) => {
      setGeneratedPage(data);
      setStep('success');
    },
  });

  // Estimate cost mutation
  const estimateMutation = useMutation({
    mutationFn: (prompt: PagePrompt) => estimatePageGenerationCost(prompt),
    onSuccess: (data) => {
      setCostEstimate(data);
    },
  });

  // Build prompt from form data
  const buildPrompt = (): PagePrompt => {
    return {
      description,
      pageType,
      tone,
      audience: audience || undefined,
      goals: goals.length > 0 ? goals : undefined,
      existingBranding: {
        companyName,
        tagline,
      },
    };
  };

  // Handle template selection
  const handleTemplateSelect = (template: PageTemplate) => {
    setSelectedTemplate(template);
    setPageType(template.pageType as PageType);
    setTone(template.tone as Tone);
    setDescription(template.promptTemplate.replace('{productName}', '').replace('{companyName}', companyName));
    setStep('customize');

    // Get cost estimate
    const prompt = {
      description: template.promptTemplate,
      pageType: template.pageType as PageType,
      tone: template.tone as Tone,
      existingBranding: { companyName, tagline },
    };
    estimateMutation.mutate(prompt);
  };

  // Handle custom prompt
  const handleCustomPrompt = () => {
    setUseCustomPrompt(true);
    setStep('customize');
  };

  // Handle generate
  const handleGenerate = () => {
    if (!description.trim()) return;

    const prompt = buildPrompt();
    setStep('generating');
    generateMutation.mutate(prompt);
  };

  // Add goal
  const handleAddGoal = () => {
    if (goalInput.trim() && goals.length < 5) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  // Remove goal
  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  // Handle close
  const handleClose = () => {
    setStep('template');
    setSelectedTemplate(null);
    setUseCustomPrompt(false);
    setDescription('');
    setGoals([]);
    setGeneratedPage(null);
    setCostEstimate(null);
    onClose();
  };

  // Handle view page
  const handleViewPage = () => {
    if (generatedPage) {
      navigate(`/admin/cms/${generatedPage.pageId}`);
      handleClose();
      if (onSuccess) {
        onSuccess(generatedPage.pageId);
      }
    }
  };

  // Update cost estimate when inputs change
  useEffect(() => {
    if (step === 'customize' && description.trim()) {
      const timer = setTimeout(() => {
        estimateMutation.mutate(buildPrompt());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [description, pageType, tone, audience, goals]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          AI Page Builder
                        </Dialog.Title>
                        <p className="text-sm text-gray-600">
                          {step === 'template' && 'Choose a template or start from scratch'}
                          {step === 'customize' && 'Customize your page details'}
                          {step === 'generating' && 'Generating your page...'}
                          {step === 'success' && 'Page created successfully!'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
                  {/* Step 1: Template Selection */}
                  {step === 'template' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {templates?.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="group relative rounded-xl border-2 border-gray-200 p-4 text-left transition-all hover:border-indigo-500 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                                {template.name}
                              </h3>
                              <span className="text-2xl">{template.pageType === 'landing' ? '🎯' : template.pageType === 'about' ? '🏢' : '📄'}</span>
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {template.suggestedBlocks.slice(0, 3).map((block) => (
                                <span
                                  key={block}
                                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                >
                                  {block}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white px-4 text-gray-500">Or</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCustomPrompt}
                        className="w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50"
                      >
                        <BeakerIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 font-medium text-gray-900">Start from scratch</p>
                        <p className="text-sm text-gray-600">Create a completely custom page</p>
                      </button>
                    </div>
                  )}

                  {/* Step 2: Customize */}
                  {step === 'customize' && (
                    <div className="space-y-6">
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Page Description *
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Describe the page you want to create. E.g., 'Create a landing page for our new hair serum that highlights its benefits and includes customer testimonials'"
                        />
                      </div>

                      {/* Page Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {pageTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setPageType(option.value)}
                              className={`rounded-lg border p-3 text-left transition-all ${
                                pageType === option.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-lg">{option.icon}</div>
                              <div className="mt-1 text-sm font-medium">{option.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tone
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {toneOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setTone(option.value)}
                              className={`rounded-lg border p-2 text-center transition-all ${
                                tone === option.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl">{option.icon}</div>
                              <div className="mt-1 text-xs font-medium">{option.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target Audience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Target Audience (Optional)
                        </label>
                        <input
                          type="text"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="E.g., Women aged 25-45 interested in natural hair care"
                        />
                      </div>

                      {/* Goals */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Page Goals (Optional)
                        </label>
                        <div className="mt-1 flex space-x-2">
                          <input
                            type="text"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="E.g., Drive product sales"
                          />
                          <button
                            onClick={handleAddGoal}
                            disabled={!goalInput.trim() || goals.length >= 5}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                        {goals.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {goals.map((goal, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                              >
                                {goal}
                                <button
                                  onClick={() => handleRemoveGoal(index)}
                                  className="hover:text-indigo-900"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Branding */}
                      <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-900">Brand Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              placeholder="E.g., Luxia Products"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Tagline
                            </label>
                            <input
                              type="text"
                              value={tagline}
                              onChange={(e) => setTagline(e.target.value)}
                              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              placeholder="E.g., Premium scalp & hair care"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cost Estimate */}
                      {costEstimate && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                          <div className="flex items-start space-x-3">
                            <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-900">Estimated Cost</h4>
                              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-600">Tokens:</span>
                                  <span className="ml-1 font-medium text-blue-900">
                                    {costEstimate.estimatedTokens.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-blue-600">Cost:</span>
                                  <span className="ml-1 font-medium text-blue-900">
                                    ${costEstimate.estimatedCostUSD.toFixed(4)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-blue-600">Time:</span>
                                  <span className="ml-1 font-medium text-blue-900">
                                    ~{costEstimate.estimatedTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Auto-publish */}
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Auto-publish page</h4>
                          <p className="text-sm text-gray-600">Make the page live immediately after generation</p>
                        </div>
                        <button
                          onClick={() => setAutoPublish(!autoPublish)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoPublish ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoPublish ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Generating */}
                  {step === 'generating' && (
                    <div className="py-12 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center">
                        <ArrowPathIcon className="h-16 w-16 animate-spin text-indigo-600" />
                      </div>
                      <h3 className="mt-6 text-lg font-semibold text-gray-900">
                        Generating your page...
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        This may take 30-60 seconds. Please don't close this window.
                      </p>
                      {generateMutation.error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-4 text-left">
                          <p className="text-sm text-red-800">
                            Error: {(generateMutation.error as Error).message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Success */}
                  {step === 'success' && generatedPage && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                          <CheckIcon className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Page created successfully!
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          {generatedPage.message}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Page Title:</span>
                            <span className="font-medium text-gray-900">{generatedPage.page.title}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Slug:</span>
                            <span className="font-medium text-gray-900">/{generatedPage.page.slug}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Blocks Created:</span>
                            <span className="font-medium text-gray-900">{generatedPage.blockIds.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${autoPublish ? 'text-green-600' : 'text-yellow-600'}`}>
                              {autoPublish ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Generated Blocks:</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedPage.page.blocks.map((block, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-white border border-blue-200 px-3 py-1 text-xs text-blue-700"
                            >
                              {block.blockType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between">
                    {step === 'template' && (
                      <div className="flex-1" />
                    )}
                    {step === 'customize' && (
                      <>
                        <button
                          onClick={() => setStep('template')}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={!description.trim() || generateMutation.isPending}
                          className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          <span>Generate Page</span>
                        </button>
                      </>
                    )}
                    {step === 'success' && (
                      <>
                        <button
                          onClick={handleClose}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleViewPage}
                          className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                          <span>View & Edit Page</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
