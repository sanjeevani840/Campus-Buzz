const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'campbuzz-jwt-super-secret-key';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Data files paths
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const EVENT_REQUESTS_FILE = path.join(DATA_DIR, 'event_requests.json');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'complaints.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const CLUB_POSTS_FILE = path.join(DATA_DIR, 'club_posts.json');

// Helper to read JSON files safely
function readJSON(file, defaultData = []) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return defaultData;
  }
}

// Helper to write JSON files safely
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Initialize seed data
const DEFAULT_USERS = [
  { email: '25115001@college.edu', rollNumber: '25115001', name: 'Sanjeevani Rao', role: 'student', phone: '+91 98765 43210', password: bcrypt.hashSync('25115001', 10) },
  { email: '25115002@college.edu', rollNumber: '25115002', name: 'Rahul Sharma', role: 'student', phone: '+91 98765 01234', password: bcrypt.hashSync('25115002', 10) },
  { email: 'codingclub@college.edu', rollNumber: 'club001', name: 'Coding Club', role: 'club', phone: '+91 91234 56789', password: bcrypt.hashSync('club001', 10) },
  { email: 'drama@college.edu', rollNumber: 'club002', name: 'Drama Society', role: 'club', phone: '+91 92345 67890', password: bcrypt.hashSync('club002', 10) },
  { email: 'admin@college.edu', rollNumber: 'admin001', name: 'Chief Administrator', role: 'admin', phone: '+91 99999 99999', password: bcrypt.hashSync('admin001', 10) }
];

const DEFAULT_POSTS = [
  {
    id: 'post_1',
    title: 'Splitting Pizza order from Dominoes',
    description: 'Ordering a double cheese Margherita and Pepper BBQ chicken. Anyone want to split the cost? Meet at Hostel 3 lounge.',
    hashtag: '#foodsplit',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    posterEmail: '25115001@college.edu',
    posterName: 'Sanjeevani Rao',
    createdAt: Date.now() - 3600000, // 1 hour ago
    expiresAt: Date.now() + 23 * 3600000, // Expires in 23 hours
    isClosed: false
  },
  {
    id: 'post_2',
    title: 'Cab split to Airport tomorrow early morning',
    description: 'Looking for 2 people to split a cab to Delhi Airport. Flight is at 7 AM, cab will start at 4 AM from Main Gate.',
    hashtag: '#cabsplit',
    imageUrl: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=500&auto=format&fit=crop&q=60',
    posterEmail: '25115002@college.edu',
    posterName: 'Rahul Sharma',
    createdAt: Date.now() - 7200000, // 2 hours ago
    expiresAt: Date.now() + 10 * 3600000, // Expires in 10 hours
    isClosed: false
  },
  {
    id: 'post_3',
    title: 'Selling Kindle Paperwhite (10th Gen)',
    description: 'Excellent condition, 8GB storage, backlight works perfectly. Price: ₹6,500. Negotiable. Drop in chat if interested!',
    hashtag: '#resell',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    posterEmail: '25115001@college.edu',
    posterName: 'Sanjeevani Rao',
    createdAt: Date.now() - 18000000, // 5 hours ago
    isClosed: false
  },
  {
    id: 'post_4',
    title: 'Lost black leather wallet in Library',
    description: 'Lost my wallet containing roll card and driving license near the first-floor reading room. Please contact if found!',
    hashtag: '#lost',
    imageUrl: 'https://images.unsplash.com/photo-1627124112126-7d4d4b7c91cd?w=500&auto=format&fit=crop&q=60',
    posterEmail: '25115002@college.edu',
    posterName: 'Rahul Sharma',
    posterPhone: '+91 98765 01234',
    createdAt: Date.now() - 5400000
  }
];

