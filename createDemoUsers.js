const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typenova');
    console.log('Connected to MongoDB.');

    // Delete existing demo users to start fresh
    await User.deleteMany({
      email: { $in: ['demouser1@typenova.com', 'demouser2@typenova.com'] }
    });
    console.log('Cleared any existing demo users.');

    const demoUsers = [
      {
        username: 'demouser1',
        email: 'demouser1@typenova.com',
        password: 'password123',
        level: 'intermediate',
        bestWpm: 75,
        streak: 3
      },
      {
        username: 'demouser2',
        email: 'demouser2@typenova.com',
        password: 'password123',
        level: 'intermediate',
        bestWpm: 82,
        streak: 2
      }
    ];

    for (const u of demoUsers) {
      const user = new User(u);
      await user.save();
      console.log(`Created user: ${user.username} (Email: ${user.email}, Password: password123)`);
    }

    mongoose.disconnect();
    console.log('Seeding completed. Disconnected from MongoDB.');
  } catch (err) {
    console.error('Error creating demo users:', err);
    process.exit(1);
  }
};

main();
