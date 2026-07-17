const User = require('../models/User');
const OfficialText = require('../models/OfficialText');
const CustomText = require('../models/CustomText');
const PendingSession = require('../models/PendingSession');
const Activity = require('../models/Activity');
const GAME_MODES = require('../config/modes');
const ANTI_CHEAT = require('../config/antiCheat');
const crypto = require('crypto');

// Anti-Cheat Checker
const checkAntiCheat = (pendingSession, wpm, accuracy, duration, text, errors) => {
  // 1. Check WPM limit
  if (wpm > ANTI_CHEAT.MAX_WPM) return true;

  // 2. Check Accuracy limit
  if (accuracy > ANTI_CHEAT.MAX_ACCURACY) return true;

  // 3. Check Minimum duration
  if (duration < ANTI_CHEAT.MIN_DURATION) return true;

  // 4. Mismatched text validation (if hash exists)
  if (pendingSession.textHash) {
    if (!text) return true; // text must be submitted to verify hash
    const submittedHash = crypto.createHash('sha256').update(text).digest('hex');
    if (submittedHash !== pendingSession.textHash) return true;

    // 5. Compare WPM with calculated words per minute drift
    const correctChars = text.length - (errors || 0);
    const expectedWpm = Math.round((correctChars / 5) / (duration / 60));
    if (Math.abs(wpm - expectedWpm) > ANTI_CHEAT.WPM_DRIFT_THRESHOLD) return true;
  }

  // 6. Check Time elapsed speed-hacking check
  const timeElapsed = (Date.now() - new Date(pendingSession.createdAt).getTime()) / 1000;
  if (timeElapsed < duration * 0.8) return true;

  return false;
};