const DEFAULT_CLUB_POSTS = [
  {
    id: 'club_post_1',
    title: 'Hackathon 2026 Registration Open!',
    description: 'The annual 24-hour campus hackathon is here! Prizes worth ₹1,00,000. Scan the QR code or fill out the embedded form below.',
    link: 'https://github.com',
    googleFormEmbed: 'https://docs.google.com/forms/d/e/1FAIpQLSfD_Nefx40r75w5bXQ3TjJgqTzD4gXf14N1z7fCq-356vC0qw/viewform?embedded=true',
    linkedEventId: 'event_1',
    posterEmail: 'codingclub@college.edu',
    posterName: 'Coding Club',
    createdAt: Date.now() - 86400000 // 1 day ago
  }
];

const DEFAULT_EVENTS = [
  {
    id: 'event_1',
    name: 'Hackathon 2026',
    date: '2026-07-05',
    time: '09:00',
    venue: 'Computer Science Lab 3',
    description: 'Unleash your creativity and coding skills in this 24-hour hackathon. Refreshments and certificates will be provided.',
    organizerEmail: 'codingclub@college.edu',
    organizerName: 'Coding Club'
  },
  {
    id: 'event_2',
    name: 'Annual Play Auditions',
    date: '2026-06-30',
    time: '17:30',
    venue: 'Campus OAT (Open Air Theatre)',
    description: 'Drama Society is hosting auditions for the upcoming annual stage play. All students are welcome to audition.',
    organizerEmail: 'drama@college.edu',
    organizerName: 'Drama Society'
  }
];

const DEFAULT_COMPLAINTS = [
  {
    id: 'comp_1',
    title: 'Wifi not working in Library 2nd floor',
    description: 'The WiFi signal on the second floor of the central library is extremely weak and keeps disconnecting every 5 minutes. Needs router check.',
    isAnonymous: true,
    isResolved: false,
    posterEmail: '25115001@college.edu',
    posterName: 'Sanjeevani Rao',
    createdAt: Date.now() - 43200000 // 12 hours ago
  },
  {
    id: 'comp_2',
    title: 'Mess food quality issue (Hostel 3)',
    description: 'Found raw paneer pieces in dinner tonight. This is a recurring issue with hygiene and food prep. Please address this.',
    isAnonymous: true,
    isResolved: true,
    posterEmail: '25115002@college.edu',
    posterName: 'Rahul Sharma',
    createdAt: Date.now() - 86400000 // 24 hours ago
  }
];

const DEFAULT_CHATS = {
  'post_1': [
    { senderEmail: '25115001@college.edu', senderName: 'Sanjeevani Rao', text: 'Hi guys, I am ordering in 15 mins. Let me know what pizzas you want.', timestamp: Date.now() - 3000000 },
    { senderEmail: '25115002@college.edu', senderName: 'Rahul Sharma', text: 'Hey, I would like to split the Veg Margherita pizza! Count me in.', timestamp: Date.now() - 2500000 }
  ],
  'post_2': [
    { senderEmail: '25115002@college.edu', senderName: 'Rahul Sharma', text: 'Cab is booked. Fare is showing ₹950 total. If we find 2 more, it will be around ₹240 each.', timestamp: Date.now() - 6000000 }
  ],
  'post_3': [
    { senderEmail: '25115002@college.edu', senderName: 'Rahul Sharma', text: 'Hey Sanjeevani, is the Kindle still available? How old is it?', timestamp: Date.now() - 10000000 }
  ]
};

// Seed database files if empty
if (!fs.existsSync(USERS_FILE) || readJSON(USERS_FILE).length === 0) writeJSON(USERS_FILE, DEFAULT_USERS);

// Ensure all existing users have a password field (default to their rollNumber)
const existingUsers = readJSON(USERS_FILE);
let usersModified = false;
existingUsers.forEach(u => {
  if (!u.password) {
    u.password = bcrypt.hashSync(u.rollNumber, 10);
    usersModified = true;
  }
});
if (usersModified) {
  writeJSON(USERS_FILE, existingUsers);
}

