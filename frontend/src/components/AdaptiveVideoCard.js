import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Eye, 
  Star, 
  TrendingUp,
  CheckCircle,
  BarChart3,
  Calendar,
  Edit3,
  Trash2,
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAdaptiveStreaming } from '../hooks/useAdaptiveStreaming';

const AdaptiveVideoCard = ({ 
  video, 
  userEmail, 
  onClick,
  onEdit,
  onDelete,
  theme = 'dark',
  showStats = false,
  userRole = 'user',
  className = '' 
}) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    isMobile,
    connectionSpeed,
    shouldUseLowBandwidthMode,
    getStreamingSettings
  } = useAdaptiveStreaming();

  const streamingSettings = getStreamingSettings();

  useEffect(() => {
    // Load user progress for this video
    loadVideoProgress();
  }, [video.id, userEmail]);

  const loadVideoProgress = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/video-progress/${userEmail}/${video.id}`
      );
      
      if (response.ok) {
        const progressData = await response.json();
        setProgress(progressData.progress_percentage || 0);
        setIsCompleted(progressData.completed || false);
      }
    } catch (error) {
      console.error('Error loading video progress:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'básico':
        return 'text-green-500 bg-green-500/20';
      case 'intermedio':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'avanzado':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const formatDuration = (duration) => {
    return duration || '45 min';
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getOptimizedThumbnail = () => {
    if (shouldUseLowBandwidthMode()) {
      // Use lower quality thumbnails for slow connections
      if (video.video_type === 'youtube') {
        return `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`; // Medium quality
      } else if (video.video_type === 'vimeo') {
        return `https://i.vimeocdn.com/video/${video.vimeoId}_200x150.jpg`; // Small quality
      }
    }
    
    // High quality for fast connections
    return video.thumbnail;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    // Fallback to different quality or placeholder
    if (video.video_type === 'youtube') {
      return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
    } else if (video.video_type === 'vimeo') {
      return `https://i.vimeocdn.com/video/${video.vimeoId}_295x166.jpg`;
    }
    return "https://via.placeholder.com/640x360/1a1a1a/ffffff?text=Video+No+Disponible";
  };

  const getConnectionIcon = () => {
    if (connectionSpeed === 'slow') return <WifiOff size={12} className="text-red-500" />;
    if (connectionSpeed === 'medium') return <Wifi size={12} className="text-yellow-500" />;
    return <Wifi size={12} className="text-green-500" />;
  };

  const getVideoTypeIcon = () => {
    const iconClass = "w-4 h-4";
    switch (video.video_type) {
      case 'youtube':
        return <div className="bg-red-600 text-white p-1 rounded text-xs font-bold">YT</div>;
      case 'vimeo':
        return <div className="bg-blue-600 text-white p-1 rounded text-xs font-bold">VM</div>;
      case 'mp4':
        return <div className="bg-purple-600 text-white p-1 rounded text-xs font-bold">MP4</div>;
      default:
        return <div className="bg-gray-600 text-white p-1 rounded text-xs font-bold">?</div>;
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 text-white hover:bg-gray-700' 
          : 'bg-white text-gray-900 hover:bg-gray-50'
      } ${className}`}
      whileHover={{ scale: isMobile ? 1 : 1.02, y: isMobile ? 0 : -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(video)}
      onHoverStart={() => !isMobile && setIsHovered(true)}
      onHoverEnd={() => !isMobile && setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div className="relative overflow-hidden rounded-t-xl">
        {/* Adaptive Image Loading */}
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"></div>
                <div className="text-xs text-gray-500">Cargando...</div>
              </div>
            </div>
          )}
          
          <img
            src={getOptimizedThumbnail()}
            alt={video.title}
            className={`w-full h-48 object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-105' : 'scale-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={shouldUseLowBandwidthMode() ? "lazy" : "eager"}
          />
        </div>
        
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/50">
            <motion.div
              className="h-full bg-[#C5A95E]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
        
        {/* Play Button Overlay */}
        {(!isMobile || isHovered) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 sm:p-4 rounded-full bg-[#C5A95E]/90 text-white">
              <Play size={isMobile ? 24 : 32} fill="white" />
            </div>
          </motion.div>
        )}
        
        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 left-3 p-2 rounded-full bg-green-500 text-white">
            <CheckCircle size={14} />
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-medium">
          <div className="flex items-center space-x-1">
            <Clock size={10} />
            <span>{formatDuration(video.duration)}</span>
          </div>
        </div>
        
        {/* Admin Edit/Delete Buttons */}
        {userRole === 'admin' && (
          <div className="absolute top-12 right-3 flex flex-col space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(video);
              }}
              className="p-1.5 rounded-full bg-blue-500/90 text-white hover:bg-blue-600/90 transition-colors"
              title="Editar video"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(video.id);
              }}
              className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-600/90 transition-colors"
              title="Eliminar video"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        
        {/* Video Type and Optimization Badges */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-2">
          {getVideoTypeIcon()}
          
          {/* Connection Status */}
          <div className="flex items-center bg-black/70 rounded px-2 py-1">
            {getConnectionIcon()}
            {isMobile && <Smartphone size={12} className="ml-1 text-blue-400" />}
          </div>
          
          {/* Low bandwidth indicator */}
          {shouldUseLowBandwidthMode() && (
            <div className="flex items-center bg-orange-600/80 rounded px-2 py-1">
              <Download size={12} className="text-white" />
              <span className="text-xs text-white ml-1">Ahorro</span>
            </div>
          )}
        </div>
        
        {/* Match Percentage */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-[#C5A95E]/90 text-white text-xs font-bold">
          {video.match || '95%'}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold line-clamp-2 leading-tight">
          {video.title}
        </h3>
        
        {/* Description */}
        <p className={`text-xs sm:text-sm line-clamp-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {video.description}
        </p>
        
        {/* Meta Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Rating */}
            <div className="flex items-center space-x-1">
              <Star size={12} className="text-yellow-500" fill="currentColor" />
              <span className="text-xs sm:text-sm font-medium">{video.rating || 4.5}</span>
            </div>
            
            {/* Views */}
            <div className="flex items-center space-x-1">
              <Eye size={12} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <span className="text-xs sm:text-sm">{formatViews(video.views)}</span>
            </div>
          </div>
          
          {/* Difficulty Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty || 'Intermedio'}
          </div>
        </div>
        
        {/* Progress Section */}
        {progress > 0 && (
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                Progreso
              </span>
              <span className="font-medium text-[#C5A95E]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-1.5 sm:h-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <motion.div
                className="h-1.5 sm:h-2 rounded-full bg-[#C5A95E]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {/* Stats (for admin view) */}
        {showStats && video.stats && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <TrendingUp size={12} className="text-[#C5A95E]" />
              <div>
                <div className="text-xs text-gray-500">Vistas</div>
                <div className="text-sm font-medium">{video.stats.total_views}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 size={12} className="text-[#C5A95E]" />
              <div>
                <div className="text-xs text-gray-500">Completado</div>
                <div className="text-sm font-medium">
                  {Math.round(video.stats.average_completion_rate)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Release Date and Optimization Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar size={10} />
            <span>{formatDate(video.releaseDate)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {streamingSettings.quality !== '1080p' && (
              <span className="text-orange-500">Opt: {streamingSettings.quality}</span>
            )}
            {isMobile && <Monitor size={10} className="text-blue-500" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdaptiveVideoCard;