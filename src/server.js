import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`SoulSync API server is running on port ${PORT}`);
});
