import React from 'react';

const OutputPanel = ({ errors, output }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      {errors.length > 0 ? (
        <div>
          <h3>Syntax Errors:</h3>
          <pre>{errors.join('\n')}</pre>
        </div>
      ) : (
        <div>
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
