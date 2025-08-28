import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, ExternalLink } from 'lucide-react';

const SimpleVideoPlayer = ({ 
  video, 
  userEmail, 
  autoPlay = false,
  onProgressUpdate,
  theme = 'dark' 
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simple timeout to simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getVideoUrl = () => {
    if (video.video_type === 'youtube' && video.youtubeId) {
      return `https://www.youtube.com/embed/${video.youtubeId}?autoplay=${autoPlay ? 1 : 0}&controls=1&rel=0`;
    } else if (video.video_type === 'vimeo' && video.vimeoId) {
      return `https://player.vimeo.com/video/${video.vimeoId}?autoplay=${autoPlay ? 1 : 0}&controls=1`;
    } else if (video.video_type === 'mp4' && video.url) {
      return video.url;
    }
    return null;
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

  const videoUrl = getVideoUrl();

  if (loading) {
    return (
      <div className={`w-full h-64 flex items-center justify-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A95E]"></div>
          <p className="text-sm text-gray-500">Cargando reproductor...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`w-full h-64 flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-gray-100 border-gray-300 text-gray-900'
      }`}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error al cargar el video</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          {error || 'El reproductor no pudo inicializarse correctamente.'}
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

  if (video.video_type === 'mp4') {
    return (
      <div className="w-full rounded-lg overflow-hidden">
        <video
          src={videoUrl}
          controls
          autoPlay={autoPlay}
          className="w-full h-auto"
          onError={() => setError('Error al reproducir el archivo MP4')}
          onLoadedMetadata={(e) => {
            if (onProgressUpdate) {
              onProgressUpdate(0, e.target.duration, false);
            }
          }}
          onTimeUpdate={(e) => {
            if (onProgressUpdate) {
              const progress = (e.target.currentTime / e.target.duration) * 100;
              onProgressUpdate(progress, e.target.duration, progress >= 90);
            }
          }}
        >
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  }

  // For YouTube and Vimeo, use iframe with error handling
  return (
    <div className="w-full rounded-lg overflow-hidden">
      <iframe
        src={videoUrl}
        width="100%"
        height="400"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setError('Error al cargar el reproductor')}
        onLoad={() => setError(null)}
        title={video.title}
        className="w-full h-96"
      />
    </div>
  );
};

export default SimpleVideoPlayer;