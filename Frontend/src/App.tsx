import React, { useState, useEffect } from 'react';

function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch data from the backend
        fetch('http://localhost:5000/api/message')
            .then(response => response.json())
            .then(data => setMessage(data.message));
    }, []);

    return (
        <div className="App">
            <h1>{message}</h1>
        </div>
    );
}

export default App;
