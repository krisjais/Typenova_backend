const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Feed includes own activities and friends' activities
    const userIds = [req.userId, ...user.friends];

    const activities = await Activity.find({ user: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
