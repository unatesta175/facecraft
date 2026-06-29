'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Palette,
  Zap,
  Stars,
  Brush,
  Eraser,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  KioskFramedImage,
  KIOSK_FRAME_ASPECT_CLASS,
  DEFAULT_PHOTO_TRANSFORM,
  type PhotoTransform,
} from '@/components/kiosk/kiosk-framed-image';
import { kioskApi, type KioskAiEffectItem } from '@/lib/kiosk-api';
import { cn } from '@/lib/utils';

type CatalogItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  source: 'ultra' | 'object';
};

type SuggestionOption = {
  label: string;
  imageUrl: string | null;
};

type MainFeature = {
  id: string;
  name: string;
  icon: typeof Sparkles;
  color: string;
  hasPrompt?: boolean;
  promptPlaceholder?: string;
  suggestions?: string[];
  /** When true, nested chips show catalog thumbnails (Object / Ultra Object). */
  suggestionUseImages?: boolean;
  applyLabel?: string;
  applyIcon?: typeof Zap;
};

const GEMINI_FEATURES: MainFeature[] = [
  { id: 'describe', name: 'Describe Image', icon: ImageIcon, color: 'bg-blue-500' },
  { id: 'enhance', name: 'Enhance Photo', icon: Sparkles, color: 'bg-yellow-500' },
  { id: 'remove-bg', name: 'Remove Background', icon: Eraser, color: 'bg-purple-500' },
  {
    id: 'change-bg',
    name: 'Change Background',
    icon: Palette,
    color: 'bg-green-500',
    hasPrompt: true,
    promptPlaceholder: 'Describe the new background',
    suggestions: ['studio', 'beach', 'office', 'nature', 'city'],
    applyLabel: 'Apply Effect',
    applyIcon: Zap,
  },
  { id: 'ghibli', name: 'Ghibli Style', icon: Brush, color: 'bg-pink-500' },
  { id: 'pixar', name: 'Pixar 3D', icon: Stars, color: 'bg-indigo-500' },
  { id: 'cartoon', name: 'Cartoon', icon: Palette, color: 'bg-orange-500' },
  { id: 'watercolor', name: 'Watercolor', icon: Brush, color: 'bg-cyan-500' },
  { id: 'oil', name: 'Oil Painting', icon: Palette, color: 'bg-amber-500' },
  { id: 'detect', name: 'Detect Objects', icon: Zap, color: 'bg-violet-500' },
  {
    id: 'custom',
    name: 'Custom Edits',
    icon: Wand2,
    color: 'bg-fuchsia-500',
    hasPrompt: true,
    promptPlaceholder: 'Describe what you want to change',
    suggestions: ['add smile', 'brighten', 'add text'],
    applyLabel: 'Apply Effect',
    applyIcon: Zap,
  },
];

const EDITING_FEATURES: MainFeature[] = [
  { id: 'bg-removal', name: 'Background Remover', icon: Eraser, color: 'bg-rose-500' },
  {
    id: 'object-eraser',
    name: 'Magic Eraser',
    icon: Wand2,
    color: 'bg-purple-500',
    hasPrompt: true,
    promptPlaceholder: 'background people',
    suggestions: ['Winking', 'Disappointment', 'Background People'],
    suggestionUseImages: true,
    applyLabel: 'Create Magic',
    applyIcon: Stars,
  },
  {
    id: 'art-studio',
    name: 'AI Art Studio',
    icon: Palette,
    color: 'bg-cyan-500',
    hasPrompt: true,
    promptPlaceholder: 'Smiling Happily',
    suggestions: [
      'Ghibli Style',
      'Chibi Cartoon',
      'Pixar',
      'Lego Style',
      'Royal Heritage',
      'Roblox',
      'Traditional Attire',
    ],
    suggestionUseImages: true,
    applyLabel: 'Create Magic',
    applyIcon: Stars,
  },
];

interface AIPhotoEditorModalProps {
  photoUrl: string;
  frameUrl?: string | null;
  photoTransform?: PhotoTransform;
  initialEditedPhotoUrl?: string | null;
  onApply: (editedPhotoUrl: string) => void;
  onClose: () => void;
}

function buildCatalog(ultraObjects: Array<KioskAiEffectItem & { objects: KioskAiEffectItem[] }>, objects: KioskAiEffectItem[]): CatalogItem[] {
  const items: CatalogItem[] = [];

  ultraObjects.forEach((ultra) => {
    items.push({ id: ultra.id, name: ultra.title, imageUrl: ultra.imageUrl, source: 'ultra' });
    ultra.objects.forEach((object) => {
      items.push({ id: object.id, name: object.title, imageUrl: object.imageUrl, source: 'object' });
    });
  });

  objects.forEach((object) => {
    items.push({ id: object.id, name: object.title, imageUrl: object.imageUrl, source: 'object' });
  });

  return items;
}

function getUltraObjectCatalog(
  ultraObjects: Array<KioskAiEffectItem & { objects: KioskAiEffectItem[] }>,
  titleMatch: (title: string) => boolean
): CatalogItem[] {
  const ultra = ultraObjects.find((item) => titleMatch(item.title.toLowerCase()));
  if (!ultra) return [];

  return ultra.objects.map((object) => ({
    id: object.id,
    name: object.title,
    imageUrl: object.imageUrl,
    source: 'object' as const,
  }));
}

function normalizeCatalogName(name: string): string {
  return name.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

const SUGGESTION_CATALOG_ALIASES: Record<string, string[]> = {
  'ghibli style': ['ghibli'],
  'chibi cartoon': ['chibi', 'cartoon'],
  pixar: ['pixar'],
  'lego style': ['lego'],
  'royal heritage': ['royal', 'heritage', 'royalheritage'],
  roblox: ['roblox', 'rob lox'],
  'traditional attire': ['traditional', 'attire'],
  winking: ['wink', 'winking'],
  disappointment: ['disappoint', 'disappointment'],
  'background people': ['background', 'people'],
};

function scoreCatalogMatch(label: string, itemName: string): number {
  const normalizedLabel = normalizeCatalogName(label);
  const normalizedName = normalizeCatalogName(itemName);
  let score = 0;

  const aliases = SUGGESTION_CATALOG_ALIASES[normalizedLabel] ?? [];
  for (const alias of aliases) {
    if (normalizedName.includes(alias)) {
      score += alias.length * 2;
    }
  }

  for (const word of normalizedLabel.split(/\s+/)) {
    if (word.length < 3) continue;
    if (normalizedName.includes(word)) {
      score += word.length;
    }
  }

  return score;
}

function mapSuggestionsToCatalog(suggestions: string[], catalog: CatalogItem[]): SuggestionOption[] {
  const used = new Set<string>();

  return suggestions.map((label) => {
    let best: { item: CatalogItem; score: number } | null = null;

    for (const item of catalog) {
      const key = `${item.source}:${item.id}`;
      if (used.has(key)) continue;

      const score = scoreCatalogMatch(label, item.name);
      if (score > 0 && (!best || score > best.score)) {
        best = { item, score };
      }
    }

    if (best) {
      used.add(`${best.item.source}:${best.item.id}`);
      return { label, imageUrl: best.item.imageUrl };
    }

    return { label, imageUrl: null };
  });
}

function SuggestionButtons({
  options,
  selectedLabel,
  onSelect,
}: {
  options: SuggestionOption[];
  selectedLabel: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selectedLabel === option.label;

        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelect(option.label)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-nunito transition-all',
              isSelected
                ? 'border-[#c9982f] bg-[#c9982f]/10 text-[#1f1b16] shadow-sm'
                : 'border-gray-300 bg-white/60 text-gray-700 hover:border-[#c9982f]/40 hover:bg-white'
            )}
          >
            {option.imageUrl ? (
              <img
                src={option.imageUrl}
                alt=""
                className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-black/5"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ExpandedPromptPanel({
  feature,
  prompt,
  suggestionOptions,
  selectedSuggestion,
  isProcessing,
  onPromptChange,
  onSuggestionSelect,
  onApply,
  className,
}: {
  feature: MainFeature;
  prompt: string;
  suggestionOptions: SuggestionOption[];
  selectedSuggestion: string | null;
  isProcessing: boolean;
  onPromptChange: (value: string) => void;
  onSuggestionSelect: (label: string) => void;
  onApply: () => void;
  className?: string;
}) {
  const ApplyIcon = feature.applyIcon ?? Zap;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('mt-3 space-y-3', className)}
    >
      <Input
        placeholder={feature.promptPlaceholder}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="border-gray-300 bg-white/80 text-sm font-nunito backdrop-blur-sm focus:border-purple-500"
      />
      <SuggestionButtons
        options={suggestionOptions}
        selectedLabel={selectedSuggestion}
        onSelect={onSuggestionSelect}
      />
      <Button
        type="button"
        onClick={onApply}
        size="sm"
        disabled={isProcessing}
        className={cn(
          'w-full text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg',
          feature.color
        )}
      >
        <ApplyIcon className="mr-2 h-4 w-4" />
        {feature.applyLabel ?? 'Apply Effect'}
      </Button>
    </motion.div>
  );
}

