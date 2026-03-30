const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { registerGitHubRoutes } = require('./GitHubService');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable CORS
app.use(express.json());

app.get('/api/message', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});

registerGitHubRoutes(app);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
