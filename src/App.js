import React, { useState, useRef, useMemo } from 'react';
import './App.css';
import { parse_file, compress_file } from './rleParser';

function App() {
  const [data, setData] = useState(null); //processed data state
  const [inputText, setInputText] = useState(''); //text input state
  const [error, setError] = useState(null);//error state
  const [mode, setMode] = useState('decode'); // 'decode' | 'encode'
  const [exectime, setExectime] = useState(null);
  
  const glowRef = useRef(null);
  const target = useRef({x: window.innerWidth/2, y: window.innerHeight/2});
  const pos = useRef({x: window.innerWidth/2,  y: window.innerHeight/2});
  const rafRef = useRef(null);

  //particle logic
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
  //process file object based on mode
  const processFileObj = async (fileObj) => {
    setError(null);
    setData(null);
    setExectime(null);


    try {
      const startTime = performance.now();
      let result;
      if (mode === 'decode') {
        result = await parse_file(fileObj);
      } else {
        result = await compress_file(fileObj);
      }
      const endTime = performance.now();
      setExectime((endTime - startTime).toFixed(3));
      setData(result);
    } catch (err) {
      setError(`Error during ${mode}: ${err.message}`);
      setData(null);
    }
  };

  //handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    //if user uploads a file, clear text input
    setInputText(''); 
    await processFileObj(file);
    event.target.value = ''; 
  };

  //handle text input submission
 const handleTextSubmit = async () => {
    if (!inputText.trim()) {
        setError("Please enter some text to process.");
        return;
    }
    
    //check for json or txt
    const text = inputText.trim();
    const isJson = text.startsWith('{') || text.startsWith('[');

    //create json or txt
    const mimeType = isJson ? 'application/json' : 'text/plain';
    const extension = isJson ? '.json' : '.txt';
    const fileName = `manual_input${extension}`;

    //create file object
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

  //animation effects
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
        
        {/*mode switcher*/}
        <div className="mode-switch">
          <button 
            className={mode === 'decode' ? 'active' : ''} 
            onClick={() => {setMode('decode'); setData(null); setError(null); setInputText('');}}
          >
            Decode
          </button>
          <button 
            className={mode === 'encode' ? 'active' : ''} 
            onClick={() => {setMode('encode'); setData(null); setError(null); setInputText('');}}
          >
            Encode
          </button>
        </div>

        {/*input textarea*/}
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

        {/*file upload zone*/}
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

        {/*output textareaU*/}
        {data && (
          <div className="fade-in">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
                <span style={{marginLeft: '10px', fontSize: '0.8rem', opacity: 0.7}}>Output</span>
              </div>
              
              {/*output area*/}
              <textarea 
                className="custom-textarea output-area"
                readOnly
                value={typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
              />
            </div>
            {exectime&& (
              <div className="execution-stats">
                <span className="blink">&gt;</span> Execution time: <strong>{exectime}ms</strong>
              </div>
            )}
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