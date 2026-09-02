import './config/env.js';
import app from './app.js';

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`SoulSync API server is running on port ${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
});
