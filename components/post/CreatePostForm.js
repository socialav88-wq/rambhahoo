'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon, BarChart3, MapPin, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { POST_TYPES, LOCALITIES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { createPost } from '@/app/actions/posts';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────

const T = (label) => {
  const t = Date.now();
  return {
    end: (extra = '') => {
      const ms = Date.now() - t;
      console.log(`%c[CREATE-POST] ✔ ${label}${extra ? ' — ' + extra : ''} (${ms}ms)`,
        'color:#10b981;font-weight:bold');
      return ms;
    },
    fail: (err) => {
      const ms = Date.now() - t;
      console.error(`%c[CREATE-POST] ✘ ${label} FAILED after ${ms}ms`, 'color:#ef4444;font-weight:bold', err);
      return ms;
    },
  };
};

async function compressImage(file) {
  const t = T('image-compression');
  try {
    const { default: imageCompression } = await import('browser-image-compression');
    const result = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
    t.end(`${(file.size / 1024 / 1024).toFixed(2)}MB → ${(result.size / 1024 / 1024).toFixed(2)}MB`);
    return result;
  } catch (err) {
    t.fail(err);
    console.warn('[CREATE-POST] Compression failed, using original file');
    return file;
  }
}

function getSupabaseClient() {
  const t = T('supabase-client-init');
  try {
    const { createClient } = require('@/lib/supabase/client');
    const client = createClient();
    if (!client) throw new Error('createClient() returned null/undefined');
    t.end('client OK');
    return client;
  } catch (err) {
    t.fail(err);
    throw err;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreatePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLocality = searchParams.get('locality') || '';

  const { user } = useAuthStore();
  const { addOptimisticPost, removeOptimisticPost, updateOptimisticPost } = useFeedStore();

  const [postType, setPostType]         = useState('discussion');
  const [title, setTitle]               = useState('');
  const [content, setContent]           = useState('');
  const [locality, setLocality]         = useState(initialLocality);
  const [tags, setTags]                 = useState('');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pollOptions, setPollOptions]   = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError]               = useState('');
  
  // GPS Location tracking
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        setError('Failed to get location. Please check browser permissions.');
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── STEP 0: Button click ──────────────────────────────────────────────
    const tTotal = T('total-create-post-flow');
    console.group('%c[CREATE-POST] ══ FLOW START ══', 'color:#6366f1;font-size:14px;font-weight:bold');
    console.log('[CREATE-POST] Post type:', postType);
    console.log('[CREATE-POST] Title:', title.trim() || '(empty)');
    console.log('[CREATE-POST] Has image:', !!imageFile);
    console.log('[CREATE-POST] Poll options:', pollOptions);

    // ── STEP 1: Client-side validation ───────────────────────────────────
    const tValidate = T('client-validation');
    if (!title.trim()) {
      tValidate.fail('title is empty');
      setError('Please enter a title for your post.');
      console.groupEnd();
      return;
    }
    if (!user) {
      tValidate.fail('user not authenticated');
      console.error('[CREATE-POST] ✘ No user in auth store — redirecting to login');
      console.groupEnd();
      router.push('/login?redirect=/create');
      return;
    }
    tValidate.end(`user=${user.id} type=${postType}`);
    console.log('[CREATE-POST] User ID:', user.id);
    console.log('[CREATE-POST] User email:', user.email);

    setIsSubmitting(true);
    setUploadStatus('Preparing post...');

    try {
      // ── STEP 2: Build FormData ──────────────────────────────────────────
      const tFormData = T('build-formdata');
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('post_type', postType);
      if (locality) formData.append('locality', locality);
      if (tags)     formData.append('tags', tags);
      if (gpsLocation) {
        formData.append('location_lat', gpsLocation.lat);
        formData.append('location_lng', gpsLocation.lng);
      }
      tFormData.end(`locality=${locality || 'none'} tags="${tags || 'none'}" gps=${gpsLocation ? 'yes' : 'no'}`);

      // Note: Image upload moved to background task

      // Note: Poll validation moved to optimistic phase

      // ── STEP 5: Discussion content check ───────────────────────────────
      if (postType === 'discussion' && !content.trim()) {
        setError('Please add content for your discussion.');
        setIsSubmitting(false);
        setUploadStatus('');
        console.groupEnd();
        return;
      }

      // ── OPTIMISTIC UI: INSTANT NAVIGATION ──────────────────────────────
      const tempId = 'temp-' + Date.now();
      const validOptions = postType === 'poll' ? pollOptions.filter(o => o.trim()) : [];
      
      const fakePost = {
        id: tempId,
        isOptimistic: true,
        post_type: postType,
        title: title.trim(),
        content: content.trim(),
        image_url: imagePreview || null, // the local blob URL
        created_at: new Date().toISOString(),
        user_id: user.id,
        comment_count: 0,
        upvotes: 0,
        downvotes: 0,
        profiles: {
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          display_name: user.user_metadata?.display_name || 'You',
          avatar_url: user.user_metadata?.avatar_url,
        },
        poll_options: postType === 'poll' ? validOptions.map((o, i) => ({ id: `temp-opt-${i}`, option_text: o, vote_count: 0, sort_order: i })) : []
      };

      // Instantly inject into the global feed
      addOptimisticPost(fakePost);
      
      // Instantly navigate back
      toast('Posting...', { icon: '🚀' });
      router.push('/');
      console.groupEnd();

      // ── BACKGROUND TASK: HEAVY LIFTING ─────────────────────────────────
      (async () => {
        try {
          // 3. Image Upload (Background)
          if (postType === 'image' && imageFile) {
            const fileToUpload = await compressImage(imageFile);
            const supabase = getSupabaseClient();
            const ext  = (fileToUpload.name || imageFile.name).split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${user.id}/${Date.now()}.${ext}`;

            const { error: upErr } = await supabase.storage
              .from('RAMBHAHOO')
              .upload(path, fileToUpload, { contentType: fileToUpload.type });

            if (upErr) throw new Error(`Image upload failed: ${upErr.message}`);

            const { data: urlData } = supabase.storage.from('RAMBHAHOO').getPublicUrl(path);
            formData.set('image_url', urlData.publicUrl);
          }

          if (postType === 'poll') {
            formData.set('poll_options', JSON.stringify(validOptions));
          }

          // 6. Server Action Call
          const result = await createPost(formData);
          
          if (result?.error) {
            throw new Error(result.error);
          } else if (result?.slug) {
            // Replace the fake post with the real one (or just remove the fake and let Feed revalidate)
            // It's safer to remove it so it's fully re-fetched if we do a hard refresh, but for SPA:
            removeOptimisticPost(tempId);
            toast.success('Posted successfully!');
          }
        } catch (err) {
          console.error('[CREATE-POST] Background Task Error:', err);
          updateOptimisticPost(tempId, { hasError: true, errorMessage: err.message });
          toast.error(`Failed to post: ${err.message}`);
        }
      })();

    } catch (err) {
      console.error('[CREATE-POST] ✘ UNCAUGHT ERROR:', err);
      setError(`Unexpected error: ${err?.message || String(err)}`);
      setIsSubmitting(false);
      setUploadStatus('');
      console.groupEnd();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Max 20 MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-bg-card rounded-2xl border border-border p-6 shadow-md">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-poppins)] mb-6">
        Create Post
      </h1>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-sm text-accent-red flex items-start gap-2">
          <X size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Type Selector */}
        <div className="grid grid-cols-3 gap-3">
          {POST_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setPostType(t.value); setError(''); }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                postType === t.value
                  ? 'border-blue-primary bg-blue-primary/10 text-blue-primary shadow-sm'
                  : 'border-border bg-bg-elevated text-text-muted hover:border-border-light hover:text-text-primary'
              }`}
            >
              {t.value === 'discussion' && <MessageSquare size={24} />}
              {t.value === 'image'      && <ImageIcon size={24} />}
              {t.value === 'poll'       && <BarChart3 size={24} />}
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Title <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a catchy title..."
            maxLength={100}
            required
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all"
          />
          <p className="text-xs text-text-dim mt-1 text-right">{title.length}/100</p>
        </div>

        {/* Image Upload (image) */}
        {postType === 'image' && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Upload Image (JPG, PNG, WEBP) <span className="text-accent-red">*</span>
            </label>
            {!imagePreview ? (
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageChange}
                required
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-primary/10 file:text-blue-primary hover:file:bg-blue-primary/20 transition-all cursor-pointer"
              />
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border bg-bg-elevated">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Poll Options */}
        {postType === 'poll' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Poll Options <span className="text-accent-red">*</span>
            </label>
            <div className="space-y-3">
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
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="p-2.5 bg-bg-elevated border border-border rounded-xl text-accent-red hover:bg-accent-red/10 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="w-full border-dashed"
                >
                  + Add Option
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {postType === 'discussion' ? (
              <>Content <span className="text-accent-red">*</span></>
            ) : (
              'Description (Optional)'
            )}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'discussion'
                ? "What's on your mind? Share details..."
                : 'Add some context...'
            }
            rows={5}
            required={postType === 'discussion'}
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Locality & GPS */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1.5">
              <MapPin size={16} className="text-text-muted" /> Exact Location (Nearby Feed)
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                loading={isLocating}
                className="flex-1 bg-bg-elevated border-border"
              >
                {gpsLocation ? '📍 Location Attached' : 'Get Current Location'}
              </Button>
            </div>
            {gpsLocation && (
              <p className="text-xs text-text-dim mt-1 text-green-500">
                GPS coordinates acquired for accurate Nearby discoverability.
              </p>
            )}
            
            <label className="block text-sm font-medium text-text-primary mt-4 mb-1.5 flex items-center gap-1.5">
              Neighborhood Tag (Optional)
            </label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-primary appearance-none"
            >
              <option value="">Anywhere in Hyderabad</option>
              {LOCALITIES.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.emoji} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="traffic, food, rant..."
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex gap-3 justify-end items-center">
          {isSubmitting && uploadStatus && (
            <span className="text-sm text-text-dim mr-auto animate-pulse">{uploadStatus}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
