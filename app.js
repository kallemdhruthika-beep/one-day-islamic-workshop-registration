/* One-Day Islamic Workshop Registration — Frontend */

// Paste your deployed Google Apps Script Web App URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxU8YafXrnWCZrESEnzfCrpuPYLBK4lQrH8VDEU537UNJzARXoojKrrl1VjCypFKZSj/exec';

async function callApi(action, payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
    throw new Error('The Apps Script Web App URL has not been set yet. Open app.js and set APPS_SCRIPT_URL.');
  }
  const body = Object.assign({ action: action }, payload);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Network error (HTTP ' + response.status + ')');
  return response.json();
}

const views = {
  register: document.getElementById('viewRegister'),
  success: document.getElementById('viewSuccess'),
  adminLogin: document.getElementById('viewAdminLogin'),
  adminDashboard: document.getElementById('viewAdminDashboard')
};

function showView(name) {
  Object.keys(views).forEach(function (key) { views[key].classList.toggle('hidden', key !== name); });
  document.getElementById('navHome').classList.toggle('active', name === 'register' || name === 'success');
  document.getElementById('navAdmin').classList.toggle('active', name === 'adminLogin' || name === 'adminDashboard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('navHome').addEventListener('click', function () { showView('register'); });
document.getElementById('navAdmin').addEventListener('click', function () {
  if (sessionStorage.getItem('sanaAdminToken')) { showView('adminDashboard'); loadStudents(); }
  else showView('adminLogin');
});

const registrationForm = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

const validators = {
  fullName: function (v) { return v.trim().length >= 3 ? '' : 'Enter the full name.'; },
  age: function (v) { const n = Number(v); return Number.isInteger(n) && n >= 5 && n <= 100 ? '' : 'Enter a valid age.'; },
  gender: function (v) { return v ? '' : 'Select a gender.'; },
  mobile: function (v) { return /^[0-9]{10}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit mobile number.'; },
  email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'; },
  address: function (v) { return v.trim().length >= 5 ? '' : 'Enter the full address.'; },
  city: function (v) { return v.trim().length >= 2 ? '' : 'Enter a city or town.'; },
  state: function (v) { return v.trim().length >= 2 ? '' : 'Enter a state.'; },
  pincode: function (v) { return /^[0-9]{6}$/.test(v.trim()) ? '' : 'Enter a valid 6-digit PIN code.'; },
  occupation: function (v) { return v ? '' : 'Select occupation / study.'; },
  emergencyName: function (v) { return v.trim().length >= 3 ? '' : 'Enter an emergency contact name.'; },
  emergencyMobile: function (v) { return /^[0-9]{10}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit emergency mobile number.'; }
};

function showFieldError(fieldName, message) {
  const input = registrationForm.elements[fieldName];
  const errorEl = registrationForm.querySelector('.error-msg[data-for="' + fieldName + '"]');
  if (input) input.classList.toggle('invalid', !!message);
  if (errorEl) errorEl.textContent = message;
}
function validateField(fieldName) {
  const input = registrationForm.elements[fieldName];
  if (!input || !validators[fieldName]) return true;
  const message = validators[fieldName](input.value);
  showFieldError(fieldName, message);
  return message === '';
}

Object.keys(validators).forEach(function (fieldName) {
  const input = registrationForm.elements[fieldName];
  if (input) input.addEventListener('blur', function () { validateField(fieldName); });
});
['mobile', 'pincode', 'emergencyMobile'].forEach(function (fieldName) {
  registrationForm.elements[fieldName].addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
});

registrationForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  let isValid = true;
  Object.keys(validators).forEach(function (fieldName) { if (!validateField(fieldName)) isValid = false; });
  if (!isValid) { formStatus.textContent = 'Please fix the highlighted fields before submitting.'; formStatus.classList.remove('ok'); return; }

  const data = {
    fullName: registrationForm.elements.fullName.value.trim(),
    age: registrationForm.elements.age.value.trim(),
    gender: registrationForm.elements.gender.value,
    mobile: registrationForm.elements.mobile.value.trim(),
    email: registrationForm.elements.email.value.trim(),
    address: registrationForm.elements.address.value.trim(),
    city: registrationForm.elements.city.value.trim(),
    state: registrationForm.elements.state.value.trim(),
    pincode: registrationForm.elements.pincode.value.trim(),
    occupation: registrationForm.elements.occupation.value,
    institution: registrationForm.elements.institution.value.trim(),
    emergencyName: registrationForm.elements.emergencyName.value.trim(),
    emergencyMobile: registrationForm.elements.emergencyMobile.value.trim(),
    howHeard: registrationForm.elements.howHeard.value
  };

  submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; formStatus.textContent = '';
  try {
    const result = await callApi('register', { data: data });
    if (result.success) {
      document.getElementById('sName').textContent = data.fullName;
      document.getElementById('sRegId').textContent = result.registrationId;
      document.getElementById('sMobile').textContent = data.mobile;
      document.getElementById('sOccupation').textContent = data.occupation;
      document.getElementById('sDate').textContent = result.registrationDate;
      registrationForm.reset();
      document.getElementById('state').value = 'Telangana';
      Object.keys(validators).forEach(function (fieldName) { showFieldError(fieldName, ''); });
      showView('success');
    } else {
      formStatus.textContent = result.message || 'Registration failed. Please try again.';
      formStatus.classList.remove('ok');
    }
  } catch (err) {
    formStatus.textContent = err.message || 'Could not reach the server. Please try again.';
    formStatus.classList.remove('ok');
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'Register for workshop';
  }
});

document.getElementById('printBtn').addEventListener('click', function () { window.print(); });
document.getElementById('newRegBtn').addEventListener('click', function () { showView('register'); });

const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginStatus = document.getElementById('adminLoginStatus');
adminLoginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (!username || !password) { adminLoginStatus.textContent = 'Enter both username and password.'; return; }
  adminLoginBtn.disabled = true; adminLoginBtn.textContent = 'Logging in…'; adminLoginStatus.textContent = '';
  try {
    const result = await callApi('adminLogin', { username: username, password: password });
    if (result.success) { sessionStorage.setItem('sanaAdminToken', result.token); adminLoginForm.reset(); showView('adminDashboard'); loadStudents(); }
    else adminLoginStatus.textContent = result.message || 'Login failed.';
  } catch (err) { adminLoginStatus.textContent = err.message || 'Could not reach the server.'; }
  finally { adminLoginBtn.disabled = false; adminLoginBtn.textContent = 'Log in'; }
});
document.getElementById('logoutBtn').addEventListener('click', function () { sessionStorage.removeItem('sanaAdminToken'); showView('register'); });

let allStudents = [];
async function loadStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading registrations…</td></tr>';
  const token = sessionStorage.getItem('sanaAdminToken');
  if (!token) { showView('adminLogin'); return; }
  try {
    const result = await callApi('getStudents', { token: token });
    if (!result.success) {
      if (result.message && result.message.toLowerCase().indexOf('session') !== -1) { sessionStorage.removeItem('sanaAdminToken'); showView('adminLogin'); adminLoginStatus.textContent = result.message; return; }
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">' + escapeHtml(result.message || 'Could not load data.') + '</td></tr>'; return;
    }
    allStudents = result.students || [];
    populateFilterOptions(allStudents); updateStats(allStudents); renderStudentsTable();
  } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">' + escapeHtml(err.message || 'Network error.') + '</td></tr>'; }
}
function populateFilterOptions(students) {
  const select = document.getElementById('filterOccupation'); const current = select.value;
  const options = Array.from(new Set(students.map(function (s) { return s.occupation; }).filter(Boolean))).sort();
  select.innerHTML = '<option value="">All</option>' + options.map(function (x) { return '<option value="' + escapeAttr(x) + '">' + escapeHtml(x) + '</option>'; }).join('');
  select.value = current;
}
function updateStats(students) {
  document.getElementById('statTotal').textContent = students.length;
  const todayStr = formatDateOnly(new Date());
  document.getElementById('statToday').textContent = students.filter(function (s) { return String(s.registrationDate || '').indexOf(todayStr) === 0; }).length;
  let latest = '—';
  if (students.length) { const sorted = students.slice().sort(function (a,b) { return parseRegDate(b.registrationDate) - parseRegDate(a.registrationDate); }); latest = sorted[0].registrationId; }
  document.getElementById('statLatest').textContent = latest;
}
function formatDateOnly(d) { return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + d.getFullYear(); }
function parseRegDate(str) { if (!str) return 0; const parts = String(str).split(/[\s:-]/); if (parts.length < 3) return 0; const [dd,mm,yyyy,HH,mi,ss] = parts; return new Date(yyyy, mm-1, dd, HH||0, mi||0, ss||0).getTime(); }
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  const regId = document.getElementById('searchRegId').value.trim().toLowerCase();
  const name = document.getElementById('searchName').value.trim().toLowerCase();
  const mobile = document.getElementById('searchMobile').value.trim();
  const occupation = document.getElementById('filterOccupation').value;
  const sortOrder = document.getElementById('sortOrder').value;
  let filtered = allStudents.filter(function (s) {
    if (regId && String(s.registrationId).toLowerCase().indexOf(regId) === -1) return false;
    if (name && String(s.fullName).toLowerCase().indexOf(name) === -1) return false;
    if (mobile && String(s.mobile).indexOf(mobile) === -1) return false;
    if (occupation && s.occupation !== occupation) return false;
    return true;
  });
  filtered.sort(function (a,b) { const diff = parseRegDate(a.registrationDate) - parseRegDate(b.registrationDate); return sortOrder === 'asc' ? diff : -diff; });
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No registrations match these filters.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(function (s) {
    return '<tr><td>' + escapeHtml(s.registrationId) + '</td><td>' + escapeHtml(s.fullName) + '</td><td>' + escapeHtml(s.mobile) + '</td><td>' + escapeHtml(s.occupation) + '</td><td>' + escapeHtml(s.institution || '—') + '</td><td>' + escapeHtml(s.registrationDate) + '</td><td><span class="status-pill">' + escapeHtml(s.status || 'Confirmed') + '</span></td></tr>';
  }).join('');
}
['searchRegId','searchName','searchMobile'].forEach(function (id) { document.getElementById(id).addEventListener('input', renderStudentsTable); });
['filterOccupation','sortOrder'].forEach(function (id) { document.getElementById(id).addEventListener('change', renderStudentsTable); });
document.getElementById('refreshBtn').addEventListener('click', loadStudents);
function escapeHtml(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function escapeAttr(str) { return escapeHtml(str); }
document.getElementById('year').textContent = new Date().getFullYear();
showView('register');
