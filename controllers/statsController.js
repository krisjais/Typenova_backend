const User = require('../models/User');

exports.saveStats = async (req, res) => {
  try {
    const { wpm, accuracy, errors, mode, duration, weakKeys } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add stat entry
    user.stats.push({ wpm, accuracy, errors, mode, duration });

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

    await user.save();
    res.json({ message: 'Stats saved', streak: user.streak, bestWpm: user.bestWpm });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('stats weakKeys bestWpm streak');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
