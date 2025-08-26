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
  Trash2
} from 'lucide-react';

const VideoCard = ({ 
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

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 text-white hover:bg-gray-700' 
          : 'bg-white text-gray-900 hover:bg-gray-50'
      } ${className}`}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(video)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div className="relative overflow-hidden rounded-t-xl">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
          }}
        />
        
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
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 rounded-full bg-[#C5A95E]/90 text-white">
            <Play size={32} fill="white" />
          </div>
        </motion.div>
        
        {/* Admin Edit/Delete Buttons */}
        {userRole === 'admin' && (
          <div className="absolute top-3 right-3 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(video);
              }}
              className="p-2 rounded-full bg-blue-500/90 text-white hover:bg-blue-600/90 transition-colors"
              title="Editar video"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(video.id);
              }}
              className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-600/90 transition-colors"
              title="Eliminar video"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        
        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 left-16 p-2 rounded-full bg-green-500 text-white">
            <CheckCircle size={16} />
          </div>
        )}
        
        {/* Duration Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-sm font-medium">
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>{formatDuration(video.duration)}</span>
          </div>
        </div>
        
        {/* Match Percentage */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-[#C5A95E]/90 text-white text-sm font-bold">
          {video.match || '95%'}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold line-clamp-2 leading-tight">
          {video.title}
        </h3>
        
        {/* Description */}
        <p className={`text-sm line-clamp-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {video.description}
        </p>
        
        {/* Meta Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Rating */}
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-yellow-500" fill="currentColor" />
              <span className="text-sm font-medium">{video.rating || 4.5}</span>
            </div>
            
            {/* Views */}
            <div className="flex items-center space-x-1">
              <Eye size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <span className="text-sm">{formatViews(video.views)}</span>
            </div>
          </div>
          
          {/* Difficulty Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty || 'Intermedio'}
          </div>
        </div>
        
        {/* Progress Section */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                Progreso
              </span>
              <span className="font-medium text-[#C5A95E]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <motion.div
                className="h-2 rounded-full bg-[#C5A95E]"
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
              <TrendingUp size={14} className="text-[#C5A95E]" />
              <div>
                <div className="text-xs text-gray-500">Vistas</div>
                <div className="text-sm font-medium">{video.stats.total_views}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 size={14} className="text-[#C5A95E]" />
              <div>
                <div className="text-xs text-gray-500">Completado</div>
                <div className="text-sm font-medium">
                  {Math.round(video.stats.average_completion_rate)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Release Date */}
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Calendar size={12} />
          <span>Publicado: {formatDate(video.releaseDate)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;