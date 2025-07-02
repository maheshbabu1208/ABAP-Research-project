import React, { useState } from 'react';

const EditorPanel = ({ onRun }) => {
  const [code, setCode] = useState('');

  const handleRun = () => {
    onRun(code);
  };

  return (
    <div>
      <textarea
        rows="10"
        cols="80"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter ABAP code here..."
      ></textarea>
      <br />
      <button onClick={handleRun}>Run Code</button>
    </div>
  );
};

export default EditorPanel;
