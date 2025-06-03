// NeedHelp.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { MapPin, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_LOCAL_API;

export default function NeedHelp() {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [userRequests, setUserRequests] = useState([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        }
      );
    };
    getLocation();
    loadUserRequests();
  }, []);

  const loadUserRequests = async () => {
    if (!currentUser) return;
    
    try {
      const res = await axios.get(`${API_URL}/user-requests/${currentUser.uid}`);
      setUserRequests(res.data);
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name || !members || !desc || !address) {
      alert('Please fill in all fields');
      return;
    }
    
    if (!location.lat || !location.lon) {
      alert('Location information is required');
      return;
    }

    try {
      await axios.post(`${API_URL}/request-help`, {
        Name: name,
        Members: members,
        Desc: desc,
        Address: address,
        Lat: location.lat,
        Lon: location.lon,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'active'
      });
      
      alert('Help request submitted successfully!');
      
      // Reset form
      setName('');
      setMembers('');
      setDesc('');
      setAddress('');
      
      // Reload user requests
      loadUserRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      await axios.delete(`${API_URL}/request/${requestId}`);
      alert('Request cancelled successfully');
      loadUserRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Help</h1>
              <p className="text-gray-600">Fill out the form below to request assistance</p>
            </div>
            <button
              onClick={() => setShowMyRequests(!showMyRequests)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>{showMyRequests ? 'New Request' : 'My Requests'}</span>
            </button>
          </div>
        </div>

        {showMyRequests ? (
          /* My Requests View */
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Help Requests</h2>
              {userRequests.length === 0 ? (
                <p className="text-gray-600">You haven't made any help requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {userRequests.map((req) => (
                    <div key={req._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{req.Name}</h3>
                          <p className="text-sm text-gray-600">{req.Members} members affected</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(req.status)}`}>
                            {req.status || 'active'}
                          </span>
                          {req.status !== 'in-progress' && (
                            <button
                              onClick={() => handleCancelRequest(req._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{req.Desc}</p>
                      <p className="text-sm text-gray-600">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {req.Address}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* New Request Form */
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Members Affected
                </label>
                <input
                  id="members"
                  type="number"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your current address"
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Situation
                </label>
                <textarea
                  id="description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Please provide details about your situation..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Your location will be automatically detected to help responders find you quickly.
                      {location.lat && location.lon && (
                        <span className="block mt-1 font-medium">
                          ✓ Location detected: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}