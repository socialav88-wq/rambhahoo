'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon, BarChart3, MapPin, X, MessageSquare, CheckCircle2, Calendar, Video } from 'lucide-react';
import Button from '@/components/ui/Button';
import { POST_TYPES, LOCALITIES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { createPost } from '@/app/actions/posts';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'discussion', label: '💬 General Discussion' },
  { value: 'question', label: '❓ Ask a Question' },
  { value: 'recommendation', label: '👍 Recommendation' },
  { value: 'news', label: '📰 Civic News' },
  { value: 'confession', label: '🤫 Local Confession' },
  { value: 'opinion', label: '🗣️ Opinion' },
  { value: 'battle', label: '⚔️ Local Battle' },
  { value: 'meme', label: '🎭 Local Meme' }
];

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
  if (file.size <= 2 * 1024 * 1024) {
    console.log('[CREATE-POST] Image is already under 2 MB. Skipping compression.');
    return file;
  }
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

function uploadToSupabaseWithProgress(bucket, path, file, token, onProgress, abortSignal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vtszkowjjwkdxxgufgie.supabase.co';
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    
    xhr.open('POST', url, true);
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Upload aborted', 'AbortError'));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (e) {
          resolve({ path });
        }
      } else {
        let errorMsg = 'Upload failed';
        try {
          const res = JSON.parse(xhr.responseText);
          errorMsg = res.message || errorMsg;
        } catch (e) {}
        reject(new Error(`${errorMsg} (Status ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload.'));
    };

    xhr.send(file);
  });
}

function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      if (video.duration > 60) {
        resolve({ error: 'Video duration exceeds 60 seconds.' });
        return;
      }
      video.currentTime = Math.min(1.0, video.duration / 2);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve({
            blob,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            url: URL.createObjectURL(blob)
          });
        }, 'image/jpeg', 0.85);
      } catch (err) {
        console.error('Failed to generate thumbnail via canvas:', err);
        resolve({ error: null, duration: video.duration, width: video.videoWidth || 640, height: video.videoHeight || 480 });
      }
    };
    
    video.onerror = () => {
      resolve({ error: 'Failed to load video file.' });
    };
  });
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
  const [category, setCategory]         = useState('discussion');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoFile, setVideoFile]       = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoWidth, setVideoWidth]     = useState(0);
  const [videoHeight, setVideoHeight]   = useState(0);
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [abortController, setAbortController] = useState(null);
  const [pollOptions, setPollOptions]   = useState(['', '']);
  const [eventDate, setEventDate]       = useState('');
  const [locationName, setLocationName] = useState('');
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

    const tTotal = T('total-create-post-flow');
    console.group('%c[CREATE-POST] ══ FLOW START ══', 'color:#6366f1;font-size:14px;font-weight:bold');
    console.log('[CREATE-POST] Post type:', postType);
    console.log('[CREATE-POST] Title:', title.trim() || '(empty)');
    console.log('[CREATE-POST] Has image:', !!imageFile);
    console.log('[CREATE-POST] Poll options:', pollOptions);

    // Client-side validation
    const tValidate = T('client-validation');
    if (!title.trim()) {
      tValidate.fail('title is empty');
      setError('Please enter a title for your post.');
      console.groupEnd();
      return;
    }
    if (postType === 'event' && !eventDate) {
      tValidate.fail('event date is empty');
      setError('Please select a date and time for the event.');
      console.groupEnd();
      return;
    }
    if (postType === 'discussion' && !content.trim()) {
      tValidate.fail('content is empty');
      setError('Please add content for your discussion.');
      console.groupEnd();
      return;
    }
    if (postType === 'image' && !imageFile) {
      tValidate.fail('image file is missing');
      setError('Please select an image to post.');
      console.groupEnd();
      return;
    }
    if (postType === 'video' && !videoFile) {
      tValidate.fail('video file is missing');
      setError('Please select a video file.');
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

    setIsSubmitting(true);
    setUploadStatus('Preparing post...');
    setUploadProgress(0);

    try {
      const tFormData = T('build-formdata');
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('post_type', postType);
      if (locality) formData.append('locality', locality);
      if (tags)     formData.append('tags', tags.toLowerCase());
      formData.append('category', category);
      
      if (postType === 'event') {
        formData.append('event_date', new Date(eventDate).toISOString());
        if (locationName) formData.append('location_name', locationName.trim());
      }
      if (gpsLocation) {
        formData.append('location_lat', gpsLocation.lat);
        formData.append('location_lng', gpsLocation.lng);
      }
      tFormData.end(`locality=${locality || 'none'} tags="${tags || 'none'}" gps=${gpsLocation ? 'yes' : 'no'}`);

      // Handle image upload synchronously
      if (postType === 'image' && imageFile) {
        try {
          setUploadStatus('Compressing image...');
          const fileToUpload = await compressImage(imageFile);

          setUploadStatus('Uploading image to storage...');
          const supabase = getSupabaseClient();
          const ext = (fileToUpload.name || imageFile.name).split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${user.id}/${Date.now()}.${ext}`;

          const { error: upErr } = await supabase.storage
              .from('tapri-images')
              .upload(path, fileToUpload, { contentType: fileToUpload.type });

          if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

          const { data: urlData } = supabase.storage.from('tapri-images').getPublicUrl(path);
          if (!urlData?.publicUrl) throw new Error('Failed to generate public URL for uploaded image.');

          formData.set('image_url', urlData.publicUrl);
          console.log('[CREATE-POST] Image uploaded successfully. Public URL:', urlData.publicUrl);
        } catch (uploadErr) {
          console.warn('[CREATE-POST] Image upload failed, fallback to text discussion:', uploadErr);
          toast.error(`Image upload failed: ${uploadErr.message}. Posting as text discussion instead.`);
          formData.set('post_type', 'discussion');
          formData.delete('image_url');
        }
      }

      // Handle video upload synchronously
      if (postType === 'video' && videoFile) {
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error('Authentication session token is invalid or expired.');

        const controller = new AbortController();
        setAbortController(controller);

        const videoExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const videoPath = `videos/${user.id}/${Date.now()}_video.${videoExt}`;

        try {
          setUploadStatus('Uploading video (0%)...');
          await uploadToSupabaseWithProgress(
            'RAMBHAHOO',
            videoPath,
            videoFile,
            token,
            (pct) => {
              setUploadProgress(pct);
              setUploadStatus(`Uploading video (${pct}%)...`);
            },
            controller.signal
          );
        } catch (upErr) {
          if (upErr.name === 'AbortError') {
            throw new Error('Upload cancelled by user.');
          }
          throw upErr;
        }

        // Upload generated thumbnail poster image
        let thumbnailUrl = '';
        if (thumbnailBlob) {
          setUploadStatus('Generating & uploading thumbnail...');
          const thumbPath = `thumbnails/${user.id}/${Date.now()}_thumb.jpg`;
          try {
            await uploadToSupabaseWithProgress(
              'RAMBHAHOO',
              thumbPath,
              thumbnailBlob,
              token,
              null,
              controller.signal
            );
            const { data: thumbUrlData } = supabase.storage.from('RAMBHAHOO').getPublicUrl(thumbPath);
            thumbnailUrl = thumbUrlData?.publicUrl || '';
          } catch (thumbErr) {
            console.warn('[CREATE-POST] Thumbnail upload failed:', thumbErr);
          }
        }

        const { data: videoUrlData } = supabase.storage.from('RAMBHAHOO').getPublicUrl(videoPath);
        if (!videoUrlData?.publicUrl) throw new Error('Failed to generate public URL for video.');

        formData.set('video_url', videoUrlData.publicUrl);

        const videoMetadata = {
          thumbnail_url: thumbnailUrl,
          duration: videoDuration,
          file_size: videoFile.size,
          mime_type: videoFile.type,
          width: videoWidth,
          height: videoHeight,
          upload_timestamp: new Date().toISOString()
        };
        formData.set('video_metadata', JSON.stringify(videoMetadata));
        setAbortController(null);
      }

      if (postType === 'poll') {
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length < 2) {
          throw new Error('Please provide at least 2 options for the poll.');
        }
        formData.set('poll_options', JSON.stringify(validOptions));
      }

      setUploadStatus('Saving post to database...');
      const result = await createPost(formData);
      
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success('Posted successfully!');
      tTotal.end('success');
      
      // Navigate to home page and refresh to display post immediately
      router.push('/');
      router.refresh();
    } catch (err) {
      tTotal.fail(err);
      console.error('[CREATE-POST] ✘ ERROR:', err);
      setError(err.message || 'An unexpected error occurred.');
      toast.error(`Failed to post: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
      setUploadProgress(0);
      setAbortController(null);
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

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported MIME types: mp4, mov (video/quicktime), webm
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported video format. Please upload an MP4, MOV, or WebM video.');
      toast.error('Unsupported video format');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video file exceeds the 50 MB limit.');
      toast.error('Video too large (Max 50 MB)');
      return;
    }

    setError('');
    setUploadStatus('Analyzing video...');
    
    try {
      const metadata = await generateVideoThumbnail(file);
      if (metadata.error) {
        setError(metadata.error);
        toast.error(metadata.error);
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoDuration(metadata.duration);
      setVideoWidth(metadata.width);
      setVideoHeight(metadata.height);
      
      if (metadata.blob) {
        setThumbnailBlob(metadata.blob);
        setThumbnailPreview(metadata.url);
      }
    } catch (err) {
      console.error('Failed to validate video:', err);
      setError('Failed to process video file.');
    } finally {
      setUploadStatus('');
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setVideoDuration(0);
    setVideoWidth(0);
    setVideoHeight(0);
    setThumbnailBlob(null);
    setThumbnailPreview('');
    setError('');
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
              {t.value === 'video'      && <Video size={24} />}
              {t.value === 'poll'       && <BarChart3 size={24} />}
              {t.value === 'event'      && <Calendar size={24} />}
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
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

        {/* Video Upload (video) */}
        {postType === 'video' && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Upload Video (MP4, MOV, WebM - Max 50 MB, 60s) <span className="text-accent-red">*</span>
            </label>
            {!videoPreview ? (
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoChange}
                required
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-primary/10 file:text-blue-primary hover:file:bg-blue-primary/20 transition-all cursor-pointer"
              />
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border bg-bg-elevated flex flex-col items-center p-4">
                <div className="w-full max-w-xs aspect-[4/5] rounded-xl overflow-hidden bg-black relative">
                  <video src={videoPreview} controls className="w-full h-full object-cover" />
                  {thumbnailPreview && (
                    <div className="absolute top-2 left-2 bg-blue-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-15">
                      Poster Frame generated
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between w-full max-w-xs text-sm">
                  <span className="text-text-muted font-medium">Duration: {Math.round(videoDuration)}s</span>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="flex items-center gap-1 text-accent-red font-semibold hover:underline"
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
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

        {/* Event Options */}
        {postType === 'event' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Event Date & Time <span className="text-accent-red">*</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Venue Name (Optional)
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. KBR Park Entrance"
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary transition-all"
              />
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

        {/* Progress Bar & Actions */}
        <div className="pt-4 border-t border-border flex flex-col gap-4">
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full bg-bg-elevated rounded-xl p-3 border border-border">
              <div className="flex justify-between items-center text-xs font-semibold mb-1 text-text-muted">
                <span>{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {abortController && (
                <button
                  type="button"
                  onClick={() => abortController.abort()}
                  className="text-xs text-accent-red font-semibold hover:underline mt-2 flex items-center gap-1"
                >
                  <X size={12} /> Cancel Upload
                </button>
              )}
            </div>
          )}
          
          <div className="flex gap-3 justify-end items-center w-full">
            {isSubmitting && uploadStatus && uploadProgress === 0 && (
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
        </div>
      </form>
    </div>
  );
}
