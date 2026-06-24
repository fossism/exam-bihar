import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            // Token expired or invalid
            logoutUser();
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          logoutUser();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const loginUser = async (email, password) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
      } else {
        setError(data.message || 'Login failed');
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
      throw err;
    }
  };

  const registerUser = async (userData) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
      } else {
        setError(data.message || 'Registration failed');
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
      throw err;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // Helper function to make authenticated requests
  const apiRequest = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        logoutUser();
        throw new Error('Session expired. Please log in again.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Request Error (${endpoint}):`, err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        loginUser,
        registerUser,
        logoutUser,
        apiRequest,
        apiUrl: API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
