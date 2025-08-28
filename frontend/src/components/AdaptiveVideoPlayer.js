import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Maximize, AlertCircle, ExternalLink } from 'lucide-react';
import { useAdaptiveStreaming } from '../hooks/useAdaptiveStreaming';

const AdaptiveVideoPlayer = ({ 
  video, 
  userEmail, 
  videoId,
  autoPlay = false,
  onProgressUpdate,
  onError,
  theme = 'dark'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSimplePlayer, setUseSimplePlayer] = useState(false);
  
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const { isMobile, shouldUseLowBandwidthMode, getStreamingSettings } = useAdaptiveStreaming();

  useEffect(() => {
    // Start with simple player if mobile or low bandwidth
    if (shouldUseLowBandwidthMode()) {
      setUseSimplePlayer(true);
    }
    
    initializePlayer();
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [video]);

  const initializePlayer = () => {
    try {
      setLoading(false);
      setError(null);
      
      if (useSimplePlayer || shouldUseLowBandwidthMode()) {
        // Use simple iframe/video tag approach
        return;
      }
      
      // If complex player fails, fall back to simple
      setTimeout(() => {
        if (error) {
          setUseSimplePlayer(true);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Error al cargar el reproductor');
      setUseSimplePlayer(true);
      if (onError) onError(err);
    }
  };

  const handleError = (errorMessage) => {
    console.error('Player error:', errorMessage);
    setError(errorMessage);
    setUseSimplePlayer(true);
    if (onError) onError(errorMessage);
  };

  const openInNewTab = () => {
    if (video.video_type === 'youtube' && video.youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank');
    } else if (video.video_type === 'vimeo' && video.vimeoId) {
      window.open(`https://vimeo.com/${video.vimeoId}`, '_blank');
    } else if (video.video_type === 'mp4' && video.url) {
      window.open(video.url, '_blank');
    }
  };

  const getVideoUrl = () => {
    if (video.video_type === 'youtube' && video.youtubeId) {
      return `https://www.youtube.com/embed/${video.youtubeId}?autoplay=${autoPlay ? 1 : 0}&controls=1&rel=0&modestbranding=1&origin=${window.location.origin}`;
    } else if (video.video_type === 'vimeo' && video.vimeoId) {
      return `https://player.vimeo.com/video/${video.vimeoId}?autoplay=${autoPlay ? 1 : 0}&controls=1&byline=0&portrait=0`;
    } else if (video.video_type === 'mp4' && video.url) {
      return video.url;
    }
    return null;
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (onProgressUpdate) {
        onProgressUpdate(progress, duration, progress >= 90);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className={`w-full h-96 flex items-center justify-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A95E]"></div>
          <p className="text-sm text-gray-500">Cargando reproductor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-96 flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-gray-100 border-gray-300 text-gray-900'
      }`}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error al cargar el video</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          {error}
        </p>
        <button
          onClick={openInNewTab}
          className="flex items-center space-x-2 px-4 py-2 bg-[#C5A95E] text-white rounded-lg hover:bg-[#B8975A] transition-colors"
        >
          <ExternalLink size={16} />
          <span>Ver en sitio original</span>
        </button>
      </div>
    );
  }

  const videoUrl = getVideoUrl();

  if (video.video_type === 'mp4') {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay={autoPlay}
          className="w-full h-auto"
          onError={() => handleError('Error al reproducir el archivo MP4')}
          onLoadedMetadata={(e) => {
            setDuration(e.target.duration);
            if (onProgressUpdate) {
              onProgressUpdate(0, e.target.duration, false);
            }
          }}
          onTimeUpdate={(e) => {
            const currentProgress = (e.target.currentTime / e.target.duration) * 100;
            setProgress(currentProgress);
            setCurrentTime(e.target.currentTime);
            
            if (onProgressUpdate) {
              onProgressUpdate(currentProgress, e.target.duration, currentProgress >= 90);
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            startProgressTracking();
          }}
          onPause={() => setIsPlaying(false)}
        >
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  }

  // For YouTube and Vimeo, use simple iframe
  return (
    <div className="w-full rounded-lg overflow-hidden bg-black">
      <iframe
        src={videoUrl}
        width="100%"
        height="400"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={video.title}
        className="w-full h-96"
        onLoad={() => {
          setLoading(false);
          setError(null);
          if (autoPlay) {
            setIsPlaying(true);
            startProgressTracking();
          }
        }}
        onError={() => handleError('Error al cargar el reproductor')}
      />
    </div>
  );
};

export default AdaptiveVideoPlayer;