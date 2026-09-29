const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Basic Permit Schema (Simulated)
const PermitSchema = new mongoose.Schema({
    location: { type: String, required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    type: { type: String, required: true }, // e.g. "Construction", "Public Gathering"
    scale: { type: Number, required: true }, // e.g. 1-10
    date: { type: Date, required: true }
});

const Permit = mongoose.model('Permit', PermitSchema);

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running' });
});

app.get('/api/permits', async (req, res) => {
    try {
        const permits = await Permit.find().sort({ date: -1 }).limit(100);
        res.json(permits);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch permits' });
    }
});

// Endpoint to trigger synthetic generation (for demo)
app.post('/api/generate-synthetic-data', async (req, res) => {
    try {
        const locations = [
            { name: "Ward 1", lat: 40.7128, lng: -74.0060 },
            { name: "Ward 2", lat: 40.7138, lng: -74.0070 },
            { name: "Commercial Block A", lat: 40.7148, lng: -74.0080 }
        ];
        
        const types = ["Construction", "Public Gathering", "Food Festival"];
        
        const newPermit = new Permit({
            location: locations[Math.floor(Math.random() * locations.length)].name,
            coordinates: locations[Math.floor(Math.random() * locations.length)],
            type: types[Math.floor(Math.random() * types.length)],
            scale: Math.floor(Math.random() * 10) + 1,
            date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Within next 7 days
        });

        await newPermit.save();
        res.json({ message: 'Synthetic permit generated successfully', data: newPermit });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
