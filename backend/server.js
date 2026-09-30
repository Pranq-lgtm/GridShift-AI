const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const PermitSchema = new mongoose.Schema({
    location: { type: String, required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    type: { type: String, required: true },
    scale: { type: Number, required: true },
    date: { type: Date, required: true },
    forecast: {
        predicted_surge_tonnage: { type: Number },
        pressure_level: { type: String },
        alert_triggered: { type: Boolean },
        copilot: {
            when: { type: String },
            why: [{ type: String }],
            recommendations: [{ type: String }],
            confidence: { type: Number }
        }
    }
});

const Permit = mongoose.model('Permit', PermitSchema);

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

app.post('/api/permits/bulk', async (req, res) => {
    try {
        const permits = req.body.permits;
        if (!permits || !Array.isArray(permits)) {
            return res.status(400).json({ error: 'Expected an array of permits' });
        }

        const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const savedPermits = [];

        for (let p of permits) {
            let forecast = null;
            try {
                const mlResponse = await fetch(`${ML_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: p.location,
                        event_type: p.type,
                        scale: p.scale,
                        date: new Date(p.date).toISOString()
                    })
                });
                if (mlResponse.ok) {
                    forecast = await mlResponse.json();
                } else {
                    console.error('ML service error for permit:', p.location);
                }
            } catch (mlErr) {
                console.error('Failed to connect to ML Service:', mlErr.message);
            }

            const newPermit = new Permit({
                ...p,
                forecast: forecast || {
                    predicted_surge_tonnage: 0,
                    pressure_level: 'Unknown',
                    alert_triggered: false,
                    copilot: null
                }
            });

            await newPermit.save();
            savedPermits.push(newPermit);
        }

        res.json({ message: `Successfully ingested and forecasted ${savedPermits.length} permits.`, data: savedPermits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process bulk permits' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
