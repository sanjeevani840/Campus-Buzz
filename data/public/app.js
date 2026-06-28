// --- STATE MANAGEMENT ---
const API_BASE = "http://localhost:3000";
let currentUser = null;
let currentToken = null;
let currentTab = 'buzz-feed';
let posts = [];
let clubPosts = [];
let events = [];
let complaints = [];
let activeChatPostId = null;
let chatEventSource = null;
let timerInterval = null;

// Preset images for posts
const PRESET_IMAGES = [
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
  { name: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Cab Taxi', url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=500&auto=format&fit=crop&q=60' },
  { name: 'Travel Bags', url: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=500&auto=format&fit=crop&q=60' },
  { name: 'Kindle/Books', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60' },
  { name: 'Laptop/Gadget', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
  { name: 'Wallet/Keys', url: 'https://images.unsplash.com/photo-1627124112126-7d4d4b7c91cd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Campus OAT', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60' }
];

// --- UI HELPERS (loading skeletons & stats) ---
function showFeedSkeleton(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cardClass = containerId.includes('club') ? 'skeleton-card club-skeleton' : 'skeleton-card';
  container.innerHTML = Array(count).fill('').map(() => `
    <div class="${cardClass}">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    </div>
  `).join('');
}

function showCalendarSkeleton() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;
  grid.innerHTML = Array(35).fill('').map(() =>
    `<div class="skeleton skeleton-list-item" style="aspect-ratio:1; margin:0;"></div>`
  ).join('');
}

function updateCampusStats() {
  const setStat = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.count = value;
    const current = parseInt(el.textContent, 10) || 0;
    if (current !== value) {
      el.dispatchEvent(new CustomEvent('stat-update', { detail: { value } }));
    }
  };
  setStat('stat-posts', posts.length);
  setStat('stat-events', events.length);
  setStat('stat-clubs', clubPosts.length);
  setStat('stat-complaints', complaints.length);
}

// --- INITIALIZE APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadSavedSession();
  setupPresetsGallery();
  
  // Start countdown ticks for feed timers
  setInterval(updateAllTimersOnFeed, 1000);
});

// Load saved auth session
function loadSavedSession() {
  const savedUser = localStorage.getItem('campbuzz_user');
  const savedToken = localStorage.getItem('campbuzz_token');
  
  if (savedUser && savedToken) {
    currentUser = JSON.parse(savedUser);
    currentToken = savedToken;
    showAppLayout();
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    
    // Validate session in background
    apiCall('/api/auth/current-user')
      .then(data => {
        currentUser = data.user;
        localStorage.setItem('campbuzz_user', JSON.stringify(currentUser));
        // Refresh layouts with updated details if necessary
        document.getElementById('current-user-name').innerText = currentUser.name;
        document.getElementById('current-user-role').innerText = currentUser.role;
        document.getElementById('current-user-avatar').innerText = currentUser.name.charAt(0).toUpperCase();
      })
      .catch(() => {
        // If verify fails (e.g. 401), apiCall handles logout/auth redirect
      });
  } else {
    showAuthPage();
  }
}

// Setup static DOM event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roll = document.getElementById('login-roll').value;
    const password = document.getElementById('login-password').value;
    await performLogin(roll, password);
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const roll = document.getElementById('register-roll').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = document.getElementById('register-role').value;
    await performRegister(name, email, roll, password, confirmPassword, role);
  });

  // Create post form
  document.getElementById('create-post-form').addEventListener('submit', handlePostSubmit);
  
  // Create club post form
  document.getElementById('create-club-post-form').addEventListener('submit', handleClubPostSubmit);

  // Create event form
  document.getElementById('create-event-form').addEventListener('submit', handleEventSubmit);

  // Create complaint form
  document.getElementById('create-complaint-form').addEventListener('submit', handleComplaintSubmit);

  // Chat message submit
  document.getElementById('chat-input-form').addEventListener('submit', sendChatMessage);

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      if (overlay.id === 'modal-chat-room') closeChatRoom();
      else closeModal(overlay.id);
    });
  });
}

