const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');


const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { protect } = require('./middleware/auth');



const app = express();
require('dotenv').config();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
// if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
// app.use(cors({ origin: ["https://tms-frontend-plum.vercel.app"], credentials: true }));


const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: origin not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());



const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: parseInt(process.env.RATE_LIMIT_MAX || 100),
});
app.use(limiter);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.get('/', (req, res) => res.json({ message: 'MERN Task Manager API' }));
app.get("/favicon.ico", (req, res) => res.status(204).end());


// Error handler
app.use(protect);


// Start server
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB connected');
            // const PORT = process.env.PORT || 5000;
            // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        })
        .catch(err => {
            console.error('Mongo connection error:', err);
            process.exit(1);
        });
}


module.exports = app; // for tests