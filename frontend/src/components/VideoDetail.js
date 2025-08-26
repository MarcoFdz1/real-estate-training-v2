import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Eye, 
  Clock, 
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Play,
  CheckCircle,
  Share2,
  Download,
  Bookmark
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import VideoCard from './VideoCard';

const VideoDetail = ({ 
  video, 
  userEmail, 
  onBack, 
  theme = 'dark',
  userRole = 'user'
}) => {
  const [videoStats, setVideoStats] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadVideoDetails();
    loadRelatedVideos();
    loadVideoProgress();
  }, [video.id]);

  const loadVideoDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/videos/${video.id}/detailed`
      );
      
      if (response.ok) {
        const detailedVideo = await response.json();
        setVideoStats(detailedVideo.stats);
      }
    } catch (error) {
      console.error('Error loading video details:', error);
    }
  };

  const loadRelatedVideos = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/videos`
      );
      
      if (response.ok) {
        const allVideos = await response.json();
        // Filter videos from same category, excluding current video
        const related = allVideos
          .filter(v => v.categoryId === video.categoryId && v.id !== video.id)
          .slice(0, 3);
        setRelatedVideos(related);
      }
    } catch (error) {
      console.error('Error loading related videos:', error);
    }
  };

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

  const handleProgressUpdate = (progressPercentage, watchTime, completed) => {
    setProgress(progressPercentage);
    setIsCompleted(completed);
  };

  const handlePlayClick = () => {
    setShowPlayer(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
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

  return (
    <motion.div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="p-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[#C5A95E] hover:text-[#B8975A] transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player or Thumbnail */}
            {showPlayer ? (
              <VideoPlayer
                youtubeId={video.youtubeId}
                title={video.title}
                duration={video.duration}
                userEmail={userEmail}
                videoId={video.id}
                onProgressUpdate={handleProgressUpdate}
                autoPlay={true}
              />
            ) : (
              <div className="relative group">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover rounded-xl"
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center justify-center h-full">
                    <button
                      onClick={handlePlayClick}
                      className="p-6 rounded-full bg-[#C5A95E]/90 text-white hover:bg-[#C5A95E] transition-colors"
                    >
                      <Play size={48} fill="white" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/50 rounded-b-xl">
                    <motion.div
                      className="h-full bg-[#C5A95E] rounded-b-xl"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{video.title}</h1>
                {isCompleted && (
                  <div className="flex items-center space-x-2 text-green-500">
                    <CheckCircle size={20} />
                    <span className="font-medium">Completado</span>
                  </div>
                )}
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                  <span>{formatViews(video.views)} visualizaciones</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Calendar size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                  <span>{formatDate(video.releaseDate)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                  <span>{video.duration}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-500" fill="currentColor" />
                  <span>{video.rating || 4.5}</span>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                  {video.difficulty || 'Intermedio'}
                </div>
              </div>

              {/* Progress Section */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Tu progreso
                    </span>
                    <span className="font-medium text-[#C5A95E]">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-3 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <motion.div
                      className="h-3 rounded-full bg-[#C5A95E]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#C5A95E] text-white rounded-lg hover:bg-[#B8975A] transition-colors"
                >
                  <Play size={20} />
                  <span>{progress > 0 ? 'Continuar' : 'Reproducir'}</span>
                </button>
                
                <button className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Bookmark size={20} />
                </button>
                
                <button className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Descripción</h2>
                <p className={`text-base leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {video.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics (for admin) */}
            {userRole === 'admin' && videoStats && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={16} className="text-[#C5A95E]" />
                      <span className="text-sm">Total de vistas</span>
                    </div>
                    <span className="font-medium">{videoStats.total_views}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm">Completado</span>
                    </div>
                    <span className="font-medium">{videoStats.total_completions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 size={16} className="text-blue-500" />
                      <span className="text-sm">Tasa de finalización</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(videoStats.average_completion_rate)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-yellow-500" />
                      <span className="text-sm">Tiempo promedio</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(videoStats.average_watch_time / 60)}min
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-4">Videos relacionados</h3>
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <VideoCard
                      key={relatedVideo.id}
                      video={relatedVideo}
                      userEmail={userEmail}
                      onClick={() => window.location.reload()} // Simple reload for now
                      theme={theme}
                      className="h-32"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoDetail;