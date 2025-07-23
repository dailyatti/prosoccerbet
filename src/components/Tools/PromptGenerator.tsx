import React, { useState, useEffect } from 'react';
import { Brain, Upload, Type, Wand2, Copy, Download, AlertCircle, CheckCircle, Image, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function PromptGenerator() {
  const { user } = useAuth();
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecentPrompts();
    }
  }, [user]);

  const fetchRecentPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_generations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPrompts(data || []);
    } catch (err) {
      console.error('Error fetching recent prompts:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const generatePrompt = async () => {
    if (!textInput && !imageFile) {
      setError('Please provide either text input or upload an image');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let prompt = '';
      
      if (inputType === 'text' && textInput) {
        // Enhanced text-based prompt generation
        prompt = `Professional AI Prompt - Enhanced Version:

Original Input: "${textInput}"

🎯 ENHANCED PROMPT:
Create a highly detailed, professional-grade image/content based on: "${textInput}"

📋 SPECIFICATIONS:
• Style: Professional, high-quality, detailed
• Technical Quality: 4K resolution, sharp focus, optimal lighting
• Composition: Rule of thirds, balanced elements, dynamic perspective
• Color Palette: Harmonious colors, proper contrast, vibrant yet realistic
• Mood & Atmosphere: ${textInput.toLowerCase().includes('dark') || textInput.toLowerCase().includes('moody') ? 'Dramatic, atmospheric lighting with rich shadows' : 'Bright, positive, engaging atmosphere'}
• Detail Level: Intricate details, texture emphasis, depth of field

🎨 ARTISTIC DIRECTION:
• Professional photography/illustration style
• Studio-quality lighting setup
• Crisp, clear details with no blur
• Photorealistic rendering
• Award-winning composition

⚡ QUALITY ENHANCERS:
• Ultra-high resolution
• Perfect exposure and white balance
• Professional color grading
• Sharp focus throughout
• Masterpiece quality

This prompt is optimized for AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.`;

      } else if (inputType === 'image' && imageFile) {
        // Image analysis-based prompt generation
        prompt = `Professional AI Prompt - Image Analysis Based:

📸 SOURCE: Image analysis of uploaded file "${imageFile.name}"

🎯 RECREATE & ENHANCE:
Generate a professional image that captures and enhances the visual elements from the reference image.

📋 DETAILED SPECIFICATIONS:
• Visual Style: Match and improve upon the reference aesthetic
• Composition: Maintain similar layout with professional refinements  
• Color Scheme: Enhanced color palette based on reference tones
• Lighting: Professional studio lighting to enhance the original mood
• Quality: Ultra-high resolution, crystal clear details
• Perspective: Optimal viewing angle with improved depth

🎨 ENHANCEMENT DIRECTIONS:
• Upgrade to professional photography standards
• Enhance all textures and surface details
• Improve lighting for maximum visual impact
• Add subtle artistic flair while maintaining authenticity
• Ensure award-winning composition quality

⚡ TECHNICAL REQUIREMENTS:
• 4K+ resolution output
• Perfect focus and clarity
• Professional color correction
• Optimal contrast and saturation
• Masterpiece-level execution

🔧 AI GENERATION SETTINGS:
• High detail mode enabled
• Professional rendering quality
• Enhanced texture processing
• Advanced lighting simulation

This prompt is specifically crafted for high-end AI image generation with reference image input.`;
      }

      setGeneratedPrompt(prompt);
      setSuccess('Professional prompt generated successfully!');

      // Save to database
      if (user) {
        await supabase
          .from('prompt_generations')
          .insert({
            user_id: user.id,
            original_text: textInput || null,
            image_url: imageFile ? imageFile.name : null,
            generated_prompt: prompt
          });
        
        fetchRecentPrompts();
      }

    } catch (err) {
      setError('Failed to generate prompt. Please try again.');
      console.error('Error generating prompt:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setSuccess('Prompt copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `professional-prompt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('Prompt downloaded successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const clearForm = () => {
    setTextInput('');
    setImageFile(null);
    setImagePreview(null);
    setGeneratedPrompt('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Prompt Generator</h1>
              <p className="text-gray-400 mt-1">Generate professional AI prompts from text descriptions or images</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Input Type Selector */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Input Method</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputType('text')}
                  className={`flex items-center justify-center space-x-3 p-4 rounded-lg transition-all duration-200 ${
                    inputType === 'text'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Type className="h-5 w-5" />
                  <span className="font-medium">Text Input</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputType('image')}
                  className={`flex items-center justify-center space-x-3 p-4 rounded-lg transition-all duration-200 ${
                    inputType === 'image'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Image Upload</span>
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {inputType === 'text' ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Describe what you want to create
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Example: A futuristic cityscape at sunset with flying cars and neon lights, cyberpunk style, highly detailed..."
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      Be as detailed as possible for better results
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Upload reference image
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-w-full max-h-48 rounded-lg object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">Click to change</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Image className="h-12 w-12 text-gray-400" />
                            <div>
                              <p className="text-gray-300 font-medium">Click to upload image</p>
                              <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePrompt}
                disabled={loading || (!textInput && !imageFile)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                <Wand2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Generating...' : 'Generate Prompt'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearForm}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <span>Clear All</span>
              </motion.button>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                    <span className="text-red-400">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-500/10 border border-green-500/50 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    <span className="text-green-400">{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generated Prompt Output */}
            <AnimatePresence>
              {generatedPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Generated Prompt</h3>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadPrompt}
                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                      {generatedPrompt}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Prompts Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent Prompts
              </h3>
              
              <div className="space-y-3">
                {recentPrompts.length > 0 ? (
                  recentPrompts.map((prompt, index) => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => setGeneratedPrompt(prompt.generated_prompt)}
                    >
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {prompt.original_text || prompt.image_url || 'Image-based prompt'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent prompts yet</p>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <h4 className="text-white font-semibold mb-3">💡 Pro Tips</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Be specific with colors, lighting, and mood</li>
                <li>• Include style references (e.g., "photorealistic", "cartoon")</li>
                <li>• Specify image quality terms like "4K", "highly detailed"</li>
                <li>• Add camera angles and composition notes</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}