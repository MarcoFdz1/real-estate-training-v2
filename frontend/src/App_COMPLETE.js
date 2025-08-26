import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, stagger, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useSwipeable } from 'react-swipeable';
import { 
  Play, 
  Info, 
  X, 
  Plus, 
  Minus,
  Upload,
  Edit,
  Trash2,
  Settings,
  LogOut,
  User,
  Home,
  Film,
  Users,
  Building,
  TrendingUp,
  BookOpen,
  PieChart,
  Lightbulb,
  Award,
  Search,
  Filter,
  SortAsc,
  Sun,
  Moon,
  Menu,
  Star,
  Clock,
  TrendingDown,
  Save,
  UserPlus,
  Eye,
  EyeOff,
  ChevronDown,
  BarChart3,
  BookMarked
} from 'lucide-react';
import './App.css';

// Direct API calls - no external dependencies
const API_BASE_URL = 'https://one-production-6db5.up.railway.app/api';

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error('API call failed');
  return response.json();
};

function App() {
  // States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [customization, setCustomization] = useState({
    logoUrl: '',
    companyName: 'Realty ONE Group Mexico',
    loginBackgroundUrl: '',
    bannerUrl: '',
    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Accede a tu plataforma de capacitación inmobiliaria'
  });

  // Real estate categories
  const realEstateCategories = [
    { id: 1, name: 'Fundamentos Inmobiliarios', icon: 'Home', videos: [] },
    { id: 2, name: 'Marketing y Ventas', icon: 'TrendingUp', videos: [] },
    { id: 3, name: 'Regulaciones y Ética', icon: 'BookOpen', videos: [] },
    { id: 4, name: 'Finanzas y Economía', icon: 'PieChart', videos: [] },
    { id: 5, name: 'Tecnología Inmobiliaria', icon: 'Lightbulb', videos: [] },
    { id: 6, name: 'Negociación y Cierre', icon: 'Award', videos: [] },
    { id: 7, name: 'Desarrollo Personal', icon: 'User', videos: [] },
    { id: 8, name: 'Evaluación de Propiedades', icon: 'Building', videos: [] },
    { id: 9, name: 'Atención al Cliente', icon: 'Users', videos: [] }
  ];

  const [categories, setCategories] = useState(realEstateCategories);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load theme
      const savedTheme = localStorage.getItem('netflixRealEstateTheme') || 'dark';
      setTheme(savedTheme);
      
      try {
        // Load settings
        const settingsData = await apiCall('/settings');
        if (settingsData) {
          setCustomization({
            logoUrl: settingsData.logoUrl || '',
            companyName: settingsData.companyName || 'Realty ONE Group Mexico',
            loginBackgroundUrl: settingsData.loginBackgroundUrl || '',
            bannerUrl: settingsData.bannerUrl || '',
            loginTitle: settingsData.loginTitle || 'Iniciar Sesión',
            loginSubtitle: settingsData.loginSubtitle || 'Accede a tu plataforma de capacitación inmobiliaria'
          });
        }
        
        // Load categories
        const categoriesData = await apiCall('/categories');
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData.map(category => ({
            id: parseInt(category.id) || category.id,
            name: category.name,
            icon: category.icon,
            videos: category.videos || []
          })));
        }

        // Load users
        const usersData = await apiCall('/users');
        if (usersData) {
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save customization - WORKING VERSION
  const saveCustomization = async (newCustomization) => {
    try {
      setCustomization(newCustomization);
      await apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(newCustomization)
      });
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const loginResult = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      setCurrentUser({
        id: Date.now(),
        name: loginResult.name,
        email: loginResult.email,
        role: loginResult.role,
        isActive: true
      });
      setUserRole(loginResult.role);
      setIsAuthenticated(true);
    } catch (error) {
      alert('Credenciales incorrectas');
    }
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    setShowAdminPanel(false);
    setEmail('');
    setPassword('');
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('netflixRealEstateTheme', newTheme);
  };

  // ALL SAVE FUNCTIONS WITH BUTTONS - WORKING VERSIONS
  const saveLogoUrl = () => {
    const input = document.getElementById('logoUrlInput');
    if (input) {
      const newCustomization = { ...customization, logoUrl: input.value };
      saveCustomization(newCustomization);
      alert('✅ Logo guardado correctamente');
    }
  };

  const saveBackgroundUrl = () => {
    const input = document.getElementById('backgroundUrlInput');
    if (input) {
      const newCustomization = { ...customization, loginBackgroundUrl: input.value };
      saveCustomization(newCustomization);
      alert('✅ Fondo guardado correctamente');
    }
  };

  const saveBannerUrl = () => {
    const input = document.getElementById('bannerUrlInput');
    if (input) {
      const newCustomization = { ...customization, bannerUrl: input.value };
      saveCustomization(newCustomization);
      alert('✅ Banner guardado correctamente');
    }
  };

  const saveCompanyName = () => {
    const input = document.getElementById('companyNameInput');
    if (input) {
      const newCustomization = { ...customization, companyName: input.value };
      saveCustomization(newCustomization);
      alert('✅ Nombre de empresa guardado');
    }
  };

  const saveLoginTitle = () => {
    const input = document.getElementById('loginTitleInput');
    if (input) {
      const newCustomization = { ...customization, loginTitle: input.value };
      saveCustomization(newCustomization);
      alert('✅ Título del login guardado');
    }
  };

  const saveLoginSubtitle = () => {
    const input = document.getElementById('loginSubtitleInput');
    if (input) {
      const newCustomization = { ...customization, loginSubtitle: input.value };
      saveCustomization(newCustomization);
      alert('✅ Subtítulo del login guardado');
    }
  };

  const createUser = async () => {
    const nameInput = document.getElementById('newUserName');
    const emailInput = document.getElementById('newUserEmail');
    const passwordInput = document.getElementById('newUserPassword');
    const roleInput = document.getElementById('newUserRole');

    if (!nameInput.value || !emailInput.value || !passwordInput.value) {
      alert('❌ Por favor complete todos los campos');
      return;
    }

    try {
      await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          password: passwordInput.value,
          role: roleInput.value
        })
      });

      // Refresh users
      const usersData = await apiCall('/users');
      setUsers(usersData);
      
      // Clear form
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
      roleInput.value = 'user';
      
      alert('✅ Usuario creado exitosamente');
    } catch (error) {
      alert('❌ Error al crear usuario: ' + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await apiCall(`/users/${userId}`, { method: 'DELETE' });
        
        // Refresh users
        const usersData = await apiCall('/users');
        setUsers(usersData);
        
        alert('✅ Usuario eliminado exitosamente');
      } catch (error) {
        alert('❌ Error al eliminar usuario: ' + error.message);
      }
    }
  };

  const uploadVideo = async () => {
    const titleInput = document.getElementById('videoTitle');
    const descInput = document.getElementById('videoDescription');
    const urlInput = document.getElementById('videoUrl');
    const categoryInput = document.getElementById('videoCategory');
    const durationInput = document.getElementById('videoDuration');

    if (!titleInput.value || !urlInput.value || !categoryInput.value) {
      alert('❌ Por favor complete título, URL y categoría');
      return;
    }

    // Extract YouTube ID
    const youtubeId = urlInput.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!youtubeId) {
      alert('❌ Por favor ingrese una URL válida de YouTube');
      return;
    }

    try {
      await apiCall('/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: titleInput.value,
          description: descInput.value || 'Sin descripción',
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          duration: durationInput.value || '45 min',
          youtubeId: youtubeId,
          match: '95%',
          difficulty: 'Intermedio',
          rating: 4.5,
          views: 0,
          releaseDate: new Date().toISOString().split('T')[0],
          categoryId: categoryInput.value
        })
      });

      // Refresh categories
      const categoriesData = await apiCall('/categories');
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData.map(category => ({
          id: parseInt(category.id) || category.id,
          name: category.name,
          icon: category.icon,
          videos: category.videos || []
        })));
      }
      
      // Clear form
      titleInput.value = '';
      descInput.value = '';
      urlInput.value = '';
      categoryInput.value = '';
      durationInput.value = '';
      
      alert('✅ Video subido exitosamente');
    } catch (error) {
      alert('❌ Error al subir video: ' + error.message);
    }
  };

  // Login Component
  if (!isAuthenticated) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center relative ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        style={{
          backgroundImage: theme === 'dark' 
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${customization.loginBackgroundUrl})` 
            : `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${customization.loginBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme === 'dark' ? 'bg-black bg-opacity-80' : 'bg-white bg-opacity-90'} p-8 rounded-lg w-full max-w-md relative z-10 shadow-2xl`}
        >
          <div className="text-center mb-8">
            {customization.logoUrl ? (
              <img 
                src={customization.logoUrl} 
                alt={customization.companyName}
                className="h-16 mx-auto mb-4 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <h1 className="text-4xl font-bold text-[#C5A95E] mb-2">
                {customization.companyName}
              </h1>
            )}
            <h2 className="text-2xl font-semibold mb-2">{customization.loginTitle}</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {customization.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 rounded ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} border focus:border-[#C5A95E] focus:outline-none transition-colors`}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 rounded ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} border focus:border-[#C5A95E] focus:outline-none transition-colors`}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#C5A95E] text-white p-3 rounded hover:bg-[#B8975A] transition-colors font-semibold"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#C5A95E] text-white hover:bg-[#B8975A] transition-colors z-20"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} p-4 flex justify-between items-center shadow-lg relative z-10`}>
        <div className="flex items-center space-x-3">
          {customization.logoUrl ? (
            <img 
              src={customization.logoUrl} 
              alt={customization.companyName}
              className="h-8 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <h1 className="text-xl font-bold text-[#C5A95E]">{customization.companyName}</h1>
          )}
        </div>

        <div className="flex items-center space-x-4">
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

      {/* Admin Panel */}
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
                  {/* Configuración de Imágenes */}
                  <div className="p-4 border border-[#C5A95E] rounded-lg">
                    <h3 className="text-[#C5A95E] font-semibold mb-4 flex items-center">
                      <Settings className="mr-2" size={18} />
                      Configuración de Imágenes
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">URL del Logo:</label>
                        <input
                          id="logoUrlInput"
                          type="text"
                          defaultValue={customization.logoUrl}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="https://ejemplo.com/logo.png"
                        />
                        <button
                          onClick={saveLogoUrl}
                          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR LOGO
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">URL de Fondo de Login:</label>
                        <input
                          id="backgroundUrlInput"
                          type="text"
                          defaultValue={customization.loginBackgroundUrl}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="https://ejemplo.com/fondo.jpg"
                        />
                        <button
                          onClick={saveBackgroundUrl}
                          className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR FONDO
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">URL de Banner Principal:</label>
                        <input
                          id="bannerUrlInput"
                          type="text"
                          defaultValue={customization.bannerUrl}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="https://ejemplo.com/banner.jpg"
                        />
                        <button
                          onClick={saveBannerUrl}
                          className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR BANNER
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Textos */}
                  <div className="p-4 border border-[#C5A95E] rounded-lg">
                    <h3 className="text-[#C5A95E] font-semibold mb-4 flex items-center">
                      <Edit className="mr-2" size={18} />
                      Configuración de Textos
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre de la Empresa:</label>
                        <input
                          id="companyNameInput"
                          type="text"
                          defaultValue={customization.companyName}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                        <button
                          onClick={saveCompanyName}
                          className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR NOMBRE
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Título del Login:</label>
                        <input
                          id="loginTitleInput"
                          type="text"
                          defaultValue={customization.loginTitle}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                        <button
                          onClick={saveLoginTitle}
                          className="mt-2 w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR TÍTULO
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Subtítulo del Login:</label>
                        <input
                          id="loginSubtitleInput"
                          type="text"
                          defaultValue={customization.loginSubtitle}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                        <button
                          onClick={saveLoginSubtitle}
                          className="mt-2 w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors flex items-center justify-center"
                        >
                          <Save className="mr-2" size={16} />
                          GUARDAR SUBTÍTULO
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gestión de Usuarios */}
                  <div className="p-4 border border-[#C5A95E] rounded-lg">
                    <h3 className="text-[#C5A95E] font-semibold mb-4 flex items-center">
                      <Users className="mr-2" size={18} />
                      Gestión de Usuarios
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre:</label>
                        <input
                          id="newUserName"
                          type="text"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email:</label>
                        <input
                          id="newUserEmail"
                          type="email"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="usuario@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Contraseña:</label>
                        <input
                          id="newUserPassword"
                          type="password"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="Contraseña"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Rol:</label>
                        <select
                          id="newUserRole"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <button
                        onClick={createUser}
                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center"
                      >
                        <UserPlus className="mr-2" size={16} />
                        CREAR USUARIO
                      </button>
                    </div>

                    {/* Lista de usuarios */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Usuarios existentes:</h4>
                      <div className="max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <div key={user.id} className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex justify-between items-center`}>
                            <div>
                              <div className="text-sm font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email} ({user.role})</div>
                            </div>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gestión de Videos */}
                  <div className="p-4 border border-[#C5A95E] rounded-lg">
                    <h3 className="text-[#C5A95E] font-semibold mb-4 flex items-center">
                      <Film className="mr-2" size={18} />
                      Subir Nuevo Video
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Título del Video:</label>
                        <input
                          id="videoTitle"
                          type="text"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="Título del video"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Descripción:</label>
                        <textarea
                          id="videoDescription"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="Descripción del video"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">URL de YouTube:</label>
                        <input
                          id="videoUrl"
                          type="url"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Categoría:</label>
                        <select
                          id="videoCategory"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
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
                        <label className="block text-sm font-medium mb-2">Duración:</label>
                        <input
                          id="videoDuration"
                          type="text"
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          placeholder="45 min"
                        />
                      </div>
                      <button
                        onClick={uploadVideo}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <Upload className="mr-2" size={16} />
                        SUBIR VIDEO
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-6">Plataforma de Capacitación Inmobiliaria</h1>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-all cursor-pointer`}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold text-[#C5A95E] mb-2">{category.name}</h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {category.videos?.length || 0} videos disponibles
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;