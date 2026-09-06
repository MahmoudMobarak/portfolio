// Portfolio Admin Panel Client Application
let portfolioData = null;

// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const adminToast = document.getElementById('adminToast');
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');

// Toast Helper
function showToast(msg, isError = false) {
  adminToast.textContent = msg;
  adminToast.style.background = isError ? '#ef4444' : '#10b981';
  adminToast.classList.add('show');
  setTimeout(() => adminToast.classList.remove('show'), 3500);
}

// Tab Switching
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    item.classList.add('active');
    const tabId = item.getAttribute('data-tab');
    const panel = document.getElementById(`tab-${tabId}`);
    if (panel) panel.classList.add('active');
  });
});

// File Upload Helper
async function uploadFile(file, targetFolder) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            targetFolder: targetFolder,
            dataBase64: base64Data
          })
        });
        const result = await res.json();
        if (result.success) {
          resolve(result.path);
        } else {
          reject(new Error(result.error || 'Upload failed'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Load Initial Content
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    portfolioData = await res.json();
    renderAll();
  } catch (err) {
    console.error('Error loading content:', err);
    showToast('Failed to load portfolio data', true);
  }
}

// Render All Sections
function renderAll() {
  if (!portfolioData) return;
  renderHero();
  renderReportCards();
  renderCertificates();
  renderProjects();
  renderExtracurriculars();
  renderSkills();
  renderYearManager();
}

/* ============================================================
   1. HERO & BIO
============================================================ */
function renderHero() {
  const hero = portfolioData.hero || {};
  const nameInput = document.getElementById('heroName');
  const subtitleInput = document.getElementById('heroSubtitle');
  const photoPath = document.getElementById('heroPhotoPath');
  const photoPreview = document.getElementById('heroPhotoPreview');

  nameInput.value = hero.name || '';
  subtitleInput.value = hero.subtitle || '';
  photoPath.value = hero.photo || '';
  photoPreview.src = hero.photo ? `/${hero.photo}` : '';

  nameInput.oninput = (e) => hero.name = e.target.value;
  subtitleInput.oninput = (e) => hero.subtitle = e.target.value;

  const photoUpload = document.getElementById('heroPhotoUpload');
  photoUpload.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Uploading photo...');
      const uploadedPath = await uploadFile(file, 'Photos');
      hero.photo = uploadedPath;
      photoPath.value = uploadedPath;
      photoPreview.src = `/${uploadedPath}`;
      showToast('Photo uploaded successfully!');
    } catch (err) {
      showToast('Photo upload failed: ' + err.message, true);
    }
  };

  // Bash Lines
  renderBashLines();
}

function renderBashLines() {
  const container = document.getElementById('bashLinesContainer');
  container.innerHTML = '';
  const lines = portfolioData.hero.bashLines || [];

  lines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'dynamic-list-row';
    row.innerHTML = `
      <textarea rows="2" class="form-textarea">${line}</textarea>
      <button type="button" class="btn btn-danger btn-sm" title="Remove paragraph">&times;</button>
    `;

    const textarea = row.querySelector('textarea');
    textarea.oninput = (e) => lines[idx] = e.target.value;

    const delBtn = row.querySelector('button');
    delBtn.onclick = () => {
      lines.splice(idx, 1);
      renderBashLines();
    };

    container.appendChild(row);
  });

  const addBtn = document.getElementById('addBashLineBtn');
  addBtn.onclick = () => {
    lines.push('New paragraph description...');
    renderBashLines();
  };
}

