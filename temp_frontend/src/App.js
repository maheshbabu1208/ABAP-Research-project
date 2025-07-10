import React, { useState } from 'react';

function App() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => {
    setCode(e.target.value);
  };

  const runCode = async () => {
    setError('');
    setOutput('Running...');

    try {
      console.log('Sending code:', code);
      const response = await fetch('http://localhost:5000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.errors.length > 0) {
        setError(data.errors.join('\n'));
        setOutput('');
      } else {
        setOutput(data.output);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch from backend: ' + err.message);
      setOutput('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple ABAP Editor</h1>
      <textarea
        value={code}
        onChange={onChange}
        rows={10}
        cols={50}
        placeholder="Type your ABAP code here..."
      />
      <br />
      <button onClick={runCode}>Run</button>

      {error && (
        <>
          <h3 style={{ color: 'red' }}>Errors:</h3>
          <pre>{error}</pre>
        </>
      )}

      <h3>Output:</h3>
      <pre>{output}</pre>
    </div>
  );
}

export default App;
