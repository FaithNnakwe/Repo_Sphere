import { useEffect, useState } from 'react';
import { fetchHello } from './api/api';

function App() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchHello()
      .then(data => setMessage(data.message))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>React + Express</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <p>{message || 'Loading...'}</p>
    </div>
  );
}

export default App;