// Generate the preset cover image options in create post modal
function setupPresetsGallery() {
  const container = document.getElementById('presets-gallery');
  container.innerHTML = '';
  
  PRESET_IMAGES.forEach((img, idx) => {
    const div = document.createElement('div');
    div.className = `preset-img-option ${idx === 0 ? 'selected' : ''}`;
    if (idx === 0) document.getElementById('post-image-url').value = img.url;
    
    div.innerHTML = `<img src="${img.url}" alt="${img.name}" title="${img.name}">`;
    div.onclick = () => {
      document.querySelectorAll('.preset-img-option').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      document.getElementById('post-image-url').value = img.url;
      // Clear custom input when preset is selected
      document.getElementById('post-image-url-custom').value = '';
    };
    container.appendChild(div);
  });
}

function useCustomImageUrl(url) {
  if (url) {
    document.querySelectorAll('.preset-img-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('post-image-url').value = url;
  }
}

// --- AUTHENTICATION FLOWS ---
window.toggleAuthMode = function(mode) {
  if (mode === 'register') {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
  } else {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('register-form-container').style.display = 'none';
  }
};

async function performRegister(name, email, rollNumber, password, confirmPassword, role) {
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rollNumber, password, confirmPassword, role })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('Registration successful! Please log in.', 'success');
      toggleAuthMode('login');
      document.getElementById('login-roll').value = rollNumber;
      document.getElementById('login-password').value = '';
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error during registration', 'error');
  }
}

async function performLogin(rollNumber, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      currentUser = data.user;
      currentToken = data.token;
      localStorage.setItem('campbuzz_user', JSON.stringify(currentUser));
      localStorage.setItem('campbuzz_token', currentToken);
      showAppLayout();
      showToast(`Verification Successful. Logged in as ${currentUser.role.toUpperCase()}`, 'success');
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error during authentication', 'error');
  }
}

function quickLogin(roll, password) {
  document.getElementById('login-roll').value = roll;
  document.getElementById('login-password').value = password;
  performLogin(roll, password);
}

function logout() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('campbuzz_user');
  localStorage.removeItem('campbuzz_token');
  closeChatRoom();
  showAuthPage();
  showToast('Logged out successfully', 'info');
}

// View Switches
function showAuthPage() {
  document.getElementById('app-layout').classList.remove('active');
  document.getElementById('auth-page').classList.add('active');
}

function showAppLayout() {
  document.getElementById('auth-page').classList.remove('active');
  document.getElementById('app-layout').classList.add('active');
  
  // Render details
  document.getElementById('current-user-name').innerText = currentUser.name;
  document.getElementById('current-user-role').innerText = currentUser.role;
  document.getElementById('current-user-avatar').innerText = currentUser.name.charAt(0).toUpperCase();

  // Show/Hide Role-Gated Buttons in UI
  const isStudent = currentUser.role === 'student';
  const isClub = currentUser.role === 'club';
  const isAdmin = currentUser.role === 'admin';

  document.getElementById('btn-create-post').style.display = (isStudent || isAdmin) ? 'flex' : 'none';
  document.getElementById('btn-create-club-post').style.display = (isClub || isAdmin) ? 'flex' : 'none';
  document.getElementById('btn-create-event').innerText = isStudent ? 'Request Admin Listings' : 'Create Event';
  document.getElementById('btn-pending-requests').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('btn-create-complaint').style.display = isStudent ? 'flex' : 'none';

  // Navigate to default tab
  switchTab(null, 'buzz-feed');
}

// Navigation Tabs Router
async function switchTab(e, tabId) {
  if (e) e.preventDefault();
  currentTab = tabId;

  // Update navigation visual state
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-target') === tabId) {
      item.classList.add('active');
    }
  });

  // Switch display contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');

  // Fetch relevant content
  if (tabId === 'buzz-feed') {
    await fetchPosts();
  } else if (tabId === 'club-feed') {
    await fetchClubPosts();
  } else if (tabId === 'calendar-view') {
    showCalendarSkeleton();
    await fetchEvents();
    renderCalendar();
  } else if (tabId === 'complaints-view') {
    showFeedSkeleton('complaints-container', 3);
    await fetchComplaints();
  }
}

// HTTP Helper for Authenticated Requests
async function apiCall(url, method = 'GET', body = null) {
  const headers = {
    'Authorization': currentToken
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  
  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, options);
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please sign in again.');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Error');
    }
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    console.error(`API Call failed to ${url}:`, err);
    throw err;
  }
}

