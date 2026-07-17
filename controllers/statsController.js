const User = require('../models/User');
const OfficialText = require('../models/OfficialText');
const CustomText = require('../models/CustomText');
const PendingSession = require('../models/PendingSession');
const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const GAME_MODES = require('../config/modes');
const ANTI_CHEAT = require('../config/antiCheat');
const crypto = require('crypto');

// Anti-Cheat Checker
const checkAntiCheat = (pendingSession, wpm, accuracy, duration, text, errors) => {
  // 1. Check WPM limit
  if (wpm > ANTI_CHEAT.MAX_WPM) return 'WPM_LIMIT_EXCEEDED';

  // 2. Check Accuracy limit
  if (accuracy > ANTI_CHEAT.MAX_ACCURACY) return 'MAX_ACCURACY_EXCEEDED';

  // 3. Check Minimum duration
  if (duration < ANTI_CHEAT.MIN_DURATION) return 'MIN_DURATION_NOT_MET';

  // 4. Mismatched text validation (if hash exists)
  if (pendingSession.textHash) {
    if (!text) return 'TEXT_MISSING_FOR_HASH_VERIFICATION';
    const submittedHash = crypto.createHash('sha256').update(text).digest('hex');
    if (submittedHash !== pendingSession.textHash) return 'TEXT_HASH_MISMATCH';

    // 5. Compare WPM with calculated words per minute drift
    const correctChars = text.length - (errors || 0);
    const expectedWpm = Math.round((correctChars / 5) / (duration / 60));
    if (Math.abs(wpm - expectedWpm) > ANTI_CHEAT.WPM_DRIFT_THRESHOLD) return 'WPM_DRIFT_LIMIT_EXCEEDED';
  }

  // 6. Check Time elapsed speed-hacking check
  const timeElapsed = (Date.now() - new Date(pendingSession.createdAt).getTime()) / 1000;
  if (timeElapsed < duration * 0.8) return 'SPEED_HACK_ELAPSED_TIME';

  return null;
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
    const antiCheatReason = checkAntiCheat(pendingSession, wpm, accuracy, duration, text, errors);
    const isFlagged = antiCheatReason !== null;

    if (isFlagged) {
      // Log details into AuditLog
      await AuditLog.create({
        user: req.userId,
        sessionId,
        reason: antiCheatReason,
        details: { wpm, accuracy, errors, duration, textLength: text ? text.length : 0 },
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const modeConfig = GAME_MODES[pendingSession.subtype] || GAME_MODES.custom;
    const isVerified = !isFlagged;

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
      verified: isVerified,
      legacy: false,
      season: GAME_MODES.CURRENT_SEASON,
      date: new Date()
    };
    user.stats.push(newStat);
    const savedStat = user.stats[user.stats.length - 1];

    // Personal best checks (Verified competitive in CURRENT_SEASON only)
    if (modeConfig.personalBest === true && isVerified && wpm > user.bestWpm) {
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

    // Achievements Checking (Verified competitive in CURRENT_SEASON only)
    const newAchievementsUnlocked = [];
    if (modeConfig.achievements === true && isVerified) {
      const currentAchievements = user.achievements.map(a => a.name);

      if (wpm >= 100 && !currentAchievements.includes('Speed Demon')) {
        user.achievements.push({ name: 'Speed Demon', legacy: false });
        newAchievementsUnlocked.push('Speed Demon');
      }

      if (accuracy >= 99 && !currentAchievements.includes('Perfect Form')) {
        user.achievements.push({ name: 'Perfect Form', legacy: false });
        newAchievementsUnlocked.push('Perfect Form');
      }

      const competitiveCount = user.stats.filter(s => s.category === 'COMPETITIVE' && s.verified && !s.legacy && s.season === GAME_MODES.CURRENT_SEASON && !s.isFlagged).length;
      if (competitiveCount >= 100 && !currentAchievements.includes('Consistent')) {
        user.achievements.push({ name: 'Consistent', legacy: false });
        newAchievementsUnlocked.push('Consistent');
      }

      if (user.streak >= 5 && !currentAchievements.includes('Speedster Streak')) {
        user.achievements.push({ name: 'Speedster Streak', legacy: false });
        newAchievementsUnlocked.push('Speedster Streak');
      }
    }

    await user.save();

    // Log Activity for competitive test completions
    if (modeConfig.category === 'COMPETITIVE' && isVerified) {
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

    // First verified competitive score celebration trigger
    const verifiedCompSessions = user.stats.filter(s => 
      s.category === 'COMPETITIVE' && 
      s.verified && 
      !s.legacy && 
      s.season === GAME_MODES.CURRENT_SEASON && 
      !s.isFlagged
    );

    let firstVerified = false;
    let rank = -1;

    if (modeConfig.category === 'COMPETITIVE' && isVerified && verifiedCompSessions.length === 1) {
      firstVerified = true;
      // Calculate current rank dynamically
      const countRes = await User.aggregate([
        { $unwind: '$stats' },
        { 
          $match: { 
            'stats.category': 'COMPETITIVE',
            'stats.verified': true,
            'stats.legacy': false,
            'stats.season': GAME_MODES.CURRENT_SEASON,
            'stats.isFlagged': { $ne: true }
          }
        },
        {
          $group: {
            _id: '$_id',
            bestWpm: { $max: '$stats.wpm' }
          }
        },
        { $match: { bestWpm: { $gt: wpm } } },
        { $count: 'count' }
      ]);
      rank = countRes.length > 0 ? countRes[0].count + 1 : 1;
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
      isFlagged,
      firstVerified,
      rank,
      wpm,
      accuracy
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('stats weakKeys bestWpm streak achievements raceWins raceLosses xp');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Official rank among verified competitive users in current season
    let officialRank = '-';
    const compStats = user.stats.filter(s => 
      s.category === 'COMPETITIVE' && 
      s.verified && 
      !s.legacy && 
      s.season === GAME_MODES.CURRENT_SEASON && 
      !s.isFlagged
    );

    if (compStats.length > 0) {
      const bestCompWpm = Math.max(...compStats.map(s => s.wpm));
      
      const rankPipeline = [
        { $unwind: '$stats' },
        {
          $match: {
            'stats.category': 'COMPETITIVE',
            'stats.verified': true,
            'stats.legacy': false,
            'stats.season': GAME_MODES.CURRENT_SEASON,
            'stats.isFlagged': { $ne: true }
          }
        },
        {
          $group: {
            _id: '$_id',
            bestWpm: { $max: '$stats.wpm' }
          }
        },
        { $match: { bestWpm: { $gt: bestCompWpm } } },
        { $count: 'count' }
      ];
      
      const countRes = await User.aggregate(rankPipeline);
      officialRank = countRes.length > 0 ? countRes[0].count + 1 : 1;
    }

    // Filter sessions
    const competitiveStats = user.stats.filter(s => s.category === 'COMPETITIVE' && s.verified && !s.legacy && s.season === GAME_MODES.CURRENT_SEASON && !s.isFlagged);
    const practiceStats = user.stats.filter(s => s.category === 'PRACTICE' && !s.isFlagged);

    const bestOfficialWpm = competitiveStats.length ? Math.max(...competitiveStats.map(s => s.wpm)) : 0;
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

    // Career Overall Calculations (Including all non-flagged stats, legacy competitive, practice, etc.)
    let totalCareerWords = 0;
    let totalCareerChars = 0;
    let totalCareerTime = 0;

    user.stats.forEach(s => {
      if (!s.isFlagged) {
        totalCareerTime += (s.duration || 0);
        const words = Math.round(s.wpm * ((s.duration || 0) / 60));
        totalCareerWords += words;
        totalCareerChars += words * 5;
      }
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
      },
      career: {
        totalWords: totalCareerWords,
        totalChars: totalCareerChars,
        totalTime: totalCareerTime,
        totalSessions: user.stats.filter(s => !s.isFlagged).length
      }
    };

    res.json({
      stats: user.stats,
      weakKeys: user.weakKeys,
      bestWpm: bestOfficialWpm, // Return verified best WPM
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
