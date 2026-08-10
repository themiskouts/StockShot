const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'stockshot_secret_key_change_this_in_production';

function readUsers() {
  const data = fs.readFileSync('users.json', 'utf8');
  return JSON.parse(data);
}

function writeUsers(data) {
  fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
}

async function register(email, password) {
  const users = readUsers();
  
  // Check if user exists
  if (users.users.find(u => u.email === email)) {
    return { success: false, message: 'User already exists' };
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const newUser = {
    id: Date.now(),
    email: email,
    password: hashedPassword,
    createdAt: new Date()
  };
  
  users.users.push(newUser);
  writeUsers(users);
  
  return { success: true, message: 'User registered successfully' };
}

async function login(email, password) {
  const users = readUsers();
  
  // Find user
  const user = users.users.find(u => u.email === email);
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  // Check password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { success: false, message: 'Invalid password' };
  }
  
  // Create token
  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
  
  return { success: true, message: 'Login successful', token: token };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, message: 'Invalid token' };
  }
}

module.exports = { register, login, verifyToken };