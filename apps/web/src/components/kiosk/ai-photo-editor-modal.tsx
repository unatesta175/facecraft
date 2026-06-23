'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Image as ImageIcon, Palette, Zap, Stars, Brush, Eraser, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const AI_FEATURES = {
  gemini: [
    { id: 'describe', name: 'Describe Image', icon: ImageIcon, color: 'bg-blue-500' },
    { id: 'enhance', name: 'Enhance Photo', icon: Sparkles, color: 'bg-yellow-500' },
    { id: 'remove-bg', name: 'Remove Background', icon: Eraser, color: 'bg-purple-500' },
    { id: 'change-bg', name: 'Change Background', icon: Palette, hasPrompt: true, color: 'bg-green-500' },
    { id: 'ghibli', name: 'Ghibli Style', icon: Brush, color: 'bg-pink-500' },
    { id: 'pixar', name: 'Pixar 3D', icon: Stars, color: 'bg-indigo-500' },
    { id: 'cartoon', name: 'Cartoon', icon: Palette, color: 'bg-orange-500' },
    { id: 'watercolor', name: 'Watercolor', icon: Brush, color: 'bg-cyan-500' },
    { id: 'oil', name: 'Oil Painting', icon: Palette, color: 'bg-amber-500' },
    { id: 'detect', name: 'Detect Objects', icon: Zap, color: 'bg-violet-500' },
    { id: 'custom', name: 'Custom Edit', icon: Wand2, hasPrompt: true, color: 'bg-fuchsia-500' },
  ],
  editing: [
    { id: 'bg-removal', name: 'AI Background Removal', icon: Eraser, hasPrompt: true, color: 'bg-rose-500' },
    { id: 'object-eraser', name: 'Magic Object Eraser', icon: Wand2, hasPrompt: true, color: 'bg-purple-500' },
    { id: 'art-studio', name: 'AI Art Studio', icon: Palette, hasPrompt: true, color: 'bg-cyan-500' },
  ],
};

const BG_SUGGESTIONS = ['studio', 'beach', 'office', 'nature', 'city'];
const CUSTOM_SUGGESTIONS = ['add smile', 'brighten', 'add text'];
const ERASER_SUGGESTIONS = ['Winking', 'Disappointment', 'Background people'];
const ART_SUGGESTIONS = [
  'Ghibli-style',
  'Chibi Cartoon',
  'Pixar',
  'Lego Style',
  'Royal Heritage',
  'Roblox',
  'Traditional Attire',
];

