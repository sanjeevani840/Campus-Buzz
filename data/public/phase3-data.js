/* Phase 3 — Mock Data & Integration Points */
window.PHASE3_DATA = {
  seniors: [
    { id: 's1', name: 'Arjun Mehta', branch: 'CSE', department: 'Computer Science', year: 4, company: 'Google', role: 'SDE Intern', type: 'placement', skills: ['DSA', 'System Design', 'React'], technologies: ['Python', 'Go', 'Kubernetes'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['Google SWE intern — cleared 3 OA rounds + 2 tech interviews', 'Microsoft Engage — selected from 2000 applicants'], amaAvailable: true, rating: 4.9, sessions: 47 },
    { id: 's2', name: 'Priya Nair', branch: 'ECE', department: 'Electronics', year: 4, company: 'Amazon', role: 'SDE-1', type: 'placement', skills: ['Embedded Systems', 'C++', 'IoT'], technologies: ['C', 'Verilog', 'AWS'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['Amazon SDE — focus on leadership principles + LP + coding'], amaAvailable: true, rating: 4.8, sessions: 32 },
    { id: 's3', name: 'Vikram Singh', branch: 'CSE', department: 'Computer Science', year: 3, company: 'Flipkart', role: 'Intern', type: 'internship', skills: ['Backend', 'Java', 'Spring Boot'], technologies: ['Java', 'PostgreSQL', 'Redis'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['Flipkart summer intern — backend team, REST APIs at scale'], amaAvailable: false, rating: 4.7, sessions: 18 },
    { id: 's4', name: 'Ananya Das', branch: 'IT', department: 'Information Technology', year: 4, company: 'Goldman Sachs', role: 'Analyst', type: 'placement', skills: ['Finance', 'Quant', 'Python'], technologies: ['Python', 'SQL', 'Excel VBA'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['GS Analyst — probability puzzles + coding + HR round'], amaAvailable: true, rating: 4.9, sessions: 55 },
    { id: 's5', name: 'Rohan Kapoor', branch: 'ME', department: 'Mechanical', year: 4, company: 'Tesla', role: 'Design Engineer', type: 'placement', skills: ['CAD', 'FEA', 'Manufacturing'], technologies: ['SolidWorks', 'ANSYS', 'MATLAB'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['Tesla design engineer — portfolio + technical + culture fit'], amaAvailable: true, rating: 4.6, sessions: 21 },
    { id: 's6', name: 'Meera Joshi', branch: 'CSE', department: 'Computer Science', year: 3, company: 'Microsoft', role: 'Engage Intern', type: 'internship', skills: ['Full Stack', 'Azure', 'TypeScript'], technologies: ['React', 'Node.js', 'Azure'], linkedin: 'https://linkedin.com', github: 'https://github.com', resumeUrl: '#', experiences: ['MS Engage — project showcase + aptitude + coding'], amaAvailable: true, rating: 4.8, sessions: 29 }
  ],
  successStories: [
    { name: 'Arjun Mehta', company: 'Google', quote: 'Started with DSA daily grind. Mentorship sessions helped me crack system design.', package: '₹45 LPA' },
    { name: 'Ananya Das', company: 'Goldman Sachs', quote: 'Quant prep + mock interviews made all the difference in the final round.', package: '₹38 LPA' },
    { name: 'Priya Nair', company: 'Amazon', quote: 'Leadership principles prep was key. Seniors guided me through LP stories.', package: '₹42 LPA' }
  ],
  alumniSpotlight: [
    { name: 'Dr. Rajesh Kumar', batch: '2018', role: 'Staff Engineer @ Meta', achievement: 'Built infra serving 2B+ users' },
    { name: 'Sneha Patel', batch: '2019', role: 'Founder @ EduTech Startup', achievement: 'Raised $5M Series A' }
  ],
  companies: [
    { id: 'c1', name: 'Google', logo: '🔵', type: 'Product', roles: ['SDE', 'SWE Intern'], package: '₹40-50 LPA', deadline: '2026-08-15', status: 'open' },
    { id: 'c2', name: 'Amazon', logo: '🟠', type: 'Product', roles: ['SDE-1', 'SDE Intern'], package: '₹38-44 LPA', deadline: '2026-08-20', status: 'open' },
    { id: 'c3', name: 'Microsoft', logo: '🟢', type: 'Product', roles: ['SDE', 'Engage Intern'], package: '₹35-42 LPA', deadline: '2026-09-01', status: 'upcoming' },
    { id: 'c4', name: 'Goldman Sachs', logo: '🔷', type: 'Finance', roles: ['Analyst', 'Engineering'], package: '₹30-38 LPA', deadline: '2026-07-30', status: 'open' },
    { id: 'c5', name: 'Flipkart', logo: '🟡', type: 'E-commerce', roles: ['SDE', 'Intern'], package: '₹28-35 LPA', deadline: '2026-08-10', status: 'open' },
    { id: 'c6', name: 'TCS', logo: '🔴', type: 'IT Services', roles: ['Ninja', 'Digital'], package: '₹7-9 LPA', deadline: '2026-09-15', status: 'upcoming' }
  ],
  internships: [
    { id: 'i1', company: 'Google', role: 'STEP Intern', duration: '12 weeks', stipend: '₹1.2L/month', deadline: '2026-07-15', type: 'Summer' },
    { id: 'i2', company: 'Microsoft', role: 'Engage Mentorship', duration: '4 weeks', stipend: 'Certificate + Stipend', deadline: '2026-07-20', type: 'Summer' },
    { id: 'i3', company: 'Razorpay', role: 'Backend Intern', duration: '6 months', stipend: '₹50K/month', deadline: '2026-08-01', type: 'Semester' },
    { id: 'i4', company: 'Swiggy', role: 'Data Science Intern', duration: '3 months', stipend: '₹45K/month', deadline: '2026-07-25', type: 'Summer' }
  ],
  placementStats: { placed: 847, total: 1200, avgPackage: '₹12.4 LPA', highestPackage: '₹52 LPA', companiesVisited: 156, internships: 423 },
  applications: [
    { id: 'a1', company: 'Google', role: 'SDE Intern', status: 'Interview Scheduled', date: '2026-07-02', stage: 3 },
    { id: 'a2', company: 'Amazon', role: 'SDE-1', status: 'Applied', date: '2026-06-28', stage: 1 },
    { id: 'a3', company: 'Microsoft', role: 'Engage', status: 'Shortlisted', date: '2026-06-25', stage: 2 }
  ],
  offers: [
    { id: 'o1', company: 'Startup XYZ', role: 'Full Stack Intern', package: '₹40K/month', deadline: '2026-07-05', status: 'pending' }
  ],
  codingRoadmap: [
    { phase: 'Foundation', topics: ['Arrays', 'Strings', 'Hash Maps'], progress: 100, weeks: '1-4' },
    { phase: 'Core DSA', topics: ['Trees', 'Graphs', 'DP'], progress: 65, weeks: '5-10' },
    { phase: 'Advanced', topics: ['System Design', 'Concurrency'], progress: 20, weeks: '11-16' }
  ],
  aptitudeResources: [
    { title: 'Quantitative Aptitude', type: 'PDF', downloads: 2340 },
    { title: 'Logical Reasoning Mastery', type: 'Video Series', downloads: 1890 },
    { title: 'Verbal Ability Handbook', type: 'PDF', downloads: 1560 }
  ],
  coreSubjects: [
    { subject: 'Operating Systems', progress: 70, resources: 12 },
    { subject: 'DBMS', progress: 55, resources: 8 },
    { subject: 'Computer Networks', progress: 40, resources: 10 },
    { subject: 'OOP & Design Patterns', progress: 80, resources: 6 }
  ],
  learningPaths: [
    { title: 'Full Stack Developer', match: 92, duration: '6 months', skills: ['React', 'Node.js', 'MongoDB'] },
    { title: 'Backend Engineer', match: 78, duration: '4 months', skills: ['Java', 'Spring', 'PostgreSQL'] },
    { title: 'Data Engineer', match: 65, duration: '5 months', skills: ['Python', 'Spark', 'SQL'] }
  ],
  announcements: [
    { id: 'ann1', title: 'Mid-Semester Exam Schedule Released', category: 'Academic', date: '2026-06-27', priority: 'high' },
    { id: 'ann2', title: 'Library Extended Hours During Exams', category: 'Campus', date: '2026-06-26', priority: 'medium' },
    { id: 'ann3', title: 'Placement Drive Registration Opens', category: 'Placement', date: '2026-06-25', priority: 'high' }
  ],
  scholarships: [
    { name: 'Merit Scholarship 2026', amount: '₹50,000', deadline: '2026-07-15', eligibility: 'CGPA > 8.5' },
    { name: 'Need-Based Financial Aid', amount: 'Full Tuition', deadline: '2026-08-01', eligibility: 'Family income < ₹5L' },
    { name: 'Research Fellowship', amount: '₹25,000/month', deadline: '2026-07-30', eligibility: 'Final year projects' }
  ],
  resources: [
    { title: 'Previous Year Question Papers', category: 'Academic', type: 'PDF', count: 450 },
    { title: 'Lab Manuals Collection', category: 'Academic', type: 'PDF', count: 89 },
    { title: 'Placement Prep Materials', category: 'Career', type: 'Mixed', count: 234 }
  ],
  deadlines: [
    { title: 'Google Intern Application', date: '2026-07-15', category: 'Placement', daysLeft: 18 },
    { title: 'Scholarship Form Submission', date: '2026-07-15', category: 'Financial', daysLeft: 18 },
    { title: 'Course Registration', date: '2026-07-01', category: 'Academic', daysLeft: 4 }
  ],
  faculty: [
    { name: 'Dr. S. Verma', department: 'CSE', designation: 'Professor', email: 'sverma@college.edu', office: 'Block A, 301' },
    { name: 'Dr. K. Sharma', department: 'ECE', designation: 'Associate Prof', email: 'ksharma@college.edu', office: 'Block B, 205' },
    { name: 'Dr. P. Gupta', department: 'ME', designation: 'HOD', email: 'pgupta@college.edu', office: 'Block C, 101' }
  ],
  campusServices: [
    { icon: '🏥', title: 'Health Center', hours: '9 AM - 5 PM', contact: 'Ext. 1234' },
    { icon: '🚌', title: 'Transport Desk', hours: '7 AM - 7 PM', contact: 'Ext. 5678' },
    { icon: '📚', title: 'Library Services', hours: '8 AM - 10 PM', contact: 'Ext. 9012' },
    { icon: '🍽️', title: 'Mess Management', hours: '6 AM - 9 PM', contact: 'Ext. 3456' }
  ],
  emergencyContacts: [
    { name: 'Campus Security', number: '100', type: 'Emergency' },
    { name: 'Medical Emergency', number: '108', type: 'Emergency' },
    { name: 'Anti-Ragging Helpline', number: '1800-180-5522', type: 'Helpline' },
    { name: 'Women Safety Cell', number: '+91 98765 00000', type: 'Helpline' }
  ],
  clubEnhancements: {
    profiles: [
      { name: 'Coding Club', members: 450, founded: '2015', tagline: 'Code. Create. Innovate.', achievements: ['Hackathon winners 2024', 'Google DSC Partner'] },
      { name: 'Drama Society', members: 120, founded: '2010', tagline: 'Stories on Stage', achievements: ['National Theatre Fest 2023'] }
    ],
    recruitments: [
      { club: 'Coding Club', role: 'Core Team Developer', deadline: '2026-07-10', positions: 5 },
      { club: 'Robotics Club', role: 'Hardware Lead', deadline: '2026-07-15', positions: 2 }
    ],
    workshops: [
      { title: 'Web Dev Bootcamp', club: 'Coding Club', date: '2026-07-05', seats: 50 },
      { title: 'Improv Theatre Workshop', club: 'Drama Society', date: '2026-07-12', seats: 30 }
    ],
    projects: [
      { title: 'Campus Navigation App', club: 'Coding Club', status: 'Active', members: 8 },
      { title: 'Annual Play Production', club: 'Drama Society', status: 'In Progress', members: 25 }
    ],
    hackathons: [
      { name: 'Hackathon 2026', date: '2026-07-05', prize: '₹1,00,000', registrations: 234 },
      { name: 'Smart India Hackathon', date: '2026-08-20', prize: '₹1,00,000', registrations: 89 }
    ],
    volunteer: [
      { org: 'NSS Unit', role: 'Blood Donation Camp', date: '2026-07-08', slots: 20 },
      { org: 'Green Club', role: 'Tree Plantation Drive', date: '2026-07-20', slots: 50 }
    ]
  },
  communityFeatures: {
    studyGroups: [
      { name: 'DSA Warriors', branch: 'CSE', members: 24, topic: 'LeetCode Daily', active: true },
      { name: 'Gate Prep Circle', branch: 'All', members: 56, topic: 'GATE 2027', active: true }
    ],
    collaborations: [
      { title: 'ML Research Project', skills: ['Python', 'TensorFlow'], members: 3, needed: 2 },
      { title: 'Mobile App for Campus', skills: ['Flutter', 'Firebase'], members: 2, needed: 3 }
    ],
    hackathonTeams: [
      { event: 'Hackathon 2026', looking: ['Backend Dev', 'UI/UX'], teamSize: 2, maxSize: 4 },
      { event: 'Smart India Hackathon', looking: ['Full Stack', 'Presenter'], teamSize: 3, maxSize: 6 }
    ],
    branchCommunities: [
      { branch: 'CSE', members: 890, posts: 234 },
      { branch: 'ECE', members: 456, posts: 123 },
      { branch: 'ME', members: 345, posts: 89 }
    ],
    qa: [
      { q: 'Best resources for OS preparation?', answers: 12, votes: 45, author: 'Anonymous', pinned: true },
      { q: 'How to prepare for Google intern OA?', answers: 8, votes: 32, author: 'Rahul S.', pinned: false }
    ],
    polls: [
      { question: 'Preferred hackathon theme?', options: [{ text: 'AI/ML', votes: 145 }, { text: 'Web3', votes: 67 }, { text: 'Sustainability', votes: 98 }], total: 310 },
      { question: 'Mess menu improvement priority?', options: [{ text: 'More veg options', votes: 234 }, { text: 'Better hygiene', votes: 189 }], total: 423 }
    ],
    trending: ['#placement2026', '#hackathon', '#gateprep', '#internships', '#festseason']
  },
  aiQuickActions: [
    { id: 'navigate', label: 'Campus Navigation', icon: '🗺️' },
    { id: 'complaint', label: 'Complaint Help', icon: '🛡️' },
    { id: 'events', label: 'Event Recommendations', icon: '📅' },
    { id: 'clubs', label: 'Club Suggestions', icon: '🏛️' },
    { id: 'placement', label: 'Placement Guidance', icon: '💼' },
    { id: 'resume', label: 'Resume Tips', icon: '📄' },
    { id: 'interview', label: 'Interview Prep', icon: '🎯' },
    { id: 'roadmap', label: 'Coding Roadmap', icon: '🛤️' }
  ],
  aiResponses: {
    navigate: 'I can help you navigate CampBuzz! Use the sidebar to access Campus Buzz, Clubs, Calendar, Complaints, Connect Portal, Placement Hub, Community+, and Campus Services. Press Ctrl+K for quick navigation.',
    complaint: 'To raise a complaint: go to Complaints → Raise Complaint. Your identity stays anonymous to others. Admins can see details for resolution. Mark resolved once addressed.',
    events: 'Upcoming highlights: Hackathon 2026 (Jul 5), Annual Play Auditions (Jun 30). Check Calendar for full schedule and create events if you\'re a club organizer.',
    clubs: 'Active clubs: Coding Club (450 members), Drama Society (120 members). Visit Clubs & Board for official announcements and recruitment info.',
    placement: 'Placement season tips: Start DSA early, build 2-3 solid projects, practice mock interviews. Visit Placement Hub for company directory and application tracker.',
    resume: 'Resume tips: Keep it 1 page, quantify achievements, tailor for each company. Use Placement Hub → Resume Builder. ATS score checker coming soon!',
    interview: 'Interview prep: Practice on LeetCode (medium), review company-specific questions, prepare STAR stories for behavioral rounds. Book mock interviews in Placement Hub.',
    roadmap: 'Recommended path: Arrays/Strings (4 weeks) → Trees/Graphs (6 weeks) → DP (4 weeks) → System Design (4 weeks). Track progress in Placement Hub.',
    default: 'Hello! I\'m your Smart Campus AI Assistant. Ask about navigation, complaints, events, clubs, placements, resumes, or interview prep. Backend AI integration point: POST /api/ai/chat'
  },
  commandPaletteItems: [
    { id: 'buzz-feed', label: 'Campus Buzz', icon: '📱', category: 'Navigate' },
    { id: 'club-feed', label: 'Clubs & Board', icon: '🏛️', category: 'Navigate' },
    { id: 'calendar-view', label: 'Calendar', icon: '📅', category: 'Navigate' },
    { id: 'complaints-view', label: 'Complaints', icon: '🛡️', category: 'Navigate' },
    { id: 'mentorship-view', label: 'Connect Portal', icon: '🤝', category: 'Navigate' },
    { id: 'placement-view', label: 'Placement Hub', icon: '💼', category: 'Navigate' },
    { id: 'community-view', label: 'Community+', icon: '👥', category: 'Navigate' },
    { id: 'campus-services-view', label: 'Campus Services', icon: '🏫', category: 'Navigate' },
    { action: 'create-post', label: 'New Campus Post', icon: '➕', category: 'Actions' },
    { action: 'create-complaint', label: 'Raise Complaint', icon: '📝', category: 'Actions' },
    { action: 'ai-assistant', label: 'Open AI Assistant', icon: '🤖', category: 'Actions' },
    { action: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', category: 'Help' }
  ],
  notifications: [
    { id: 'n1', title: 'Hackathon registration open', time: '2h ago', read: false, type: 'event' },
    { id: 'n2', title: 'New club announcement from Coding Club', time: '5h ago', read: false, type: 'club' },
    { id: 'n3', title: 'Your complaint was acknowledged', time: '1d ago', read: true, type: 'complaint' },
    { id: 'n4', title: 'Placement drive: Google visiting campus', time: '2d ago', read: true, type: 'placement' }
  ]
};
