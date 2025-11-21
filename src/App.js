import React, { useState } from 'react';
import './App.css';
import { parse_file } from './rleParser';

function App() {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async(event) => {
    const file = event.target.files[0];

    if(!file) return;

    try{
      setError(null);
      const data = await parse_file(file);
      setJsonData(data);
    } catch (err){
      setError(`Error parsing file: ${err.message}`);
      setJsonData(null);
    }
  };


  return(
    <div className="App">
      <h1 className="greeting">RLE JSON Parser</h1>
      <input 
      type="file" 
      accept=".json,.txt" 
      onChange={handleFileUpload}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {jsonData && (
        <pre>{JSON.stringify(jsonData, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;