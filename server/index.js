import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { middleware } from '@line/bot-sdk';
import googleSheets from './services/googleSheets.js';
import lineBot from './services/lineBot.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3000;

// LINE Bot middleware config
const lineBotConfig = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: '🛹 Board School Booking System API',
        version: '1.0.0'
    });
});

// Health check for webhook (doesn't require signature)
app.get('/webhook', (req, res) => {
    res.send('Webhook endpoint is ready');
});

// LINE Bot webhook (with signature verification)
app.post('/webhook', async (req, res) => {
    try {
        // Apply LINE middleware manually with error handling
        const lineMw = middleware(lineBotConfig);

        // Wrap middleware call in promise to catch errors
        await new Promise((resolve, reject) => {
            lineMw(req, res, (err) => {
                if (err) {
                    // Check if it's a signature validation error
                    if (err.name === 'SignatureValidationFailed') {
                        console.log('⚠️  Signature validation failed - this is normal for LINE verification requests');
                        // For verification requests, just return 200 OK
                        res.status(200).json({ success: true });
                        resolve();
                    } else {
                        reject(err);
                    }
                } else {
                    resolve();
                }
            });
        });

        // If middleware passed, process events
        if (!res.headersSent) {
            const events = req.body.events || [];

            if (events.length > 0) {
                await Promise.all(events.map(async (event) => {
                    try {
                        await lineBot.handleEvent(event);
                    } catch (err) {
                        console.error('Event handling error:', err);
                    }
                }));
            }

            res.json({ success: true });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

// API Routes
app.use('/api', apiRoutes);

// Initialize Google Sheets and start server
async function startServer() {
    try {
        console.log('🚀 Initializing Board School Booking System...\n');

        // Initialize Google Sheets
        await googleSheets.initialize();

        // Start Express server
        app.listen(PORT, () => {
            console.log('\n✅ Server started successfully!');
            console.log(`📡 Server running on http://localhost:${PORT}`);
            console.log(`🤖 LINE Bot webhook: http://localhost:${PORT}/webhook`);
            console.log(`🔌 API endpoints: http://localhost:${PORT}/api`);
            console.log('\n💡 Next steps:');
            console.log('   1. Use ngrok to expose this server: ngrok http 3000');
            console.log('   2. Set the ngrok URL as LINE Bot webhook: https://xxxxx.ngrok.io/webhook');
            console.log('   3. Start the frontend: cd frontend && npm run dev\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