if (!fs.existsSync(POSTS_FILE) || readJSON(POSTS_FILE).length === 0) writeJSON(POSTS_FILE, DEFAULT_POSTS);
if (!fs.existsSync(EVENTS_FILE) || readJSON(EVENTS_FILE).length === 0) writeJSON(EVENTS_FILE, DEFAULT_EVENTS);
if (!fs.existsSync(EVENT_REQUESTS_FILE)) writeJSON(EVENT_REQUESTS_FILE, []);
if (!fs.existsSync(COMPLAINTS_FILE) || readJSON(COMPLAINTS_FILE).length === 0) writeJSON(COMPLAINTS_FILE, DEFAULT_COMPLAINTS);
if (!fs.existsSync(CLUB_POSTS_FILE) || readJSON(CLUB_POSTS_FILE).length === 0) writeJSON(CLUB_POSTS_FILE, DEFAULT_CLUB_POSTS);
if (!fs.existsSync(CHATS_FILE) || Object.keys(readJSON(CHATS_FILE)).length === 0) writeJSON(CHATS_FILE, DEFAULT_CHATS);

// SSE Active Connections: postId -> Array of Response Objects
let chatStreams = {};

// Helper to broadcast message to SSE clients
function broadcastToChat(postId, message) {
  if (chatStreams[postId]) {
    const dataString = `data: ${JSON.stringify(message)}\n\n`;
    chatStreams[postId].forEach(res => {
      res.write(dataString);
    });
  }
}

// Authentication Middleware
function authenticateUser(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }
  
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.rollNumber === decoded.rollNumber);
    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication credentials' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role Guard Middleware
function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// --- API ROUTES ---

