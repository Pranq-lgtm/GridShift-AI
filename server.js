// GridShift-AI Root Server Entry Point
// Forwards execution to backend/server.js
const path = require('path');
process.chdir(path.join(__dirname, 'backend'));
require('./backend/server.js');
