'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, ImageIcon, BarChart3, MapPin, X, Loader2, AlertCircle, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ADVICE_CATEGORIES_MAP } from '@/components/advice/AdviceFeedCard';
import { LOCALITIES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { createAdvicePost } from '@/app/actions/advice';
import toast from 'react-hot-toast';

async function compressImage(file) {
  if (file.size <= 2 * 1024 * 1024) return file;
  try {
    const { default: imageCompression } = await import('browser-image-compression');
    return await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  } catch (err) {
    console.warn('[COMPRESSION-ERROR] Failed to compress image:', err);
    return file;
  }
}

export default function CreateAdviceForm() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [category, setCategory] = useState('general');
  const [locality, setLocality] = useState(profile?.locality_id ? LOCALITIES.find(l => l.id === profile.locality_id)?.slug || '' : '');
  const [anonymousMode, setAnonymousMode] = useState(false);
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Poll states
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  const categories = Object.entries(ADVICE_CATEGORIES_MAP).map(([key, val]) => ({
    value: key,
    label: `${val.emoji} ${val.label}`
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      toast.error('Please log in to ask for advice.');
      router.push('/login?redirect=/advice/create');
      return;
    }

    if (!title.trim() || !content.trim() || !category) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isPoll) {
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        setError('Please provide at least 2 choices for the poll.');
        return;
      }
    }

    setIsSubmitting(true);
    setUploadStatus('Preparing request...');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('additional_details', additionalDetails.trim());
      formData.append('category', category);
      formData.append('anonymous_mode', String(anonymousMode));
      formData.append('is_poll', String(isPoll));
      if (locality) formData.append('locality', locality);

      // Upload image if present
      if (imageFile) {
        setUploadStatus('Compressing image...');
        const fileToUpload = await compressImage(imageFile);

        setUploadStatus('Uploading image...');
        const { createClient } = require('@/lib/supabase/client');
        const supabase = createClient();
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/advice_${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('tapri-images')
          .upload(path, fileToUpload, { contentType: fileToUpload.type });

        if (upErr) throw new Error(upErr.message);

        const { data: urlData } = supabase.storage.from('tapri-images').getPublicUrl(path);
        if (!urlData?.publicUrl) throw new Error('Failed to retrieve image URL');

        formData.append('image_url', urlData.publicUrl);
      }

      if (isPoll) {
        const validOptions = pollOptions.filter(o => o.trim());
        formData.append('poll_options', JSON.stringify(validOptions));
      }

      setUploadStatus('Saving to Rambhahoo database...');
      const res = await createAdvicePost(formData);

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success('Your advice request is live!');
      router.push(`/advice/post/${res.slug}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
      toast.error(`Post failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Image too large. Max 15 MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-bg-card rounded-3xl border border-border p-6 shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="text-blue-primary" size={24} />
        <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-poppins)]">
          Seek Advice
        </h1>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-accent-red/10 border border-accent-red/20 rounded-2xl text-sm text-accent-red flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title / Question */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">
            What is your question? <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Should I choose a remote job or local MNC?"
            maxLength={100}
            required
            disabled={isSubmitting}
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/30 transition-all font-medium"
          />
        </div>

        {/* Category & Locality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Advice Category <span className="text-accent-red">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-primary"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5 flex items-center gap-1">
              <MapPin size={14} className="text-text-muted" /> Locality Tag (Optional)
            </label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-primary"
            >
              <option value="">Anywhere in Hyderabad</option>
              {LOCALITIES.map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.emoji} {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content (Context) */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">
            Describe your situation <span className="text-accent-red">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Explain the background context, options you have, or challenges you're facing..."
            rows={5}
            required
            disabled={isSubmitting}
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Additional Details (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">
            Additional details or specific questions (Optional)
          </label>
          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="e.g. Any specific metrics, salary differences, pros and cons..."
            rows={3}
            disabled={isSubmitting}
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary transition-all resize-y text-xs leading-relaxed"
          />
        </div>

        {/* Poll Toggle & Fields */}
        <div className="border border-border/60 bg-bg-elevated/40 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-text-muted" size={18} />
              <div>
                <span className="text-sm font-semibold text-text-primary block">Include a poll</span>
                <span className="text-xs text-text-dim">Let the community vote on options</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPoll}
                onChange={(e) => setIsPoll(e.target.checked)}
                disabled={isSubmitting}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-primary"></div>
            </label>
          </div>

          {isPoll && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const n = [...pollOptions];
                      n[i] = e.target.value;
                      setPollOptions(n);
                    }}
                    placeholder={`Choice Option ${i + 1}`}
                    required={isPoll}
                    disabled={isSubmitting}
                    className="flex-1 bg-bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      disabled={isSubmitting}
                      className="p-2 bg-bg-card border border-border rounded-xl text-accent-red hover:bg-accent-red/5"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  disabled={isSubmitting}
                  className="w-full text-center py-2 border border-dashed border-border rounded-xl text-xs font-semibold text-blue-primary hover:bg-blue-primary/5 transition-colors"
                >
                  + Add Option Choice
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media / Image Attachments */}
        <div className="border border-border/60 bg-bg-elevated/40 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-text-muted" size={18} />
            <div>
              <span className="text-sm font-semibold text-text-primary block">Attach an image</span>
              <span className="text-xs text-text-dim">Attach a visual chart, comparison, or photo</span>
            </div>
          </div>
          
          {!imagePreview ? (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
              disabled={isSubmitting}
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-primary/10 file:text-blue-primary hover:file:bg-blue-primary/20 transition-all cursor-pointer"
            />
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border bg-bg-card max-h-48 flex justify-center">
              <img src={imagePreview} alt="Upload preview" className="max-h-48 object-contain" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                disabled={isSubmitting}
                className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Anonymous Mode Option */}
        <div className="border border-border/60 bg-bg-elevated/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="text-text-muted" size={18} />
            <div>
              <span className="text-sm font-semibold text-text-primary block">Ask Anonymously</span>
              <span className="text-xs text-text-dim">Hide your username and avatar from the community</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={anonymousMode}
              onChange={(e) => setAnonymousMode(e.target.checked)}
              disabled={isSubmitting}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-primary"></div>
          </label>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-border flex gap-3 justify-end items-center">
          {isSubmitting && uploadStatus && (
            <span className="text-xs text-text-dim mr-auto animate-pulse flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              <span>{uploadStatus}</span>
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-full px-5"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting} 
            disabled={isSubmitting}
            className="rounded-full px-6 font-bold"
          >
            Ask Question
          </Button>
        </div>
      </form>
    </div>
  );
}