exports.startStatsSession = async (req, res) => {
  try {
    const { subtype, category, difficulty, language, textId } = req.body;

    if (!GAME_MODES[subtype]) {
      return res.status(400).json({ message: 'Invalid game mode / subtype' });
    }

    let textContent = '';
    let resolvedTestId = null;

    // Resolve text based on subtype
    if (subtype === 'official' || subtype === 'daily' || subtype === 'weekly') {
      let query = { language: language || 'English' };
      if (category && category !== 'All') query.category = category;
      if (difficulty && difficulty !== 'All') query.difficulty = difficulty;

      let officialText = null;
      if (textId) {
        officialText = await OfficialText.findOne({ _id: textId });
      } else {
        const count = await OfficialText.countDocuments(query);
        if (count > 0) {
          const randomIdx = Math.floor(Math.random() * count);
          officialText = await OfficialText.findOne(query).skip(randomIdx);
        }
      }

      if (officialText) {
        textContent = officialText.content;
        resolvedTestId = officialText._id.toString();
      } else {
        // Fallback random generation
        const pool = ['the', 'that', 'this', 'there', 'these', 'those', 'then', 'than', 'she', 'her', 'here', 'see', 'seen', 'are', 'art', 'area', 'one', 'on', 'our', 'in', 'is', 'it', 'not', 'no', 'to', 'too', 'ten', 'test', 'rest', 'rent', 'let', 'lane', 'learn'];
        textContent = Array.from({ length: 25 }, () => pool[Math.floor(Math.random() * pool.length)]).join(' ');
      }
    } else if (subtype === 'custom') {
      if (!textId) {
        return res.status(400).json({ message: 'Custom text ID required' });
      }
      const customText = await CustomText.findOne({ _id: textId, user: req.userId });
      if (!customText) {
        return res.status(404).json({ message: 'Custom text not found or unauthorized' });
      }
      textContent = customText.content;
      resolvedTestId = customText._id.toString();
    } else if (subtype === 'practice') {
      const count = await OfficialText.countDocuments();
      if (count > 0) {
        const randomIdx = Math.floor(Math.random() * count);
        const officialText = await OfficialText.findOne().skip(randomIdx);
        textContent = officialText.content;
        resolvedTestId = officialText._id.toString();
      } else {
        textContent = 'the quick brown fox jumps over the lazy dog';
      }
    } else if (req.body.text) {
      // Dynamic games passing customized text (e.g. Type Racer)
      textContent = req.body.text;
    }

    const sessionId = crypto.randomUUID();
    const textHash = textContent
      ? crypto.createHash('sha256').update(textContent).digest('hex')
      : '';

    await PendingSession.create({
      sessionId,
      user: req.userId,
      testId: resolvedTestId,
      textHash,
      subtype,
      status: 'PENDING'
    });

    res.json({
      sessionId,
      text: textContent,
      testId: resolvedTestId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveStats = async (req, res) => {
  try {
    const { sessionId, wpm, accuracy, errors, duration, weakKeys, consistency, text } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Atomic session state check
    const pendingSession = await PendingSession.findOneAndUpdate(
      { sessionId, user: req.userId, status: 'PENDING' },
      { status: 'COMPLETED' },
      { new: true }
    );

    if (!pendingSession) {
      return res.status(400).json({ message: 'Invalid or already completed session' });
    }

    // Validate anti-cheat
    const isFlagged = checkAntiCheat(pendingSession, wpm, accuracy, duration, text, errors);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const modeConfig = GAME_MODES[pendingSession.subtype] || GAME_MODES.custom;

    // Save stats
    const newStat = {
      wpm,
      accuracy,
      errors,
      duration,
      category: modeConfig.category,
      subtype: pendingSession.subtype,
      textId: pendingSession.testId || null,
      consistency: consistency || null,
      isFlagged,
      date: new Date()
    };
    user.stats.push(newStat);
    const savedStat = user.stats[user.stats.length - 1];

    // Personal best checks
    if (modeConfig.personalBest === true && !isFlagged && wpm > user.bestWpm) {
      user.bestWpm = wpm;
    }

    // XP calculation with multipliers
    let xpEarned = modeConfig.xp || 0;
    if (xpEarned > 0 && modeConfig.multiplier) {
      const today = new Date();
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      const mult = isWeekend ? (modeConfig.multiplier.weekend || 1) : (modeConfig.multiplier.daily || 1);
      xpEarned = Math.round(xpEarned * mult);
    }
    user.xp = (user.xp || 0) + xpEarned;

    // Streak tracker
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

    // Weak Keys drill down
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
    if (modeConfig.achievements === true && !isFlagged) {
      const currentAchievements = user.achievements.map(a => a.name);

      if (wpm >= 100 && !currentAchievements.includes('Speed Demon')) {
        user.achievements.push({ name: 'Speed Demon' });
        newAchievementsUnlocked.push('Speed Demon');
      }

      if (accuracy >= 99 && !currentAchievements.includes('Perfect Form')) {
        user.achievements.push({ name: 'Perfect Form' });
        newAchievementsUnlocked.push('Perfect Form');
      }

      const competitiveCount = user.stats.filter(s => s.category === 'COMPETITIVE' && !s.isFlagged).length;
      if (competitiveCount >= 100 && !currentAchievements.includes('Consistent')) {
        user.achievements.push({ name: 'Consistent' });
        newAchievementsUnlocked.push('Consistent');
      }

      if (user.streak >= 5 && !currentAchievements.includes('Speedster Streak')) {
        user.achievements.push({ name: 'Speedster Streak' });
        newAchievementsUnlocked.push('Speedster Streak');
      }
    }

    await user.save();

    // Log Activity for competitive test completions
    if (modeConfig.category === 'COMPETITIVE' && !isFlagged) {
      await Activity.create({
        user: req.userId,
        username: user.username,
        type: 'test_completed',
        details: {
          wpm,
          accuracy,
          statId: savedStat._id
        }
      });
    }

    for (const achName of newAchievementsUnlocked) {
      await Activity.create({
        user: req.userId,
        username: user.username,
        type: 'achievement_unlocked',
        details: { achievementName: achName }
      });
    }

    // Session cleanup
    await PendingSession.deleteOne({ sessionId });

    res.json({
      message: isFlagged ? 'Stats saved (Flagged by anti-cheat)' : 'Stats saved',
      streak: user.streak,
      bestWpm: user.bestWpm,
      xpEarned,
      totalXp: user.xp,
      newAchievements: newAchievementsUnlocked,
      statId: savedStat._id,
      isFlagged
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('stats weakKeys bestWpm streak achievements raceWins raceLosses xp');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const officialRank = await User.countDocuments({ bestWpm: { $gt: user.bestWpm } }) + 1;

    const competitiveStats = user.stats.filter(s => s.category === 'COMPETITIVE' && !s.isFlagged);
    const practiceStats = user.stats.filter(s => s.category === 'PRACTICE' && !s.isFlagged);

    const bestOfficialWpm = competitiveStats.length ? Math.max(...competitiveStats.map(s => s.wpm)) : user.bestWpm;
    const avgOfficialAcc = competitiveStats.length
      ? Math.round(competitiveStats.reduce((acc, s) => acc + s.accuracy, 0) / competitiveStats.length)
      : 0;
    const officialSessions = competitiveStats.length;

    const practiceSessions = practiceStats.length;
    const avgPracticeWpm = practiceStats.length
      ? Math.round(practiceStats.reduce((acc, s) => acc + s.wpm, 0) / practiceStats.length)
      : 0;
    const avgPracticeAcc = practiceStats.length
      ? Math.round(practiceStats.reduce((acc, s) => acc + s.accuracy, 0) / practiceStats.length)
      : 0;

    let totalPracticeWords = 0;
    let totalPracticeChars = 0;
    let totalPracticeTime = 0;

    practiceStats.forEach(s => {
      totalPracticeTime += (s.duration || 0);
      const words = Math.round(s.wpm * ((s.duration || 0) / 60));
      totalPracticeWords += words;
      totalPracticeChars += words * 5;
    });

    const summary = {
      official: {
        bestWpm: bestOfficialWpm,
        accuracy: avgOfficialAcc,
        sessions: officialSessions,
        rank: officialRank
      },
      practice: {
        sessions: practiceSessions,
        avgWpm: avgPracticeWpm,
        accuracy: avgPracticeAcc,
        totalWords: totalPracticeWords,
        totalChars: totalPracticeChars,
        totalTime: totalPracticeTime
      }
    };

    res.json({
      stats: user.stats,
      weakKeys: user.weakKeys,
      bestWpm: user.bestWpm,
      streak: user.streak,
      achievements: user.achievements,
      raceWins: user.raceWins,
      raceLosses: user.raceLosses,
      xp: user.xp || 0,
      summary
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
