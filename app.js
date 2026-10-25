const titles = [
  { title: 'Ember Hearts', meta: 'Fantasy · Romance', chapter: 'Chapter 24', cover: 'cover-violet', word: 'EMBER\nHEARTS', badge: 'TRENDING' },
  { title: 'Lost Orbit', meta: 'Sci-fi · Drama', chapter: 'Chapter 12', cover: 'cover-cobalt', word: 'LOST\nORBIT', badge: 'NEW' },
  { title: 'Moonlore', meta: 'Mystery · Fantasy', chapter: 'Chapter 08', cover: 'cover-rose', word: 'MOON\nLORE', badge: 'STAFF PICK' },
  { title: 'Afterglow Club', meta: 'Slice of life · Romance', chapter: 'Chapter 17', cover: 'cover-green', word: 'AFTER\nGLOW', badge: 'COMPLETED' }
];

const demoAdmin = { email: 'admin@sunscan.test', password: 'SunScanAdmin1!', username: 'studio_admin', role: 'admin' };
const storage = {
  users: 'sunscan_users', session: 'sunscan_session', saved: 'sunscan_saved', uploads: 'sunscan_uploads'
};
let otpValue = '';
let currentView = 'home';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function getSession() { return read(storage.session, null) || (() => { try { return JSON.parse(sessionStorage.getItem(storage.session)); } catch { return null; } })(); }
function setSession(user, remember = true) { const value = JSON.stringify(user); if (remember) { localStorage.setItem(storage.session, value); sessionStorage.removeItem(storage.session); } else { sessionStorage.setItem(storage.session, value); localStorage.removeItem(storage.session); } updateProfile(); }
function clearSession() { localStorage.removeItem(storage.session); sessionStorage.removeItem(storage.session); updateProfile(); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200); }
function openModal(id) { const modal = $('#' + id); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
function closeModal(id) { const modal = $('#' + id); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }

function renderTitleCards(target, filter = '') {
  const saved = read(storage.saved, []);
  const list = titles.filter(item => `${item.title} ${item.meta}`.toLowerCase().includes(filter.toLowerCase()));
  target.innerHTML = list.map((item, index) => `
    <article class="title-card">
      <div class="title-cover ${item.cover}"><span class="cover-number">${item.badge} · 0${index + 1}</span><strong>${item.word.replace('\n', '<br>')}</strong><small>${item.meta}</small></div>
      <div class="title-details"><h3>${item.title}</h3><p>${item.chapter} · Updated recently</p><div class="title-meta"><span>${item.badge}</span><button class="bookmark ${saved.includes(item.title) ? 'saved' : ''}" data-bookmark="${item.title}" aria-label="Bookmark ${item.title}">${saved.includes(item.title) ? '♥' : '♡'}</button></div></div>
    </article>`).join('') || '<div class="empty-state">No stories found in this constellation yet. Try another search.</div>';
  target.querySelectorAll('[data-bookmark]').forEach(button => button.addEventListener('click', () => toggleBookmark(button.dataset.bookmark)));
}

function toggleBookmark(title) { const saved = read(storage.saved, []); const next = saved.includes(title) ? saved.filter(item => item !== title) : [...saved, title]; write(storage.saved, next); renderTitleCards($('#titleGrid')); renderTitleCards($('#browseGrid'), $('#browseSearch')?.value || ''); showToast(next.includes(title) ? `${title} saved to your shelf.` : `${title} removed from your shelf.`); }

function updateProfile() { const session = getSession(); const label = $('#profileLabel'); const dot = $('.avatar-dot'); if (session) { label.textContent = session.username || session.email.split('@')[0]; dot.textContent = (session.username || session.email)[0].toUpperCase(); } else { label.textContent = 'Sign in'; dot.textContent = 'S'; } }

function navigate(view) { currentView = view; $$('.view').forEach(section => section.classList.remove('active-view')); const destination = $('#' + view + '-view'); if (destination) destination.classList.add('active-view'); const homeShell = document.querySelector('.content-shell'); if (homeShell) homeShell.style.display = view === 'home' ? '' : 'none'; $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view)); window.scrollTo({ top: 0, behavior: 'smooth' }); if (view === 'browse') renderTitleCards($('#browseGrid'), $('#browseSearch')?.value || ''); }

