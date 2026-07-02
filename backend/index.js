require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());

// Mount API routes
app.use('/api', apiRoutes);

module.exports = app;
