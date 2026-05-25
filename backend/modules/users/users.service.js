const User = require("../../models/User");
const Repository = require("../../models/Repository");
const File = require("../../models/File");
const AIInsight = require("../../models/AIInsight");
const AppError = require("../../utils/AppError");

// ─── Get Profile + Aggregated Stats ──────────────────────────────────────────

const fetchProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  // Fetch all repo IDs for this user (needed for cross-collection queries)
  const userRepos = await Repository.find({ userId }).select("_id repoName repoUrl status createdAt");
  const repoIds = userRepos.map((r) => r._id);

  // Run all aggregations in parallel
  const [totalFilesScanned, aiInsightsGenerated, mostRecentRepo] = await Promise.all([
    File.countDocuments({ repoId: { $in: repoIds } }),
    AIInsight.countDocuments({ repoId: { $in: repoIds } }),
    Repository.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("repoName repoUrl status createdAt"),
  ]);

  const stats = {
    repoCount: userRepos.length,
    totalFilesScanned,
    aiInsightsGenerated,
    mostRecentRepo: mostRecentRepo
      ? {
          repoName: mostRecentRepo.repoName,
          repoUrl: mostRecentRepo.repoUrl,
          status: mostRecentRepo.status,
          createdAt: mostRecentRepo.createdAt,
        }
      : null,
  };

  return { user, stats };
};

// ─── Update Display Name ──────────────────────────────────────────────────────

const updateUserProfile = async (userId, fields) => {
  // Explicitly allow only displayName — strip any attempt to change email or password
  const { displayName } = fields;
  const allowedUpdate = {};
  if (displayName !== undefined) allowedUpdate.displayName = displayName;

  const user = await User.findByIdAndUpdate(
    userId,
    allowedUpdate,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");
  return user;
};

// ─── Change Password ──────────────────────────────────────────────────────────

const updateUserPassword = async (userId, currentPassword, newPassword, confirmPassword) => {
  // Fetch user with password field (normally excluded by default)
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  // Verify current password using the instance method
  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    throw new AppError("Current password is incorrect.", 401, "INVALID_CREDENTIALS");
  }

  // Passwords must match
  if (newPassword !== confirmPassword) {
    throw new AppError(
      "New password and confirm password do not match.",
      400,
      "PASSWORDS_DO_NOT_MATCH"
    );
  }

  // Minimum length (also enforced by validator, but guard here too)
  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters long.", 400, "INVALID_INPUT");
  }

  // Assign plain text — the pre-save bcrypt hook will hash it automatically
  user.password = newPassword;
  await user.save();
};

module.exports = { fetchProfile, updateUserProfile, updateUserPassword };
