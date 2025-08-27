import { useState, useEffect, useCallback } from 'react';

// Hook for adaptive streaming optimization
export const useAdaptiveStreaming = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState('fast'); // fast, medium, slow
  const [videoQuality, setVideoQuality] = useState('auto');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Monitor network connection
  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });

        // Determine connection speed based on effective type
        if (connection.effectiveType === '4g' && connection.downlink > 10) {
          setConnectionSpeed('fast');
        } else if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
          setConnectionSpeed('medium');
        } else {
          setConnectionSpeed('slow');
        }

        // Auto-adjust quality based on connection
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setVideoQuality('240p');
        } else if (connection.effectiveType === '3g') {
          setVideoQuality('360p');
        } else if (connection.effectiveType === '4g' && connection.downlink < 5) {
          setVideoQuality('480p');
        } else if (isMobile) {
          setVideoQuality('720p');
        } else {
          setVideoQuality('1080p');
        }
      }
    };

    updateNetworkInfo();

    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
      return () => navigator.connection.removeEventListener('change', updateNetworkInfo);
    }
  }, [isMobile]);

  // Monitor battery level
  useEffect(() => {
    const updateBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          // Enable power saving mode if battery is low
          setIsLowPowerMode(battery.level < 0.2);

          const updateBattery = () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsLowPowerMode(battery.level < 0.2);
          };

          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          return () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    updateBatteryInfo();
  }, []);

  // Get optimal video quality based on device and connection
  const getOptimalQuality = useCallback(() => {
    if (isLowPowerMode) return '240p';
    if (connectionSpeed === 'slow') return '240p';
    if (connectionSpeed === 'medium') return isMobile ? '360p' : '480p';
    if (connectionSpeed === 'fast') return isMobile ? '720p' : '1080p';
    return '480p';
  }, [connectionSpeed, isMobile, isLowPowerMode]);

  // Get YouTube video quality parameter
  const getYouTubeQuality = useCallback((quality = videoQuality) => {
    const qualityMap = {
      '240p': 'small',
      '360p': 'medium',
      '480p': 'large',
      '720p': 'hd720',
      '1080p': 'hd1080',
      'auto': getOptimalQuality()
    };
    return qualityMap[quality] || qualityMap[getOptimalQuality()];
  }, [videoQuality, getOptimalQuality]);

  // Get Vimeo video quality parameter
  const getVimeoQuality = useCallback((quality = videoQuality) => {
    const qualityMap = {
      '240p': '240',
      '360p': '360',
      '480p': '480',
      '720p': '720',
      '1080p': '1080',
      'auto': getOptimalQuality().replace('p', '')
    };
    return qualityMap[quality] || qualityMap[getOptimalQuality().replace('p', '')];
  }, [videoQuality, getOptimalQuality]);

  // Check if should use low-bandwidth mode
  const shouldUseLowBandwidthMode = useCallback(() => {
    return (
      connectionSpeed === 'slow' ||
      isLowPowerMode ||
      (networkInfo && networkInfo.saveData) ||
      (isMobile && batteryLevel < 30)
    );
  }, [connectionSpeed, isLowPowerMode, networkInfo, isMobile, batteryLevel]);

  // Get adaptive streaming settings
  const getStreamingSettings = useCallback(() => {
    const lowBandwidth = shouldUseLowBandwidthMode();
    
    return {
      quality: videoQuality === 'auto' ? getOptimalQuality() : videoQuality,
      preload: lowBandwidth ? 'metadata' : 'auto',
      autoplay: !lowBandwidth && !isMobile,
      controls: isMobile ? 'native' : 'custom',
      buffering: lowBandwidth ? 'aggressive' : 'normal',
      youtubeQuality: getYouTubeQuality(),
      vimeoQuality: getVimeoQuality()
    };
  }, [
    videoQuality, 
    getOptimalQuality, 
    shouldUseLowBandwidthMode, 
    isMobile,
    getYouTubeQuality,
    getVimeoQuality
  ]);

  return {
    isMobile,
    connectionSpeed,
    videoQuality,
    networkInfo,
    batteryLevel,
    isLowPowerMode,
    setVideoQuality,
    getOptimalQuality,
    shouldUseLowBandwidthMode,
    getStreamingSettings,
    getYouTubeQuality,
    getVimeoQuality
  };
};