interface AIPhotoEditorModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function AIPhotoEditorModal({ imageUrl, onClose }: AIPhotoEditorModalProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleApplyFilter = async (featureId: string, _customPrompt?: string) => {
    setIsProcessing(true);
    setActiveFeature(featureId);
    
    // Simulate AI processing
    setTimeout(() => {
      setEditedImage(imageUrl);
      setShowComparison(true);
      setIsProcessing(false);
    }, 2000);
  };

  const getSuggestions = (featureId: string) => {
    switch (featureId) {
      case 'change-bg':
        return BG_SUGGESTIONS;
      case 'custom':
        return CUSTOM_SUGGESTIONS;
      case 'bg-removal':
      case 'object-eraser':
        return ERASER_SUGGESTIONS;
      case 'art-studio':
        return ART_SUGGESTIONS;
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[#f9f9f7]/80 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-7xl my-8"
      >
        {/* Glassmorphism Modal */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Header */}
          <div className="relative bg-[#c9982f]/90 backdrop-blur-md px-6 md:px-8 py-6 text-white overflow-hidden border-b border-white/20">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
                >
                  <Sparkles className="h-7 w-7" />
                </motion.div>
                <div>
                  <h3 className="font-jakarta text-2xl md:text-3xl font-bold flex items-center gap-2">
                    AI Photo Editor
                    <Stars className="h-6 w-6" />
                  </h3>
                  <p className="font-nunito text-sm text-white/90 mt-1">
                    Transform your photos with powerful AI magic
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-xl backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8">
            {/* Left - Image Preview */}
            <div className="lg:col-span-2">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 min-h-[500px] md:h-[600px] border border-gray-200/50">
                    {showComparison && editedImage ? (
                  <div className="w-full h-full">
                    <div className="mb-4 text-center">
                      <Badge className="bg-[#c9982f] text-white font-nunito border-0 px-4 py-2">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Drag slider to compare
                      </Badge>
                    </div>
                    <div className="relative w-full h-[calc(100%-3rem)] rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="relative w-1/2 border-r-4 border-[#c9982f]/30">
                          <img
                            src={imageUrl}
                            alt="Original"
                            className="w-full h-full object-contain bg-white"
                          />
                          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
                            <p className="font-jakarta text-sm font-bold text-gray-800">
                              Before
                            </p>
                          </div>
                        </div>
                        <div className="relative w-1/2">
                          <img
                            src={editedImage}
                            alt="Edited"
                            className="w-full h-full object-contain bg-white"
                          />
                          <div className="absolute bottom-4 right-4 bg-[#c9982f] px-4 py-2 rounded-full shadow-lg">
                            <p className="font-jakarta text-sm font-bold text-white flex items-center gap-1">
                              <Sparkles className="h-4 w-4" />
                              After
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <motion.div
                            animate={{ 
                              rotate: 360,
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block mb-6"
                          >
                            <Sparkles className="h-16 w-16 text-[#c9982f]" />
                          </motion.div>
                          <p className="font-jakarta text-xl font-bold text-[#c9982f] mb-2">
                            AI Magic in Progress...
                          </p>
                          <p className="font-nunito text-sm text-gray-600">
                            Creating something amazing
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showComparison && (
                <div className="mt-6 flex justify-center gap-4">
                  <Button
                    onClick={() => {
                      setShowComparison(false);
                      setEditedImage(null);
                    }}
                    variant="outline"
                    size="lg"
                    className="font-jakarta border-2 border-gray-300 hover:bg-gray-50 px-8 py-6 rounded-2xl"
                  >
                    Try Another Effect
                  </Button>
                  <Button
                    onClick={onClose}
                    size="lg"
                    className="bg-[#c9982f] hover:bg-[#b8872a] text-white font-jakarta px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Apply & Save
                  </Button>
                </div>
              )}
            </div>

            {/* Right - AI Controls */}
            <div className="lg:col-span-1 space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Gemini AI Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-jakarta text-lg font-bold text-blue-600">
                    Gemini AI Features
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AI_FEATURES.gemini.map((feature) => (
                    <div key={feature.id}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (feature.hasPrompt) {
                            setActiveFeature(feature.id);
                          } else {
                            handleApplyFilter(feature.id);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border-2 transition-all ${
                          activeFeature === feature.id
                            ? `${feature.color} border-transparent text-white shadow-lg`
                            : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        disabled={isProcessing}
                      >
                        <feature.icon className={`h-6 w-6 mx-auto mb-2 ${activeFeature === feature.id ? 'text-white' : ''}`} />
                        <span className="font-nunito text-xs font-medium text-center block">
                          {feature.name}
                        </span>
                      </motion.button>

                      <AnimatePresence>
                        {activeFeature === feature.id && feature.hasPrompt && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-3 col-span-2"
                          >
                            <Input
                              placeholder="Describe your edit..."
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              className="text-sm font-nunito bg-white/80 backdrop-blur-sm border-gray-300 focus:border-purple-500"
                            />
                            <div className="flex flex-wrap gap-2">
                              {getSuggestions(feature.id).map((suggestion) => (
                                <Button
                                  key={suggestion}
                                  onClick={() => setPrompt(suggestion)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs font-nunito bg-white/60 hover:bg-white border-gray-300"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                            <Button
                              onClick={() => handleApplyFilter(feature.id, prompt)}
                              size="sm"
                              className={`w-full ${feature.color} text-white shadow-md hover:shadow-lg transition-all hover:opacity-90`}
                            >
                              <Zap className="mr-2 h-4 w-4" />
                              Apply Effect
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Editing & Art Studio Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-jakarta text-lg font-bold text-purple-600">
                    AI Art Studio
                  </h4>
                </div>
                <div className="space-y-3">
                  {AI_FEATURES.editing.map((feature) => (
                    <div key={feature.id}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveFeature(feature.id)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          activeFeature === feature.id
                            ? `${feature.color} border-transparent text-white shadow-lg`
                            : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        disabled={isProcessing}
                      >
                        <feature.icon className={`h-6 w-6 ${activeFeature === feature.id ? 'text-white' : ''}`} />
                        <span className="font-nunito font-medium flex-1 text-left">{feature.name}</span>
                      </motion.button>

                      <AnimatePresence>
                        {activeFeature === feature.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-3 pl-4"
                          >
                            <Input
                              placeholder="Enter your creative prompt..."
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              className="text-sm font-nunito bg-white/80 backdrop-blur-sm border-gray-300 focus:border-purple-500"
                            />
                            <div className="flex flex-wrap gap-2">
                              {getSuggestions(feature.id).map((suggestion) => (
                                <Button
                                  key={suggestion}
                                  onClick={() => setPrompt(suggestion)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs font-nunito bg-white/60 hover:bg-white border-gray-300"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                            <Button
                              onClick={() => handleApplyFilter(feature.id, prompt)}
                              size="sm"
                              className={`w-full ${feature.color} text-white shadow-md hover:shadow-lg transition-all hover:opacity-90`}
                            >
                              <Stars className="mr-2 h-4 w-4" />
                              Create Magic
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
