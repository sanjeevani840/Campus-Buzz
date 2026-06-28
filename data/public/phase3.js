/**
 * CAMPBUZZ — Phase 3 Extension Module
 * Senior Connect · Placement Hub · AI Assistant · Community+ · UX
 * Extends app.js without modifying core business logic
 */
(function () {
  'use strict';

  const DATA = window.PHASE3_DATA || {};
  let mentorshipFilters = { branch: '', department: '', company: '', type: '' };
  let placementSubTab = 'dashboard';
  let communitySubTab = 'study-groups';
  let clubEnhanceSubTab = 'announcements';
  let recentPages = JSON.parse(localStorage.getItem('campbuzz_recent') || '[]');
  let activityLog = JSON.parse(localStorage.getItem('campbuzz_activity') || '[]');

  // ─── INIT ─────────────────────────────────────────────────────────
  function init() {
    setupCommandPalette();
    setupAIAssistant();
    setupScrollToTop();
    setupNotifications();
    setupKeyboardShortcuts();
    renderWelcomeWidget();
    logActivity('Phase 3 modules loaded');
    if (document.getElementById('app-layout')?.classList.contains('active')) {
      updateNotifBadge();
    }
  }

  // Patch core app.js hooks immediately (before DOMContentLoaded session restore)
  function patchSwitchTab() {
    const orig = window.switchTab;
    if (!orig) return;
    window.switchTab = async function (e, tabId) {
      const phase3Tabs = ['mentorship-view', 'placement-view', 'community-view', 'campus-services-view'];
      if (phase3Tabs.includes(tabId)) {
        if (e) e.preventDefault();
        window.currentTab = tabId;
        document.querySelectorAll('.menu-item').forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-target') === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const el = document.getElementById(tabId);
        if (el) el.classList.add('active');
        handlePhase3Tab(tabId);
        trackRecentPage(tabId);
        return;
      }
      await orig(e, tabId);
      trackRecentPage(tabId);
      if (tabId === 'club-feed') renderClubEnhancements();
    };
  }

  patchSwitchTab();
  patchShowAppLayout();
  extendFilterSearch();

  function patchShowAppLayout() {
    const orig = window.showAppLayout;
    if (!orig) return;
    window.showAppLayout = function () {
      orig();
      renderWelcomeWidget();
      updateNotifBadge();
      document.getElementById('ai-assistant-fab')?.classList.add('pulse');
      setTimeout(() => document.getElementById('ai-assistant-fab')?.classList.remove('pulse'), 4000);
    };
  }

  function extendFilterSearch() {
    const orig = window.filterSearch;
    window.filterSearch = function () {
      const tab = window.currentTab;
      const q = (document.getElementById('global-search')?.value || '').toLowerCase();
      if (tab === 'mentorship-view') { filterMentors(q); return; }
      if (tab === 'placement-view') { filterPlacement(q); return; }
      if (tab === 'community-view') { filterCommunity(q); return; }
      if (tab === 'campus-services-view') { filterCampusServices(q); return; }
      if (orig) orig();
    };
  }

  function handlePhase3Tab(tabId) {
    switch (tabId) {
      case 'mentorship-view': renderMentorshipPortal(); break;
      case 'placement-view': renderPlacementHub(); break;
      case 'community-view': renderCommunityPlus(); break;
      case 'campus-services-view': renderCampusServices(); break;
    }
  }

  function trackRecentPage(tabId) {
    const labels = {
      'buzz-feed': 'Campus Buzz', 'club-feed': 'Clubs & Board', 'calendar-view': 'Calendar',
      'complaints-view': 'Complaints', 'mentorship-view': 'Connect Portal',
      'placement-view': 'Placement Hub', 'community-view': 'Community+', 'campus-services-view': 'Campus Services'
    };
    const label = labels[tabId] || tabId;
    recentPages = recentPages.filter(p => p.id !== tabId);
    recentPages.unshift({ id: tabId, label, time: Date.now() });
    recentPages = recentPages.slice(0, 5);
    localStorage.setItem('campbuzz_recent', JSON.stringify(recentPages));
    renderRecentPages();
    logActivity(`Visited ${label}`);
  }

  function logActivity(text) {
    activityLog.unshift({ text, time: Date.now() });
    activityLog = activityLog.slice(0, 10);
    localStorage.setItem('campbuzz_activity', JSON.stringify(activityLog));
    renderActivityTimeline();
  }

  function esc(str) {
    if (typeof window.escapeHTML === 'function') return window.escapeHTML(String(str));
    return String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  // ─── MENTORSHIP PORTAL ────────────────────────────────────────────
  function renderMentorshipPortal() {
    const container = document.getElementById('mentorship-view');
    if (!container || container.dataset.rendered === 'full') {
      filterMentors('');
      return;
    }
    container.innerHTML = `
      <div class="p3-module-header reveal">
        <div><h2>Senior–Junior Connect Portal</h2><p>Find mentors, book guidance sessions, and learn from placement experiences.</p></div>
        <span class="integration-badge">API: POST /api/mentorship/request</span>
      </div>
      <div class="p3-filter-bar">
        <select id="filter-branch" onchange="Phase3.setMentorFilter('branch', this.value)"><option value="">All Branches</option><option>CSE</option><option>ECE</option><option>IT</option><option>ME</option></select>
        <select id="filter-dept" onchange="Phase3.setMentorFilter('department', this.value)"><option value="">All Departments</option><option>Computer Science</option><option>Electronics</option><option>Information Technology</option><option>Mechanical</option></select>
        <select id="filter-company" onchange="Phase3.setMentorFilter('company', this.value)"><option value="">All Companies</option>${[...new Set(DATA.seniors.map(s => s.company))].map(c => `<option>${c}</option>`).join('')}</select>
        <select id="filter-type" onchange="Phase3.setMentorFilter('type', this.value)"><option value="">All Mentors</option><option value="placement">Placement Mentors</option><option value="internship">Internship Mentors</option></select>
      </div>
      <div class="p3-spotlight-row" id="success-stories-row"></div>
      <h3 style="margin-bottom:16px; color:var(--accent-champagne); font-size:0.9375rem;">🎓 Alumni Spotlight</h3>
      <div class="p3-grid p3-grid-2" id="alumni-spotlight-row" style="margin-bottom:24px;"></div>
      <h3 style="margin-bottom:16px; color:var(--accent-champagne); font-size:0.9375rem;">👥 Senior Directory</h3>
      <div class="p3-grid p3-grid-2" id="mentors-grid"></div>
    `;
    container.dataset.rendered = 'full';
    renderSuccessStories();
    renderAlumniSpotlight();
    filterMentors('');
  }

  function renderSuccessStories() {
    const row = document.getElementById('success-stories-row');
    if (!row) return;
    row.innerHTML = DATA.successStories.map(s => `
      <div class="spotlight-card glass-card reveal">
        <span class="spotlight-package">${esc(s.package)}</span>
        <blockquote>"${esc(s.quote)}"</blockquote>
        <div class="spotlight-author">${esc(s.name)} · ${esc(s.company)}</div>
      </div>
    `).join('');
  }

  function renderAlumniSpotlight() {
    const row = document.getElementById('alumni-spotlight-row');
    if (!row) return;
    row.innerHTML = DATA.alumniSpotlight.map(a => `
      <div class="spotlight-card glass-card">
        <div class="spotlight-author">${esc(a.name)} · Batch ${esc(a.batch)}</div>
        <p style="font-size:0.8125rem; color:var(--text-secondary); margin:8px 0;">${esc(a.role)}</p>
        <p style="font-size:0.75rem; color:var(--text-muted);">${esc(a.achievement)}</p>
      </div>
    `).join('');
  }

  function setMentorFilter(key, val) {
    mentorshipFilters[key] = val;
    filterMentors(document.getElementById('global-search')?.value?.toLowerCase() || '');
  }

  function filterMentors(q) {
    let list = DATA.seniors.filter(s => {
      if (mentorshipFilters.branch && s.branch !== mentorshipFilters.branch) return false;
      if (mentorshipFilters.department && s.department !== mentorshipFilters.department) return false;
      if (mentorshipFilters.company && s.company !== mentorshipFilters.company) return false;
      if (mentorshipFilters.type && s.type !== mentorshipFilters.type) return false;
      if (q && !(`${s.name} ${s.company} ${s.skills.join(' ')} ${s.branch}`).toLowerCase().includes(q)) return false;
      return true;
    });
    const grid = document.getElementById('mentors-grid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<div class="p3-empty-state"><div class="empty-icon">🔍</div><h4>No mentors found</h4><p>Try adjusting your filters or search query.</p></div>`;
      return;
    }
    grid.innerHTML = list.map(s => `
      <div class="mentor-card glass-card reveal">
        <div class="mentor-card-header">
          <div class="mentor-avatar">${esc(s.name.charAt(0))}</div>
          <div class="mentor-info">
            <h4>${esc(s.name)}</h4>
            <div class="mentor-meta">${esc(s.branch)} · Year ${s.year} · ${esc(s.company)}</div>
            <span class="mentor-badge ${s.type}">${s.type === 'placement' ? 'Placement Mentor' : 'Internship Mentor'}</span>
          </div>
        </div>
        <div class="mentor-skills">${s.skills.map(sk => `<span class="mentor-skill-tag">${esc(sk)}</span>`).join('')}</div>
        <div class="mentor-skills">${s.technologies.map(t => `<span class="mentor-skill-tag">${esc(t)}</span>`).join('')}</div>
        <div class="mentor-card-footer">
          <span class="mentor-rating">★ ${s.rating} · ${s.sessions} sessions</span>
          <div class="mentor-actions">
            ${s.amaAvailable ? `<button class="btn btn-secondary" onclick="Phase3.openMentorModal('${s.id}','ama')">AMA</button>` : ''}
            <button class="btn btn-primary" onclick="Phase3.openMentorModal('${s.id}','mentor')">Connect</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function openMentorModal(id, action) {
    const s = DATA.seniors.find(x => x.id === id);
    if (!s) return;
    const modal = document.getElementById('modal-mentor-detail');
    if (!modal) return;
    document.getElementById('mentor-modal-name').textContent = s.name;
    document.getElementById('mentor-modal-body').innerHTML = `
      <p><strong>${esc(s.role)}</strong> at ${esc(s.company)} · ${esc(s.department)}</p>
      <div style="margin:16px 0; display:flex; gap:8px; flex-wrap:wrap;">
        <a href="${s.linkedin}" target="_blank" class="btn btn-secondary">LinkedIn</a>
        <a href="${s.github}" target="_blank" class="btn btn-secondary">GitHub</a>
        <button class="btn btn-secondary" onclick="showToast('Resume sharing — integrate POST /api/mentorship/resume','info')">Share Resume</button>
      </div>
      <h4 style="margin:12px 0 8px; color:var(--accent-champagne);">Interview Experiences</h4>
      <ul style="font-size:0.8125rem; color:var(--text-secondary); padding-left:16px;">${s.experiences.map(e => `<li style="margin-bottom:6px;">${esc(e)}</li>`).join('')}</ul>
      <div style="margin-top:16px; display:flex; gap:8px;">
        <button class="btn btn-primary" onclick="Phase3.requestMentorship('${s.id}')">Request Mentorship</button>
        <button class="btn btn-accent" onclick="Phase3.bookSession('${s.id}')">Book Guidance Session</button>
        <button class="btn btn-secondary" onclick="Phase3.askQuestion('${s.id}')">Ask Question</button>
      </div>
    `;
    openModal('modal-mentor-detail');
    if (action === 'ama') showToast(`AMA session with ${s.name} — integrate POST /api/mentorship/ama`, 'info');
  }

  function requestMentorship(id) {
    showToast('Mentorship request sent! (Integrate: POST /api/mentorship/request)', 'success');
    closeModal('modal-mentor-detail');
    logActivity('Requested mentorship');
  }
  function bookSession(id) {
    showToast('Session booking UI ready — integrate POST /api/mentorship/book', 'success');
    closeModal('modal-mentor-detail');
  }
  function askQuestion(id) {
    const q = prompt('Your question for the senior:');
    if (q) showToast('Question submitted! (Integrate: POST /api/mentorship/question)', 'success');
  }

  // ─── PLACEMENT HUB ────────────────────────────────────────────────
  function renderPlacementHub() {
    const container = document.getElementById('placement-view');
    if (!container) return;
    container.innerHTML = `
      <div class="p3-module-header reveal">
        <div><h2>Placement Hub</h2><p>Your career command center — companies, applications, and preparation.</p></div>
      </div>
      <div class="p3-subnav" id="placement-subnav">
        ${['dashboard','companies','internships','tracker','resume','resources','statistics'].map(t =>
          `<button class="p3-subnav-btn ${placementSubTab === t ? 'active' : ''}" onclick="Phase3.setPlacementTab('${t}')">${t.charAt(0).toUpperCase() + t.slice(1).replace('-',' ')}</button>`
        ).join('')}
      </div>
      <div id="placement-content"></div>
    `;
    renderPlacementContent();
  }

  function setPlacementTab(tab) {
    placementSubTab = tab;
    document.querySelectorAll('#placement-subnav .p3-subnav-btn').forEach((btn, i) => {
      const tabs = ['dashboard','companies','internships','tracker','resume','resources','statistics'];
      btn.classList.toggle('active', tabs[i] === tab);
    });
    renderPlacementContent();
  }

  function renderPlacementContent() {
    const el = document.getElementById('placement-content');
    if (!el) return;
    const stats = DATA.placementStats;
    switch (placementSubTab) {
      case 'dashboard':
        el.innerHTML = `
          <div class="p3-stat-dashboard">${[
            ['Placed Students', stats.placed], ['Total Eligible', stats.total], ['Avg Package', stats.avgPackage],
            ['Highest Package', stats.highestPackage], ['Companies', stats.companiesVisited], ['Internships', stats.internships]
          ].map(([l,v]) => `<div class="p3-stat-card glass-card"><div class="stat-value">${esc(v)}</div><div class="stat-label">${l}</div></div>`).join('')}</div>
          <h3 style="margin:16px 0 12px; color:var(--accent-champagne);">Recommended Learning Paths</h3>
          <div class="p3-grid p3-grid-3">${DATA.learningPaths.map(p => `
            <div class="company-card glass-card"><h4>${esc(p.title)}</h4><p style="font-size:0.75rem;color:var(--text-muted);">${p.match}% match · ${esc(p.duration)}</p>
            <div class="mentor-skills">${p.skills.map(s => `<span class="mentor-skill-tag">${esc(s)}</span>`).join('')}</div></div>
          `).join('')}</div>
          <h3 style="margin:24px 0 12px; color:var(--accent-champagne);">Skill Gap Analysis</h3>
          <div class="resume-builder-panel glass-card"><p style="font-size:0.8125rem;color:var(--text-secondary);">Based on your profile, focus on: System Design, Dynamic Programming, and Behavioral Interview prep.</p>
          <span class="integration-badge">Integrate: GET /api/placement/skill-gap</span></div>`;
        break;
      case 'companies':
        el.innerHTML = `<div class="p3-grid p3-grid-2">${DATA.companies.map(c => `
          <div class="company-card glass-card"><div class="company-card-header"><span class="company-logo">${c.logo}</span><div><h4>${esc(c.name)}</h4><p style="font-size:0.75rem;color:var(--text-muted);">${esc(c.type)} · ${esc(c.package)}</p></div><span class="company-status ${c.status}">${c.status}</span></div>
          <p style="font-size:0.8125rem;">Roles: ${c.roles.map(r => esc(r)).join(', ')}</p><p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">Deadline: ${esc(c.deadline)}</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Application tracked! (POST /api/placement/apply)','success')">Apply</button></div>
        `).join('')}</div>`;
        break;
      case 'internships':
        el.innerHTML = `<div class="p3-grid p3-grid-2">${DATA.internships.map(i => `
          <div class="internship-card glass-card"><h4>${esc(i.company)} — ${esc(i.role)}</h4><p style="font-size:0.8125rem;color:var(--text-secondary);">${esc(i.duration)} · ${esc(i.stipend)}</p>
          <p style="font-size:0.75rem;color:var(--text-muted);">Deadline: ${esc(i.deadline)} · ${esc(i.type)}</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Internship application saved!','success')">Apply</button></div>
        `).join('')}</div>`;
        break;
      case 'tracker':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Application Tracker</h3><div class="p3-grid p3-grid-2">${DATA.applications.map(a => `
          <div class="tracker-card glass-card"><h4>${esc(a.company)} — ${esc(a.role)}</h4><p style="font-size:0.8125rem;color:var(--accent-champagne);">${esc(a.status)}</p>
          <div class="tracker-progress">${[1,2,3,4,5].map(n => `<div class="tracker-step ${n < a.stage ? 'done' : n === a.stage ? 'active' : ''}"></div>`).join('')}</div>
          <p style="font-size:0.75rem;color:var(--text-muted);">Applied: ${esc(a.date)}</p></div>
        `).join('')}</div>
          <h3 style="margin:24px 0 16px;">Offer Tracker</h3>${DATA.offers.map(o => `
          <div class="tracker-card glass-card"><h4>${esc(o.company)} — ${esc(o.role)}</h4><p>${esc(o.package)} · Deadline: ${esc(o.deadline)}</p>
          <button class="btn btn-accent" onclick="showToast('Offer accepted!','success')">Accept</button> <button class="btn btn-secondary">Decline</button></div>`).join('')}`;
        break;
      case 'resume':
        el.innerHTML = `<div class="p3-grid p3-grid-2"><div class="resume-builder-panel glass-card"><h3>Resume Builder</h3><p style="font-size:0.8125rem;color:var(--text-muted);margin:12px 0;">Build ATS-friendly resumes with guided sections.</p>
          <button class="btn btn-primary" onclick="showToast('Resume builder — integrate POST /api/placement/resume','info')">Start Building</button>
          <span class="integration-badge">POST /api/placement/resume</span></div>
          <div class="resume-builder-panel glass-card" style="text-align:center;"><h3>Resume Score</h3><div class="resume-score-ring"><span class="resume-score-value">78</span><span class="resume-score-label">/ 100</span></div>
          <p style="font-size:0.75rem;color:var(--text-muted);">UI placeholder — integrate GET /api/placement/resume-score</p></div></div>
          <div class="resume-builder-panel glass-card" style="margin-top:16px;"><h3>ATS Resume Checker</h3><p style="font-size:0.8125rem;color:var(--text-muted);margin:12px 0;">Upload your resume for ATS compatibility analysis.</p>
          <input type="file" accept=".pdf,.doc,.docx" style="margin-bottom:12px;color:var(--text-muted);"><button class="btn btn-primary" onclick="showToast('ATS check queued — POST /api/placement/ats-check','info')">Check ATS Score</button></div>
          <div style="margin-top:16px;"><button class="btn btn-accent" onclick="showToast('Mock interview scheduled! POST /api/placement/mock-interview','success')">Schedule Mock Interview</button></div>`;
        break;
      case 'resources':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Coding Roadmap</h3>${DATA.codingRoadmap.map(r => `
          <div class="company-card glass-card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><strong>${esc(r.phase)}</strong><span style="font-size:0.75rem;color:var(--text-muted);">Weeks ${esc(r.weeks)}</span></div>
          <div class="learning-progress-bar"><div class="learning-progress-fill" style="width:${r.progress}%"></div></div>
          <p style="font-size:0.8125rem;color:var(--text-secondary);">${r.topics.map(t => esc(t)).join(' · ')}</p></div>
        `).join('')}
          <h3 style="margin:24px 0 16px;">Aptitude Resources</h3><div class="p3-grid p3-grid-3">${DATA.aptitudeResources.map(r => `
          <div class="company-card glass-card"><h4>${esc(r.title)}</h4><p style="font-size:0.75rem;color:var(--text-muted);">${esc(r.type)} · ${r.downloads} downloads</p></div>`).join('')}</div>
          <h3 style="margin:24px 0 16px;">Core Subject Preparation</h3>${DATA.coreSubjects.map(s => `
          <div class="company-card glass-card" style="margin-bottom:8px;"><strong>${esc(s.subject)}</strong> · ${s.resources} resources
          <div class="learning-progress-bar"><div class="learning-progress-fill" style="width:${s.progress}%"></div></div></div>`).join('')}
          <h3 style="margin:24px 0 16px;">Interview Experiences</h3><div class="p3-empty-state"><p>Browse senior interview experiences in Connect Portal</p><button class="btn btn-primary" style="margin-top:12px;" onclick="switchTab(null,'mentorship-view')">Go to Connect Portal</button></div>`;
        break;
      case 'statistics':
        el.innerHTML = `<div class="p3-stat-dashboard">${[
          ['Placement Rate', Math.round(stats.placed/stats.total*100) + '%'], ['Avg Package', stats.avgPackage], ['Highest', stats.highestPackage], ['Companies Visited', stats.companiesVisited]
        ].map(([l,v]) => `<div class="p3-stat-card glass-card"><div class="stat-value">${esc(v)}</div><div class="stat-label">${l}</div></div>`).join('')}</div>
          <div class="resume-builder-panel glass-card"><h3>Placement Calendar</h3><p style="font-size:0.8125rem;color:var(--text-muted);">View upcoming drives on the Events Calendar.</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="switchTab(null,'calendar-view')">Open Calendar</button></div>
          <div class="resume-builder-panel glass-card" style="margin-top:16px;"><h3>Learning Progress</h3>${DATA.codingRoadmap.map(r => `
          <div style="margin:8px 0;"><span style="font-size:0.8125rem;">${esc(r.phase)}</span><div class="learning-progress-bar"><div class="learning-progress-fill" style="width:${r.progress}%"></div></div></div>`).join('')}</div>`;
        break;
    }
  }

  function filterPlacement(q) {
    if (!q) return;
    showToast(`Searching placement hub for "${q}"`, 'info');
  }

  // ─── COMMUNITY+ ───────────────────────────────────────────────────
  function renderCommunityPlus() {
    const container = document.getElementById('community-view');
    if (!container) return;
    const tabs = ['study-groups','collaboration','hackathon','branch','qa','marketplace','polls','trending'];
    const labels = ['Study Groups','Project Collab','Hackathon Teams','Branch Communities','Q&A','Lost & Found / Buy & Sell','Polls','Trending'];
    container.innerHTML = `
      <div class="p3-module-header reveal"><div><h2>Community+</h2><p>Study groups, collaboration, and campus discussions — extending Campus Buzz.</p></div></div>
      <div class="p3-subnav">${tabs.map((t,i) => `<button class="p3-subnav-btn ${communitySubTab === t ? 'active' : ''}" onclick="Phase3.setCommunityTab('${t}')">${labels[i]}</button>`).join('')}</div>
      <div id="community-content"></div>`;
    renderCommunityContent();
  }

  function setCommunityTab(tab) {
    communitySubTab = tab;
    document.querySelectorAll('#community-view .p3-subnav-btn').forEach((btn, i) => {
      const tabs = ['study-groups','collaboration','hackathon','branch','qa','marketplace','polls','trending'];
      btn.classList.toggle('active', tabs[i] === tab);
    });
    renderCommunityContent();
  }

  function renderCommunityContent() {
    const el = document.getElementById('community-content');
    if (!el) return;
    const cf = DATA.communityFeatures;
    switch (communitySubTab) {
      case 'study-groups':
        el.innerHTML = `<div class="p3-grid p3-grid-2">${cf.studyGroups.map(g => `
          <div class="community-card glass-card"><h4>${esc(g.name)}</h4><p style="font-size:0.8125rem;color:var(--text-muted);">${esc(g.branch)} · ${g.members} members · ${esc(g.topic)}</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Joined study group! POST /api/community/groups/join','success')">Join Group</button></div>`).join('')}
          <div class="community-card glass-card" style="border-style:dashed;"><h4>+ Create Study Group</h4><button class="btn btn-secondary" style="margin-top:12px;" onclick="showToast('Create group — POST /api/community/groups','info')">Create</button></div></div>`;
        break;
      case 'collaboration':
        el.innerHTML = `<div class="p3-grid p3-grid-2">${cf.collaborations.map(c => `
          <div class="community-card glass-card"><h4>${esc(c.title)}</h4><p style="font-size:0.8125rem;">${c.members} members · Need ${c.needed} more</p>
          <div class="mentor-skills">${c.skills.map(s => `<span class="mentor-skill-tag">${esc(s)}</span>`).join('')}</div>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Collaboration request sent!','success')">Collaborate</button></div>`).join('')}</div>`;
        break;
      case 'hackathon':
        el.innerHTML = `<div class="p3-grid p3-grid-2">${cf.hackathonTeams.map(t => `
          <div class="community-card glass-card"><h4>${esc(t.event)}</h4><p style="font-size:0.8125rem;">Team: ${t.teamSize}/${t.maxSize} · Looking for: ${t.looking.map(l => esc(l)).join(', ')}</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Team join request sent!','success')">Join Team</button></div>`).join('')}</div>`;
        break;
      case 'branch':
        el.innerHTML = `<div class="p3-grid p3-grid-3">${cf.branchCommunities.map(b => `
          <div class="community-card glass-card" onclick="showToast('Opening ${b.branch} community','info')" style="cursor:pointer;"><h4>${esc(b.branch)}</h4><p style="font-size:0.8125rem;color:var(--text-muted);">${b.members} members · ${b.posts} posts</p></div>`).join('')}</div>`;
        break;
      case 'qa':
        el.innerHTML = cf.qa.map(q => `
          <div class="community-card glass-card ${q.pinned ? 'pinned' : ''}" style="margin-bottom:12px;"><h4>${q.pinned ? '📌 ' : ''}${esc(q.q)}</h4>
          <p style="font-size:0.8125rem;color:var(--text-muted);">${q.answers} answers · ${q.votes} votes · ${esc(q.author)}</p>
          <button class="btn btn-secondary" style="margin-top:8px;" onclick="showToast('Answer posted! POST /api/community/qa','success')">Answer</button></div>`).join('') +
          `<button class="btn btn-primary" style="margin-top:16px;" onclick="showToast('Question posted! POST /api/community/qa','success')">Ask Question</button>`;
        break;
      case 'marketplace':
        el.innerHTML = `<p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:16px;">Lost & Found and Buy & Sell are integrated with Campus Buzz hashtags.</p>
          <button class="btn btn-primary" onclick="switchTab(null,'buzz-feed'); setTimeout(() => filterFeed('#lostfound'), 300);">Browse Lost & Found</button>
          <button class="btn btn-secondary" style="margin-left:8px;" onclick="switchTab(null,'buzz-feed'); setTimeout(() => filterFeed('#resell'), 300);">Browse Buy & Sell</button>
          <div class="community-card glass-card" style="margin-top:16px;"><h4>Roommate Finder</h4><p style="font-size:0.8125rem;color:var(--text-muted);">Find roommates near campus. POST /api/community/roommate</p>
          <button class="btn btn-secondary" style="margin-top:8px;" onclick="showToast('Roommate finder — coming soon','info')">Browse Listings</button></div>`;
        break;
      case 'polls':
        el.innerHTML = cf.polls.map(p => `
          <div class="community-card glass-card" style="margin-bottom:16px;"><h4>${esc(p.question)}</h4><p style="font-size:0.75rem;color:var(--text-muted);margin:8px 0;">${p.total} votes</p>
          ${p.options.map(o => `<div class="poll-option"><div class="poll-bar" style="width:${Math.round(o.votes/p.total*100)}%"></div><span>${esc(o.text)}</span><span style="margin-left:auto;font-size:0.75rem;">${o.votes}</span></div>`).join('')}</div>`).join('') +
          `<button class="btn btn-primary" onclick="showToast('Poll created! POST /api/community/polls','success')">Create Poll</button>`;
        break;
      case 'trending':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Trending Topics</h3><div style="display:flex;flex-wrap:wrap;gap:8px;">${cf.trending.map(t => `<span class="trending-tag" onclick="showToast('Browsing ${t}','info')">${esc(t)}</span>`).join('')}</div>
          <h3 style="margin:24px 0 16px;">Pinned Discussions</h3>${cf.qa.filter(q => q.pinned).map(q => `<div class="community-card glass-card pinned" style="margin-bottom:8px;"><h4>📌 ${esc(q.q)}</h4></div>`).join('')}`;
        break;
    }
  }

  function filterCommunity(q) { if (q) showToast(`Searching community for "${q}"`, 'info'); }

  // ─── CAMPUS SERVICES ──────────────────────────────────────────────
  function renderCampusServices() {
    const container = document.getElementById('campus-services-view');
    if (!container || container.dataset.rendered) {
      filterCampusServices(document.getElementById('global-search')?.value?.toLowerCase() || '');
      return;
    }
    container.innerHTML = `
      <div class="p3-module-header reveal"><div><h2>Campus Services</h2><p>Announcements, resources, faculty, and student support.</p></div></div>
      <div class="p3-subnav">
        <button class="p3-subnav-btn active" data-section="announcements" onclick="Phase3.showCampusSection('announcements')">Announcements</button>
        <button class="p3-subnav-btn" data-section="scholarships" onclick="Phase3.showCampusSection('scholarships')">Scholarships</button>
        <button class="p3-subnav-btn" data-section="resources" onclick="Phase3.showCampusSection('resources')">Resource Library</button>
        <button class="p3-subnav-btn" data-section="deadlines" onclick="Phase3.showCampusSection('deadlines')">Deadlines</button>
        <button class="p3-subnav-btn" data-section="faculty" onclick="Phase3.showCampusSection('faculty')">Faculty</button>
        <button class="p3-subnav-btn" data-section="services" onclick="Phase3.showCampusSection('services')">Services</button>
        <button class="p3-subnav-btn" data-section="emergency" onclick="Phase3.showCampusSection('emergency')">Emergency</button>
        <button class="p3-subnav-btn" data-section="feedback" onclick="Phase3.showCampusSection('feedback')">Feedback</button>
      </div>
      <div id="campus-services-content"></div>`;
    container.dataset.rendered = '1';
    showCampusSection('announcements');
  }

  function showCampusSection(section) {
    document.querySelectorAll('#campus-services-view .p3-subnav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });
    const el = document.getElementById('campus-services-content');
    if (!el) return;
    switch (section) {
      case 'announcements':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Campus Announcements & Notice Board</h3>${DATA.announcements.map(a => `
          <div class="deadline-item glass-card"><div class="deadline-urgency ${a.priority === 'high' ? 'urgent' : 'soon'}">${a.priority === 'high' ? '!' : '•'}</div>
          <div><strong>${esc(a.title)}</strong><p style="font-size:0.75rem;color:var(--text-muted);">${esc(a.category)} · ${esc(a.date)}</p></div></div>`).join('')}`;
        break;
      case 'scholarships':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Scholarship Corner</h3>${DATA.scholarships.map(s => `
          <div class="company-card glass-card" style="margin-bottom:12px;"><h4>${esc(s.name)}</h4><p style="font-size:0.8125rem;color:var(--accent-champagne);">${esc(s.amount)}</p>
          <p style="font-size:0.75rem;color:var(--text-muted);">Deadline: ${esc(s.deadline)} · ${esc(s.eligibility)}</p>
          <button class="btn btn-primary" style="margin-top:8px;" onclick="showToast('Scholarship application — POST /api/campus/scholarships','info')">Apply</button></div>`).join('')}`;
        break;
      case 'resources':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Resource Library & Study Material Hub</h3><div class="p3-grid p3-grid-3">${DATA.resources.map(r => `
          <div class="service-card glass-card"><div class="service-icon">📚</div><h4>${esc(r.title)}</h4><p>${esc(r.category)} · ${r.count} items · ${esc(r.type)}</p></div>`).join('')}</div>
          <h3 style="margin:24px 0 16px;">Internship Corner</h3><button class="btn btn-primary" onclick="switchTab(null,'placement-view'); Phase3.setPlacementTab('internships');">Browse Internships</button>`;
        break;
      case 'deadlines':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Important Deadlines</h3>${DATA.deadlines.map(d => `
          <div class="deadline-item glass-card"><div class="deadline-urgency ${d.daysLeft <= 7 ? 'urgent' : 'soon'}">${d.daysLeft}d</div>
          <div><strong>${esc(d.title)}</strong><p style="font-size:0.75rem;color:var(--text-muted);">${esc(d.category)} · ${esc(d.date)}</p></div></div>`).join('')}`;
        break;
      case 'faculty':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Faculty Directory</h3><div class="p3-grid p3-grid-2">${DATA.faculty.map(f => `
          <div class="community-card glass-card"><h4>${esc(f.name)}</h4><p style="font-size:0.8125rem;">${esc(f.designation)} · ${esc(f.department)}</p>
          <p style="font-size:0.75rem;color:var(--text-muted);">${esc(f.email)} · ${esc(f.office)}</p></div>`).join('')}</div>`;
        break;
      case 'services':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Campus Services & Student Helpline</h3><div class="p3-grid p3-grid-4">${DATA.campusServices.map(s => `
          <div class="service-card glass-card"><div class="service-icon">${s.icon}</div><h4>${esc(s.title)}</h4><p>${esc(s.hours)}<br>${esc(s.contact)}</p></div>`).join('')}</div>`;
        break;
      case 'emergency':
        el.innerHTML = `<h3 style="margin-bottom:16px;">Emergency Contacts</h3>${DATA.emergencyContacts.map(e => `
          <div class="deadline-item glass-card"><div class="deadline-urgency urgent">SOS</div><div><strong>${esc(e.name)}</strong><p style="font-size:1rem;color:var(--accent-coral);font-weight:700;">${esc(e.number)}</p><p style="font-size:0.75rem;color:var(--text-muted);">${esc(e.type)}</p></div></div>`).join('')}`;
        break;
      case 'feedback':
        el.innerHTML = `<div class="resume-builder-panel glass-card"><h3>Feedback & Suggestions</h3><textarea id="feedback-text" rows="4" placeholder="Share your feedback..." style="width:100%;margin:12px 0;padding:12px;background:var(--bg-input);border:1px solid var(--border-default);border-radius:8px;color:var(--text-primary);"></textarea>
          <button class="btn btn-primary" onclick="Phase3.submitFeedback()">Submit Feedback</button><span class="integration-badge">POST /api/campus/feedback</span></div>`;
        break;
    }
  }

  function submitFeedback() {
    const text = document.getElementById('feedback-text')?.value;
    if (!text?.trim()) { showToast('Please enter feedback', 'error'); return; }
    showToast('Thank you for your feedback!', 'success');
    logActivity('Submitted feedback');
  }

  function filterCampusServices(q) { if (q) showToast(`Searching campus services for "${q}"`, 'info'); }

  // ─── CLUB ENHANCEMENTS ────────────────────────────────────────────
  function renderClubEnhancements() {
    const container = document.getElementById('club-enhancements');
    if (!container) return;
    const ce = DATA.clubEnhancements;
    container.innerHTML = `
      <div class="club-enhance-section">
        <div class="p3-subnav" style="margin-top:24px;">
          <button class="p3-subnav-btn active" onclick="Phase3.setClubTab('profiles')">Club Profiles</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('recruitments')">Recruitments</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('workshops')">Workshops</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('projects')">Projects</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('hackathons')">Hackathons</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('volunteer')">Volunteer</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('gallery')">Gallery</button>
          <button class="p3-subnav-btn" onclick="Phase3.setClubTab('timeline')">Timeline</button>
        </div>
        <div id="club-enhance-content"></div>
      </div>`;
    setClubTab('profiles');
  }

  function setClubTab(tab) {
    clubEnhanceSubTab = tab;
    const ce = DATA.clubEnhancements;
    const el = document.getElementById('club-enhance-content');
    if (!el) return;
    switch (tab) {
      case 'profiles':
        el.innerHTML = `<div class="club-enhance-grid">${ce.profiles.map(p => `
          <div class="club-enhance-card glass-card"><h4>${esc(p.name)}</h4><p style="font-size:0.8125rem;color:var(--text-muted);">${p.members} members · Est. ${esc(p.founded)}</p><p style="font-size:0.875rem;margin:8px 0;">${esc(p.tagline)}</p>
          <p style="font-size:0.75rem;">🏆 ${p.achievements.map(a => esc(a)).join(' · ')}</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Event registration — POST /api/clubs/register','success')">Register for Events</button></div>`).join('')}</div>`;
        break;
      case 'recruitments':
        el.innerHTML = ce.recruitments.map(r => `<div class="club-enhance-card glass-card" style="margin-bottom:12px;"><h4>${esc(r.club)} — ${esc(r.role)}</h4><p style="font-size:0.8125rem;">${r.positions} positions · Deadline: ${esc(r.deadline)}</p><button class="btn btn-primary" style="margin-top:8px;" onclick="showToast('Application submitted!','success')">Apply</button></div>`).join('');
        break;
      case 'workshops':
        el.innerHTML = `<div class="club-enhance-grid">${ce.workshops.map(w => `<div class="club-enhance-card glass-card"><h4>${esc(w.title)}</h4><p style="font-size:0.8125rem;">${esc(w.club)} · ${esc(w.date)} · ${w.seats} seats</p><button class="btn btn-primary" style="margin-top:8px;" onclick="showToast('Workshop registered!','success')">Register</button></div>`).join('')}</div>`;
        break;
      case 'projects':
        el.innerHTML = `<div class="club-enhance-grid">${ce.projects.map(p => `<div class="club-enhance-card glass-card"><h4>${esc(p.title)}</h4><p style="font-size:0.8125rem;">${esc(p.club)} · ${esc(p.status)} · ${p.members} members</p></div>`).join('')}</div>`;
        break;
      case 'hackathons':
        el.innerHTML = ce.hackathons.map(h => `<div class="club-enhance-card glass-card" style="margin-bottom:12px;"><h4>${esc(h.name)}</h4><p style="font-size:0.8125rem;">${esc(h.date)} · Prize: ${esc(h.prize)} · ${h.registrations} registered</p><button class="btn btn-primary" style="margin-top:8px;" onclick="switchTab(null,'calendar-view')">View Event</button></div>`).join('');
        break;
      case 'volunteer':
        el.innerHTML = ce.volunteer.map(v => `<div class="club-enhance-card glass-card" style="margin-bottom:12px;"><h4>${esc(v.org)} — ${esc(v.role)}</h4><p style="font-size:0.8125rem;">${esc(v.date)} · ${v.slots} slots</p><button class="btn btn-accent" style="margin-top:8px;" onclick="showToast('Volunteer signup confirmed!','success')">Sign Up</button></div>`).join('');
        break;
      case 'gallery':
        el.innerHTML = `<div class="p3-empty-state"><div class="empty-icon">🖼️</div><h4>Club Gallery</h4><p>Photo gallery integration point — GET /api/clubs/gallery</p></div>`;
        break;
      case 'timeline':
        el.innerHTML = `<div class="activity-timeline-item"><span class="activity-dot"></span><span>Hackathon 2026 announced — Coding Club</span></div>
          <div class="activity-timeline-item"><span class="activity-dot"></span><span>Annual Play Auditions — Drama Society</span></div>
          <div class="activity-timeline-item"><span class="activity-dot"></span><span>Core team recruitment opens — Robotics Club</span></div>`;
        break;
    }
  }

  // ─── AI ASSISTANT ─────────────────────────────────────────────────
  function setupAIAssistant() {
    document.getElementById('ai-assistant-fab')?.addEventListener('click', toggleAI);
    document.getElementById('ai-send-btn')?.addEventListener('click', sendAIMessage);
    document.getElementById('ai-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendAIMessage(); });
    DATA.aiQuickActions?.forEach(a => {
      document.getElementById('ai-quick-actions')?.addEventListener('click', e => {
        const btn = e.target.closest('.ai-quick-btn');
        if (btn) handleAIQuickAction(btn.dataset.action);
      });
    });
    appendAIMessage('bot', 'Hello! I\'m your Smart Campus AI Assistant. How can I help you today?');
  }

  function toggleAI() {
    document.getElementById('ai-assistant-panel')?.classList.toggle('open');
  }

  function handleAIQuickAction(action) {
    const resp = DATA.aiResponses[action] || DATA.aiResponses.default;
    appendAIMessage('user', DATA.aiQuickActions.find(a => a.id === action)?.label || action);
    setTimeout(() => appendAIMessage('bot', resp), 400);
  }

  function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const text = input?.value?.trim();
    if (!text) return;
    appendAIMessage('user', text);
    input.value = '';
    const lower = text.toLowerCase();
    let resp = DATA.aiResponses.default;
    for (const [key, val] of Object.entries(DATA.aiResponses)) {
      if (key !== 'default' && lower.includes(key)) { resp = val; break; }
    }
    if (lower.includes('complaint')) resp = DATA.aiResponses.complaint;
    else if (lower.includes('event') || lower.includes('calendar')) resp = DATA.aiResponses.events;
    else if (lower.includes('club')) resp = DATA.aiResponses.clubs;
    else if (lower.includes('placement') || lower.includes('job')) resp = DATA.aiResponses.placement;
    else if (lower.includes('resume')) resp = DATA.aiResponses.resume;
    else if (lower.includes('interview')) resp = DATA.aiResponses.interview;
    else if (lower.includes('roadmap') || lower.includes('coding')) resp = DATA.aiResponses.roadmap;
    else if (lower.includes('navigate') || lower.includes('where')) resp = DATA.aiResponses.navigate;
    setTimeout(() => appendAIMessage('bot', resp), 500);
  }

  function appendAIMessage(type, text) {
    const box = document.getElementById('ai-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `ai-msg ${type}`;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // ─── COMMAND PALETTE ──────────────────────────────────────────────
  function setupCommandPalette() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCommandPalette(); }
      if (e.key === 'Escape') closeCommandPalette();
    });
    document.getElementById('cmd-search')?.addEventListener('input', filterCommands);
    document.getElementById('command-palette-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'command-palette-overlay') closeCommandPalette();
    });
  }

  function openCommandPalette() {
    document.getElementById('command-palette-overlay')?.classList.add('open');
    const input = document.getElementById('cmd-search');
    if (input) { input.value = ''; input.focus(); }
    renderCommandResults('');
  }

  function closeCommandPalette() {
    document.getElementById('command-palette-overlay')?.classList.remove('open');
  }

  function filterCommands() {
    renderCommandResults(document.getElementById('cmd-search')?.value?.toLowerCase() || '');
  }

  function renderCommandResults(q) {
    const list = DATA.commandPaletteItems.filter(item =>
      !q || item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
    const el = document.getElementById('command-results');
    if (!el) return;
    el.innerHTML = list.map((item, i) => `
      <div class="command-item ${i === 0 ? 'selected' : ''}" onclick="Phase3.executeCommand('${item.id || ''}','${item.action || ''}')">
        <span class="command-item-icon">${item.icon}</span>
        <span class="command-item-label">${esc(item.label)}</span>
        <span class="command-item-cat">${esc(item.category)}</span>
      </div>`).join('');
  }

  function executeCommand(id, action) {
    closeCommandPalette();
    if (id) switchTab(null, id);
    else if (action === 'create-post') openCreatePostModal?.();
    else if (action === 'create-complaint') openCreateComplaintModal?.();
    else if (action === 'ai-assistant') toggleAI();
    else if (action === 'shortcuts') openModal('modal-shortcuts');
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────
  function setupNotifications() {
    document.getElementById('notif-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('notification-panel')?.classList.toggle('open');
    });
    document.addEventListener('click', () => document.getElementById('notification-panel')?.classList.remove('open'));
    renderNotifications();
  }

  function renderNotifications() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    list.innerHTML = DATA.notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Phase3.markNotifRead('${n.id}')">
        <div class="notif-item-title">${esc(n.title)}</div>
        <div class="notif-item-time">${esc(n.time)}</div>
      </div>`).join('');
  }

  function markNotifRead(id) {
    const n = DATA.notifications.find(x => x.id === id);
    if (n) n.read = true;
    updateNotifBadge();
    renderNotifications();
  }

  function updateNotifBadge() {
    const unread = DATA.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = unread ? 'block' : 'none';
  }

  // ─── SCROLL TO TOP ────────────────────────────────────────────────
  function setupScrollToTop() {
    const btn = document.getElementById('scroll-to-top');
    const content = document.querySelector('.view-content');
    content?.addEventListener('scroll', () => {
      if (btn) btn.classList.toggle('visible', content.scrollTop > 300);
    });
    btn?.addEventListener('click', () => content?.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === '?' && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        openModal('modal-shortcuts');
      }
    });
  }

  // ─── WELCOME & ACTIVITY WIDGETS ───────────────────────────────────
  function renderWelcomeWidget() {
    const el = document.getElementById('welcome-widget');
    if (!el || !window.currentUser) return;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    el.innerHTML = `<h4>${greeting}, ${esc(currentUser.name.split(' ')[0])}! 👋</h4><p>Welcome back to your campus command center.</p>`;
    renderRecentPages();
    renderActivityTimeline();
    renderSmartRecommendations();
  }

  function renderRecentPages() {
    const el = document.getElementById('recent-pages');
    if (!el) return;
    el.innerHTML = recentPages.slice(0, 4).map(p =>
      `<div class="recent-page-item" onclick="switchTab(null,'${p.id}')"><span>↩</span> ${esc(p.label)}</div>`
    ).join('') || '<p style="font-size:0.75rem;color:var(--text-muted);">No recent pages yet</p>';
  }

  function renderActivityTimeline() {
    const el = document.getElementById('activity-timeline');
    if (!el) return;
    el.innerHTML = activityLog.slice(0, 5).map(a =>
      `<div class="activity-timeline-item"><span class="activity-dot"></span><span>${esc(a.text)}</span></div>`
    ).join('') || '<p style="font-size:0.75rem;color:var(--text-muted);">No recent activity</p>';
  }

  function renderSmartRecommendations() {
    const el = document.getElementById('smart-recommendations');
    if (!el) return;
    el.innerHTML = `
      <div class="recent-page-item" onclick="switchTab(null,'mentorship-view')">🤝 Connect with placement mentors</div>
      <div class="recent-page-item" onclick="switchTab(null,'placement-view')">💼 Check placement dashboard</div>
      <div class="recent-page-item" onclick="switchTab(null,'calendar-view')">📅 Hackathon 2026 — Jul 5</div>`;
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────
  window.Phase3 = {
    setMentorFilter, openMentorModal, requestMentorship, bookSession, askQuestion,
    setPlacementTab, setCommunityTab, showCampusSection, submitFeedback,
    setClubTab, executeCommand, markNotifRead, toggleAI, openCommandPalette,
    onTabSwitch: handlePhase3Tab
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
