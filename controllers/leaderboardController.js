const mongoose = require('mongoose');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const { category, timeFilter, friendsOnly } = req.query;

    // Build match query for users
    let userMatch = { bestWpm: { $gt: 0 } };

    if (friendsOnly === 'true' && req.userId) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      userMatch._id = { $in: [user._id, ...user.friends] };
    }

    // Default global all-time query
    if (!category && (!timeFilter || timeFilter === 'all')) {
      const users = await User.find(userMatch)
        .select('username bestWpm streak stats')
        .sort({ bestWpm: -1 })
        .limit(50);

      const leaderboard = users.map((u) => {
        const tests = u.stats ? u.stats.filter((s) => s.mode === 'test') : [];
        const totalTests = tests.length;
        const avgAccuracy = totalTests > 0
          ? Math.round(tests.reduce((acc, s) => acc + s.accuracy, 0) / totalTests)
          : 0;

        return {
          _id: u._id,
          username: u.username,
          bestWpm: u.bestWpm,
          streak: u.streak,
          accuracy: avgAccuracy,
          totalTests
        };
      });

      let personalRank = -1;
      if (req.userId) {
        const currentUser = await User.findById(req.userId);
        if (currentUser) {
          const userCount = await User.countDocuments({
            bestWpm: { $gt: currentUser.bestWpm },
            ...(friendsOnly === 'true' ? { _id: { $in: [currentUser._id, ...currentUser.friends] } } : {})
          });
          personalRank = userCount + 1;
        }
      }

      return res.json({ leaderboard, personalRank });
    }

    // Advanced category & time-filtered aggregation
    const dateLimit = new Date();
    if (timeFilter === 'weekly') {
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (timeFilter === 'monthly') {
      dateLimit.setDate(dateLimit.getDate() - 30);
    }

    const pipeline = [
      { $match: friendsOnly === 'true' ? userMatch : {} },
      { $unwind: '$stats' },
      {
        $match: {
          'stats.mode': 'test',
          ...(category ? { 'stats.category': category } : {}),
          ...(timeFilter && timeFilter !== 'all' ? { 'stats.date': { $gte: dateLimit } } : {})
        }
      },
      {
        $group: {
          _id: '$_id',
          username: { $first: '$username' },
          streak: { $first: '$streak' },
          bestWpm: { $max: '$stats.wpm' },
          totalWpm: { $sum: '$stats.wpm' },
          totalAccuracy: { $sum: '$stats.accuracy' },
          totalTests: { $sum: 1 }
        }
      },
      {
        $project: {
          username: 1,
          streak: 1,
          bestWpm: 1,
          totalTests: 1,
          accuracy: { $round: [{ $divide: ['$totalAccuracy', '$totalTests'] }, 0] }
        }
      },
      { $sort: { bestWpm: -1 } },
      { $limit: 50 }
    ];

    const leaderboard = await User.aggregate(pipeline);

    let personalRank = -1;
    if (req.userId) {
      const userIndex = leaderboard.findIndex((u) => u._id.toString() === req.userId.toString());
      if (userIndex !== -1) {
        personalRank = userIndex + 1;
      } else {
        const rankPipeline = [
          ...pipeline.slice(0, -1), // remove limit
          { $match: { _id: new mongoose.Types.ObjectId(req.userId) } }
        ];
        const userAgg = await User.aggregate(rankPipeline);
        if (userAgg.length > 0) {
          const userBestWpm = userAgg[0].bestWpm;
          const countPipeline = [
            ...pipeline.slice(0, -2), // remove limit and sort
            { $match: { bestWpm: { $gt: userBestWpm } } },
            { $count: 'count' }
          ];
          const countRes = await User.aggregate(countPipeline);
          personalRank = countRes.length > 0 ? countRes[0].count + 1 : 1;
        }
      }
    }

    res.json({ leaderboard, personalRank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