// --- BUZZ FEED BUSINESS LOGIC ---
async function fetchPosts() {
  showFeedSkeleton('buzz-posts-container', 4);
  try {
    posts = await apiCall('/api/posts');
    renderBuzzFeed(posts);
    renderStoriesIndicator(posts);
    updateCampusStats();
  } catch (e) {}
}

function renderBuzzFeed(feedPosts) {
  const container = document.getElementById('buzz-posts-container');
  container.innerHTML = '';

  if (feedPosts.length === 0) {
    container.innerHTML = `<div class="empty-state">No coordination posts yet. Be the first to start a conversation!</div>`;
    return;
  }

  feedPosts.forEach(post => {
    const isOwner = post.posterEmail === currentUser.email;
    const canInteractChat = ['#foodsplit', '#cabsplit', '#resell'].includes(post.hashtag);
    
    // Check if remaining timer applies
    let timerHTML = '';
    if (post.expiresAt) {
      const remaining = post.expiresAt - Date.now();
      if (remaining > 0) {
        timerHTML = `<div class="post-timer-badge ${post.hashtag === '#cabsplit' ? 'cabsplit' : ''}" data-expiry="${post.expiresAt}">
          🕒 <span class="timer-countdown">Calculating...</span>
        </div>`;
      } else {
        timerHTML = `<div class="post-timer-badge expired">⚠️ Expired</div>`;
      }
    }

    let cardActionBtn = '';
    if (canInteractChat) {
      if (post.isClosed) {
        cardActionBtn = `<span class="badge" style="background:#4b5563; animation:none;">Closed</span>`;
      } else {
        cardActionBtn = `<button class="btn-card-action" onclick="openChatRoom('${post.id}')">Join Chat</button>`;
      }
    } else {
      // Private contact info lost/found
      cardActionBtn = `<button class="btn-card-action" style="border-color:var(--accent-blue);" onclick="revealContact('${post.id}')">Contact Info</button>`;
    }

    const card = document.createElement('div');
    card.className = `post-card ${post.isClosed ? 'closed' : ''}`;
    card.id = `post-card-${post.id}`;
    
    card.innerHTML = `
      <div class="post-image-container">
        <img class="post-image" src="${post.imageUrl}" alt="Post cover">
        <span class="post-hashtag-badge ${post.hashtag.replace('#', '')}">${post.hashtag}</span>
        ${timerHTML}
      </div>
      <div class="post-body">
        <h4 class="post-title">${escapeHTML(post.title)}</h4>
        <p class="post-desc">${escapeHTML(post.description)}</p>
        <div class="post-footer">
          <div class="poster-info">
            <div class="poster-avatar">${post.posterName.charAt(0).toUpperCase()}</div>
            <span class="poster-name" title="${post.posterName}">${post.posterName}</span>
          </div>
          ${cardActionBtn}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  updateAllTimersOnFeed();
}

// Ticking remaining time on UI
function updateAllTimersOnFeed() {
  const elements = document.querySelectorAll('.post-timer-badge');
  const now = Date.now();
  
  elements.forEach(el => {
    const expiresAt = parseInt(el.getAttribute('data-expiry'));
    const countdownEl = el.querySelector('.timer-countdown');
    if (!countdownEl) return;

    const diff = expiresAt - now;
    if (diff <= 0) {
      el.className = 'post-timer-badge expired';
      el.innerHTML = '⚠️ Expired';
      // Trigger feed refresh if not done to clear expired posts
      // Wait a moment so background job deletes it
    } else {
      countdownEl.innerText = formatTimeDiff(diff);
    }
  });
}

function formatTimeDiff(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Render active splits stories (Instagram visual feel)
function renderStoriesIndicator(feedPosts) {
  const container = document.getElementById('active-splits-stories');
  container.innerHTML = '';
  
  // Filter active split group chats
  const activeSplits = feedPosts.filter(p => ['#foodsplit', '#cabsplit'].includes(p.hashtag) && !p.isClosed);
  
  if (activeSplits.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';

  activeSplits.slice(0, 5).forEach(post => {
    const bubble = document.createElement('div');
    bubble.className = 'story-bubble';
    bubble.onclick = () => openChatRoom(post.id);
    
    const emoji = post.hashtag === '#foodsplit' ? '🍕' : '🚗';
    bubble.innerHTML = `
      <div class="story-ring">
        <div class="story-ring-inner">
          ${emoji}
        </div>
      </div>
      <span>${escapeHTML(post.title)}</span>
    `;
    container.appendChild(bubble);
  });
}

// Open modals helper
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Create Buzz Post Modal Action
function openCreatePostModal() {
  document.getElementById('create-post-form').reset();
  setupPresetsGallery();
  togglePostTimerView();
  openModal('modal-create-post');
}

function togglePostTimerView() {
  const hash = document.getElementById('post-hashtag').value;
  const container = document.getElementById('post-timer-container');
  if (hash === '#foodsplit' || hash === '#cabsplit') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

async function handlePostSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('post-title').value;
  const description = document.getElementById('post-desc').value;
  const hashtag = document.getElementById('post-hashtag').value;
  const imageUrl = document.getElementById('post-image-url').value;
  const timerMinutes = document.getElementById('post-timer').value;

  try {
    await apiCall('/api/posts', 'POST', {
      title,
      description,
      hashtag,
      imageUrl,
      timerMinutes: ['#foodsplit', '#cabsplit'].includes(hashtag) ? timerMinutes : null
    });
    closeModal('modal-create-post');
    showToast('Coordination Post Published!', 'success');
    await fetchPosts();
  } catch (err) {}
}

// Tap lost/found reveals details immediately
function revealContact(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  
  // Show prompt styled beautifully
  const contactText = `📞 Phone: ${post.posterPhone || 'Not provided'}\n✉️ Email: ${post.posterEmail}`;
  showToast(`Contact Poster Directly:\n${contactText}`, 'info', 10000);
}

// Filter feed by hashtag buttons
function filterFeed(hashtag) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const filterClass = hashtag === 'all' ? 'filter-btn' : hashtag.replace('#', '');
  const activeBtn = document.querySelector(`.filter-btn[data-hashtag="${hashtag}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (hashtag === 'all') {
    renderBuzzFeed(posts);
  } else if (hashtag === '#lostfound') {
    const filtered = posts.filter(p => p.hashtag === '#lost' || p.hashtag === '#found');
    renderBuzzFeed(filtered);
  } else {
    const filtered = posts.filter(p => p.hashtag === hashtag);
    renderBuzzFeed(filtered);
  }
}

// Global search filtering
function filterSearch() {
  const q = document.getElementById('global-search').value.toLowerCase();
  
  if (currentTab === 'buzz-feed') {
    const filtered = posts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.hashtag.toLowerCase().includes(q) ||
      p.posterName.toLowerCase().includes(q)
    );
    renderBuzzFeed(filtered);
  } else if (currentTab === 'club-feed') {
    const filtered = clubPosts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.posterName.toLowerCase().includes(q)
    );
    renderClubPosts(filtered);
  } else if (currentTab === 'complaints-view') {
    const filtered = complaints.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q)
    );
    renderComplaintsList(filtered);
  }
}