// 1. Register Endpoint
app.post('/api/auth/register', (req, res) => {
  const { name, email, rollNumber, password, confirmPassword, role } = req.body;
  
  if (!name || !email || !rollNumber || !password || !confirmPassword || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const allowedRoles = ['student', 'faculty', 'club', 'admin'];
  if (!allowedRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  const users = readJSON(USERS_FILE);
  
  const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  const rollExists = users.some(u => u.rollNumber === rollNumber);

  if (emailExists || rollExists) {
    return res.status(400).json({ error: 'User with this Email or Roll Number already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const newUser = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    rollNumber: rollNumber.trim(),
    password: hashedPassword,
    role: role.toLowerCase(),
    phone: '+91 99999 99999'
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.status(201).json({ message: 'Registration successful' });
});

// 2. Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { rollNumber, password } = req.body;
  
  if (!rollNumber || !password) {
    return res.status(400).json({ error: 'Roll Number and Password are required' });
  }

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.rollNumber === rollNumber);
  
  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Invalid Roll Number or Password' });
  }

  const token = jwt.sign(
    { rollNumber: user.rollNumber, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const userResponse = {
    email: user.email,
    rollNumber: user.rollNumber,
    name: user.name,
    role: user.role,
    phone: user.phone
  };

  res.json({ user: userResponse, token });
});

// 2. Fetch logged in user status
app.get('/api/auth/current-user', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// 3. Buzz Feed Endpoints
app.get('/api/posts', authenticateUser, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  // Sort posts by date, newest first
  const sorted = posts.sort((a, b) => b.createdAt - a.createdAt);
  res.json(sorted);
});

app.post('/api/posts', authenticateUser, requireRoles(['student', 'admin']), (req, res) => {
  const { title, description, hashtag, imageUrl, timerMinutes } = req.body;

  if (!title || !description || !hashtag || !imageUrl) {
    return res.status(400).json({ error: 'Title, description, hashtag, and image are mandatory.' });
  }

  const allowedHashtags = ['#foodsplit', '#cabsplit', '#resell', '#lost', '#found'];
  if (!allowedHashtags.includes(hashtag)) {
    return res.status(400).json({ error: 'Invalid hashtag. Must be one of #foodsplit, #cabsplit, #resell, #lost, #found.' });
  }

  let expiresAt = null;
  if (hashtag === '#foodsplit' || hashtag === '#cabsplit') {
    let minutes = 24 * 60; // Default 24 hours
    if (timerMinutes) {
      const minVal = parseInt(timerMinutes);
      // Validate bounds: 10 mins to 2 days (2880 mins)
      if (minVal >= 10 && minVal <= 2880) {
        minutes = minVal;
      } else {
        return res.status(400).json({ error: 'Timer must be between 10 minutes and 2 days (2880 minutes).' });
      }
    }
    expiresAt = Date.now() + (minutes * 60 * 1000);
  }

  const posts = readJSON(POSTS_FILE);
  const newPost = {
    id: 'post_' + Math.random().toString(36).substr(2, 9),
    title,
    description,
    hashtag,
    imageUrl,
    posterEmail: req.user.email,
    posterName: req.user.name,
    posterPhone: req.user.phone || '+91 99999 99999',
    createdAt: Date.now(),
    expiresAt,
    isClosed: false
  };

  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);

  // Initialize empty chat room for splits/resell
  if (['#foodsplit', '#cabsplit', '#resell'].includes(hashtag)) {
    const chats = readJSON(CHATS_FILE);
    chats[newPost.id] = [];
    writeJSON(CHATS_FILE, chats);
  }

  res.status(201).json(newPost);
});

// Close a post split/resell room
app.post('/api/posts/:id/close', authenticateUser, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const postIndex = posts.findIndex(p => p.id === req.params.id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const post = posts[postIndex];

  // Only original poster or admin can close
  if (post.posterEmail !== req.user.email && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to close this room.' });
  }

  post.isClosed = true;
  writeJSON(POSTS_FILE, posts);

  // Notify active chat streams that room is closed
  broadcastToChat(post.id, { system: true, text: 'This room has been closed by the poster.', timestamp: Date.now() });

  res.json({ message: 'Room closed successfully.', post });
});

// 4. Live Chat Endpoints (SSE & Fetch History)
app.get('/api/chats/:postId', authenticateUser, (req, res) => {
  const chats = readJSON(CHATS_FILE);
  const roomChats = chats[req.params.postId] || [];
  res.json(roomChats);
});

app.post('/api/chats/:postId', authenticateUser, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  // Ensure post is active
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found or expired.' });
  }
  if (post.isClosed) {
    return res.status(400).json({ error: 'This room is closed.' });
  }

  const chats = readJSON(CHATS_FILE);
  if (!chats[req.params.postId]) {
    chats[req.params.postId] = [];
  }

  const newMessage = {
    senderEmail: req.user.email,
    senderName: req.user.name,
    text,
    timestamp: Date.now()
  };

  chats[req.params.postId].push(newMessage);
  writeJSON(CHATS_FILE, chats);

  // Broadcast in real-time
  broadcastToChat(req.params.postId, newMessage);

  res.status(201).json(newMessage);
});

// SSE Stream Setup
app.get('/api/chats/:postId/stream', (req, res) => {
  const postId = req.params.postId;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  if (!chatStreams[postId]) {
    chatStreams[postId] = [];
  }
  chatStreams[postId].push(res);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    chatStreams[postId] = chatStreams[postId].filter(client => client !== res);
    if (chatStreams[postId].length === 0) {
      delete chatStreams[postId];
    }
  });
});

// 5. Club Section Endpoints
app.get('/api/club-posts', authenticateUser, (req, res) => {
  // Visible to all logged in users, but we filter or sort
  const posts = readJSON(CLUB_POSTS_FILE);
  const sorted = posts.sort((a, b) => b.createdAt - a.createdAt);
  res.json(sorted);
});

