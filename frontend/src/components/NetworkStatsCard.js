import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Smartphone, 
  Monitor, 
  Download,
  Upload,
  Signal,
  Zap
} from 'lucide-react';
import { useAdaptiveStreaming } from '../hooks/useAdaptiveStreaming';

const NetworkStatsCard = ({ theme = 'dark' }) => {
  const {
    isMobile,
    connectionSpeed,
    videoQuality,
    networkInfo,
    batteryLevel,
    isLowPowerMode,
    shouldUseLowBandwidthMode,
    getOptimalQuality
  } = useAdaptiveStreaming();

  const getConnectionColor = () => {
    if (connectionSpeed === 'slow') return 'text-red-500';
    if (connectionSpeed === 'medium') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConnectionIcon = () => {
    if (connectionSpeed === 'slow') return <WifiOff size={16} className={getConnectionColor()} />;
    return <Wifi size={16} className={getConnectionColor()} />;
  };

  const getBatteryColor = () => {
    if (batteryLevel <= 20) return 'text-red-500';
    if (batteryLevel <= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <motion.div 
      className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Signal size={20} className="mr-2 text-[#C5A95E]" />
        Estado de Conexión
      </h3>
      
      <div className="space-y-3">
        {/* Device Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
            <span className="text-sm">Dispositivo</span>
          </div>
          <span className="text-sm font-medium">
            {isMobile ? 'Móvil' : 'Escritorio'}
          </span>
        </div>

        {/* Connection Speed */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm">Conexión</span>
          </div>
          <span className={`text-sm font-medium ${getConnectionColor()}`}>
            {connectionSpeed === 'fast' ? 'Rápida' : connectionSpeed === 'medium' ? 'Media' : 'Lenta'}
          </span>
        </div>

        {/* Network Details */}
        {networkInfo && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download size={16} className="text-blue-500" />
                <span className="text-sm">Velocidad</span>
              </div>
              <span className="text-sm font-medium">
                {networkInfo.effectiveType?.toUpperCase()} 
                {networkInfo.downlink && ` (${networkInfo.downlink} Mbps)`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload size={16} className="text-purple-500" />
                <span className="text-sm">Latencia</span>
              </div>
              <span className="text-sm font-medium">
                {networkInfo.rtt ? `${networkInfo.rtt}ms` : 'N/A'}
              </span>
            </div>
          </>
        )}

        {/* Battery Level (Mobile) */}
        {isMobile && batteryLevel !== null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Battery size={16} className={getBatteryColor()} />
              <span className="text-sm">Batería</span>
            </div>
            <span className={`text-sm font-medium ${getBatteryColor()}`}>
              {batteryLevel}%
              {isLowPowerMode && ' (Ahorro)'}
            </span>
          </div>
        )}

        {/* Video Quality */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#C5A95E] rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">Q</span>
            </div>
            <span className="text-sm">Calidad</span>
          </div>
          <span className="text-sm font-medium">
            {videoQuality === 'auto' ? `Auto (${getOptimalQuality()})` : videoQuality}
          </span>
        </div>

        {/* Optimization Status */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <Zap size={14} className="mr-1 text-yellow-500" />
            Optimizaciones
          </h4>
          
          <div className="space-y-2">
            {shouldUseLowBandwidthMode() && (
              <div className="flex items-center text-xs text-orange-500">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Modo ahorro de datos activado
              </div>
            )}
            
            {isLowPowerMode && (
              <div className="flex items-center text-xs text-yellow-500">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Modo ahorro de energía activado
              </div>
            )}
            
            {networkInfo?.saveData && (
              <div className="flex items-center text-xs text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Ahorro de datos del navegador
              </div>
            )}

            {isMobile && (
              <div className="flex items-center text-xs text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Optimización móvil activada
              </div>
            )}
            
            {!shouldUseLowBandwidthMode() && !isLowPowerMode && (
              <div className="flex items-center text-xs text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Calidad óptima disponible
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {(connectionSpeed === 'slow' || isLowPowerMode) && (
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h4 className="text-sm font-semibold mb-2 text-blue-500">💡 Consejos</h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {connectionSpeed === 'slow' && (
                <div>• Considera descargar videos para verlos sin conexión</div>
              )}
              {isLowPowerMode && (
                <div>• Conecta el cargador para mejor calidad de video</div>
              )}
              {isMobile && (
                <div>• Usa WiFi para mejor experiencia de streaming</div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NetworkStatsCard;