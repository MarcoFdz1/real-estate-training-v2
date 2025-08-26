import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Eye,
  Award,
  Target,
  Calendar,
  PlayCircle,
  Users
} from 'lucide-react';
import VideoCard from './VideoCard';

const ProgressDashboard = ({ userEmail, theme = 'dark' }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/dashboard/${userEmail}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-[#C5A95E]' }) => (
    <motion.div
      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color === 'text-[#C5A95E]' ? 'bg-[#C5A95E]/20' : 'bg-green-500/20'}`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm text-gray-500">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const CategoryProgressCard = ({ categoryName, stats }) => (
    <motion.div
      className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">{categoryName}</h4>
        <span className="text-xs text-gray-500">
          {stats.watched_videos}/{stats.total_videos}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className={`w-full rounded-full h-2 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <motion.div
            className="h-2 rounded-full bg-[#C5A95E]"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.watched_videos / stats.total_videos) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Visto: {stats.watched_videos}</span>
          <span>Completado: {stats.completed_videos}</span>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#C5A95E] mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            Cargando tu progreso...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <Target size={48} className="mx-auto mb-4 text-[#C5A95E]" />
          <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            ¡Comienza tu aprendizaje!
          </h2>
          <p className="text-gray-500">
            Mira tu primer video para ver tu progreso aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tu Dashboard de Progreso</h1>
          <p className="text-gray-500">
            Seguimiento de tu aprendizaje y progreso en la plataforma
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={PlayCircle}
            title="Videos Vistos"
            value={dashboardData.total_videos_watched}
            subtitle="Total de videos iniciados"
          />
          
          <StatCard
            icon={CheckCircle}
            title="Videos Completados"
            value={dashboardData.total_videos_completed}
            subtitle="Videos terminados al 100%"
            color="text-green-500"
          />
          
          <StatCard
            icon={Clock}
            title="Tiempo Total"
            value={formatWatchTime(dashboardData.total_watch_time)}
            subtitle="Tiempo de aprendizaje"
          />
          
          <StatCard
            icon={Award}
            title="Tasa de Finalización"
            value={`${Math.round(dashboardData.completion_rate)}%`}
            subtitle="Porcentaje de completado"
          />
        </div>

        {/* Progress by Category */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Progreso por Categoría</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dashboardData.progress_by_category).map(([categoryName, stats]) => (
              <CategoryProgressCard
                key={categoryName}
                categoryName={categoryName}
                stats={stats}
              />
            ))}
          </div>
        </div>

        {/* Recent Videos */}
        {dashboardData.recent_videos && dashboardData.recent_videos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Videos Recientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.recent_videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  userEmail={userEmail}
                  onClick={() => {}} // This will be handled by parent component
                  theme={theme}
                  showStats={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-6">Logros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First Video Achievement */}
            <div className={`p-4 rounded-lg text-center ${
              dashboardData.total_videos_watched > 0 
                ? 'bg-[#C5A95E]/20 border-2 border-[#C5A95E]' 
                : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
            }`}>
              <PlayCircle size={32} className={`mx-auto mb-2 ${
                dashboardData.total_videos_watched > 0 ? 'text-[#C5A95E]' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-sm">Primer Video</h3>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.total_videos_watched > 0 ? '¡Completado!' : 'Mira tu primer video'}
              </p>
            </div>

            {/* Completion Achievement */}
            <div className={`p-4 rounded-lg text-center ${
              dashboardData.total_videos_completed >= 5 
                ? 'bg-green-500/20 border-2 border-green-500' 
                : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
            }`}>
              <CheckCircle size={32} className={`mx-auto mb-2 ${
                dashboardData.total_videos_completed >= 5 ? 'text-green-500' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-sm">Aprendiz Dedicado</h3>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.total_videos_completed >= 5 ? '¡Completado!' : 'Completa 5 videos'}
              </p>
            </div>

            {/* Time Achievement */}
            <div className={`p-4 rounded-lg text-center ${
              dashboardData.total_watch_time >= 3600 
                ? 'bg-blue-500/20 border-2 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
            }`}>
              <Clock size={32} className={`mx-auto mb-2 ${
                dashboardData.total_watch_time >= 3600 ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-sm">Maratonista</h3>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.total_watch_time >= 3600 ? '¡Completado!' : 'Mira 1 hora de contenido'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;