app.post('/api/club-posts', authenticateUser, requireRoles(['club', 'admin']), (req, res) => {
  const { title, description, link, googleFormEmbed, linkedEventId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const posts = readJSON(CLUB_POSTS_FILE);
  const newPost = {
    id: 'club_post_' + Math.random().toString(36).substr(2, 9),
    title,
    description,
    link: link || null,
    googleFormEmbed: googleFormEmbed || null,
    linkedEventId: linkedEventId || null,
    posterEmail: req.user.email,
    posterName: req.user.name,
    createdAt: Date.now()
  };

  posts.push(newPost);
  writeJSON(CLUB_POSTS_FILE, posts);
  res.status(201).json(newPost);
});

// 6. Event Calendar Endpoints
app.get('/api/events', authenticateUser, (req, res) => {
  const events = readJSON(EVENTS_FILE);
  res.json(events);
});

app.post('/api/events', authenticateUser, requireRoles(['club', 'admin']), (req, res) => {
  const { name, date, time, venue, description } = req.body;

  if (!name || !date || !time || !venue || !description) {
    return res.status(400).json({ error: 'All fields (name, date, time, venue, description) are required.' });
  }

  const events = readJSON(EVENTS_FILE);
  const newEvent = {
    id: 'event_' + Math.random().toString(36).substr(2, 9),
    name,
    date,
    time,
    venue,
    description,
    organizerEmail: req.user.email,
    organizerName: req.user.name
  };

  events.push(newEvent);
  writeJSON(EVENTS_FILE, events);
  res.status(201).json(newEvent);
});

// Edit Event (Clubs manage their own, Admin manages all)
app.put('/api/events/:id', authenticateUser, requireRoles(['club', 'admin']), (req, res) => {
  const events = readJSON(EVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const event = events[index];
  if (event.organizerEmail !== req.user.email && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to modify this event.' });
  }

  const { name, date, time, venue, description } = req.body;
  events[index] = {
    ...event,
    name: name || event.name,
    date: date || event.date,
    time: time || event.time,
    venue: venue || event.venue,
    description: description || event.description
  };

  writeJSON(EVENTS_FILE, events);
  res.json(events[index]);
});

// Delete Event
app.delete('/api/events/:id', authenticateUser, requireRoles(['club', 'admin']), (req, res) => {
  const events = readJSON(EVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const event = events[index];
  if (event.organizerEmail !== req.user.email && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this event.' });
  }

  const filtered = events.filter(e => e.id !== req.params.id);
  writeJSON(EVENTS_FILE, filtered);
  res.json({ message: 'Event deleted successfully.' });
});

// Event request workflow for students
app.post('/api/events/request', authenticateUser, requireRoles(['student']), (req, res) => {
  const { name, date, time, venue, description } = req.body;

  if (!name || !date || !time || !venue || !description) {
    return res.status(400).json({ error: 'All event details are required.' });
  }

  const requests = readJSON(EVENT_REQUESTS_FILE);
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substr(2, 9),
    name,
    date,
    time,
    venue,
    description,
    studentEmail: req.user.email,
    studentName: req.user.name,
    status: 'pending', // pending, approved, rejected
    createdAt: Date.now()
  };

  requests.push(newRequest);
  writeJSON(EVENT_REQUESTS_FILE, requests);
  res.status(201).json(newRequest);
});

// View pending requests (Admin only)
app.get('/api/events/requests', authenticateUser, requireRoles(['admin']), (req, res) => {
  const requests = readJSON(EVENT_REQUESTS_FILE);
  res.json(requests);
});

// Approve/Reject event requests (Admin only)
app.post('/api/events/requests/:requestId/:action', authenticateUser, requireRoles(['admin']), (req, res) => {
  const { requestId, action } = req.params;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
  }

  const requests = readJSON(EVENT_REQUESTS_FILE);
  const index = requests.findIndex(r => r.id === requestId);

  if (index === -1) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  const request = requests[index];
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request is already processed.' });
  }

  if (action === 'approve') {
    request.status = 'approved';
    
    // Create actual event
    const events = readJSON(EVENTS_FILE);
    const newEvent = {
      id: 'event_' + Math.random().toString(36).substr(2, 9),
      name: request.name,
      date: request.date,
      time: request.time,
      venue: request.venue,
      description: `Created on behalf of ${request.studentName}: ${request.description}`,
      organizerEmail: request.studentEmail,
      organizerName: request.studentName
    };
    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);
  } else {
    request.status = 'rejected';
  }

  writeJSON(EVENT_REQUESTS_FILE, requests);
  res.json({ message: `Request successfully ${request.status}.`, request });
});

