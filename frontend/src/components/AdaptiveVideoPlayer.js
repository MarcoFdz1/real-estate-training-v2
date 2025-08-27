import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Clock, Eye, Settings, Wifi, WifiOff, Battery,
  Smartphone, Monitor, Download
} from 'lucide-react';
import { useAdaptiveStreaming } from '../hooks/useAdaptiveStreaming';

const AdaptiveVideoPlayer = ({ 
  video,
  userEmail, 
  videoId, 
  onProgressUpdate,
  autoPlay = false 
}) => {
  const {
    isMobile,
    connectionSpeed,
    videoQuality,
    batteryLevel,
    isLowPowerMode,
    networkInfo,
    setVideoQuality,
    getStreamingSettings,
    shouldUseLowBandwidthMode
  } = useAdaptiveStreaming();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const playerContainerRef = useRef(null);

  const streamingSettings = getStreamingSettings();

  useEffect(() => {
    if (video.video_type === 'youtube') {
      initializeYouTubePlayer();
    } else if (video.video_type === 'vimeo') {
      initializeVimeoPlayer();
    } else if (video.video_type === 'mp4') {
      initializeMP4Player();
    }

    // Auto-hide controls on mobile after 3 seconds
    if (isMobile) {
      resetControlsTimeout();
    }

    return () => {
      clearProgressTracking();
      clearControlsTimeout();
    };
  }, [video, videoId, streamingSettings]);

  const resetControlsTimeout = () => {
    clearControlsTimeout();
    if (isMobile && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const clearControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const initializeYouTubePlayer = () => {
    // Load YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player(`adaptive-youtube-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: video.youtubeId,
        playerVars: {
          autoplay: streamingSettings.autoplay ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1, // Important for mobile
          quality: streamingSettings.youtubeQuality,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            
            // Set initial quality for mobile optimization
            if (isMobile && shouldUseLowBandwidthMode()) {
              try {
                event.target.setPlaybackQuality('small');
              } catch (e) {
                console.log('Quality setting not available');
              }
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              startProgressTracking(() => {
                const currentTime = event.target.getCurrentTime();
                const totalDuration = event.target.getDuration();
                return { currentTime, duration: totalDuration };
              });
              resetControlsTimeout();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              clearProgressTracking();
              setShowControls(true);
              clearControlsTimeout();
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              clearProgressTracking();
              handleVideoComplete();
            }
          }
        }
      });
      
      window[`adaptivePlayer_${videoId}`] = player;
    };
  };

  const initializeVimeoPlayer = () => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    document.head.appendChild(script);

    script.onload = () => {
      const iframe = document.getElementById(`adaptive-vimeo-${videoId}`);
      const player = new window.Vimeo.Player(iframe, {
        quality: streamingSettings.vimeoQuality,
        responsive: true,
        playsinline: true
      });

      player.getDuration().then(duration => {
        setDuration(duration);
      });

      player.on('play', () => {
        setIsPlaying(true);
        setIsBuffering(false);
        startProgressTracking(() => {
          return player.getCurrentTime().then(currentTime => {
            return player.getDuration().then(duration => {
              return { currentTime, duration };
            });
          });
        });
        resetControlsTimeout();
      });

      player.on('pause', () => {
        setIsPlaying(false);
        clearProgressTracking();
        setShowControls(true);
        clearControlsTimeout();
      });

      player.on('ended', () => {
        setIsPlaying(false);
        clearProgressTracking();
        handleVideoComplete();
      });

      player.on('bufferstart', () => {
        setIsBuffering(true);
      });

      player.on('bufferend', () => {
        setIsBuffering(false);
      });

      window[`adaptivePlayer_${videoId}`] = player;
    };
  };

  const initializeMP4Player = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Set optimal preload based on connection
      videoElement.preload = streamingSettings.preload;
      
      // Handle different MP4 storage methods
      let videoSrc = video.mp4_url;
      
      if (video.mp4_url && video.mp4_url.startsWith('chunked://')) {
        // For chunked files, use the streaming endpoint
        videoSrc = `${process.env.REACT_APP_BACKEND_URL}/api/videos/${video.id}/mp4-stream`;
      }
      
      videoElement.src = videoSrc;
      
      videoElement.addEventListener('loadedmetadata', () => {
        setDuration(videoElement.duration);
      });

      videoElement.addEventListener('play', () => {
        setIsPlaying(true);
        setIsBuffering(false);
        startProgressTracking(() => ({
          currentTime: videoElement.currentTime,
          duration: videoElement.duration
        }));
        resetControlsTimeout();
      });

      videoElement.addEventListener('pause', () => {
        setIsPlaying(false);
        clearProgressTracking();
        setShowControls(true);
        clearControlsTimeout();
      });

      videoElement.addEventListener('ended', () => {
        setIsPlaying(false);
        clearProgressTracking();
        handleVideoComplete();
      });

      videoElement.addEventListener('waiting', () => {
        setIsBuffering(true);
      });

      videoElement.addEventListener('canplay', () => {
        setIsBuffering(false);
      });

      videoElement.addEventListener('error', (e) => {
        console.error('Video playback error:', e);
        setIsBuffering(false);
        // Try fallback URL if streaming fails
        if (videoSrc.includes('/mp4-stream')) {
          videoElement.src = video.mp4_url;
        }
      });

      if (streamingSettings.autoplay && !shouldUseLowBandwidthMode()) {
        videoElement.play().catch(console.error);
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
        
        // Update progress less frequently on slow connections
        const updateInterval = shouldUseLowBandwidthMode() ? 15 : 10;
        if (Math.floor(currentTime) % updateInterval === 0) {
          updateVideoProgress(progressPercentage, currentTime, progressPercentage >= 90);
        }
      } catch (error) {
        console.error('Error tracking progress:', error);
      }
    }, 1000);
  };

  const clearProgressTracking = () => {
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
    const player = window[`adaptivePlayer_${videoId}`];
    
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
    
    setShowControls(true);
    resetControlsTimeout();
  };

  const handleContainerClick = () => {
    if (isMobile) {
      setShowControls(!showControls);
      if (!showControls) {
        resetControlsTimeout();
      } else {
        clearControlsTimeout();
      }
    }
  };

  const changeQuality = (quality) => {
    setVideoQuality(quality);
    setShowQualityMenu(false);
    
    const player = window[`adaptivePlayer_${videoId}`];
    if (video.video_type === 'youtube' && player) {
      const qualityMap = {
        '240p': 'small',
        '360p': 'medium', 
        '480p': 'large',
        '720p': 'hd720',
        '1080p': 'hd1080'
      };
      player.setPlaybackQuality(qualityMap[quality]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    if (connectionSpeed === 'slow') return <WifiOff size={16} className="text-red-500" />;
    if (connectionSpeed === 'medium') return <Wifi size={16} className="text-yellow-500" />;
    return <Wifi size={16} className="text-green-500" />;
  };

  const renderVideoPlayer = () => {
    if (video.video_type === 'youtube') {
      return (
        <div 
          id={`adaptive-youtube-${videoId}`}
          className="w-full h-full"
        />
      );
    } else if (video.video_type === 'vimeo') {
      return (
        <iframe
          id={`adaptive-vimeo-${videoId}`}
          src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=${streamingSettings.autoplay ? 1 : 0}&controls=0&quality=${streamingSettings.vimeoQuality}`}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      );
    } else if (video.video_type === 'mp4') {
      // Determine video source based on storage method
      let videoSrc = video.mp4_url;
      
      if (video.mp4_url && video.mp4_url.startsWith('chunked://')) {
        // For chunked files, use the streaming endpoint
        videoSrc = `${process.env.REACT_APP_BACKEND_URL}/api/videos/${video.id}/mp4-stream`;
      }
      
      return (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          controls={false}
          preload={streamingSettings.preload}
          playsInline
          crossOrigin="anonymous"
        />
      );
    }
  };

  return (
    <motion.div 
      ref={playerContainerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleContainerClick}
    >
      {/* Video Player */}
      <div className={`relative w-full ${isMobile ? 'aspect-video' : 'aspect-video'}`}>
        {renderVideoPlayer()}
        
        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A95E]"></div>
          </div>
        )}

        {/* Mobile-optimized Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4"
            >
              {/* Progress Bar */}
              <div className="mb-2 sm:mb-4">
                <div className="w-full bg-gray-600 rounded-full h-1 sm:h-2">
                  <motion.div 
                    className="bg-[#C5A95E] h-1 sm:h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                    onClick={togglePlayPause}
                    className={`p-2 sm:p-3 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors ${isMobile ? 'touch-manipulation' : ''}`}
                  >
                    {isPlaying ? <Pause size={isMobile ? 16 : 20} /> : <Play size={isMobile ? 16 : 20} />}
                  </button>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2 text-white text-xs sm:text-sm">
                    <Clock size={isMobile ? 12 : 16} />
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Network Status */}
                  <div className="flex items-center space-x-1">
                    {getConnectionIcon()}
                    <span className="text-white text-xs hidden sm:inline">{connectionSpeed}</span>
                  </div>

                  {/* Battery Status (Mobile) */}
                  {isMobile && (
                    <div className="flex items-center space-x-1">
                      <Battery size={12} className={batteryLevel < 20 ? 'text-red-500' : 'text-white'} />
                      <span className="text-white text-xs">{batteryLevel}%</span>
                    </div>
                  )}

                  {/* Device Type Indicator */}
                  <div className="text-white text-xs bg-gray-700 px-1 sm:px-2 py-1 rounded hidden sm:block">
                    {isMobile ? <Smartphone size={12} /> : <Monitor size={12} />}
                  </div>

                  {/* Quality Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQualityMenu(!showQualityMenu);
                      }}
                      className="p-1 sm:p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    >
                      <Settings size={isMobile ? 12 : 16} />
                    </button>

                    {showQualityMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]"
                      >
                        <div className="text-white text-xs font-semibold mb-2">Calidad</div>
                        {['auto', '240p', '360p', '480p', '720p', '1080p'].map((quality) => (
                          <button
                            key={quality}
                            onClick={() => changeQuality(quality)}
                            className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-600 ${
                              videoQuality === quality ? 'bg-[#C5A95E] text-white' : 'text-gray-300'
                            }`}
                          >
                            {quality}
                            {quality === 'auto' && ` (${streamingSettings.quality})`}
                          </button>
                        ))}
                        
                        {/* Low bandwidth mode indicator */}
                        {shouldUseLowBandwidthMode() && (
                          <div className="border-t border-gray-600 mt-2 pt-2">
                            <div className="text-yellow-400 text-xs flex items-center">
                              <Download size={12} className="mr-1" />
                              Modo ahorro
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center space-x-1 text-white text-xs">
                    <Eye size={isMobile ? 12 : 16} />
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>

              {/* Mobile-specific info bar */}
              {isMobile && (
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>Calidad: {videoQuality}</span>
                    {isLowPowerMode && <span className="text-yellow-400">• Ahorro energía</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{video.video_type.toUpperCase()}</span>
                    {networkInfo && networkInfo.saveData && (
                      <span className="text-orange-400">• Ahorro datos</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to show controls hint (Mobile) */}
        {isMobile && !showControls && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white text-center bg-black/50 p-4 rounded-lg"
            >
              <div className="text-sm">Toca para mostrar controles</div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Video Title and Stats */}
      <div className="p-2 sm:p-4 bg-gray-900 text-white">
        <h3 className="text-sm sm:text-lg font-semibold truncate">{video.title}</h3>
        <div className="flex items-center justify-between mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">
          <span>Progreso: {Math.round(progress)}%</span>
          <span>Tiempo: {formatTime(currentTime)}</span>
          <div className="flex items-center space-x-2">
            <span className="text-[#C5A95E]">{video.video_type.toUpperCase()}</span>
            {isMobile && (
              <span className="text-blue-400">📱 Móvil</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdaptiveVideoPlayer;