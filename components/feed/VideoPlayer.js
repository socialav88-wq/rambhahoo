'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';

// Global variable to keep track of the currently playing video element
let activeVideoElement = null;

export default function VideoPlayer({ src, metadata = {} }) {
  const { thumbnail_url, duration, file_size, mime_type } = metadata;
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy load video source using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Autoplay/Pause when 50% visible, or scrolled away
  useEffect(() => {
    const autoplayObserver = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          // Play video when 50% or more is visible
          video.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Autoplay block by browser (silently keep paused state)
              setIsPlaying(false);
            });
        } else {
          // Pause when scrolled away
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      autoplayObserver.observe(containerRef.current);
    }

    return () => {
      autoplayObserver.disconnect();
    };
  }, []);

  // Synchronize playing states
  const handlePlayState = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Pause active video first
      if (activeVideoElement && activeVideoElement !== video) {
        try {
          activeVideoElement.pause();
        } catch (e) {}
      }
      activeVideoElement = video;

      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    } else {
      video.pause();
      setIsPlaying(false);
      if (activeVideoElement === video) {
        activeVideoElement = null;
      }
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration) {
      setVideoDuration(video.duration);
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-border shadow-sm relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlayState}
    >
      {/* HTML5 Video element */}
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onLoadStart={() => setIsLoading(true)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
            setHasError(false);
            if (activeVideoElement && activeVideoElement !== videoRef.current) {
              try { activeVideoElement.pause(); } catch (e) {}
            }
            activeVideoElement = videoRef.current;
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={(e) => setVideoDuration(e.target.duration)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      {/* Video Poster Thumbnail */}
      {(!isPlaying || !isVisible) && thumbnail_url && (
        <img 
          src={thumbnail_url} 
          alt="Video poster" 
          className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300"
        />
      )}

      {/* Play Overlay Button */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 transition-all group-hover:bg-black/45">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-transform duration-200 shadow-lg">
            <Play className="text-white fill-white translate-x-0.5" size={30} />
          </div>
        </div>
      )}

      {/* Loading Buffering Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
          <Loader2 className="animate-spin text-blue-primary" size={40} />
        </div>
      )}

      {/* Error Playback Indicator */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white z-20 p-4 text-center">
          <AlertCircle className="text-accent-red mb-2" size={36} />
          <p className="text-sm font-semibold">Playback failed</p>
          <p className="text-xs text-text-dim mt-1">Unsupported video codec or network error</p>
        </div>
      )}

      {/* Custom Control Overlay (Desktop hover, Mobile always show on pause or touch) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30 transition-opacity duration-200 ${
          isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()} // Stop clicking controls from toggling play state
      >
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer relative group/progress overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-blue-primary transition-all duration-75 relative rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between text-white select-none">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handlePlayState}
              className="hover:scale-110 active:scale-90 transition-transform p-1 rounded-full hover:bg-white/10"
            >
              {isPlaying ? (
                <Pause size={18} className="fill-white" />
              ) : (
                <Play size={18} className="fill-white translate-x-0.5" />
              )}
            </button>

            {/* Time display */}
            <span className="text-xs font-medium">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mute button */}
            <button 
              type="button"
              onClick={handleMuteToggle}
              className="hover:scale-110 active:scale-90 transition-transform p-1 rounded-full hover:bg-white/10"
            >
              {isMuted ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