// 7. Complaints Endpoints
app.get('/api/complaints', authenticateUser, (req, res) => {
  const complaints = readJSON(COMPLAINTS_FILE);
  
  // Format the output: Students see anonymous details. Admin sees real identity.
  const isUserAdmin = req.user.role === 'admin';
  const sanitized = complaints.map(c => {
    if (isUserAdmin) {
      return c; // Send everything
    } else {
      // Clean poster data
      const { posterEmail, posterName, ...rest } = c;
      return {
        ...rest,
        posterName: 'Anonymous Student',
        // Still allow the actual poster to know it is theirs so they can resolve it
        isOwnComplaint: c.posterEmail === req.user.email
      };
    }
  });

  res.json(sanitized);
});

app.post('/api/complaints', authenticateUser, requireRoles(['student']), (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const complaints = readJSON(COMPLAINTS_FILE);
  const newComplaint = {
    id: 'comp_' + Math.random().toString(36).substr(2, 9),
    title,
    description,
    isAnonymous: true,
    isResolved: false,
    posterEmail: req.user.email,
    posterName: req.user.name,
    createdAt: Date.now()
  };

  complaints.push(newComplaint);
  writeJSON(COMPLAINTS_FILE, complaints);
  res.status(201).json(newComplaint);
});

// Mark complaint as resolved (Only original student poster can do this)
app.post('/api/complaints/:id/resolve', authenticateUser, (req, res) => {
  const complaints = readJSON(COMPLAINTS_FILE);
  const index = complaints.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const complaint = complaints[index];
  if (complaint.posterEmail !== req.user.email) {
    return res.status(403).json({ error: 'Only the creator can resolve this complaint.' });
  }

  complaint.isResolved = true;
  writeJSON(COMPLAINTS_FILE, complaints);
  res.json(complaint);
});

// Moderate complaints: Admin can delete
app.delete('/api/complaints/:id', authenticateUser, requireRoles(['admin']), (req, res) => {
  const complaints = readJSON(COMPLAINTS_FILE);
  const index = complaints.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const filtered = complaints.filter(c => c.id !== req.params.id);
  writeJSON(COMPLAINTS_FILE, filtered);
  res.json({ message: 'Complaint deleted by admin.' });
});


// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// Catch all to serve frontend SPA index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- BACKGROUND EXPIRY WORKER ---
// Checks every 10 seconds for expired cabsplit and foodsplit posts and deletes them
setInterval(() => {
  let posts = readJSON(POSTS_FILE);
  const now = Date.now();
  let expiredCount = 0;

  const activePosts = posts.filter(post => {
    if (post.expiresAt && now >= post.expiresAt) {
      expiredCount++;
      // Notify SSE clients if listening
      broadcastToChat(post.id, { system: true, text: 'This post has expired and is auto-deleting.', timestamp: now });
      
      // Clean up chats for this post
      const chats = readJSON(CHATS_FILE);
      if (chats[post.id]) {
        delete chats[post.id];
        writeJSON(CHATS_FILE, chats);
      }
      return false;
    }
    return true;
  });

  if (expiredCount > 0) {
    console.log(`[Worker] Expired and auto-deleted ${expiredCount} posts.`);
    writeJSON(POSTS_FILE, activePosts);
  }
}, 10000);

// Start server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`CampBuzz Server running on: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