export function AIPhotoEditorModal({
  photoUrl,
  frameUrl = null,
  photoTransform = DEFAULT_PHOTO_TRANSFORM,
  initialEditedPhotoUrl = null,
  onApply,
  onClose,
}: AIPhotoEditorModalProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(initialEditedPhotoUrl);
  const [showComparison, setShowComparison] = useState(Boolean(initialEditedPhotoUrl));
  const [ultraObjects, setUltraObjects] = useState<
    Array<KioskAiEffectItem & { objects: KioskAiEffectItem[] }>
  >([]);
  const [objects, setObjects] = useState<KioskAiEffectItem[]>([]);

  const previewPhotoUrl = editedImage ?? photoUrl;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const catalog = await kioskApi.getAiEffects();
        if (cancelled) return;
        setUltraObjects(catalog.data?.ultraObjects ?? []);
        setObjects(catalog.data?.objects ?? []);
      } catch {
        if (!cancelled) {
          setUltraObjects([]);
          setObjects([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => buildCatalog(ultraObjects, objects), [ultraObjects, objects]);

  const getSuggestionOptions = (feature: MainFeature): SuggestionOption[] => {
    if (!feature.suggestions?.length) return [];
    if (!feature.suggestionUseImages) {
      return feature.suggestions.map((label) => ({ label, imageUrl: null }));
    }

    let scopedCatalog = catalog;
    if (feature.id === 'art-studio') {
      const artStudioCatalog = getUltraObjectCatalog(ultraObjects, (title) => title.includes('art studio'));
      if (artStudioCatalog.length) scopedCatalog = artStudioCatalog;
    } else if (feature.id === 'object-eraser') {
      const eraserCatalog = getUltraObjectCatalog(
        ultraObjects,
        (title) => title.includes('object remover') || title.includes('remover')
      );
      if (eraserCatalog.length) scopedCatalog = eraserCatalog;
    }

    return mapSuggestionsToCatalog(feature.suggestions, scopedCatalog);
  };

  const runEffect = (featureId: string) => {
    setIsProcessing(true);
    setActiveFeature(featureId);

    setTimeout(() => {
      setEditedImage(photoUrl);
      setShowComparison(true);
      setIsProcessing(false);
    }, 2000);
  };

  const handleMainClick = (feature: MainFeature) => {
    if (feature.hasPrompt) {
      setActiveFeature(feature.id);
      setSelectedSuggestion(null);
      setPrompt('');
      return;
    }
    runEffect(feature.id);
  };

  const handleApplyWithPrompt = (featureId: string) => {
    runEffect(featureId);
  };

  const handleSave = () => {
    if (!editedImage) return;
    onApply(editedImage);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 min-h-[100dvh] bg-[#f9f9f7]/80 backdrop-blur-md"
        aria-hidden
      />

      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-[100dvh] items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-7xl"
          >
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-2xl">
          <div className="relative overflow-hidden border-b border-white/20 bg-[#c9982f]/90 px-6 py-6 text-white backdrop-blur-md md:px-8">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm"
                >
                  <Sparkles className="h-7 w-7" />
                </motion.div>
                <div>
                  <h3 className="flex items-center gap-2 font-jakarta text-2xl font-bold md:text-3xl">
                    AI Photo Editor
                    <Stars className="h-6 w-6" />
                  </h3>
                  <p className="mt-1 font-nunito text-sm text-white/90">
                    Transform your photos with powerful AI magic
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="rounded-xl text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:p-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative min-h-[500px] rounded-3xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:h-[600px]">
                {showComparison && editedImage ? (
                  <div className="h-full w-full">
                    <div className="mb-4 text-center">
                      <Badge className="border-0 bg-[#c9982f] px-4 py-2 font-nunito text-white">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Drag slider to compare
                      </Badge>
                    </div>
                    <div className="relative h-[calc(100%-3rem)] w-full overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 flex">
                        <div className="relative w-1/2 border-r-4 border-[#c9982f]/30">
                          <div className={`relative mx-auto h-full w-full max-w-md ${KIOSK_FRAME_ASPECT_CLASS}`}>
                            <KioskFramedImage
                              photoUrl={photoUrl}
                              frameUrl={frameUrl}
                              alt="Before"
                              photoTransform={photoTransform}
                              photoFit="contain"
                            />
                          </div>
                          <div className="absolute bottom-4 left-4 rounded-full border border-gray-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                            <p className="font-jakarta text-sm font-bold text-gray-800">Before</p>
                          </div>
                        </div>
                        <div className="relative w-1/2">
                          <div className={`relative mx-auto h-full w-full max-w-md ${KIOSK_FRAME_ASPECT_CLASS}`}>
                            <KioskFramedImage
                              photoUrl={editedImage}
                              frameUrl={frameUrl}
                              alt="After"
                              photoTransform={photoTransform}
                              photoFit="contain"
                            />
                          </div>
                          <div className="absolute bottom-4 right-4 rounded-full bg-[#c9982f] px-4 py-2 shadow-lg">
                            <p className="flex items-center gap-1 font-jakarta text-sm font-bold text-white">
                              <Sparkles className="h-4 w-4" />
                              After
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className={`relative w-full max-w-lg ${KIOSK_FRAME_ASPECT_CLASS}`}>
                      <KioskFramedImage
                        photoUrl={previewPhotoUrl}
                        frameUrl={frameUrl}
                        alt="Preview"
                        photoTransform={photoTransform}
                        photoFit="contain"
                      />
                    </div>
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md">
                        <div className="text-center">
                          <motion.div
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mb-6 inline-block"
                          >
                            <Sparkles className="h-16 w-16 text-[#c9982f]" />
                          </motion.div>
                          <p className="mb-2 font-jakarta text-xl font-bold text-[#c9982f]">
                            AI Magic in Progress...
                          </p>
                          <p className="font-nunito text-sm text-gray-600">Creating something amazing</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {showComparison ? (
                <div className="mt-6 flex justify-center gap-4">
                  <Button
                    onClick={() => {
                      setShowComparison(false);
                      setEditedImage(null);
                      setActiveFeature(null);
                      setSelectedSuggestion(null);
                      setPrompt('');
                    }}
                    variant="outline"
                    size="lg"
                    className="rounded-2xl border-2 border-gray-300 px-8 py-6 font-jakarta hover:bg-gray-50"
                  >
                    Try Another Effect
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="rounded-2xl bg-[#c9982f] px-8 py-6 font-jakarta text-white shadow-lg transition-all hover:bg-[#b8872a] hover:shadow-xl"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Apply & Save
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="custom-scrollbar max-h-[600px] space-y-6 overflow-y-auto pr-2 lg:col-span-1">
              <div className="rounded-3xl border border-gray-200/50 bg-white/60 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-jakarta text-lg font-bold text-blue-600">Gemini AI Features</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GEMINI_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === feature.id;

                    return (
                      <div key={feature.id}>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMainClick(feature)}
                          disabled={isProcessing}
                          className={cn(
                            'w-full rounded-2xl border-2 p-4 transition-all',
                            isActive
                              ? `${feature.color} border-transparent text-white shadow-lg`
                              : 'border-gray-200 bg-white/80 text-gray-700 backdrop-blur-sm hover:border-gray-300'
                          )}
                        >
                          <Icon className={cn('mx-auto mb-2 h-6 w-6', isActive ? 'text-white' : '')} />
                          <span className="block text-center font-nunito text-xs font-medium">
                            {feature.name}
                          </span>
                          {feature.id === 'change-bg' || feature.id === 'custom' ? (
                            <span
                              className={cn(
                                'mt-1 flex items-center justify-center gap-0.5 font-nunito text-[10px] font-semibold',
                                isActive ? 'text-white/90' : 'text-purple-500'
                              )}
                            >
                              <span aria-hidden>✦</span>
                              prompt
                            </span>
                          ) : null}
                        </motion.button>

                        <AnimatePresence>
                          {feature.hasPrompt && isActive ? (
                            <ExpandedPromptPanel
                              feature={feature}
                              prompt={prompt}
                              suggestionOptions={getSuggestionOptions(feature)}
                              selectedSuggestion={selectedSuggestion}
                              isProcessing={isProcessing}
                              onPromptChange={setPrompt}
                              onSuggestionSelect={(label) => {
                                setSelectedSuggestion(label);
                                setPrompt(label);
                              }}
                              onApply={() => handleApplyWithPrompt(feature.id)}
                              className="col-span-2"
                            />
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200/50 bg-white/60 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-jakarta text-lg font-bold text-purple-600">
                    AI Editing &amp; Art Studio
                  </h4>
                </div>
                <div className="space-y-3">
                  {EDITING_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === feature.id;

                    return (
                      <div key={feature.id}>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMainClick(feature)}
                          disabled={isProcessing}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                            isActive
                              ? `${feature.color} border-transparent text-white shadow-lg`
                              : 'border-gray-200 bg-white/80 text-gray-700 backdrop-blur-sm hover:border-gray-300'
                          )}
                        >
                          <Icon className={cn('h-6 w-6 shrink-0', isActive ? 'text-white' : '')} />
                          <span className="flex-1 text-left font-nunito font-medium">{feature.name}</span>
                        </motion.button>

                        <AnimatePresence>
                          {feature.hasPrompt && isActive ? (
                            <ExpandedPromptPanel
                              feature={feature}
                              prompt={prompt}
                              suggestionOptions={getSuggestionOptions(feature)}
                              selectedSuggestion={selectedSuggestion}
                              isProcessing={isProcessing}
                              onPromptChange={setPrompt}
                              onSuggestionSelect={(label) => {
                                setSelectedSuggestion(label);
                                setPrompt(label);
                              }}
                              onApply={() => handleApplyWithPrompt(feature.id)}
                            />
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(201, 152, 47);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(184, 135, 42);
        }
      `}</style>
    </div>
  );
}
