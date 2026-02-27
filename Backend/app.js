// const express = require('express');
// const cors = require('cors');
// const app = express();
// const port = 5000;
// app.use(cors()); // Enable CORS
// app.get('/api/message', (req, res) => {
//     res.json({ message: 'Hello from Node.js backend!' });
// });
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });



const express = require('express');
const cors = require('cors');

// Import database connection
const { checkConnection } = require('../RepoSphere-app/db.js');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/message', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});

// Start server + connect DB
app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);

    console.log("Checking database connection...");

    try {
        await checkConnection();
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
});