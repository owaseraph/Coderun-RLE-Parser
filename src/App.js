import React, { useState, useRef, useMemo } from 'react';
import './App.css';
import { decodeRLE, encodeRLE } from './rleParser';

function App() {
  const [data, setData] = useState(null);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('decode');
  
  
  const [execTime, setExecTime] = useState(null); 
  const [stats, setStats] = useState(null); 

  const glowRef = useRef(null);
  const target = useRef({x: window.innerWidth/2, y: window.innerHeight/2});
  const pos = useRef({x: window.innerWidth/2,  y: window.innerHeight/2});
  const rafRef = useRef(null);

  
  const particles = useMemo(() => {
    const items = [];
    for(let i=0; i<10; i++) {
        items.push({
            id: `h-${i}`, className: 'particle-h',
            style: { '--pos': `${Math.random() * 100}%`, '--speed': `${3 + Math.random() * 5}s`, '--delay': `-${Math.random() * 5}s` }
        });
    }
    for(let i=0; i<10; i++) {
        items.push({
            id: `v-${i}`, className: 'particle-v',
            style: { '--pos': `${Math.random() * 100}%`, '--speed': `${3 + Math.random() * 5}s`, '--delay': `-${Math.random() * 5}s` }
        });
    }
    return items;
  }, []);


  const processFileObj = async (fileObj) => {
    setError(null);
    setData(null);
    setExecTime(null);
    setStats(null);

    try {
      const startTime = performance.now();
      
      
      const text = await fileObj.text();
      const inputLen = text.length;

      let resultData;
      let outputLen = 0;
      let ratio = 0;

      if (mode === 'decode') {
        const decoded = decodeRLE(text);
        outputLen = decoded.length;
        
        try {
          resultData = JSON.parse(decoded);
        } catch (e) {
          resultData = decoded;
        }
        ratio = outputLen > 0 ? (inputLen / outputLen) * 100 : 0;

      } else {
        const encoded = encodeRLE(text);
        outputLen = encoded.length;
        resultData = encoded;

        
        ratio = inputLen > 0 ? (outputLen / inputLen) * 100 : 0;
      }

      const endTime = performance.now();
      
      setExecTime((endTime - startTime).toFixed(3));
      setStats({
        original: inputLen,
        result: outputLen,
        ratio: ratio.toFixed(2)
      });
      
      setData(resultData);

    } catch (err) {
      setError(`Error during ${mode}: ${err.message}`);
      setData(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setInputText(''); 
    await processFileObj(file);
    event.target.value = ''; 
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
        setError("Please enter some text to process.");
        return;
    }
    
    const text = inputText.trim();
    const isJson = text.startsWith('{') || text.startsWith('[');
    const mimeType = isJson ? 'application/json' : 'text/plain';
    const extension = isJson ? '.json' : '.txt';
    const fileName = `manual_input${extension}`;

    const blob = new Blob([inputText], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    
    await processFileObj(file);
  };

  const handleCopy = () => {
    if (!data) return;
    const textToCopy = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleDownload = () => {
    if (!data) return;
    const isObject = typeof data === 'object';
    const content = isObject ? JSON.stringify(data, null, 2) : data;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'decode' ? 'decoded.json' : 'encoded.json'; 
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
      pos.current.x= lerp(pos.current.x, target.current.x, 0.25);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.25);
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
      
      <div className="grid-particles-container">
        {particles.map(p => (
            <div key={p.id} className={p.className} style={p.style}></div>
        ))}
      </div>

      <div className="bg-anim" aria-hidden="true"></div>
      <div ref={glowRef} className="mouse-glow" aria-hidden="true"></div>
      
      <div className="App card">
        <h1 className="greeting neon">RLE {mode === 'decode' ? 'Decoder' : 'Encoder'}</h1>
        
        <div className="mode-switch">
          <button 
            className={mode === 'decode' ? 'active' : ''} 
            onClick={() => {setMode('decode'); setData(null); setError(null); setInputText(''); setExecTime(null); setStats(null);}}
          >
            Decode
          </button>
          <button 
            className={mode === 'encode' ? 'active' : ''} 
            onClick={() => {setMode('encode'); setData(null); setError(null); setInputText(''); setExecTime(null); setStats(null);}}
          >
            Encode
          </button>
        </div>

        <div className="input-section">
            <textarea 
                className="custom-textarea input-area"
                placeholder={`Paste your text to ${mode} here...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
            <button className="file-cta process-btn" onClick={handleTextSubmit}>
                Process Text
            </button>
        </div>
        
        <div className="divider"><span>OR</span></div>

        <label className="drop-zone">
          <input
            type="file"
            accept=".json,.txt,.rle"
            onChange={handleFileUpload}
          />
          <div className="upload-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span className="drop-text-main">Upload File</span>
        </label>

        {error && <p className="error">{error}</p>}

        {data && (
          <div className="fade-in">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
                <span style={{marginLeft: '10px', fontSize: '0.8rem', opacity: 0.7}}>Output</span>
              </div>
              
              <textarea 
                className="custom-textarea output-area"
                readOnly
                value={typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
              />
            </div>
            
            <div className="meta-container">
              {/*execution time*/}
              {execTime && (
                <div className="execution-stats">
                  <span className="blink">&gt;</span> Time: <strong>{execTime}ms</strong>
                </div>
              )}

              {/*filestats*/}
              {stats && (
                <div className="file-stats">
                  <div className="stat-item">
                    <span className="stat-label">Original:</span>
                    <span className="stat-val">{stats.original} chars</span>
                  </div>
                  <div className="stat-divider">|</div>
                  <div className="stat-item">
                    <span className="stat-label">Result:</span>
                    <span className="stat-val">{stats.result} chars</span>
                  </div>
                  <div className="stat-divider">|</div>
                  <div className="stat-item">
                    <span className="stat-label">Ratio:</span>
                    <span className="stat-val" style={{color: stats.ratio < 100 ? '#4af626' : '#ffcc00'}}>
                      {stats.ratio}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display:'flex', gap:15, marginTop:20, justifyContent:'center' }}>
              <button onClick={handleCopy} className="file-cta">Copy Result</button>
              <button onClick={handleDownload} className="file-cta">Download</button>
            </div>
          </div>
          )}
      </div>
    </div>
  );
}

export default App;