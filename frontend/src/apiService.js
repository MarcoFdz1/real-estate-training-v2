// API Service for Real Estate Training Platform
// This service handles all HTTP requests to the backend

const API_BASE_URL = 'https://one-production-6db5.up.railway.app';
const API_URL = `${API_BASE_URL}/api`;

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`);
    return handleResponse(response);
  },

  create: async (userData) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/categories`);
    return handleResponse(response);
  },

  create: async (categoryData) => {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response);
  },

  update: async (categoryId, categoryData) => {
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response);
  },

  delete: async (categoryId) => {
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Videos API
export const videosAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/videos`);
    return handleResponse(response);
  },

  create: async (videoData) => {
    const response = await fetch(`${API_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData),
    });
    return handleResponse(response);
  },

  update: async (videoId, videoData) => {
    const response = await fetch(`${API_URL}/videos/${videoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData),
    });
    return handleResponse(response);
  },

  delete: async (videoId) => {
    const response = await fetch(`${API_URL}/videos/${videoId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/settings`);
    return handleResponse(response);
  },

  update: async (settingsData) => {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });
    return handleResponse(response);
  },
};

// Banner Video API
export const bannerVideoAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/banner-video`);
    if (response.status === 200) {
      return handleResponse(response);
    }
    return null; // No banner video set
  },

  set: async (bannerVideoData) => {
    const response = await fetch(`${API_URL}/banner-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bannerVideoData),
    });
    return handleResponse(response);
  },

  delete: async () => {
    const response = await fetch(`${API_URL}/banner-video`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Helper functions for localStorage theme persistence
export const themeAPI = {
  get: () => {
    return localStorage.getItem('netflixRealEstateTheme') || 'dark';
  },

  set: (theme) => {
    localStorage.setItem('netflixRealEstateTheme', theme);
  },
};

export default {
  authAPI,
  usersAPI,
  categoriesAPI,
  videosAPI,
  settingsAPI,
  bannerVideoAPI,
  themeAPI,
};