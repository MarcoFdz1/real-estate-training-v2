import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, Eye } from 'lucide-react';

const UniversalVideoPlayer = ({ 
  video,
  userEmail, 
  videoId, 
  onProgressUpdate,
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (video.video_type === 'youtube') {
      initializeYouTubePlayer();
    } else if (video.video_type === 'vimeo') {
      initializeVimeoPlayer();
    } else if (video.video_type === 'mp4') {
      initializeMP4Player();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [video, videoId, autoPlay]);

  const initializeYouTubePlayer = () => {
    // Load YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player(`youtube-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: video.youtubeId,
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
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking(() => {
                const currentTime = event.target.getCurrentTime();
                const totalDuration = event.target.getDuration();
                return { currentTime, duration: totalDuration };
              });
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTracking();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopProgressTracking();
              handleVideoComplete();
            }
          }
        }
      });
      
      // Store player reference
      window[`player_${videoId}`] = player;
    };
  };

  const initializeVimeoPlayer = () => {
    // Load Vimeo Player API
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    document.head.appendChild(script);

    script.onload = () => {
      const iframe = document.getElementById(`vimeo-player-${videoId}`);
      const player = new window.Vimeo.Player(iframe);

      player.getDuration().then(duration => {
        setDuration(duration);
      });

      player.on('play', () => {
        setIsPlaying(true);
        startProgressTracking(() => {
          return player.getCurrentTime().then(currentTime => {
            return player.getDuration().then(duration => {
              return { currentTime, duration };
            });
          });
        });
      });

      player.on('pause', () => {
        setIsPlaying(false);
        stopProgressTracking();
      });

      player.on('ended', () => {
        setIsPlaying(false);
        stopProgressTracking();
        handleVideoComplete();
      });

      // Store player reference
      window[`player_${videoId}`] = player;
    };
  };

  const initializeMP4Player = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', () => {
        setDuration(videoElement.duration);
      });

      videoElement.addEventListener('play', () => {
        setIsPlaying(true);
        startProgressTracking(() => ({
          currentTime: videoElement.currentTime,
          duration: videoElement.duration
        }));
      });

      videoElement.addEventListener('pause', () => {
        setIsPlaying(false);
        stopProgressTracking();
      });

      videoElement.addEventListener('ended', () => {
        setIsPlaying(false);
        stopProgressTracking();
        handleVideoComplete();
      });

      if (autoPlay) {
        videoElement.play();
      }
    }
  };

  const startProgressTracking = (getTimeFunction) => {
    progressIntervalRef.current = setInterval(async () => {
      try {
        let timeData;
        
        if (typeof getTimeFunction === 'function') {
          timeData = await getTimeFunction();
        } else {
          return;
        }

        const { currentTime, duration } = timeData;
        const progressPercentage = (currentTime / duration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(progressPercentage);
        
        // Update progress on server every 10 seconds
        if (Math.floor(currentTime) % 10 === 0) {
          updateVideoProgress(progressPercentage, currentTime, progressPercentage >= 90);
        }
      } catch (error) {
        console.error('Error tracking progress:', error);
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
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

  const togglePlayPause = async () => {
    const player = window[`player_${videoId}`];
    
    if (video.video_type === 'youtube') {
      if (player) {
        if (isPlaying) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    } else if (video.video_type === 'vimeo') {
      if (player) {
        if (isPlaying) {
          await player.pause();
        } else {
          await player.play();
        }
      }
    } else if (video.video_type === 'mp4') {
      const videoElement = videoRef.current;
      if (videoElement) {
        if (isPlaying) {
          videoElement.pause();
        } else {
          videoElement.play();
        }
      }
    }
  };

  const toggleMute = () => {
    const player = window[`player_${videoId}`];
    
    if (video.video_type === 'youtube') {
      if (player) {
        if (isMuted) {
          player.unMute();
        } else {
          player.mute();
        }
        setIsMuted(!isMuted);
      }
    } else if (video.video_type === 'vimeo') {
      if (player) {
        player.setVolume(isMuted ? 1 : 0);
        setIsMuted(!isMuted);
      }
    } else if (video.video_type === 'mp4') {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.muted = !videoElement.muted;
        setIsMuted(videoElement.muted);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoPlayer = () => {
    if (video.video_type === 'youtube') {
      return (
        <div 
          id={`youtube-player-${videoId}`}
          className="w-full h-full"
        />
      );
    } else if (video.video_type === 'vimeo') {
      return (
        <iframe
          id={`vimeo-player-${videoId}`}
          src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=${autoPlay ? 1 : 0}&controls=0`}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      );
    } else if (video.video_type === 'mp4') {
      return (
        <video
          ref={videoRef}
          src={video.mp4_url}
          className="w-full h-full object-cover"
          controls={false}
          preload="metadata"
        />
      );
    }
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
        {renderVideoPlayer()}
        
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
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white text-sm">
                <Eye size={16} />
                <span>{Math.round(progress)}%</span>
              </div>
              
              <div className="text-white text-xs bg-gray-700 px-2 py-1 rounded">
                {video.video_type.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Title */}
      <div className="p-4 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold">{video.title}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
          <span>Progreso: {Math.round(progress)}%</span>
          <span>Tiempo: {formatTime(currentTime)}</span>
          <span className="text-[#C5A95E]">Fuente: {video.video_type.toUpperCase()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default UniversalVideoPlayer;