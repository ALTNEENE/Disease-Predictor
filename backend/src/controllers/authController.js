const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function sanitize(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    throw new ApiError(400, "Name, valid email, and password of at least 8 characters are required");
  }

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email is already registered");

  const role = (await User.countDocuments()) === 0 ? "admin" : "analyst";
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: signToken(user), user: sanitize(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json({ token: signToken(user), user: sanitize(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitize(req.user) });
});

module.exports = { register, login, me };
