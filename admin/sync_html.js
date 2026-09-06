const fs = require('fs');
const path = require('path');

function syncHtml(rootDir, data) {
  const htmlPath = path.join(rootDir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Update Hero name & subtitle
  if (data.hero) {
    if (data.hero.name) {
      html = html.replace(
        /(<span class="typing-text" data-text=")[^"]*(" data-delay="500"><\/span>)/,
        `$1${data.hero.name}$2`
      );
      html = html.replace(
        /(<div class="logo">)[^<]*(<\/div>)/,
        `$1${data.hero.name}$2`
      );
    }
    if (data.hero.subtitle) {
      html = html.replace(
        /(<h2 class="subtitle typing-text" data-text=")[^"]*(" data-delay="1800"><\/h2>)/,
        `$1${data.hero.subtitle}$2`
      );
    }
    if (data.hero.photo) {
      html = html.replace(
        /(<div class="landing-image">[\s\S]*?<img src=")[^"]*(")/,
        `$1${encodeURI(data.hero.photo)}$2`
      );
    }
    if (Array.isArray(data.hero.bashLines) && data.hero.bashLines.length > 0) {
      const bashLinesHtml = data.hero.bashLines
        .map(line => `          <p class="bash-out">${line}</p>`)
        .join('\n');
      html = html.replace(
        /(<p class="bash-cmd">\$ cat about_me\.txt<\/p>[\s\S]*?)(<p class="bash-out">[\s\S]*?)(<p class="bash-cmd">\$ <span class="bash-cursor">)/,
        `$1\n${bashLinesHtml}\n          $3`
      );
    }
  }

  // 2. Update Academic Report Cards
  if (Array.isArray(data.reportCards) && data.reportCards.length > 0) {
    // Unique years in ascending order — from data.reportYears if the admin set one,
    // otherwise derived from the report cards themselves
    let years;
    if (Array.isArray(data.reportYears) && data.reportYears.length > 0) {
      years = data.reportYears.slice().sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return (isNaN(numA) || isNaN(numB)) ? String(a).localeCompare(String(b)) : numA - numB;
      });
    } else {
      years = [...new Set(data.reportCards.map(c => c.year))].sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return (isNaN(numA) ? a : numA) > (isNaN(numB) ? b : numB) ? 1 : -1;
      });
    }

    const selectOptionsHtml = years
      .map((y, idx) => `        <option value="${y}"${idx === 0 ? ' selected' : ''}>Year ${y}</option>`)
      .join('\n');

    const cardsHtml = data.reportCards
      .map(c => {
        const photoSrc = encodeURI(c.photo || '');
        const pdfHref = encodeURI(c.pdf || '#');
        return `      <!-- Year ${c.year} -->\n      <div class="report-card" data-year="${c.year}">\n        <div class="report-card-head">\n          <span class="report-year-badge">Year ${c.year}</span>\n          <h2>${c.term}</h2>\n        </div>\n        <div class="report-images">\n          <img src="${photoSrc}" alt="${c.term}">\n        </div>\n        <div class="pdf-link">\n          <a href="${pdfHref}" target="_blank">Download PDF &rarr;</a>\n          <button type="button" class="report-zoom-btn">View Full Size &#128269;</button>\n        </div>\n      </div>`;
      })
      .join('\n');

    // Replace select options (legacy) and year tab buttons
    html = html.replace(
      /(<select id="yearSelect">)[\s\S]*?(<\/select>)/,
      `$1\n${selectOptionsHtml}\n      $2`
    );

    const tabsHtml = years
      .map((y, idx) => `        <button class="year-tab${idx === 0 ? ' active' : ''}" data-year="${y}">Year ${y}</button>`)
      .join('\n');
    html = html.replace(
      /(<div class="year-tabs">)[\s\S]*?(<\/div>)/,
      `$1\n${tabsHtml}\n      $2`
    );

    // Replace report-cards-container
    html = html.replace(
      /(<div class="report-cards-container">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/,
      `$1\n${cardsHtml}\n    $2`
    );
  }

  // 3. Update Certificates
  if ((Array.isArray(data.certificates) && data.certificates.length > 0) ||
      (data.certificateCategories && Object.keys(data.certificateCategories).length > 0)) {
    // Group certificates by category
    const categories = {};
    data.certificates.forEach(cert => {
      const cat = cert.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cert);
    });
    // Categories declared in the manager render even while they have no certificates yet,
    // so a newly added group shows up on the site immediately.
    Object.keys(data.certificateCategories || {}).forEach(catName => {
      if (!categories[catName]) categories[catName] = [];
    });

    const escCert = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const certCategoriesHtml = Object.keys(categories).map(catName => {
      const cards = categories[catName].map(c => {
        const photoSrc = encodeURI(c.photo || '');
        const tags = (Array.isArray(c.tags) ? c.tags : [])
          .map(t => `            <span class="glass-tag">${escCert(t)}</span>`)
          .join('\n');
        const tagBlock = tags ? `\n          <div class="extra-tags cert-tags-overlay">\n${tags}\n          </div>` : '';
        const linkTag = c.link && c.link !== '#'
          ? `          <a class="cert-link-chip" href="${escCert(c.link)}" target="_blank" rel="noopener">Verify &#8599;</a>\n` : '';
        return `        <div class="cert-card" tabindex="0">\n          <div class="cert-photo-wrap">\n            <img src="${photoSrc}" alt="${escCert(c.title)}" loading="lazy">${tagBlock}\n          </div>\n          <h3>${escCert(c.title)}</h3>\n          <p class="cert-desc">${escCert(c.description || 'Certificate earned — details verified and documented.')}</p>\n${linkTag}        </div>`;
      }).join('\n');

      const catDesc = data.certificateCategories && data.certificateCategories[catName] && data.certificateCategories[catName].description
        ? `\n      <p class="category-desc">${escCert(data.certificateCategories[catName].description)}</p>` : '';
      return `    <div class="cert-category reveal">\n      <h2 class="section-title">${escCert(catName)}</h2>${catDesc}\n      <div class="cert-grid">\n${cards}\n      </div>\n    </div>`;
    }).join('\n\n');

    // Splice by index instead of a cross-section regex: replace from the first
    // cert-category div up to (and including) this section's own closing tag.
    // This survives section reordering (the old regex hardcoded the next
    // section as EXPERIENCES) and never eats neighbouring sections' markup.
    const certSecIdx = html.indexOf('<section class="certificates reveal" id="certificates">');
    if (certSecIdx >= 0) {
      const gridStartRel = html.indexOf('<div class="cert-category reveal">', certSecIdx);
      const closeRel = html.indexOf('</section>', gridStartRel);
      if (gridStartRel > certSecIdx && closeRel > gridStartRel) {
        html =
          html.slice(0, gridStartRel) +
          certCategoriesHtml +
          '\n  </section>' +
          html.slice(closeRel + '</section>'.length);
      }
    }
  }

  // 4. Update Projects — exact WealthWise template per project
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const projectsHtml = data.projects.map((p, i) => {
      const photoSrc = encodeURI(p.photo || '');
      const points = (Array.isArray(p.points) ? p.points : [])
        .map(pt => `            <li class="project-point">
              <span class="project-point-plus">+</span>
              <p>${esc(pt)}</p>
            </li>`)
        .join('\n');
      const badges = (Array.isArray(p.tags) ? p.tags : [])
        .map(t => `          <span class="project-badge"><span class="project-badge-dot" style="background:${esc(p.accentColor || '#818cf8')}"></span>${esc(t)}</span>`)
        .join('\n');
      const links = [];
      if (p.showLink !== false) {
        const hasUrl = p.link && p.link !== '#';
        const href = hasUrl ? esc(p.link) : '#';
        links.push(`          <a href="${href}"${hasUrl ? ' target="_blank" rel="noopener"' : ''} class="project-link">Check out
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
          </a>`);
      }
      if (p.github) {
        links.push(`          <a href="${esc(p.github)}" target="_blank" rel="noopener" class="project-link">GitHub
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          </a>`);
      }
      const flip = i % 2 === 1 ? ' project-row--flip' : '';
      return `      <!-- PROJECT: ${esc(p.title)} -->
      <div class="project-row reveal${flip}">
        <div class="project-card-visual">
          <div class="project-glow"></div>
          <div class="project-card-inner">
            <h2 class="project-card-title">${esc(p.fullTitle || p.title)}</h2>
            <div class="project-browser">
              <div class="browser-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <div class="browser-content">
                <img src="${photoSrc}" alt="${esc(p.title)}">
              </div>
            </div>
          </div>
        </div>
        <div class="project-details">
          <div class="project-details-header">
            <div class="project-accent-bar"></div>
            <h3 class="project-details-title">${esc(p.title)}</h3>
${links.length > 0 ? links.join('\n') : ''}
          </div>
          <p class="project-details-desc">${esc(p.description)}</p>
          <ul class="project-points">
${points}
          </ul>
          <div class="project-badges">
${badges}
          </div>
        </div>
      </div>`;
    }).join('\n\n');

    html = html.replace(
      /(<div class="projects-list">)[\s\S]*?(\n    <\/div>\s*<\/section>)/,
      `$1\n${projectsHtml}\n$2`
    );
  }

  // 5. Update Skills — simple chips grouped by category
  if (data.skills && typeof data.skills === 'object') {
    const CATS = [
      { key: 'technical', name: 'Technical', dot: '#60a5fa' },
      { key: 'academic', name: 'Academic', dot: '#34d399' },
      { key: 'soft', name: 'Leadership & Soft Skills', dot: '#fb923c' }
    ];

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const skillsHtml = CATS
      .filter(cat => Array.isArray(data.skills[cat.key]) && data.skills[cat.key].length > 0)
      .map(cat => {
        const chips = data.skills[cat.key]
          .map(s => `        <div class="skill-chip"><span class="skill-dot" style="background:${cat.dot}"></span>${esc(s)}</div>`)
          .join('\n');
        return `    <div class="skills-category">
      <h3 class="skills-category-title">${esc(cat.name)}</h3>
      <div class="skills-row">
${chips}
      </div>
    </div>`;
      })
      .join('\n\n');

    html = html.replace(
      /(<div class="skills-showcase"[^>]*>)[\s\S]*?(\n    <\/div>\s*<\/section>)/,
      `$1\n${skillsHtml}\n$2`
    );
  }

  // 6. Update Extracurriculars
  if (Array.isArray(data.extracurriculars) && data.extracurriculars.length > 0) {
    const extraHtml = data.extracurriculars.map(e => {
      const photoSrc = encodeURI(e.photo || '');
      const tags = (Array.isArray(e.tags) ? e.tags : [])
        .map(t => `            <span class="glass-tag">${t}</span>`)
        .join('\n');
      const lead = e.lead ? `\n          <p class="extra-lead">${e.lead}</p>` : '';
      const points = (Array.isArray(e.points) ? e.points : [])
        .map(p => `            <li class="extra-point">${p}</li>`)
        .join('\n');
      const pointsBlock = points ? `\n          <ul class="extra-points">\n${points}\n          </ul>` : '';
      return `      <div class="extra-card reveal">\n        <figure class="extra-photo">\n          <img src="${photoSrc}" alt="${e.title}">\n          <div class="extra-tags">\n${tags}\n          </div>\n        </figure>\n        <div class="extra-body">\n          <h3>${e.title}</h3>${lead}\n          <p class="extra-desc">${e.description}</p>${pointsBlock}\n        </div>\n      </div>`;
    }).join('\n\n');

    html = html.replace(
      /(<section class="extracurriculars reveal" id="extracurriculars">[\s\S]*?<p class="academics-intro">[\s\S]*?<\/p>[\s\n]*)(<div class="extra-grid">[\s\S]*?)(<\/section>\s*<!-- ============================================================[\s\n]*CONTACT)/,
      `$1\n    <div class="extra-grid">\n${extraHtml}\n    </div>\n  $3`
    );
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  return true;
}

module.exports = { syncHtml };
