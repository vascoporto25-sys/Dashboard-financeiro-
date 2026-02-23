// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mcache = require('memory-cache');

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Middleware for CORS
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware for parsing JSON bodies
app.use(express.json());

// Cache middleware
const cache = (duration) => {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cachedBody = mcache.get(key);
        if (cachedBody) {
            return res.json(JSON.parse(cachedBody));
        }
        res.sendResponse = res.json;
        res.json = (body) => {
            mcache.put(key, JSON.stringify(body), duration * 1000);
            res.sendResponse(body);
        };
        next();
    };
};

// Example route to get financial data
app.get('/api/financial-data', cache(60), async (req, res) => {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
