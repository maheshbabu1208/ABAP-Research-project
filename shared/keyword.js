// ABAP keywords for basic syntax check
const ABAP_KEYWORDS = [
  'DATA',
  'WRITE',
  'IF',
  'ENDIF',
  'LOOP',
  'ENDLOOP',
  'CASE',
  'ENDCASE',
  'WHEN',
  'ELSE',
  'TYPE',
  'BEGIN',
  'END',
  'CLEAR',
  'MOVE'
];

// Helper: check if a word is an ABAP keyword
function isKeyword(word) {
  return ABAP_KEYWORDS.includes(word.toUpperCase());
}

// Helper: check if code ends with period (.)
function endsWithPeriod(line) {
  return line.trim().endsWith('.');
}

module.exports = {
  ABAP_KEYWORDS,
  isKeyword,
  endsWithPeriod
};
