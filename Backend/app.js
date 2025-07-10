const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/', routes); // ✅ Connects the route

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

