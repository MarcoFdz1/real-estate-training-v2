import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, Eye } from 'lucide-react';

const VideoPlayer = ({ 
  youtubeId, 
  title, 
  duration, 
  userEmail, 
  videoId, 
  onProgressUpdate,
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // YouTube iframe API integration
  useEffect(() => {
    // Load YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player(`youtube-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: youtubeId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking(event.target);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              handleVideoComplete();
            }
          }
        }
      });
    };

    return () => {
      // Cleanup
      if (window.YT && window.YT.Player) {
        const player = window.YT.get(`youtube-player-${videoId}`);
        if (player) {
          player.destroy();
        }
      }
    };
  }, [youtubeId, videoId, autoPlay]);

  const startProgressTracking = (player) => {
    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const progressPercentage = (currentTime / duration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(progressPercentage);
        
        // Update progress on server every 10 seconds
        if (Math.floor(currentTime) % 10 === 0) {
          updateVideoProgress(progressPercentage, currentTime, progressPercentage >= 90);
        }
      }
    }, 1000);

    return interval;
  };

  const updateVideoProgress = async (progressPercentage, watchTime, completed) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/video-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          video_id: videoId,
          progress_percentage: progressPercentage,
          watch_time: Math.floor(watchTime),
          completed: completed
        })
      });

      if (response.ok && onProgressUpdate) {
        onProgressUpdate(progressPercentage, watchTime, completed);
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const handleVideoComplete = () => {
    updateVideoProgress(100, currentTime, true);
    if (onProgressUpdate) {
      onProgressUpdate(100, currentTime, true);
    }
  };

  const togglePlayPause = () => {
    const player = window.YT.get(`youtube-player-${videoId}`);
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const toggleMute = () => {
    const player = window.YT.get(`youtube-player-${videoId}`);
    if (player) {
      if (isMuted) {
        player.unMute();
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const playerElement = document.getElementById(`video-container-${videoId}`);
    if (playerElement) {
      if (!isFullscreen) {
        if (playerElement.requestFullscreen) {
          playerElement.requestFullscreen();
        } else if (playerElement.webkitRequestFullscreen) {
          playerElement.webkitRequestFullscreen();
        } else if (playerElement.msRequestFullscreen) {
          playerElement.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      id={`video-container-${videoId}`}
    >
      {/* Video Player */}
      <div className="relative w-full aspect-video">
        <div 
          id={`youtube-player-${videoId}`}
          className="w-full h-full"
        />
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <motion.div 
                className="bg-[#C5A95E] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <div className="flex items-center space-x-2 text-white text-sm">
                <Clock size={16} />
                <span>{formatTime(currentTime)} / {duration}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white text-sm">
                <Eye size={16} />
                <span>{Math.round(progress)}%</span>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Title */}
      <div className="p-4 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
          <span>Progreso: {Math.round(progress)}%</span>
          <span>Tiempo: {formatTime(currentTime)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;