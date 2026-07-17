const mongoose = require('mongoose');
const User = require('../models/User');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const GAME_MODES = require('../config/modes');

// Rebuilds and returns the leaderboard standings for a type and timeFilter
const rebuildLeaderboard = async (type, timeFilter, friendsOnlyUser = null) => {
  // Build match query for users
  let userMatch = {};
  if (friendsOnlyUser) {
    userMatch._id = { $in: [friendsOnlyUser._id, ...friendsOnlyUser.friends] };
  }

  // Determine the matching stats filter
  let statsMatch = { 'stats.isFlagged': { $ne: true } };

  if (type === 'global') {
    // Competitive modes only
    const eligibleSubtypes = Object.keys(GAME_MODES).filter(key => GAME_MODES[key].leaderboard);
    statsMatch['stats.subtype'] = { $in: eligibleSubtypes };
  } else if (type === 'practice') {
    // Practice modes only
    statsMatch['stats.subtype'] = { $in: ['practice', 'custom'] };
  } else {
    // Strict games/modes filter
    statsMatch['stats.subtype'] = type;
  }

  // Time filters
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

    // For Friends Only, we always query dynamically because it's user-specific and can't be globally cached
    if (friendsOnly === 'true' && currentUser) {
      standings = await rebuildLeaderboard(leaderboardType, timeFilter, currentUser);
    } else {
      // Check cache snapshot
      let snapshot = await LeaderboardSnapshot.findOne({ type: leaderboardType, timeFilter });

      // If cache exists and is fresh (younger than 5 minutes), use it
      const CACHE_LIFETIME_MS = 5 * 60 * 1000;
      if (snapshot && (Date.now() - new Date(snapshot.updatedAt).getTime() < CACHE_LIFETIME_MS)) {
        standings = snapshot.standings;
      } else {
        // Rebuild and update cache
        standings = await rebuildLeaderboard(leaderboardType, timeFilter);
        
        await LeaderboardSnapshot.findOneAndUpdate(
          { type: leaderboardType, timeFilter },
          { standings, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }

    // Apply category filter in-memory if requested (since snapshots contain all categories combined)
    // In practice, snapshots pre-aggregate by user best, so category filters are less common on snapshots
    // but if the category is requested, we can filter/rebuild dynamically or filter in-memory.
    // Let's support dynamic category querying if a specific category is requested:
    if (category && category !== 'All') {
      // Dynamic rebuild for category
      standings = standings.filter(s => s.category === category); // note: standings projection does not have category, so if category is requested we rebuild dynamically
      // To ensure correct sorting/filtering by category, do dynamic rebuild:
      let userMatch = {};
      if (friendsOnly === 'true' && currentUser) {
        userMatch._id = { $in: [currentUser._id, ...currentUser.friends] };
      }
      let statsMatch = { 'stats.isFlagged': { $ne: true }, 'stats.category': category };
      if (leaderboardType === 'global') {
        const eligibleSubtypes = Object.keys(GAME_MODES).filter(key => GAME_MODES[key].leaderboard);
        statsMatch['stats.subtype'] = { $in: eligibleSubtypes };
      } else if (leaderboardType === 'practice') {
        statsMatch['stats.subtype'] = { $in: ['practice', 'custom'] };
      } else {
        statsMatch['stats.subtype'] = leaderboardType;
      }

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
        // Calculate personal rank dynamically
        // Find user's bestWpm in current filter criteria
        let statsMatch = { 'stats.isFlagged': { $ne: true } };
        if (category && category !== 'All') statsMatch['stats.category'] = category;
        
        if (leaderboardType === 'global') {
          const eligibleSubtypes = Object.keys(GAME_MODES).filter(key => GAME_MODES[key].leaderboard);
          statsMatch['stats.subtype'] = { $in: eligibleSubtypes };
        } else if (leaderboardType === 'practice') {
          statsMatch['stats.subtype'] = { $in: ['practice', 'custom'] };
        } else {
          statsMatch['stats.subtype'] = leaderboardType;
        }

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
