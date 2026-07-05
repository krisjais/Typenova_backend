const User = require('../models/User');
const Activity = require('../models/Activity');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find users by username or email (case-insensitive regex)
    const regex = new RegExp(query, 'i');
    const matches = await User.find({
      _id: { $ne: req.userId, $nin: user.blockedUsers },
      $or: [{ username: regex }, { email: regex }]
    })
      .select('username email bestWpm streak level')
      .limit(10);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { targetId } = req.body;
    if (targetId === req.userId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    const user = await User.findById(req.userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if blocked
    if (user.blockedUsers.includes(targetId) || target.blockedUsers.includes(req.userId)) {
      return res.status(400).json({ message: 'Blocked user interaction' });
    }

    // Check if already friends
    if (user.friends.includes(targetId)) {
      return res.status(400).json({ message: 'You are already friends' });
    }

    // Check if request already sent/received
    if (user.friendRequestsSent.includes(targetId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    user.friendRequestsSent.push(targetId);
    target.friendRequestsReceived.push(req.userId);

    await user.save();
    await target.save();

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { targetId } = req.body;
    const user = await User.findById(req.userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.friendRequestsReceived.includes(targetId)) {
      return res.status(400).json({ message: 'No pending friend request found' });
    }

    // Accept friend request
    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== targetId);
    target.friendRequestsSent = target.friendRequestsSent.filter(id => id.toString() !== req.userId);

    if (!user.friends.includes(targetId)) user.friends.push(targetId);
    if (!target.friends.includes(req.userId)) target.friends.push(req.userId);

    await user.save();
    await target.save();

    // Log activity feed
    await Activity.create({
      user: req.userId,
      username: user.username,
      type: 'friend_added',
      details: { friendId: targetId, friendName: target.username }
    });

    await Activity.create({
      user: targetId,
      username: target.username,
      type: 'friend_added',
      details: { friendId: req.userId, friendName: user.username }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const { targetId } = req.body;
    const user = await User.findById(req.userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== targetId);
    target.friendRequestsSent = target.friendRequestsSent.filter(id => id.toString() !== req.userId);

    await user.save();
    await target.save();

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const { targetId } = req.body;
    const user = await User.findById(req.userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.friendRequestsSent = user.friendRequestsSent.filter(id => id.toString() !== targetId);
    target.friendRequestsReceived = target.friendRequestsReceived.filter(id => id.toString() !== req.userId);

    await user.save();
    await target.save();

    res.json({ message: 'Friend request cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    const user = await User.findById(req.userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.friends = user.friends.filter(id => id.toString() !== targetId);
    target.friends = target.friends.filter(id => id.toString() !== req.userId);

    await user.save();
    await target.save();

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { targetId } = req.body;
    if (targetId === req.userId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add to block list, remove from friends and pending requests
    if (!user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
    }
    user.friends = user.friends.filter(id => id.toString() !== targetId);
    user.friendRequestsSent = user.friendRequestsSent.filter(id => id.toString() !== targetId);
    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== targetId);

    await user.save();

    // Clean up target's side
    const target = await User.findById(targetId);
    if (target) {
      target.friends = target.friends.filter(id => id.toString() !== req.userId);
      target.friendRequestsSent = target.friendRequestsSent.filter(id => id.toString() !== req.userId);
      target.friendRequestsReceived = target.friendRequestsReceived.filter(id => id.toString() !== req.userId);
      await target.save();
    }

    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { targetId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId);
    await user.save();

    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username email bestWpm streak level stats')
      .populate('friendRequestsSent', 'username email bestWpm level')
      .populate('friendRequestsReceived', 'username email bestWpm level')
      .populate('blockedUsers', 'username email');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Format friends list with online status and latest stats
    const friendsFormatted = user.friends.map(friend => {
      const stats = friend.stats || [];
      const latestTest = stats.filter(s => s.mode === 'test').slice(-1)[0] || null;
      
      const isOnline = global.onlineUsers ? global.onlineUsers.has(friend._id.toString()) : false;

      return {
        _id: friend._id,
        username: friend.username,
        email: friend.email,
        bestWpm: friend.bestWpm,
        streak: friend.streak,
        level: friend.level,
        isOnline,
        latestTest: latestTest ? {
          wpm: latestTest.wpm,
          accuracy: latestTest.accuracy,
          date: latestTest.date
        } : null
      };
    });

    res.json({
      friends: friendsFormatted,
      friendRequestsSent: user.friendRequestsSent,
      friendRequestsReceived: user.friendRequestsReceived,
      blockedUsers: user.blockedUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