function seedUsers() { const users = read(storage.users, []); if (!users.some(user => user.email === demoAdmin.email)) { write(storage.users, [...users, demoAdmin]); } }

function renderUpdates() { const uploads = read(storage.uploads, []); const updates = [...uploads.map(upload => ({ title: upload.series, meta: `Chapter ${upload.chapter} · ${upload.note || 'New release'}`, date: 'Just now', letter: '✦' })), { title: 'Ember Hearts', meta: 'Chapter 24 · The lantern room', date: '2h ago', letter: 'EH' }, { title: 'Afterglow Club', meta: 'Chapter 17 · One more song', date: 'Yesterday', letter: 'AC' }, { title: 'Lost Orbit', meta: 'Chapter 12 · Zero gravity', date: '2d ago', letter: 'LO' }]; $('#updatesList').innerHTML = updates.map(item => `<article class="update-item"><div class="update-thumb">${item.letter}</div><div><span class="tag">NEW CHAPTER</span><h3>${item.title}</h3><p>${item.meta}</p></div><span class="update-date">${item.date}</span></article>`).join(''); }

function renderAdminReleases() { const uploads = read(storage.uploads, []); $('#uploadCount').textContent = uploads.length; $('#adminReleases').innerHTML = uploads.length ? uploads.map(upload => `<div class="release-row"><div><strong>${upload.series} · Chapter ${upload.chapter}</strong><small>${upload.pages.length} .webp page${upload.pages.length === 1 ? '' : 's'} · ${upload.note || 'No release note'}</small></div><button class="release-delete" data-delete-upload="${upload.id}">Remove</button></div>`).join('') : '<div class="empty-state">No local releases yet. Publish a rights-cleared chapter and it will appear here.</div>'; $$('#adminReleases [data-delete-upload]').forEach(button => button.addEventListener('click', () => { const next = read(storage.uploads, []).filter(upload => upload.id !== button.dataset.deleteUpload); write(storage.uploads, next); renderAdminReleases(); renderUpdates(); showToast('Chapter removed from the local release queue.'); })); }

function showAuthTab(tab) { $$('.auth-tab').forEach(button => button.classList.toggle('active', button.dataset.authTab === tab)); $('#loginForm').classList.toggle('hidden', tab !== 'login'); $('#signupForm').classList.toggle('hidden', tab !== 'signup'); }

function handleLogin(event) { event.preventDefault(); const email = $('#loginEmail').value.trim().toLowerCase(); const password = $('#loginPassword').value; const users = read(storage.users, []); const user = users.find(item => item.email === email && item.password === password); const feedback = $('#loginFeedback'); if (!user) { feedback.textContent = 'That email or password did not match. Try the demo admin credentials from README.md.'; return; } setSession(user, $('#rememberMe').checked); closeModal('authModal'); showToast(`Welcome back, ${user.username || email.split('@')[0]}.`); if (user.role === 'admin') { navigate('admin'); renderAdminReleases(); } }

function handleSignup(event) { event.preventDefault(); const email = $('#signupEmail').value.trim().toLowerCase(); const username = $('#signupUsername').value.trim(); const password = $('#signupPassword').value; const otp = $('#signupOtp').value.trim(); const feedback = $('#signupFeedback'); const users = read(storage.users, []); if (!otpValue) { feedback.textContent = 'Send an OTP first so we can verify your email.'; return; } if (otp !== otpValue) { feedback.textContent = 'That OTP is not correct. Use the code shown in the demo hint.'; return; } if (users.some(user => user.email === email)) { feedback.textContent = 'An account with that email already exists.'; return; } const user = { email, username, password, role: 'reader' }; write(storage.users, [...users, user]); setSession(user, true); closeModal('authModal'); showToast('Account created — your shelf is ready.'); }

