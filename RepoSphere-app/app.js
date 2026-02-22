import express from 'express';
import cors from 'cors';

import {pool, checkConnection} from '../RepoSphere-app/db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sample route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    await checkConnection();
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
});
