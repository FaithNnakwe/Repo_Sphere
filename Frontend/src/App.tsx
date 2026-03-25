import Settings from './SettingPages/Settings';    
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


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
            <Settings />
            <ToastContainer />
        </div>
    );


}

export default App;
