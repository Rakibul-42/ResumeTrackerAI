const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '..', '.env')});
const {loadConfig} = require('../src/config');
try {
  loadConfig();
  console.log('Environment format is valid. Database connectivity and Gemini credentials still require live verification.');
} catch (error) {
  console.error(error.message);
  console.error('Use Server/.env.example as the template; no existing values have been changed.');
  process.exitCode = 1;
}