/* ============================================================
   2. ACADEMIC REPORT CARDS
============================================================ */
function renderReportCards() {
  const container = document.getElementById('reportCardsList');
  container.innerHTML = '';
  const filter = document.getElementById('adminYearFilter').value;
  const cards = portfolioData.reportCards || [];

  // keep the filter dropdown in sync with the current year list
  const filterSel = document.getElementById('adminYearFilter');
  const currentVal = filterSel.value;
  const years = Array.isArray(portfolioData.reportYears)
    ? portfolioData.reportYears.slice().sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
    : [...new Set(cards.map(c => String(c.year)))];
  filterSel.innerHTML = '<option value="all">All Years</option>' +
    years.map(y => `<option value="${y}">Year ${y}</option>`).join('');
  filterSel.value = currentVal && years.some(y => String(y) === String(currentVal)) ? currentVal : 'all';

  cards.forEach((card, idx) => {
    if (filter !== 'all' && card.year !== filter) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'admin-card-item';
    cardEl.innerHTML = `
      <div class="card-item-header">
        <span class="card-badge">Year ${card.year}</span>
        <button type="button" class="btn btn-danger btn-sm delete-card-btn">Delete</button>
      </div>
      <div class="card-item-body">
        <img class="card-preview-img" src="/${card.photo}" alt="${card.term}">
        <div class="form-group">
          <label>Academic Year</label>
          <input type="text" class="form-input card-year" value="${card.year}" placeholder="e.g. 2">
        </div>
        <div class="form-group">
          <label>Term Title</label>
          <input type="text" class="form-input card-term" value="${card.term}" placeholder="e.g. Year 2 - First Term">
        </div>
        <div class="form-group">
          <label>Photo</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input card-photo" value="${card.photo}" readonly style="flex:1;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              Upload
              <input type="file" accept="image/*" class="card-photo-upload" style="display:none;">
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>PDF Document</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input card-pdf" value="${card.pdf}" readonly style="flex:1;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              Upload
              <input type="file" accept=".pdf" class="card-pdf-upload" style="display:none;">
            </label>
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    cardEl.querySelector('.card-year').oninput = (e) => card.year = e.target.value.trim();
    cardEl.querySelector('.card-term').oninput = (e) => card.term = e.target.value.trim();

    // Photo upload
    const photoUploadInput = cardEl.querySelector('.card-photo-upload');
    photoUploadInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading report card image...');
        const path = await uploadFile(file, 'Report Cards/Photos');
        card.photo = path;
        cardEl.querySelector('.card-photo').value = path;
        cardEl.querySelector('.card-preview-img').src = `/${path}`;
        showToast('Image uploaded!');
      } catch (err) {
        showToast('Image upload failed: ' + err.message, true);
      }
    };

    // PDF upload
    const pdfUploadInput = cardEl.querySelector('.card-pdf-upload');
    pdfUploadInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading report card PDF...');
        const path = await uploadFile(file, 'Report Cards/PDF');
        card.pdf = path;
        cardEl.querySelector('.card-pdf').value = path;
        showToast('PDF uploaded!');
      } catch (err) {
        showToast('PDF upload failed: ' + err.message, true);
      }
    };

    // Delete
    cardEl.querySelector('.delete-card-btn').onclick = () => {
      if (confirm(`Delete report card "${card.term}"?`)) {
        cards.splice(idx, 1);
        renderReportCards();
      }
    };

    container.appendChild(cardEl);
  });
}


// Year tabs manager — add / remove years shown on the site
function renderYearManager() {
  const wrap = document.getElementById('yearManagerRow');
  if (!wrap) return;
  if (!Array.isArray(portfolioData.reportYears)) {
    portfolioData.reportYears = [...new Set((portfolioData.reportCards || []).map(c => String(c.year)))];
  }
  wrap.innerHTML = '';
  (portfolioData.reportYears || []).forEach((y, i) => {
    const chip = document.createElement('span');
    chip.className = 'skill-tag';
    chip.innerHTML = `Year ${y}
      <button type="button" class="tag-remove" title="Remove year">&times;</button>`;
    chip.querySelector('.tag-remove').onclick = () => {
      const inUse = (portfolioData.reportCards || []).some(c => String(c.year) === String(y));
      if (inUse && !confirm(`Year ${y} still has report cards. They will keep their year label but lose their tab. Continue?`)) return;
      portfolioData.reportYears.splice(i, 1);
      renderYearManager();
    };
    wrap.appendChild(chip);
  });
}
document.getElementById('addReportYearBtn').onclick = () => {
  const input = document.getElementById('newReportYearInput');
  const val = input.value.trim();
  if (!val) return;
  if (!Array.isArray(portfolioData.reportYears)) portfolioData.reportYears = [];
  if (portfolioData.reportYears.some(y => String(y) === val)) {
    showToast('That year already exists.');
    return;
  }
  portfolioData.reportYears.push(val);
  input.value = '';
  renderYearManager();
};

document.getElementById('adminYearFilter').onchange = renderReportCards;

document.getElementById('addReportCardBtn').onclick = () => {
  const currentFilter = document.getElementById('adminYearFilter').value;
  const newYear = currentFilter === 'all' ? '1' : currentFilter;
  portfolioData.reportCards.push({
    year: newYear,
    term: `Year ${newYear} - Term`,
    photo: "Report Cards/Photos/Final term year 1 report card.jpg",
    pdf: "Report Cards/PDF/Final term year 1 report card.pdf"
  });
  renderReportCards();
};

/* ============================================================
   3. CERTIFICATES
============================================================ */
function renderCertificates() {
  const container = document.getElementById('certificatesList');
  container.innerHTML = '';
  const certs = portfolioData.certificates || [];

  certs.forEach((cert, idx) => {
    const certEl = document.createElement('div');
    certEl.className = 'admin-card-item';
    certEl.innerHTML = `
      <div class="card-item-header">
        <span class="card-badge">${cert.category || 'General'}</span>
        <button type="button" class="btn btn-danger btn-sm delete-cert-btn">Delete</button>
      </div>
      <div class="card-item-body">
        <img class="card-preview-img" src="/${cert.photo}" alt="${cert.title}">
        <div class="form-group">
          <label>Category</label>
          <input type="text" class="form-input cert-category" value="${cert.category || ''}" placeholder="e.g. AI & Programming">
        </div>
        <div class="form-group">
          <label>Certificate Title</label>
          <input type="text" class="form-input cert-title" value="${cert.title || ''}" placeholder="e.g. AI Level 1">
        </div>
        <div class="form-group">
          <label>Description (shown under the title on the site)</label>
          <textarea rows="2" class="form-textarea cert-desc-in">${cert.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Tags (comma separated, shown as glass chips on the photo)</label>
          <input type="text" class="form-input cert-tags" value="${(cert.tags || []).join(', ')}" placeholder="e.g. AI, Certification, 2025">
        </div>
        <div class="form-group">
          <label>Link (optional - verification or PDF)</label>
          <input type="text" class="form-input cert-link" value="${cert.link || ''}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>Certificate Photo</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input cert-photo" value="${cert.photo || ''}" readonly style="flex:1;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              Upload
              <input type="file" accept="image/*" class="cert-photo-upload" style="display:none;">
            </label>
          </div>
        </div>
      </div>
    `;

    certEl.querySelector('.cert-category').oninput = (e) => cert.category = e.target.value.trim();
    certEl.querySelector('.cert-title').oninput = (e) => cert.title = e.target.value.trim();
    certEl.querySelector('.cert-desc-in').oninput = (e) => cert.description = e.target.value.trim();
    certEl.querySelector('.cert-tags').oninput = (e) => {
      cert.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    };
    certEl.querySelector('.cert-link').oninput = (e) => cert.link = e.target.value.trim();

    const photoUploadInput = certEl.querySelector('.cert-photo-upload');
    photoUploadInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading certificate photo...');
        const path = await uploadFile(file, 'Certificate');
        cert.photo = path;
        certEl.querySelector('.cert-photo').value = path;
        certEl.querySelector('.card-preview-img').src = `/${path}`;
        showToast('Certificate uploaded!');
      } catch (err) {
        showToast('Upload failed: ' + err.message, true);
      }
    };

    certEl.querySelector('.delete-cert-btn').onclick = () => {
      if (confirm(`Delete certificate "${cert.title}"?`)) {
        certs.splice(idx, 1);
        renderCertificates();
      }
    };

    container.appendChild(certEl);
  });
}

document.getElementById('addCertBtn').onclick = () => {
  portfolioData.certificates.push({
    category: "AI & Programming",
    title: "New Certificate",
    description: "What this certificate recognises.",
    tags: [],
    link: "",
    photo: "Certificate/AI-Level 1.jpg"
  });
  renderCertificates();
};

/* ============================================================
   4. PROJECTS
============================================================ */
function renderProjects() {
  const container = document.getElementById('projectsList');
  container.innerHTML = '';
  const projects = portfolioData.projects || [];

  projects.forEach((proj, idx) => {
    const projEl = document.createElement('div');
    projEl.className = 'admin-card-item';
    projEl.innerHTML = `
      <div class="card-item-header">
        <span class="card-badge">Project #${idx + 1}</span>
        <button type="button" class="btn btn-danger btn-sm delete-proj-btn">Delete</button>
      </div>
      <div class="card-item-body">
        <img class="card-preview-img" src="/${proj.photo}" alt="${proj.title}">
        <div class="form-group">
          <label>Project Title (next to accent bar)</label>
          <input type="text" class="form-input proj-title" value="${proj.title}">
        </div>
        <div class="form-group">
          <label>Card Title (bold, inside gradient card)</label>
          <input type="text" class="form-input proj-fullTitle" value="${proj.fullTitle || proj.title}">
        </div>
        <div class="form-group">
          <label>Description (brief)</label>
          <textarea rows="2" class="form-textarea proj-desc">${proj.description}</textarea>
        </div>
        <div class="form-group">
          <label>Feature Points (one per line)</label>
          <textarea rows="5" class="form-textarea proj-points" placeholder="Point 1...\nPoint 2...">${(proj.points || []).join('\n')}</textarea>
        </div>
        <div class="form-group">
          <label>Tech Tags (comma separated)</label>
          <input type="text" class="form-input proj-tags" value="${(proj.tags || []).join(', ')}" placeholder="Python, TensorFlow">
        </div>
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" class="proj-showLink" ${proj.showLink !== false ? 'checked' : ''} style="width:16px;height:16px;accent-color:#3b82f6;">
            Show "Check out" button for this project
          </label>
        </div>
        <div class="form-group">
          <label>Live Project URL (Optional)</label>
          <input type="text" class="form-input proj-link" value="${proj.link || ''}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>GitHub Repository URL (Optional)</label>
          <input type="text" class="form-input proj-github" value="${proj.github || ''}" placeholder="https://github.com/...">
        </div>
        <div class="form-group">
          <label>Project Screenshot / Image</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input proj-photo" value="${proj.photo || ''}" readonly style="flex:1;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              Upload
              <input type="file" accept="image/*" class="proj-photo-upload" style="display:none;">
            </label>
          </div>
        </div>
      </div>
    `;

    projEl.querySelector('.proj-showLink').onchange = (e) => proj.showLink = e.target.checked;
    projEl.querySelector('.proj-title').oninput = (e) => proj.title = e.target.value.trim();
    projEl.querySelector('.proj-fullTitle').oninput = (e) => proj.fullTitle = e.target.value.trim();
    projEl.querySelector('.proj-desc').oninput = (e) => proj.description = e.target.value.trim();
    projEl.querySelector('.proj-points').oninput = (e) => {
      proj.points = e.target.value.split('\n').map(p => p.trim()).filter(Boolean);
    };
    projEl.querySelector('.proj-tags').oninput = (e) => {
      proj.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    };
    projEl.querySelector('.proj-link').oninput = (e) => proj.link = e.target.value.trim();
    projEl.querySelector('.proj-github').oninput = (e) => proj.github = e.target.value.trim();

    const photoUploadInput = projEl.querySelector('.proj-photo-upload');
    photoUploadInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading project screenshot...');
        const path = await uploadFile(file, 'Photos');
        proj.photo = path;
        projEl.querySelector('.proj-photo').value = path;
        projEl.querySelector('.card-preview-img').src = `/${path}`;
        showToast('Project screenshot uploaded!');
      } catch (err) {
        showToast('Upload failed: ' + err.message, true);
      }
    };

    projEl.querySelector('.delete-proj-btn').onclick = () => {
      if (confirm(`Delete project "${proj.title}"?`)) {
        projects.splice(idx, 1);
        renderProjects();
      }
    };

    container.appendChild(projEl);
  });
}

document.getElementById('addProjectBtn').onclick = () => {
  portfolioData.projects.push({
    title: "New Project",
    fullTitle: "New Project: Full Descriptive Title",
    description: "Brief description of the project.",
    points: ["First feature point...", "Second feature point..."],
    tags: [],
    photo: "Photos/Mahmoud Mobarak Portfolio.png",
    link: "#",
    showLink: true
  });
  renderProjects();
};

/* ============================================================
   5. EXTRACURRICULARS
============================================================ */
function renderExtracurriculars() {
  const container = document.getElementById('extracurricularsList');
  container.innerHTML = '';
  const extras = portfolioData.extracurriculars || [];

  extras.forEach((extra, idx) => {
    const extraEl = document.createElement('div');
    extraEl.className = 'admin-card-item';
    extraEl.innerHTML = `
      <div class="card-item-header">
        <span class="card-badge">Activity #${idx + 1}</span>
        <button type="button" class="btn btn-danger btn-sm delete-extra-btn">Delete</button>
      </div>
      <div class="card-item-body">
        <img class="card-preview-img" src="/${extra.photo}" alt="${extra.title}">
        <div class="form-group">
          <label>Activity Title</label>
          <input type="text" class="form-input extra-title" value="${extra.title}">
        </div>
        <div class="form-group">
          <label>Lead Line (short hook shown under the title)</label>
          <input type="text" class="form-input extra-lead" value="${extra.lead || ''}" placeholder="e.g. Where code meets creation — building robots that think.">
        </div>
        <div class="form-group">
          <label>Tags (comma separated, shown on the photo)</label>
          <input type="text" class="form-input extra-tags-in" value="${(extra.tags || []).join(', ')}" placeholder="e.g. Robotics, Competition">
        </div>
        <div class="form-group">
          <label>Description (the full story paragraph)</label>
          <textarea rows="4" class="form-textarea extra-desc">${extra.description}</textarea>
        </div>
        <div class="form-group">
          <label>Highlight Bullets (one per line, shown under the description)</label>
          <textarea rows="4" class="form-textarea extra-points" placeholder="Did this...\nAchieved that...">${(extra.points || []).join('\n')}</textarea>
        </div>
        <div class="form-group">
          <label>Photo</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input extra-photo" value="${extra.photo || ''}" readonly style="flex:1;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              Upload
              <input type="file" accept="image/*" class="extra-photo-upload" style="display:none;">
            </label>
          </div>
        </div>
      </div>
    `;

    extraEl.querySelector('.extra-title').oninput = (e) => extra.title = e.target.value.trim();
    extraEl.querySelector('.extra-lead').oninput = (e) => extra.lead = e.target.value.trim();
    extraEl.querySelector('.extra-tags-in').oninput = (e) => {
      extra.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    };
    extraEl.querySelector('.extra-desc').oninput = (e) => extra.description = e.target.value.trim();
    extraEl.querySelector('.extra-points').oninput = (e) => {
      extra.points = e.target.value.split('\n').map(p => p.trim()).filter(Boolean);
    };

    const photoUploadInput = extraEl.querySelector('.extra-photo-upload');
    photoUploadInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Uploading activity photo...');
        const path = await uploadFile(file, 'Photos');
        extra.photo = path;
        extraEl.querySelector('.extra-photo').value = path;
        extraEl.querySelector('.card-preview-img').src = `/${path}`;
        showToast('Photo uploaded!');
      } catch (err) {
        showToast('Upload failed: ' + err.message, true);
      }
    };

    extraEl.querySelector('.delete-extra-btn').onclick = () => {
      if (confirm(`Delete activity "${extra.title}"?`)) {
        extras.splice(idx, 1);
        renderExtracurriculars();
      }
    };

    container.appendChild(extraEl);
  });
}

document.getElementById('addExtraBtn').onclick = () => {
  portfolioData.extracurriculars.push({
    title: "New Activity",
    lead: "A short hook line for this activity.",
    description: "Details about your participation, achievements, and teamwork in this event.",
    points: ["First highlight...", "Second highlight..."],
    tags: [],
    photo: "Photos/FLL-Photo-1.png"
  });
  renderExtracurriculars();
};

/* ============================================================
   6. SKILLS — simple chips grouped by category
============================================================ */
function renderSkills() {
  if (!portfolioData.skills || typeof portfolioData.skills !== 'object') {
    portfolioData.skills = { technical: [], academic: [], soft: [] };
  }
  const skills = portfolioData.skills;
  ['technical', 'academic', 'soft'].forEach(k => {
    if (!Array.isArray(skills[k])) skills[k] = [];
  });

  function renderTags(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    list.forEach((item, idx) => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.innerHTML = `
        ${item}
        <button type="button" class="tag-remove" title="Remove">&times;</button>
      `;
      tag.querySelector('.tag-remove').onclick = () => {
        list.splice(idx, 1);
        renderTags(containerId, list);
      };
      container.appendChild(tag);
    });
  }

  renderTags('techSkillsContainer', skills.technical);
  renderTags('acadSkillsContainer', skills.academic);
  renderTags('softSkillsContainer', skills.soft);

  const bindAdd = (btnId, inputId, key) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = () => {
      const input = document.getElementById(inputId);
      const val = input.value.trim();
      if (val) {
        skills[key].push(val);
        input.value = '';
        renderTags(btnId.replace('add', '').replace('SkillBtn', '') === 'Tech' ? 'techSkillsContainer' : (btnId.includes('Acad') ? 'acadSkillsContainer' : 'softSkillsContainer'), skills[key]);
      }
    };
  };
  bindAdd('addTechSkillBtn', 'newTechSkillInput', 'technical');
  bindAdd('addAcadSkillBtn', 'newAcadSkillInput', 'academic');
  bindAdd('addSoftSkillBtn', 'newSoftSkillInput', 'soft');
}

/* ============================================================
   6. SKILLS — simple chips grouped by category
============================================================ */
/* ============================================================
   SAVE ALL CHANGES
============================================================ */
document.getElementById('pushBtn').addEventListener('click', async () => {
  const pushBtn = document.getElementById('pushBtn');
  pushBtn.disabled = true;
  pushBtn.textContent = 'Pushing...';
  try {
    const res = await fetch('/api/push', { method: 'POST' });
    const result = await res.json();
    if (result.success) {
      showToast('Successfully pushed to GitHub!');
    } else {
      showToast('Push failed: ' + (result.error || result.stderr), true);
    }
  } catch (err) {
    showToast('Push failed: ' + err.message, true);
  } finally {
    pushBtn.disabled = false;
    pushBtn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/>
      </svg>
      Push to GitHub
    `;
  }
});

// Save All Changes
document.getElementById('saveBtn').addEventListener('click', async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolioData)
    });
    const result = await res.json();

    if (result.success) {
      showToast('All changes saved and synchronized to index.html!');
      saveStatus.textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
    } else {
      showToast('Save failed: ' + result.error, true);
    }
  } catch (err) {
    showToast('Save failed: ' + err.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/></svg>
      Save All Changes
    `;
  }
});

/* ============================================================
   7. TUTORIAL TAB
============================================================ */
document.querySelectorAll('.tutorial-accordion .tutorial-item').forEach((item) => {
  const head = item.querySelector('.tutorial-head');
  if (!head) return;
  head.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.tutorial-accordion .tutorial-item.open').forEach(o => o.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Copy-to-clipboard for tutorial code snippets
document.querySelectorAll('.tutorial-copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.parentElement.querySelector('code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.textContent);
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = old), 1500);
    } catch (err) {
      showToast('Copy failed: ' + err.message, true);
    }
  });
});

// Initialize
loadContent();
renderYearManager();