// --- LIVE CHAT BUSINESS LOGIC (SSE) ---
async function openChatRoom(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  activeChatPostId = postId;
  
  // Set UI elements
  document.getElementById('chat-hashtag').innerText = post.hashtag;
  document.getElementById('chat-hashtag').className = `chat-post-badge ${post.hashtag.replace('#', '')}`;
  document.getElementById('chat-post-title').innerText = post.title;
  document.getElementById('chat-post-desc').innerText = post.description;
  document.getElementById('chat-poster-name').innerText = `Created by: ${post.posterName}`;

  // Close Room actions panel (only for owner/admin)
  const isOwner = post.posterEmail === currentUser.email;
  const isAdmin = currentUser.role === 'admin';
  const actionsPane = document.getElementById('chat-actions-pane');
  actionsPane.innerHTML = '';
  
  if ((isOwner || isAdmin) && !post.isClosed) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-red btn-block';
    closeBtn.innerText = 'Close Coordination Room';
    closeBtn.onclick = () => closeCoordinationPost(postId);
    actionsPane.appendChild(closeBtn);
  }

  // Room Expiration Timer display inside chat
  const timerCount = document.getElementById('chat-room-timer');
  if (post.expiresAt) {
    timerCount.style.display = 'block';
    if (timerInterval) clearInterval(timerInterval);
    
    const updateChatTimer = () => {
      const remaining = post.expiresAt - Date.now();
      if (remaining <= 0) {
        timerCount.innerText = 'Expired';
        closeChatRoom();
      } else {
        timerCount.innerText = `Remaining: ${formatTimeDiff(remaining)}`;
      }
    };
    updateChatTimer();
    timerInterval = setInterval(updateChatTimer, 1000);
  } else {
    timerCount.style.display = 'none';
  }

  // Load old messages
  try {
    const msgs = await apiCall(`/api/chats/${postId}`);
    const messagesBox = document.getElementById('chat-messages-box');
    messagesBox.innerHTML = '';
    
    msgs.forEach(appendMessageBubble);
    scrollChatToBottom();
  } catch (err) {}

  // Open SSE connection
  if (chatEventSource) {
    chatEventSource.close();
  }
  
  chatEventSource = new EventSource(`${API_BASE}/api/chats/${postId}/stream`);
  chatEventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);
    appendMessageBubble(message);
    scrollChatToBottom();
  };

  openModal('modal-chat-room');
}

