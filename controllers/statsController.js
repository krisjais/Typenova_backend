const User = require('../models/User');

exports.saveStats = async (req, res) => {
  try {
    const { wpm, accuracy, errors, mode, duration, weakKeys, category, difficulty, language } = req.body;
    const User = require('../models/User');
    const Activity = require('../models/Activity');
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add stat entry
    const newStat = { 
      wpm, 
      accuracy, 
      errors, 
      mode, 
      duration,
      category: category || 'English',
      difficulty: difficulty || 'Medium',
      language: language || 'English'
    };
    user.stats.push(newStat);
    const savedStat = user.stats[user.stats.length - 1];

    // Update best WPM
    if (wpm > user.bestWpm) user.bestWpm = wpm;

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = (today - last) / (1000 * 60 * 60 * 24);
      if (diff === 1) user.streak += 1;
      else if (diff > 1) user.streak = 1;
    } else {
      user.streak = 1;
    }
    user.lastPracticeDate = new Date();

    // Update weak keys
    if (weakKeys && Array.isArray(weakKeys)) {
      for (const { key, errorCount, totalCount } of weakKeys) {
        const existing = user.weakKeys.find((k) => k.key === key);
        if (existing) {
          existing.errorCount += errorCount;
          existing.totalCount += totalCount;
        } else {
          user.weakKeys.push({ key, errorCount, totalCount });
        }
      }
    }

    // Achievements Checking
    const newAchievementsUnlocked = [];
    const currentAchievements = user.achievements.map(a => a.name);

    // 1. Speed Demon (100+ WPM)
    if (wpm >= 100 && !currentAchievements.includes('Speed Demon')) {
      user.achievements.push({ name: 'Speed Demon' });
      newAchievementsUnlocked.push('Speed Demon');
    }

    // 2. Perfect Form (99%+ accuracy)
    if (accuracy >= 99 && !currentAchievements.includes('Perfect Form')) {
      user.achievements.push({ name: 'Perfect Form' });
      newAchievementsUnlocked.push('Perfect Form');
    }

    // 3. Consistent (100+ tests completed)
    const testCount = user.stats.filter(s => s.mode === 'test').length;
    if (testCount >= 100 && !currentAchievements.includes('Consistent')) {
      user.achievements.push({ name: 'Consistent' });
      newAchievementsUnlocked.push('Consistent');
    }

    // 4. Speedster Streak (5-day streak)
    if (user.streak >= 5 && !currentAchievements.includes('Speedster Streak')) {
      user.achievements.push({ name: 'Speedster Streak' });
      newAchievementsUnlocked.push('Speedster Streak');
    }

    await user.save();

    // Log Activity for test completed
    await Activity.create({
      user: req.userId,
      username: user.username,
      type: 'test_completed',
      details: {
        wpm,
        accuracy,
        category: category || 'English',
        statId: savedStat._id
      }
    });

    // Log Activity for each unlocked achievement
    for (const achName of newAchievementsUnlocked) {
      await Activity.create({
        user: req.userId,
        username: user.username,
        type: 'achievement_unlocked',
        details: { achievementName: achName }
      });
    }

    res.json({ 
      message: 'Stats saved', 
      streak: user.streak, 
      bestWpm: user.bestWpm,
      newAchievements: newAchievementsUnlocked,
      statId: savedStat._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('stats weakKeys bestWpm streak achievements raceWins raceLosses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
