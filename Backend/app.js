const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;
app.use(cors()); // Enable CORS
app.get('/api/message', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
