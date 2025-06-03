// App.js
import './App.css'
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios'
import { MapPin, Heart, AlertTriangle, LogOut, User, HeartHandshake } from 'lucide-react'
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_LOCAL_API;

export default function HomePage() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [stats, setStats] = useState({ total: 0, active: 0, inProgress: 0, completed: 0 });
  const { currentUser, logout } = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/request-info`);
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${import.meta.env.VITE_MAP_API}`,
      center: [78.9629, 22], // Center of India
      zoom: 4.5,
    });

    // Add markers for requests
    requests.forEach(req => {
      const markerColor = req.status === 'in-progress' ? '#f59e0b' : '#ef4444';
      
      const marker = new maplibregl.Marker({ color: markerColor })
        .setLngLat([req.Lon, req.Lat])
        .setPopup(
          new maplibregl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${req.Name}</h3>
              <p class="text-sm text-gray-600">${req.Desc}</p>
              <p class="text-sm"><strong>Members:</strong> ${req.Members}</p>
              <p class="text-sm"><strong>Status:</strong> ${req.status || 'active'}</p>
            </div>
          `)
        )
        .addTo(mapRef.current);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [requests]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setLocation(newLocation);
        
        // Update map center
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [newLocation.lon, newLocation.lat],
            zoom: 10
          });
          
          // Add user location marker
          new maplibregl.Marker({ color: '#10b981' })
            .setLngLat([newLocation.lon, newLocation.lat])
            .setPopup(new maplibregl.Popup().setText('Your Location'))
            .addTo(mapRef.current);
        }
      },
      (error) => {
        alert("Unable to retrieve your location");
        console.error(error);
      }
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <HeartHandshake className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CrisisConnect</h1>
                <p className="text-sm text-gray-600">Find and offer help in your community</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{currentUser.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
              
              <button 
                onClick={getLocation} 
                className="flex items-center space-x-2 hover:scale-105 duration-200 rounded-xl px-4 py-2 bg-blue-600 text-white"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-sm">Find Nearby</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Active: <strong>{stats.active}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">In Progress: <strong>{stats.inProgress}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Completed: <strong>{stats.completed}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Map Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Live Crisis Map
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time help requests and available assistance in your area
              {location.lat && location.lon && (
                <span className="ml-2 text-green-600 font-medium">
                  • Your location detected
                </span>
              )}
            </p>
          </div>
          
          <div 
            ref={mapContainer} 
            className="h-96 md:h-[500px] w-full bg-gray-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to='NeedHelp'>
            <button className="group relative flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95">
              <AlertTriangle className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              <span>Need Help</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
            </button>
          </Link>

          <Link to="HelpOthers">
            <button className="group relative flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95">
              <Heart className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              <span>Help Others</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
            </button>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Request Help</h3>
            </div>
            <p className="text-gray-600">Quickly request assistance from nearby volunteers and emergency responders in your area.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Offer Help</h3>
            </div>
            <p className="text-gray-600">Connect with people in need and provide assistance to your community during emergencies.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Real-time Tracking</h3>
            </div>
            <p className="text-gray-600">Monitor active help requests and available resources on our live interactive map.</p>
          </div>
        </div>

        {/* Emergency Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-amber-800 mb-2">Emergency Notice</h4>
              <p className="text-amber-700">
                For life-threatening emergencies, always call <strong>911</strong> first. 
                CrisisConnect is designed to supplement emergency services and connect community members for mutual aid.
              </p>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}