function sendOtp() { const email = $('#signupEmail').value.trim(); if (!email) { $('#signupFeedback').textContent = 'Add your email first, then request an OTP.'; return; } otpValue = String(Math.floor(100000 + Math.random() * 900000)); $('#otpHint').textContent = `Demo OTP for ${email}: ${otpValue} · In production this is emailed by your provider.`; showToast('Verification code generated for the demo.'); }

function handleUpload(event) { event.preventDefault(); const files = [...$('#chapterFiles').files]; const feedback = $('#uploadFeedback'); if (!files.length) return; if (!files.every(file => file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp'))) { feedback.textContent = 'Only .webp chapter pages are accepted.'; return; } const readerJobs = files.map(file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, data: reader.result }); reader.readAsDataURL(file); })); Promise.all(readerJobs).then(pages => { const uploads = read(storage.uploads, []); uploads.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), series: $('#seriesTitle').value.trim(), chapter: $('#chapterNumber').value, note: $('#releaseNote').value.trim(), pages, createdAt: new Date().toISOString() }); write(storage.uploads, uploads); $('#uploadForm').reset(); $('#selectedFiles').textContent = 'No pages selected'; feedback.textContent = 'Chapter published to this local demo library.'; renderAdminReleases(); renderUpdates(); showToast('Chapter published.'); }); }

function init() { seedUsers(); renderTitleCards($('#titleGrid')); renderTitleCards($('#browseGrid')); renderUpdates(); renderAdminReleases(); updateProfile();
  $$('.nav-link,[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  $('#profileButton').addEventListener('click', () => { const session = getSession(); if (session?.role === 'admin') { navigate('admin'); renderAdminReleases(); } else if (session) { showToast(`You're signed in as ${session.username || session.email}.`); } else openModal('authModal'); });
  $('#searchButton').addEventListener('click', () => { navigate('browse'); $('#browseSearch').focus(); });
  $('#menuButton').addEventListener('click', () => { $('.main-nav').classList.toggle('mobile-open'); });
  $$('.auth-tab').forEach(button => button.addEventListener('click', () => showAuthTab(button.dataset.authTab)));
  $$('[data-close-modal]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.closeModal)));
  $('#authModal').addEventListener('click', event => { if (event.target.id === 'authModal') closeModal('authModal'); });
  $('#loginForm').addEventListener('submit', handleLogin); $('#signupForm').addEventListener('submit', handleSignup); $('#sendOtpButton').addEventListener('click', sendOtp);
  $('#googleButton').addEventListener('click', () => demoGoogleLogin()); $('#signupGoogleButton').addEventListener('click', () => demoGoogleLogin());
  $('#browseSearch').addEventListener('input', event => renderTitleCards($('#browseGrid'), event.target.value)); $('#uploadForm').addEventListener('submit', handleUpload);
  $('#chapterFiles').addEventListener('change', event => { const files = [...event.target.files]; $('#selectedFiles').textContent = files.length ? `${files.length} page${files.length === 1 ? '' : 's'} ready · ${files.map(file => file.name).join(', ')}` : 'No pages selected'; });
  $('#adminLogoutButton').addEventListener('click', () => { clearSession(); navigate('home'); showToast('You have been logged out.'); });
  $('#rightsButton').addEventListener('click', () => showToast('Only upload work you own, have licensed, or have creator approval to distribute.'));
  $('#footerRights').addEventListener('click', () => showToast('For takedowns, contact the site operator with the title, chapter, and proof of rights.'));
  $('#footerAbout').addEventListener('click', () => showToast('Sun-Scan is a cozy frontend prototype for a rights-aware reading library.'));
  $('#forgotButton').addEventListener('click', () => showToast('Password recovery is a production integration point for your auth provider.'));
}

function demoGoogleLogin() { const user = { email: 'google.reader@sunscan.test', username: 'google_reader', role: 'reader', provider: 'google' }; const users = read(storage.users, []); if (!users.some(item => item.email === user.email)) write(storage.users, [...users, user]); setSession(user, true); closeModal('authModal'); showToast('Signed in with Google demo.'); }

document.addEventListener('DOMContentLoaded', init);
