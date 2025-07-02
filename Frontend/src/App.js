import React, { useState } from 'react';
import EditorPanel from './EditorPanel';
import OutputPanel from './OutputPanel';

const App = () => {
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState([]);

  const runCode = async (code) => {
    const res = await fetch('http://localhost:5000/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    setErrors(data.errors);
    setOutput(data.output);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>ABAP Simulator</h1>
      <EditorPanel onRun={runCode} />
      <OutputPanel errors={errors} output={output} />
    </div>
  );
};

export default App;
