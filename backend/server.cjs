// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'CrisisConnect';

app.use(cors());
app.use(bodyParser.json());

let db, mycollection;

async function connectDB() {
    await client.connect();
    db = client.db(dbName);
    mycollection = db.collection('Requests');
}

// Get all requests
app.get('/request-info', async (req, res) => {
    try {
        const Data = await mycollection.find().toArray();
        res.json(Data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Get requests by user ID
app.get('/user-requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await mycollection.find({ userId }).toArray();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user requests' });
    }
});

// Create new help request
app.post('/request-help', async (req, res) => {
    try {
        const { Name, Members, Address, Desc, Lat, Lon, userId, userEmail, status = 'active' } = req.body;
        
        const requestData = {
            Name,
            Members: parseInt(Members),
            Desc,
            Address,
            Lat: parseFloat(Lat),
            Lon: parseFloat(Lon),
            userId,
            userEmail,
            status,
            createdAt: new Date(),
            helperId: null
        };
        
        const result = await mycollection.insertOne(requestData);
        res.json({ 
            _id: result.insertedId, 
            ...requestData 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// Update request status (mark as in-progress, completed, etc.)
app.patch('/request-status', async (req, res) => {
    try {
        const { requestId, status, helperId } = req.body;
        
        const updateData = {
            status,
            updatedAt: new Date()
        };
        
        if (helperId) {
            updateData.helperId = helperId;
        }
        
        const result = await mycollection.updateOne(
            { _id: new ObjectId(requestId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Delete/Cancel request
app.delete('/request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const result = await mycollection.deleteOne({
            _id: new ObjectId(requestId)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel request' });
    }
});

// Get nearby requests within specified radius
app.post('/nearby-requests', async (req, res) => {
    try {
        const { lat, lon, radius = 50 } = req.body; // radius in km
        
        // Using MongoDB's geospatial query for better performance
        // First, let's get all requests and filter by distance
        const allRequests = await mycollection.find({ status: { $ne: 'completed' } }).toArray();
        
        const nearbyRequests = allRequests.filter(req => {
            const distance = calculateDistance(lat, lon, req.Lat, req.Lon);
            return distance <= radius;
        });
        
        // Sort by distance
        nearbyRequests.sort((a, b) => {
            const distanceA = calculateDistance(lat, lon, a.Lat, a.Lon);
            const distanceB = calculateDistance(lat, lon, b.Lat, b.Lon);
            return distanceA - distanceB;
        });
        
        res.json(nearbyRequests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch nearby requests' });
    }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

// Get request statistics
app.get('/stats', async (req, res) => {
    try {
        const totalRequests = await mycollection.countDocuments();
        const activeRequests = await mycollection.countDocuments({ status: 'active' });
        const inProgressRequests = await mycollection.countDocuments({ status: 'in-progress' });
        const completedRequests = await mycollection.countDocuments({ status: 'completed' });
        
        res.json({
            total: totalRequests,
            active: activeRequests,
            inProgress: inProgressRequests,
            completed: completedRequests
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`)
    })
}).catch(error => {
    console.error('Failed to connect to database:', error);
});