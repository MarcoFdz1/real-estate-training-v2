import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, LogOut, Sun, Moon, Save, UserPlus, Upload, 
  Film, Users, Edit, Trash2, X, BarChart3, Home, 
  TrendingUp, Eye, Play, Plus, Edit3, Folder
} from 'lucide-react';
import VideoCard from './components/VideoCard';
import VideoDetail from './components/VideoDetail';
import ProgressDashboard from './components/ProgressDashboard';
import ToastContainer, { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
} from './components/ToastContainer';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentView, setCurrentView] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [customization, setCustomization] = useState({
    logoUrl: '',
    companyName: 'Realty ONE Group Mexico',
    loginBackgroundUrl: '',
    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Accede a tu plataforma de capacitación inmobiliaria',
    heroTitle: 'Plataforma de Capacitación Inmobiliaria',
    heroSubtitle: 'Explora nuestro contenido educativo especializado'
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const settingsResponse = await fetch(`${API_URL}/settings`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        setCustomization({
          logoUrl: settings.logoUrl || '',
          companyName: settings.companyName || 'Realty ONE Group Mexico',
          loginBackgroundUrl: settings.loginBackgroundUrl || '',
          loginTitle: settings.loginTitle || 'Iniciar Sesión',
          loginSubtitle: settings.loginSubtitle || 'Accede a tu plataforma de capacitación inmobiliaria',
          heroTitle: settings.heroTitle || 'Plataforma de Capacitación Inmobiliaria',
          heroSubtitle: settings.heroSubtitle || 'Explora nuestro contenido educativo especializado'
        });
      }

      const categoriesResponse = await fetch(`${API_URL}/categories`);
      if (categoriesResponse.ok) {
        const cats = await categoriesResponse.json();
        setCategories(cats || []);
      }

      const usersResponse = await fetch(`${API_URL}/users`);
      if (usersResponse.ok) {
        const usersList = await usersResponse.json();
        setUsers(usersList || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const result = await response.json();
        setUserRole(result.role);
        setUserEmail(result.email);
        setUserName(result.name);
        setIsAuthenticated(true);
        showSuccessToast('¡Bienvenido!', `Hola ${result.name}`);
      } else {
        showErrorToast('Error de autenticación', 'Credenciales incorrectas');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail('');
    setUserName('');
    setEmail('');
    setPassword('');
    setShowAdminPanel(false);
    setCurrentView('videos');
    setSelectedVideo(null);
    showInfoToast('Sesión cerrada', 'Has cerrado sesión exitosamente');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const saveSettings = async (field, value) => {
    try {
      const newSettings = { ...customization, [field]: value };
      
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        setCustomization(newSettings);
        showSuccessToast('Configuración guardada', `${field} actualizado correctamente`);
        setTimeout(loadInitialData, 500);
      } else {
        showErrorToast('Error al guardar', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'Error al conectar con el servidor');
    }
  };

  const saveInput = (inputId, fieldName, validationMsg = 'Ingrese un valor válido') => {
    const input = document.getElementById(inputId);
    const value = input?.value.trim();
    
    if (value !== undefined && value !== null) {
      saveSettings(fieldName, value);
    } else {
      showWarningToast('Entrada inválida', validationMsg);
    }
  };

  const createUser = async () => {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const role = document.getElementById('userRole').value;

    if (!name || !email || !password) {
      showWarningToast('Campos incompletos', 'Complete todos los campos obligatorios');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      if (response.ok) {
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userRole').value = 'user';
        showSuccessToast('Usuario creado', 'Usuario creado exitosamente');
        loadInitialData();
      } else {
        const error = await response.json();
        showErrorToast('Error al crear usuario', error.detail || 'Error al crear usuario');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const deleteUser = async (userId) => {
    if (confirm('¿Eliminar usuario?')) {
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showSuccessToast('Usuario eliminado', 'Usuario eliminado exitosamente');
          loadInitialData();
        } else {
          showErrorToast('Error al eliminar', 'No se pudo eliminar el usuario');
        }
      } catch (error) {
        showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
      }
    }
  };

  const createCategory = async () => {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name) {
      showWarningToast('Campo requerido', 'El nombre de la categoría es obligatorio');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          description: description || '',
          icon: '📂'
        })
      });

      if (response.ok) {
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryDescription').value = '';
        showSuccessToast('Categoría creada', 'Categoría creada exitosamente');
        loadInitialData();
      } else {
        const error = await response.json();
        showErrorToast('Error al crear categoría', error.detail || 'Error al crear categoría');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (confirm('¿Eliminar categoría? Esto también eliminará todos los videos asociados.')) {
      try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showSuccessToast('Categoría eliminada', 'Categoría eliminada exitosamente');
          loadInitialData();
        } else {
          showErrorToast('Error al eliminar', 'No se pudo eliminar la categoría');
        }
      } catch (error) {
        showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');  
      }
    }
  };

  const editVideo = (video) => {
    setEditingVideo(video);
    
    // Pre-fill form with existing data
    setTimeout(() => {
      document.getElementById('editVideoTitle').value = video.title || '';
      document.getElementById('editVideoDescription').value = video.description || '';
      document.getElementById('editVideoUrl').value = `https://www.youtube.com/watch?v=${video.youtubeId}` || '';
      document.getElementById('editVideoThumbnail').value = video.thumbnail || '';
      document.getElementById('editVideoDuration').value = video.duration || '';
      document.getElementById('editVideoDifficulty').value = video.difficulty || 'Intermedio';
      document.getElementById('editVideoCategory').value = video.categoryId || '';
    }, 100);
  };

  const saveVideoEdit = async () => {
    if (!editingVideo) return;

    const title = document.getElementById('editVideoTitle').value.trim();
    const description = document.getElementById('editVideoDescription').value.trim();
    const url = document.getElementById('editVideoUrl').value.trim();
    const thumbnail = document.getElementById('editVideoThumbnail').value.trim();
    const duration = document.getElementById('editVideoDuration').value.trim();
    const difficulty = document.getElementById('editVideoDifficulty').value;
    const categoryId = document.getElementById('editVideoCategory').value;

    if (!title) {
      showWarningToast('Campo requerido', 'El título es obligatorio');
      return;
    }

    let youtubeId = editingVideo.youtubeId;
    if (url && url !== `https://www.youtube.com/watch?v=${editingVideo.youtubeId}`) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (match) {
        youtubeId = match[1];
      }
    }

    try {
      const response = await fetch(`${API_URL}/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || '',
          thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          duration: duration || '45 min',
          youtubeId,
          difficulty: difficulty || 'Intermedio',
          categoryId: categoryId || editingVideo.categoryId,
          match: editingVideo.match || '95%',
          rating: editingVideo.rating || 4.5,
          views: editingVideo.views || 0,
          releaseDate: editingVideo.releaseDate
        })
      });

      if (response.ok) {
        showSuccessToast('Video actualizado', 'Video actualizado exitosamente');
        setEditingVideo(null);
        loadInitialData();
      } else {
        const error = await response.json();
        showErrorToast('Error al actualizar video', error.detail || 'Error al actualizar video');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const deleteVideo = async (videoId) => {
    if (confirm('¿Eliminar video?')) {
      try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showSuccessToast('Video eliminado', 'Video eliminado exitosamente');
          loadInitialData();
        } else {
          showErrorToast('Error al eliminar', 'No se pudo eliminar el video');
        }
      } catch (error) {
        showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
      }
    }
  };

  const uploadVideo = async () => {
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const url = document.getElementById('videoUrl').value.trim();
    const categoryId = document.getElementById('videoCategory').value;
    const duration = document.getElementById('videoDuration').value.trim();
    const thumbnail = document.getElementById('videoThumbnail').value.trim();
    const difficulty = document.getElementById('videoDifficulty').value;

    if (!title || !url || !categoryId) {
      showWarningToast('Campos incompletos', 'Complete título, URL y categoría');
      return;
    }

    const youtubeId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!youtubeId) {
      showErrorToast('URL inválida', 'URL de YouTube inválida');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || '',
          thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          duration: duration || '45 min',
          youtubeId,
          match: '95%',
          difficulty: difficulty || 'Intermedio',
          rating: 4.5,
          views: 0,
          releaseDate: new Date().toISOString().split('T')[0],
          categoryId: categoryId.toString()
        })
      });

      if (response.ok) {
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoDescription').value = '';
        document.getElementById('videoUrl').value = '';
        document.getElementById('videoCategory').value = '';
        document.getElementById('videoDuration').value = '';
        document.getElementById('videoThumbnail').value = '';
        document.getElementById('videoDifficulty').value = 'Intermedio';
        showSuccessToast('Video subido', 'Video subido exitosamente');
        loadInitialData();
      } else {
        const error = await response.json();
        showErrorToast('Error al subir video', error.detail || 'Error al subir video');
      }
    } catch (error) {
      showErrorToast('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setCurrentView('video-detail');
  };

  const handleBackFromVideoDetail = () => {
    setCurrentView('videos');
    setSelectedVideo(null);
  };

  if (!isAuthenticated) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center relative ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        style={{
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
          backgroundImage: customization.loginBackgroundUrl ? (theme === 'dark' 
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${customization.loginBackgroundUrl})` 
            : `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${customization.loginBackgroundUrl})`) : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <ToastContainer />
        <div className={`${theme === 'dark' ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'} p-8 rounded-lg w-full max-w-md shadow-2xl`}>
          <div className="text-center mb-8">
            {customization.logoUrl && (
              <img 
                src={customization.logoUrl} 
                alt="Logo"
                className="h-16 mx-auto mb-4 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <h1 className="text-4xl font-bold text-[#C5A95E] mb-2">{customization.companyName}</h1>
            <h2 className="text-2xl font-semibold mb-2">{customization.loginTitle}</h2>
            <p className="text-gray-400">{customization.loginSubtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:border-[#C5A95E] focus:outline-none`}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:border-[#C5A95E] focus:outline-none`}
              required
            />
            <button
              type="submit"
              className="w-full bg-[#C5A95E] text-white p-3 rounded hover:bg-[#B8975A] transition-colors font-semibold"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>

        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    );
  }

  // Render Video Detail View
  if (currentView === 'video-detail' && selectedVideo) {
    return (
      <div style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff' }}>
        <ToastContainer />
        <VideoDetail
          video={selectedVideo}
          userEmail={userEmail}
          onBack={handleBackFromVideoDetail}
          theme={theme}
          userRole={userRole}
        />
      </div>
    );
  }

  // Render Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ backgroundColor: theme === 'dark' ? '#000000' : '#f3f4f6' }}>
        <ToastContainer />
        <header className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} p-4 flex justify-between items-center shadow-lg`}>
          <div className="flex items-center space-x-3">
            {customization.logoUrl && (
              <img 
                src={customization.logoUrl} 
                alt="Logo"
                className="h-8 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <h1 className="text-xl font-bold text-[#C5A95E]">{customization.companyName}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('videos')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'videos' 
                  ? 'bg-[#C5A95E] text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Home size={20} />
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'dashboard' 
                  ? 'bg-[#C5A95E] text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {userRole === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
              >
                <Settings size={20} />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <ProgressDashboard userEmail={userEmail} theme={theme} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ backgroundColor: theme === 'dark' ? '#000000' : '#f3f4f6' }}>
      <ToastContainer />
      <header className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} p-4 flex justify-between items-center shadow-lg`}>
        <div className="flex items-center space-x-3">
          {customization.logoUrl && (
            <img 
              src={customization.logoUrl} 
              alt="Logo"
              className="h-8 object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <h1 className="text-xl font-bold text-[#C5A95E]">{customization.companyName}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('videos')}
            className={`p-2 rounded-lg transition-colors ${
              currentView === 'videos' 
                ? 'bg-[#C5A95E] text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Home size={20} />
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`p-2 rounded-lg transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-[#C5A95E] text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <BarChart3 size={20} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors"
            >
              <Settings size={20} />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAdminPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowAdminPanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className={`fixed right-0 top-0 h-full w-96 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl z-50 overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#C5A95E]">Panel de Administración</h2>
                  <button
                    onClick={() => setShowAdminPanel(false)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Configuration sections */}
                  <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                    <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                      <Settings className="mr-2" size={20} />
                      🖼️ CONFIGURACIÓN DE IMÁGENES
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-blue-600 dark:text-blue-400">🏢 URL del Logo:</label>
                        <input
                          id="logoInput"
                          type="text"
                          defaultValue={customization.logoUrl}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                          placeholder="https://ejemplo.com/logo.png"
                        />
                        <button
                          onClick={() => saveInput('logoInput', 'logoUrl')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR LOGO
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-green-600 dark:text-green-400">🌄 URL de Fondo de Login:</label>
                        <input
                          id="backgroundInput"
                          type="text"
                          defaultValue={customization.loginBackgroundUrl}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
                          placeholder="https://ejemplo.com/fondo.jpg"
                        />
                        <button
                          onClick={() => saveInput('backgroundInput', 'loginBackgroundUrl')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR FONDO
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                    <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                      <Edit className="mr-2" size={20} />
                      ✏️ CONFIGURACIÓN DE TEXTOS
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400">🏢 Nombre de la Empresa:</label>
                        <input
                          id="companyInput"
                          type="text"
                          defaultValue={customization.companyName}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          onClick={() => saveInput('companyInput', 'companyName')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR NOMBRE
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-teal-600 dark:text-teal-400">📋 Título del Login:</label>
                        <input
                          id="titleInput"
                          type="text"
                          defaultValue={customization.loginTitle}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none"
                        />
                        <button
                          onClick={() => saveInput('titleInput', 'loginTitle')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR TÍTULO
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-pink-600 dark:text-pink-400">📝 Subtítulo del Login:</label>
                        <input
                          id="subtitleInput"
                          type="text"
                          defaultValue={customization.loginSubtitle}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pink-500 focus:outline-none"
                        />
                        <button
                          onClick={() => saveInput('subtitleInput', 'loginSubtitle')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR SUBTÍTULO
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-cyan-600 dark:text-cyan-400">🏠 Título de Portada:</label>
                        <input
                          id="heroTitleInput"
                          type="text"
                          defaultValue={customization.heroTitle}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                        />
                        <button
                          onClick={() => saveInput('heroTitleInput', 'heroTitle')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR TÍTULO PORTADA
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <label className="block text-sm font-bold mb-2 text-orange-600 dark:text-orange-400">📰 Subtítulo de Portada:</label>
                        <input
                          id="heroSubtitleInput"
                          type="text"
                          defaultValue={customization.heroSubtitle}
                          className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                        />
                        <button
                          onClick={() => saveInput('heroSubtitleInput', 'heroSubtitle')}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Save className="mr-2" size={18} />
                          💾 GUARDAR SUBTÍTULO PORTADA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                      <Folder className="mr-2" size={20} />
                      📂 GESTIÓN DE CATEGORÍAS
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-green-600 dark:text-green-400">📂 Nombre de Categoría:</label>
                            <input
                              id="categoryName"
                              type="text"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
                              placeholder="Nombre de la categoría"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-green-600 dark:text-green-400">📝 Descripción (Opcional):</label>
                            <textarea
                              id="categoryDescription"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
                              placeholder="Descripción de la categoría"
                              rows="2"
                            />
                          </div>
                        </div>
                        <button
                          onClick={createCategory}
                          className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Plus className="mr-2" size={18} />
                          ➕ CREAR CATEGORÍA
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <h4 className="text-sm font-bold mb-3 text-green-600 dark:text-green-400">📋 Categorías existentes:</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {categories.map((category) => (
                            <div key={category.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border flex justify-between items-center">
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{category.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{category.videos?.length || 0} videos</div>
                              </div>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800">
                    <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                      <Users className="mr-2" size={20} />
                      👥 GESTIÓN DE USUARIOS
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">👤 Nombre:</label>
                            <input
                              id="userName"
                              type="text"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">📧 Email:</label>
                            <input
                              id="userEmail"
                              type="email"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="usuario@email.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">🔐 Contraseña:</label>
                            <input
                              id="userPassword"
                              type="password"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="Contraseña"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">🎭 Rol:</label>
                            <select
                              id="userRole"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="user">Usuario</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={createUser}
                          className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <UserPlus className="mr-2" size={18} />
                          ➕ CREAR USUARIO
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <h4 className="text-sm font-bold mb-3 text-emerald-600 dark:text-emerald-400">📋 Usuarios existentes:</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {users.map((user) => (
                            <div key={user.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border flex justify-between items-center">
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email} ({user.role})</div>
                              </div>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
                    <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                      <Film className="mr-2" size={20} />
                      🎬 SUBIR NUEVO VIDEO
                    </h3>
                    
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">🎥 Título del Video:</label>
                          <input
                            id="videoTitle"
                            type="text"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                            placeholder="Título del video"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">📝 Descripción (Opcional):</label>
                          <textarea
                            id="videoDescription"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                            placeholder="Descripción del video"
                            rows="3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">🔗 URL de YouTube:</label>
                          <input
                            id="videoUrl"
                            type="url"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">🖼️ URL de Miniatura (Opcional):</label>
                          <input
                            id="videoThumbnail"
                            type="url"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                            placeholder="https://ejemplo.com/miniatura.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">📂 Categoría:</label>
                          <select
                            id="videoCategory"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                          >
                            <option value="">Seleccionar categoría</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">⏱️ Duración (Opcional):</label>
                          <input
                            id="videoDuration"
                            type="text"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                            placeholder="45 min"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-red-600 dark:text-red-400">🎯 Dificultad:</label>
                          <select
                            id="videoDifficulty"
                            className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                          >
                            <option value="Básico">Básico</option>
                            <option value="Intermedio" selected>Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                          </select>
                        </div>
                        <button
                          onClick={uploadVideo}
                          className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                        >
                          <Upload className="mr-2" size={18} />
                          ⬆️ SUBIR VIDEO
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Video Editing Modal */}
                  {editingVideo && (
                    <div className="border-2 border-[#C5A95E] rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
                      <h3 className="text-[#C5A95E] font-bold mb-4 flex items-center text-lg">
                        <Edit3 className="mr-2" size={20} />
                        ✏️ EDITAR VIDEO
                      </h3>
                      
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">🎥 Título del Video:</label>
                            <input
                              id="editVideoTitle"
                              type="text"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                              placeholder="Título del video"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">📝 Descripción:</label>
                            <textarea
                              id="editVideoDescription"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                              placeholder="Descripción del video"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">🔗 URL de YouTube:</label>
                            <input
                              id="editVideoUrl"
                              type="url"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">🖼️ URL de Miniatura:</label>
                            <input
                              id="editVideoThumbnail"
                              type="url"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                              placeholder="https://ejemplo.com/miniatura.jpg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">📂 Categoría:</label>
                            <select
                              id="editVideoCategory"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                            >
                              <option value="">Seleccionar categoría</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">⏱️ Duración:</label>
                            <input
                              id="editVideoDuration"
                              type="text"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                              placeholder="45 min"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-yellow-600 dark:text-yellow-400">🎯 Dificultad:</label>
                            <select
                              id="editVideoDifficulty"
                              className="w-full p-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                            >
                              <option value="Básico">Básico</option>
                              <option value="Intermedio">Intermedio</option>
                              <option value="Avanzado">Avanzado</option>
                            </select>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={saveVideoEdit}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                            >
                              <Save className="mr-2" size={18} />
                              💾 GUARDAR CAMBIOS
                            </button>
                            <button
                              onClick={() => setEditingVideo(null)}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                            >
                              <X className="mr-2" size={18} />
                              ❌ CANCELAR
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{customization.heroTitle}</h1>
          <p className="text-gray-500">{customization.heroSubtitle}</p>
        </div>
        
        {/* Categories Grid with Videos */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-semibold text-[#C5A95E]">{category.name}</h2>
                  <span className="text-sm text-gray-500">
                    ({category.videos?.length || 0} videos)
                  </span>
                </div>
                {userRole === 'admin' && category.videos && category.videos.length > 0 && (
                  <div className="flex space-x-2">
                    {category.videos.map((video) => (
                      <div key={video.id} className="flex space-x-1">
                        <button
                          onClick={() => editVideo(video)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                          title="Editar video"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          title="Eliminar video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {category.videos && category.videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      userEmail={userEmail}
                      onClick={handleVideoClick}
                      theme={theme}
                      showStats={userRole === 'admin'}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Play size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No hay videos en esta categoría</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;