// HelpOthers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_LOCAL_API;

// Function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

export default function HelpOthers() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: null, lon: null });
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(50); // Default radius in 50km
  // const [showMap, setShowMap] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    getCurrentLocation();
    loadRequests();
  }, []);

  useEffect(() => {
    if (userLocation.lat && userLocation.lon && data.length > 0) {
      filterNearbyRequests(radius);
    }
  }, [userLocation, data,radius]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        console.error(error);
        setLoading(false);
      }
    );
  };

  const loadRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/request-info`);
      setData(res.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNearbyRequests = (radius) => {
    const nearby = data.filter(req => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lon, 
        req.Lat, 
        req.Lon
      );
      return distance <= radius; // Within [50km] radius
    });

    // Sort by distance
    nearby.sort((a, b) => {
      const distanceA = calculateDistance(userLocation.lat, userLocation.lon, a.Lat, a.Lon);
      const distanceB = calculateDistance(userLocation.lat, userLocation.lon, b.Lat, b.Lon);
      return distanceA - distanceB;
    });

    setFilteredData(nearby);
  };

  const handleMarkInProgress = async (requestId) => {
    try {
      await axios.patch(`${API_URL}/request-status`, {
        requestId,
        status: 'in-progress',
        helperId: currentUser.uid
      });
      
      // Update local state
      setFilteredData(prev => 
        prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'in-progress', helperId: currentUser.uid }
            : req
        )
      );
      
      alert('Request marked as in progress!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getDistanceText = (req) => {
    if (!userLocation.lat || !userLocation.lon) return '';
    const distance = calculateDistance(userLocation.lat, userLocation.lon, req.Lat, req.Lon);
    return `${distance.toFixed(1)} km away`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nearby help requests...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Location Required</h2>
          <p className="text-gray-600 mb-4">{locationError}</p>
          <button
            onClick={getCurrentLocation}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Help Others</h1>
              <p className="text-gray-600">
                {filteredData.length} people need help within {radius}km of your location
              <input value={radius} onChange={e => setRadius(Number(e.target.value))} className="ml-10 bg-amber-100 border border-amber-200 rounded-lg pt-2 pb-2 pl-2" placeholder='Enter the km radius'></input>
              {/* <button onClick={() => {setRadius(Number(radinput.target.value))}} className="bg-red-50 hover:bg-red-100 p-2 ml-1 rounded-lg cursor-pointer"><Search color='red' size={24} /></button> */}
              </p>
            </div>
            
            {/* <div className="flex space-x-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
            </div> */}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-4">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-amber-800 mb-2">Map Location Disclaimer</h4>
              <p className="text-amber-700">
                The location on the map may be inaccurate due to the browser's location accuracy. Please verify it using the person's address.
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Map View (placeholder)
        {showMap && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Interactive map will show here</p>
                <p className="text-sm text-gray-500">Showing {filteredData.length} nearby requests</p>
              </div>
            </div>
          </div>
        )} */}

        {/* Help Requests List */}
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Help Requests Nearby</h3>
              <p className="text-gray-600">There are no active help requests within {radius}km of your location.</p>
            </div>
          ) : (
            filteredData.map((req) => (
              <div key={req._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{req.Name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{getDistanceText(req)}</span>
                        </span>
                        <span>{req.Members} members affected</span>
                      </div>
                    </div>
                  </div>
                  
                  {req.status === 'in-progress' ? (
                    <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 font-medium">In Progress</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkInProgress(req._id)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Help Now</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Situation:</h4>
                    <p className="text-gray-600">{req.Desc}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Address:</h4>
                    <p className="text-gray-600">{req.Address}</p>
                  </div>
                </div>

                {req.status === 'in-progress' && req.helperId && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Someone is already responding to this request.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}