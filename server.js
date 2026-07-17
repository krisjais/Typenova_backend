const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB().then(async () => {
  try {
    const OfficialText = require('./models/OfficialText');
    const seedTexts = require('./config/officialTextsSeed');
    const count = await OfficialText.countDocuments();
    if (count === 0) {
      console.log('Seeding official texts database...');
      
      const computeTextStats = (content) => {
        const words = content.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const specialCharCount = content.replace(/[a-zA-Z0-9\s]/g, '').length;
        const totalCharCountNoSpaces = content.replace(/\s+/g, '').length;
        const avgWordLength = wordCount > 0 ? parseFloat((totalCharCountNoSpaces / wordCount).toFixed(1)) : 0;
        return { wordCount, avgWordLength, specialCharCount };
      };

      const textsToInsert = seedTexts.map(t => {
        const stats = computeTextStats(t.content);
        return {
          title: t.title,
          content: t.content,
          difficulty: t.difficulty,
          category: t.category,
          language: t.language || 'English',
          wordCount: stats.wordCount,
          avgWordLength: stats.avgWordLength,
          specialCharCount: stats.specialCharCount
        };
      });

      await OfficialText.insertMany(textsToInsert);
      console.log('Successfully seeded OfficialText collection!');
    }
  } catch (err) {
    console.error('Error seeding OfficialText database:', err.message);
  }
});

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/theme', require('./routes/theme'));
app.use('/api/level', require('./routes/level'));
app.use('/api/custom-texts', require('./routes/customTexts'));
app.use('/api/language', require('./routes/language'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/share', require('./routes/share'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

// Refactor server startup to support WebSockets (Socket.io)
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

require('./sockets/raceHandler')(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
