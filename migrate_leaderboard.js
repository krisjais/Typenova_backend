const mongoose = require('mongoose');
const User = require('./models/User');
const Migration = require('./models/Migration');
const connectDB = require('./config/db');
require('dotenv').config();

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to MongoDB.');

    const lockName = 'leaderboard_migration_v2';
    
    // Check if --force reset flag is passed
    const forceReset = process.argv.includes('--force');
    if (forceReset) {
      console.log('Force reset flag detected. Removing migration lock...');
      await Migration.deleteOne({ name: lockName });
    }

    // 1. Double run lock check
    const existingMigration = await Migration.findOne({ name: lockName });
    if (existingMigration) {
      console.log('\n[INFO] Leaderboard migration has already been executed successfully.');
      console.log('Refusing to run twice. Exiting.');
      process.exit(0);
    }

    console.log('Fetching all users...');
    const users = await User.find();
    console.log(`Found ${users.length} users to migrate.`);

    let usersUpdated = 0;
    let competitiveSessionsArchived = 0;
    let achievementsFlaggedLegacy = 0;
    let bestWpmResetCount = 0;
    let errorsCount = 0;

    for (const user of users) {
      try {
        let userModified = false;

        // Clean up and migrate legacy stats to conform to new validation rules
        user.stats.forEach(stat => {
          // If subtype is missing, assign the old category (e.g., 'English') as subtype, or default to 'official'
          if (!stat.subtype) {
            stat.subtype = stat.category || 'official';
          }
          
          // Force category to be either COMPETITIVE or PRACTICE
          const sub = stat.subtype.toLowerCase();
          if (sub === 'practice' || sub === 'custom') {
            stat.category = 'PRACTICE';
          } else {
            stat.category = 'COMPETITIVE';
          }

          // Archive competitive stats (Season 0)
          if (stat.category === 'COMPETITIVE' && !stat.legacy) {
            stat.legacy = true;
            stat.verified = false;
            stat.season = 0;
            competitiveSessionsArchived++;
            userModified = true;
          }
        });

        // Set legacy = true for all legacy achievements
        user.achievements.forEach(ach => {
          if (!ach.legacy) {
            ach.legacy = true;
            achievementsFlaggedLegacy++;
            userModified = true;
          }
        });

        // Reset competitive Best WPM
        if (user.bestWpm !== 0) {
          user.bestWpm = 0;
          bestWpmResetCount++;
          userModified = true;
        }

        if (userModified) {
          // Mark paths as modified to ensure Mongoose updates them
          user.markModified('stats');
          user.markModified('achievements');
          await user.save();
          usersUpdated++;
        }
      } catch (userErr) {
        console.error(`Error migrating user ${user.username}:`, userErr.message);
        errorsCount++;
      }
    }

    // 2. Lock migration (only if no errors)
    if (errorsCount === 0) {
      await Migration.create({ name: lockName });
    }

    // 3. Print formatting Audit Report
    console.log('\n======================================');
    console.log('         MIGRATION COMPLETE           ');
    console.log('======================================');
    console.log(`Users Updated:                 ${usersUpdated}`);
    console.log(`Competitive Sessions Archived:  ${competitiveSessionsArchived}`);
    console.log(`Achievements Flagged as Legacy: ${achievementsFlaggedLegacy}`);
    console.log(`Best WPM Reset:                 ${bestWpmResetCount}`);
    console.log(`Errors:                         ${errorsCount}`);
    console.log('======================================\n');

    process.exit(errorsCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Migration Error:', err.message);
    process.exit(1);
  }
};

runMigration();