function closeChatRoom() {
  if (chatEventSource) {
    chatEventSource.close();
    chatEventSource = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  activeChatPostId = null;
  closeModal('modal-chat-room');
}

function appendMessageBubble(msg) {
  const container = document.getElementById('chat-messages-box');
  const isSent = msg.senderEmail === currentUser.email;
  
  const msgRow = document.createElement('div');
  if (msg.system) {
    msgRow.className = 'chat-msg-row system-msg';
    msgRow.innerHTML = `<div class="chat-msg-bubble">${msg.text}</div>`;
  } else {
    msgRow.className = `chat-msg-row ${isSent ? 'sent' : 'received'}`;
    msgRow.innerHTML = `
      <div class="chat-msg-meta">${isSent ? 'You' : msg.senderName} • ${formatTime(msg.timestamp)}</div>
      <div class="chat-msg-bubble">${escapeHTML(msg.text)}</div>
    `;
  }
  container.appendChild(msgRow);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollChatToBottom() {
  const box = document.getElementById('chat-messages-box');
  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-message-input');
  const text = input.value.trim();
  if (!text || !activeChatPostId) return;

  try {
    await apiCall(`/api/chats/${activeChatPostId}`, 'POST', { text });
    input.value = '';
  } catch (err) {}
}

async function closeCoordinationPost(postId) {
  if (!confirm('Are you sure you want to close this room? This will lock coordination and chat interaction for everyone.')) return;
  try {
    await apiCall(`/api/posts/${postId}/close`, 'POST');
    showToast('Coordination closed.', 'info');
    closeChatRoom();
    await fetchPosts();
  } catch (e) {}
}


// --- CLUB BOARD LOGIC ---
async function fetchClubPosts() {
  showFeedSkeleton('club-posts-container', 2);
  try {
    clubPosts = await apiCall('/api/club-posts');
    renderClubPosts(clubPosts);
    updateCampusStats();
  } catch (e) {}
}

function renderClubPosts(postsArray) {
  const container = document.getElementById('club-posts-container');
  container.innerHTML = '';

  if (postsArray.length === 0) {
    container.innerHTML = `<div class="empty-state">No official announcements published yet.</div>`;
    return;
  }

  postsArray.forEach(post => {
    let linkHTML = '';
    if (post.link) {
      linkHTML = `<a href="${post.link}" target="_blank" class="club-post-link">🌐 Visit Link</a>`;
    }

    let formHTML = '';
    if (post.googleFormEmbed) {
      formHTML = `
        <div class="form-embed-wrapper">
          <div class="mock-form-overlay">
            <h4>📋 Embedded Form: Click to Open & Complete</h4>
            <a href="${post.googleFormEmbed}" target="_blank" class="btn btn-primary btn-block">Fill Out Official Google Form</a>
          </div>
        </div>
      `;
    }

    let linkedEventHTML = '';
    if (post.linkedEventId) {
      // Find the event description in state
      const ev = events.find(e => e.id === post.linkedEventId);
      if (ev) {
        linkedEventHTML = `
          <div class="linked-event-card">
            <div class="linked-event-card-info">
              <span class="linked-event-card-title">🗓️ Linked Event: ${escapeHTML(ev.name)}</span>
              <div class="linked-event-card-meta">${ev.date} at ${ev.time} | Venue: ${escapeHTML(ev.venue)}</div>
            </div>
            <button class="btn btn-secondary" onclick="viewEventDetails('${ev.id}')">View Calendar</button>
          </div>
        `;
      }
    }

    const card = document.createElement('div');
    card.className = 'club-post-card';
    card.innerHTML = `
      <div class="club-card-header">
        <div class="club-profile">
          <div class="avatar club">${post.posterName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>${post.posterName}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <span class="club-badge-icon">Official Announcement</span>
      </div>
      <h3 class="club-post-title">${escapeHTML(post.title)}</h3>
      <p class="club-post-desc">${escapeHTML(post.description)}</p>
      
      ${linkedEventHTML}
      ${formHTML}

      <div class="club-post-footer">
        <span>Published by: ${post.posterEmail}</span>
        ${linkHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

async function openClubPostModal() {
  document.getElementById('create-club-post-form').reset();
  
  // Populate existing events dropdown to link them
  await fetchEvents();
  const dropdown = document.getElementById('club-post-event');
  dropdown.innerHTML = '<option value="">-- No Linked Event --</option>';
  
  events.forEach(e => {
    // Only allow linking event organizer matching logged in club or admin
    if (currentUser.role === 'admin' || e.organizerEmail === currentUser.email) {
      dropdown.innerHTML += `<option value="${e.id}">${e.name} (${e.date})</option>`;
    }
  });

  openModal('modal-club-post');
}

async function handleClubPostSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('club-post-title').value;
  const description = document.getElementById('club-post-desc').value;
  const link = document.getElementById('club-post-link').value;
  const googleFormEmbed = document.getElementById('club-post-form').value;
  const linkedEventId = document.getElementById('club-post-event').value;

  try {
    await apiCall('/api/club-posts', 'POST', {
      title,
      description,
      link: link || null,
      googleFormEmbed: googleFormEmbed || null,
      linkedEventId: linkedEventId || null
    });
    closeModal('modal-club-post');
    showToast('Official Board Announcement published!', 'success');
    await fetchClubPosts();
  } catch (err) {}
}


// --- EVENTS CALENDAR BUSINESS LOGIC ---
let calendarYear = 2026;
let calendarMonth = 5; // June (0-indexed)

async function fetchEvents() {
  try {
    events = await apiCall('/api/events');
    renderEventsListPanel();
    updateCampusStats();
  } catch (e) {}
}

function prevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendar();
}

function nextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('calendar-month-year').innerText = `${monthNames[calendarMonth]} ${calendarYear}`;

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Add empty slots before start date
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    grid.appendChild(emptyCell);
  }

  const today = new Date();
  
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    // Check if cell represents today
    if (today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear) {
      dayCell.classList.add('today');
    }

    const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Find calendar events happening on this date
    const dayEvents = events.filter(e => e.date === dayStr);

    let dotsHTML = '';
    if (dayEvents.length > 0) {
      dotsHTML = `<div class="event-dots-container">`;
      dayEvents.forEach(() => {
        dotsHTML += `<span class="event-dot"></span>`;
      });
      dotsHTML += `</div>`;
    }

    dayCell.innerHTML = `
      <span class="calendar-day-num">${day}</span>
      ${dotsHTML}
    `;

    dayCell.onclick = () => {
      renderEventsListPanel(dayEvents, dayStr);
    };

    grid.appendChild(dayCell);
  }
}

// Side panel events list
function renderEventsListPanel(filteredEvents = null, chosenDateStr = null) {
  const container = document.getElementById('events-list-container');
  container.innerHTML = '';

  const displayList = filteredEvents || events;
  const titleText = chosenDateStr ? `Events for ${chosenDateStr}` : 'All Upcoming Events';
  
  const h3 = document.querySelector('.upcoming-events-panel h3');
  h3.innerText = titleText;

  if (displayList.length === 0) {
    container.innerHTML = `<div class="empty-state">No events scheduled.</div>`;
    return;
  }

  displayList.forEach(ev => {
    const isOrganizer = ev.organizerEmail === currentUser.email;
    const isAdmin = currentUser.role === 'admin';
    
    let adminManageHTML = '';
    if (isOrganizer || isAdmin) {
      adminManageHTML = `
        <div class="event-actions">
          <button class="btn btn-secondary" onclick="openEditEventModal('${ev.id}')">Edit</button>
          <button class="btn btn-red" onclick="deleteEvent('${ev.id}')">Delete</button>
        </div>
      `;
    }

    const div = document.createElement('div');
    div.className = 'event-list-item';
    div.innerHTML = `
      <div class="event-list-header">
        <span class="event-list-name">${escapeHTML(ev.name)}</span>
      </div>
      <div class="event-list-meta">
        <span>📅 ${ev.date}</span>
        <span>🕒 ${ev.time}</span>
        <span>📍 ${escapeHTML(ev.venue)}</span>
      </div>
      <p class="event-list-desc">${escapeHTML(ev.description)}</p>
      <div class="event-list-organizer">Organized by: ${escapeHTML(ev.organizerName)}</div>
      ${adminManageHTML}
    `;
    container.appendChild(div);
  });
}

function viewEventDetails(eventId) {
  switchTab(null, 'calendar-view');
  const ev = events.find(e => e.id === eventId);
  if (ev) {
    renderEventsListPanel([ev], ev.date);
  }
}

let activeEditEventId = null;

// Create/Edit Event Modal trigger
function openCreateEventModal() {
  activeEditEventId = null;
  document.getElementById('event-modal-title').innerText = currentUser.role === 'student' ? 'Request Calendar Event' : 'Create Campus Event';
  document.getElementById('event-form-submit-btn').innerText = currentUser.role === 'student' ? 'Submit Listing Request' : 'Publish Event';
  document.getElementById('create-event-form').reset();
  openModal('modal-create-event');
}

function openEditEventModal(eventId) {
  const ev = events.find(e => e.id === eventId);
  if (!ev) return;

  activeEditEventId = eventId;
  document.getElementById('event-modal-title').innerText = 'Edit Event Details';
  document.getElementById('event-form-submit-btn').innerText = 'Save Changes';
  
  document.getElementById('event-name').value = ev.name;
  document.getElementById('event-date').value = ev.date;
  document.getElementById('event-time').value = ev.time;
  document.getElementById('event-venue').value = ev.venue;
  document.getElementById('event-desc').value = ev.description;
  
  openModal('modal-create-event');
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('event-name').value;
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const venue = document.getElementById('event-venue').value;
  const description = document.getElementById('event-desc').value;

  const payload = { name, date, time, venue, description };

  try {
    if (currentUser.role === 'student') {
      // Student request workflow
      await apiCall('/api/events/request', 'POST', payload);
      closeModal('modal-create-event');
      showToast('Event requested successfully! Admin will moderate.', 'success');
    } else {
      if (activeEditEventId) {
        // Edit existing
        await apiCall(`/api/events/${activeEditEventId}`, 'PUT', payload);
        showToast('Event updated successfully!', 'success');
      } else {
        // Create new
        await apiCall('/api/events', 'POST', payload);
        showToast('Campus event published!', 'success');
      }
      closeModal('modal-create-event');
      await fetchEvents();
      renderCalendar();
    }
  } catch (err) {}
}

async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    await apiCall(`/api/events/${eventId}`, 'DELETE');
    showToast('Event deleted.', 'info');
    await fetchEvents();
    renderCalendar();
  } catch (err) {}
}

// Student event requests moderation modal (Admin only)
async function openPendingRequestsModal() {
  try {
    const reqs = await apiCall('/api/events/requests');
    const container = document.getElementById('admin-requests-list');
    container.innerHTML = '';

    const pending = reqs.filter(r => r.status === 'pending');
    document.getElementById('pending-count').innerText = pending.length;

    if (pending.length === 0) {
      container.innerHTML = `<div class="empty-state">No pending student requests.</div>`;
      openModal('modal-admin-requests');
      return;
    }

    pending.forEach(r => {
      const card = document.createElement('div');
      card.className = 'request-admin-card';
      card.innerHTML = `
        <div class="request-info">
          <h4>${escapeHTML(r.name)}</h4>
          <div class="request-student-tag">Submitted by: ${escapeHTML(r.studentName)} (${r.studentEmail})</div>
          <div class="event-list-meta" style="margin-bottom:8px;">
            <span>📅 ${r.date}</span>
            <span>🕒 ${r.time}</span>
            <span>📍 ${escapeHTML(r.venue)}</span>
          </div>
          <p class="event-list-desc">${escapeHTML(r.description)}</p>
        </div>
        <div class="request-admin-actions">
          <button class="btn btn-accent" onclick="processEventRequest('${r.id}', 'approve')">Approve</button>
          <button class="btn btn-red" onclick="processEventRequest('${r.id}', 'reject')">Deny</button>
        </div>
      `;
      container.appendChild(card);
    });

    openModal('modal-admin-requests');
  } catch (err) {}
}

async function processEventRequest(requestId, action) {
  try {
    await apiCall(`/api/events/requests/${requestId}/${action}`, 'POST');
    showToast(`Request ${action}d successfully.`, 'success');
    
    // Refresh modal lists
    await openPendingRequestsModal();
    await fetchEvents();
    renderCalendar();
  } catch (err) {}
}


// --- COMPLAINTS BUSINESS LOGIC ---
async function fetchComplaints() {
  try {
    complaints = await apiCall('/api/complaints');
    renderComplaintsList(complaints);
    updateCampusStats();
  } catch (e) {}
}

function renderComplaintsList(complaintsArray) {
  const container = document.getElementById('complaints-container');
  container.innerHTML = '';

  if (complaintsArray.length === 0) {
    container.innerHTML = `<div class="empty-state">No complaints raised. Campus seems peaceful!</div>`;
    return;
  }

  complaintsArray.forEach(comp => {
    const isOP = comp.isOwnComplaint;
    const isAdmin = currentUser.role === 'admin';
    
    let actionHTML = '';
    if (isOP && !comp.isResolved) {
      actionHTML = `<button class="btn btn-secondary" onclick="resolveComplaint('${comp.id}')">Mark Resolved</button>`;
    }

    let adminHTML = '';
    if (isAdmin) {
      adminHTML = `
        <div class="complaint-admin-reveal">
          ⚠️ <span>Admin Identity Log:</span> Poster is ${comp.posterName} (${comp.posterEmail})
          <button class="btn btn-red" style="padding:2px 8px; font-size:0.7rem; margin-top:8px; display:block;" onclick="deleteComplaint('${comp.id}')">Remove Post</button>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'complaint-card';
    card.innerHTML = `
      <div class="complaint-header">
        <span class="complaint-status-badge ${comp.isResolved ? 'resolved' : 'active'}">
          ${comp.isResolved ? '✓ Resolved' : '● Active'}
        </span>
        <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(comp.createdAt).toLocaleDateString()}</div>
      </div>
      <h3 class="complaint-title">${escapeHTML(comp.title)}</h3>
      <p class="complaint-desc">${escapeHTML(comp.description)}</p>
      
      <div class="complaint-meta-footer">
        <span>Raised by: Anonymous Student</span>
        ${actionHTML}
      </div>
      ${adminHTML}
    `;
    container.appendChild(card);
  });
}

function openCreateComplaintModal() {
  document.getElementById('create-complaint-form').reset();
  openModal('modal-create-complaint');
}

async function handleComplaintSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('comp-title').value;
  const description = document.getElementById('comp-desc').value;

  try {
    await apiCall('/api/complaints', 'POST', { title, description });
    closeModal('modal-create-complaint');
    showToast('Complaint submitted anonymously!', 'success');
    await fetchComplaints();
  } catch (err) {}
}

async function resolveComplaint(id) {
  if (!confirm('Mark this complaint as resolved? This tells the campus the issue is addressed.')) return;
  try {
    await apiCall(`/api/complaints/${id}/resolve`, 'POST');
    showToast('Complaint resolved!', 'success');
    await fetchComplaints();
  } catch (e) {}
}

async function deleteComplaint(id) {
  if (!confirm('Admin: Remove this complaint post from the platform?')) return;
  try {
    await apiCall(`/api/complaints/${id}`, 'DELETE');
    showToast('Complaint post removed.', 'info');
    await fetchComplaints();
  } catch (e) {}
}


// --- TOAST ALERTS MODULE ---
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <span>${message.replace(/\n/g, '<br>')}</span>
    <button style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Utility to escape HTML output
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
