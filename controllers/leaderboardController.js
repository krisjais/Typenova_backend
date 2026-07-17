const mongoose = require('mongoose');
const User = require('../models/User');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const GAME_MODES = require('../config/modes');

// Helper to build stats match query uniformly
const getStatsMatchQuery = (leaderboardType, category, timeFilter) => {
  let statsMatch = { 'stats.isFlagged': { $ne: true } };

  if (leaderboardType === 'legacy') {
    statsMatch['stats.season'] = 0;
    statsMatch['stats.category'] = 'COMPETITIVE';
  } else {
    statsMatch['stats.season'] = GAME_MODES.CURRENT_SEASON;
    statsMatch['stats.verified'] = true;
    statsMatch['stats.legacy'] = false;

    if (leaderboardType === 'global') {
      const eligibleSubtypes = Object.keys(GAME_MODES).filter(key => GAME_MODES[key].leaderboard);
      statsMatch['stats.subtype'] = { $in: eligibleSubtypes };
    } else if (leaderboardType === 'practice') {
      statsMatch['stats.subtype'] = { $in: ['practice', 'custom'] };
    } else {
      statsMatch['stats.subtype'] = leaderboardType;
    }
  }

  if (category && category !== 'All') {
    statsMatch['stats.category'] = category;
  }

  if (timeFilter) {
    const dateLimit = new Date();
    if (timeFilter === 'daily') {
      dateLimit.setDate(dateLimit.getDate() - 1);
      statsMatch['stats.date'] = { $gte: dateLimit };
    } else if (timeFilter === 'weekly') {
      dateLimit.setDate(dateLimit.getDate() - 7);
      statsMatch['stats.date'] = { $gte: dateLimit };
    } else if (timeFilter === 'monthly') {
      dateLimit.setDate(dateLimit.getDate() - 30);
      statsMatch['stats.date'] = { $gte: dateLimit };
    }
  }

  return statsMatch;
};

// Rebuilds and returns the leaderboard standings for a type and timeFilter
const rebuildLeaderboard = async (type, timeFilter, friendsOnlyUser = null) => {
  let userMatch = {};
  if (friendsOnlyUser) {
    userMatch._id = { $in: [friendsOnlyUser._id, ...friendsOnlyUser.friends] };
  }

  const statsMatch = getStatsMatchQuery(type, null, timeFilter);

  const pipeline = [
    { $match: userMatch },
    { $unwind: '$stats' },
    { $match: statsMatch },
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

  return User.aggregate(pipeline);
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { category, timeFilter = 'all', friendsOnly, leaderboardType = 'global' } = req.query;

    let currentUser = null;
    if (req.userId) {
      currentUser = await User.findById(req.userId);
    }

    let standings = [];

    // For Friends Only or Legacy Leaderboard, we query dynamically
    if ((friendsOnly === 'true' && currentUser) || leaderboardType === 'legacy') {
      standings = await rebuildLeaderboard(leaderboardType, timeFilter, friendsOnly === 'true' ? currentUser : null);
    } else {
      // Check cache snapshot
      let snapshot = await LeaderboardSnapshot.findOne({ type: leaderboardType, timeFilter });

      const CACHE_LIFETIME_MS = 5 * 60 * 1000;
      if (snapshot && (Date.now() - new Date(snapshot.updatedAt).getTime() < CACHE_LIFETIME_MS)) {
        standings = snapshot.standings;
      } else {
        standings = await rebuildLeaderboard(leaderboardType, timeFilter);
        
        await LeaderboardSnapshot.findOneAndUpdate(
          { type: leaderboardType, timeFilter },
          { standings, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }

    // Apply category filter dynamically if requested
    if (category && category !== 'All') {
      let userMatch = {};
      if (friendsOnly === 'true' && currentUser) {
        userMatch._id = { $in: [currentUser._id, ...currentUser.friends] };
      }
      const statsMatch = getStatsMatchQuery(leaderboardType, category, timeFilter);

      const pipeline = [
        { $match: userMatch },
        { $unwind: '$stats' },
        { $match: statsMatch },
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
      standings = await User.aggregate(pipeline);
    }

    // Determine personal rank
    let personalRank = -1;
    if (currentUser) {
      const userIndex = standings.findIndex((u) => u._id.toString() === currentUser._id.toString());
      if (userIndex !== -1) {
        personalRank = userIndex + 1;
      } else {
        const statsMatch = getStatsMatchQuery(leaderboardType, category, timeFilter);

        const userAgg = await User.aggregate([
          { $match: { _id: currentUser._id } },
          { $unwind: '$stats' },
          { $match: statsMatch },
          {
            $group: {
              _id: '$_id',
              bestWpm: { $max: '$stats.wpm' }
            }
          }
        ]);

        if (userAgg.length > 0) {
          const userBestWpm = userAgg[0].bestWpm;
          
          let userMatch = {};
          if (friendsOnly === 'true') {
            userMatch._id = { $in: [currentUser._id, ...currentUser.friends] };
          }

          const countRes = await User.aggregate([
            { $match: userMatch },
            { $unwind: '$stats' },
            { $match: statsMatch },
            {
              $group: {
                _id: '$_id',
                bestWpm: { $max: '$stats.wpm' }
              }
            },
            { $match: { bestWpm: { $gt: userBestWpm } } },
            { $count: 'count' }
          ]);
          personalRank = countRes.length > 0 ? countRes[0].count + 1 : 1;
        }
      }
    }

    res.json({ leaderboard: standings, personalRank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
