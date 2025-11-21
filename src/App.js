import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { parse_file } from './rleParser';

function App() {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);

  const glowRef = useRef(null);
  const target = useRef({x: window.innerWidth/2, y: window.innerHeight/2});
  const pos = useRef({x: window.innerWidth/2,  y: window.innerHeight/2});
  const rafRef=useRef(null);

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
  const handleCopy = () => {
    if (!jsonData) return;
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
  };

  const handleDownload = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decoded.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  React.useEffect(()=>{
    const el = document.querySelector('.bg-anim');
    if(!el) return;
    const onMove=(e) =>{
      const cx=window.innerWidth / 2;
      const cy=window.innerHeight /2;
      const dx=(e.clientX - cx) / cx;
      const dy=(e.clientY -cy) / cy;
      el.style.transform =  `translate(${dx * 8}px, ${dy * -8}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  },[]);

  React.useEffect(()=>{
    const onMove=(e) =>{
      target.current.x=e.clientX;
      target.current.y=e.clientY;
      if(glowRef.current) glowRef.current.style.opacity= '1';
    };
    const onLeave = () =>{
      if(glowRef.current) glowRef.current.style.opacity= '0';
    };


    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const lerp = (a,b,t) => a+(b-a)*t;
    const tick=()=>{
      pos.current.x= lerp(pos.current.x, target.current.x, 0.66);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.66);

      if(glowRef.current){
        glowRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);

    return()=>{
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('mouseleave', onLeave);
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  },[]);
 

  return(
    <div className="page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      <div className="bg-anim" aria-hidden="true"></div>
      <div ref={glowRef} className="mouse-glow" aria-hidden="true"></div>
      <div className="App card glass-card">
        <h1 className="greeting neon">RLE JSON Parser</h1>

        <label className="file-cta">
          <input
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
          />
          <span>Choose File</span>
        </label>
        <span className="chosen-file">{}</span>

        {error && <p className="error">{error}</p>}

        {jsonData && (
          <div className="fade-in">
            <pre className="json-output">{JSON.stringify(jsonData, null, 2)}</pre>
            <div style={{ display:'flex', gap:8, marginTop:10, justifyContent:'center' }}>
              <button onClick={handleCopy} className="file-cta">Copy</button>
              <button onClick={handleDownload} className="file-cta">Download JSON</button>
            </div>
          </div>
          )}

        
      </div>
    </div>
  );
}

export default App;