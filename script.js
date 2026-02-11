/* ============================================
   M&A Intelligence Hub - JavaScript
   FDSS Fast Hackathon 2025 | S&P Global -> Soft Red Theme
   Professional, subtle interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollReveal();
    initPipeline();
    initDemo();
    initCounters();
    initResultCards();
    initActiveNav();
    initDriveLink();
});

/* -------------------------------------------
   NAVBAR
   ------------------------------------------- */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    // Scroll shadow
    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu
    hamburger?.addEventListener('click', () => {
        const expanded = navLinks.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', expanded);
    });

    // Close mobile menu on link click
    navLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Smooth scroll for all in-page links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                const offset = navbar.offsetHeight + 16;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* -------------------------------------------
   SCROLL REVEAL (subtle fade-in)
   ------------------------------------------- */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

/* -------------------------------------------
   PIPELINE (click to expand sample data)
   ------------------------------------------- */
function initPipeline() {
    const steps = document.querySelectorAll('.pipeline-step');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            const isActive = step.classList.contains('active');

            // Close all
            steps.forEach(s => s.classList.remove('active'));

            // Toggle current
            if (!isActive) {
                step.classList.add('active');
            }
        });
    });
}

/* -------------------------------------------
   ANIMATED COUNTERS
   ------------------------------------------- */
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = prefix + current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* -------------------------------------------
   DEMO SECTION (Multi-File Upload + n8n)
   ------------------------------------------- */
function initDemo() {
    const processBtn = document.getElementById('process-btn');
    const processingBar = document.getElementById('processing-bar');
    const progressFill = document.getElementById('progress-fill');
    const processText = document.getElementById('process-text');
    const demoResults = document.getElementById('demo-results');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-upload');
    const webhookUrl = 'https://xcorre.app.n8n.cloud/webhook/178967dc-2e06-40e8-b05a-a87156fd5df6';

    let selectedDocs = new Set();
    let currentMode = 'sample'; // 'sample' or 'upload'

    // Backup original content
    const originalResultsContent = demoResults.innerHTML;

    // Handle Drag & Drop
    if (uploadZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        uploadZone.addEventListener('dragover', () => {
            uploadZone.classList.add('active');
            uploadZone.style.borderColor = 'var(--sp-royal-blue)';
            uploadZone.style.background = 'var(--bg-light)';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('active');
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            uploadZone.classList.remove('active');
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            const dt = e.dataTransfer;
            if (dt.files.length > 0) handleFiles(dt.files);
        });

        // Click to open file dialog
        uploadZone.addEventListener('click', (e) => {
            // If clicking inputs directly, don't trigger (prevents loop)
            if (e.target.tagName === 'INPUT') return;
            fileInput?.click();
        });
    }

    // Handle File Input
    fileInput?.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFiles(fileInput.files);
    });

    function handleFiles(files) {
        // Convert FileList to Array
        const fileArray = Array.from(files);
        const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'html', 'htm'];

        const validFiles = fileArray.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            return validExtensions.includes(ext);
        });

        if (validFiles.length === 0) {
            alert('Please upload supported files (PDF, DOCX, TXT, RTF, HTML).');
            return;
        }

        if (validFiles.length < fileArray.length) {
            console.warn(`Skipped ${fileArray.length - validFiles.length} unsupported files.`);
        }

        currentMode = 'upload';
        uploadFiles(validFiles);
    }

    // Flag to prevent double submission
    let isUploading = false;

    // UPDATED: Single Batch Upload
    function uploadFiles(files) {
        if (!processBtn) return;
        if (isUploading) return; // Prevent double submission

        isUploading = true;
        // UI Feedback
        processBtn.disabled = true;
        processingBar.classList.add('active');
        demoResults.classList.remove('active');
        progressFill.style.width = '0%';
        progressFill.style.background = 'var(--sp-royal-blue)'; // Reset color

        const total = files.length;
        processText.textContent = `Uploading batch of ${total} files...`;
        processBtn.innerHTML = `Uploading <span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-left:8px;"></span>`;

        // Start indeterminate progress
        progressFill.style.width = '30%';

        // Create FormData with ALL files
        const formData = new FormData();
        files.forEach((file, index) => {
            // Append each file with the same key 'files' (or 'files[]')
            // Using 'files' is standard for multiple file inputs
            formData.append('files', file);
        });

        // Single fetch request with multiple files
        fetch(webhookUrl, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    // Success
                    progressFill.style.width = '100%';
                    processText.textContent = 'Batch sent to n8n Webhook!';
                    processBtn.textContent = 'Sent Batch!';
                    processBtn.style.backgroundColor = 'var(--sp-green)';
                    processBtn.style.color = 'white';

                    setTimeout(() => {
                        showRealUploadSuccess(total);
                        processBtn.textContent = 'Upload More';
                        processBtn.style.backgroundColor = '';
                        processBtn.style.color = '';
                        isUploading = false;
                        processBtn.disabled = false;
                    }, 1000);
                } else {
                    throw new Error('Upload failed');
                }
            })
            .catch(err => {
                console.error('Upload error:', err);
                processText.textContent = 'Upload failed.';
                processBtn.textContent = 'Error';
                progressFill.style.background = 'var(--sp-red)';
                processBtn.disabled = false;
                isUploading = false;
            });
    }

    function showRealUploadSuccess(count) {
        processingBar.classList.remove('active');
        demoResults.classList.add('active');

        // Replace content with simple success message
        demoResults.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: fadeUp 0.5s ease-out;">
                <div style="font-size: 3rem; color: var(--sp-green); margin-bottom: 20px;">✓</div>
                <h3 style="margin-bottom: 10px; color: var(--text-primary);">${count} Files Sent in Batch</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Your documents are being processed together. Check the dashboard for real-time results.</p>
                <a href="dashboard.html" class="btn btn-primary btn-lg" style="text-decoration: none;">Go to Dashboard →</a>
            </div>
        `;
    }

    // Sample Docs Logic (Legacy Support)
    const sampleDocs = document.querySelectorAll('.sample-doc');
    sampleDocs.forEach(doc => {
        doc.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent upload zone click
            const id = doc.dataset.doc;
            if (selectedDocs.has(id)) {
                selectedDocs.delete(id);
                doc.classList.remove('selected');
            } else {
                selectedDocs.add(id);
                doc.classList.add('selected');
            }
            if (processBtn && currentMode === 'sample') {
                processBtn.disabled = selectedDocs.size === 0;
            }
            currentMode = 'sample';
        });
    });

    processBtn?.addEventListener('click', (e) => {
        if (processBtn.textContent.includes('More')) {
            // Reset UI
            demoResults.innerHTML = originalResultsContent;
            fileInput?.click();
            return;
        }
        if (selectedDocs.size > 0 && currentMode === 'sample') {
            runSimulation(); // Only for samples
        }
    });

    function runSimulation() {
        processBtn.disabled = true;
        processingBar.classList.add('active');
        demoResults.classList.remove('active');

        // Reset bar
        progressFill.style.width = '0%';
        progressFill.style.background = 'var(--sp-green)';

        const stages = [
            { text: 'Extracting text content...', pct: 30 },
            { text: 'Running Claude AI analysis...', pct: 55 },
            { text: 'Classifying M&A relevance...', pct: 75 },
            { text: 'Analysis complete.', pct: 100 }
        ];

        let i = 0;
        function nextStage() {
            if (i < stages.length) {
                const stage = stages[i];
                processText.textContent = stage.text;
                progressFill.style.width = stage.pct + '%';
                i++;
                setTimeout(nextStage, 600 + Math.random() * 400);
            } else {
                setTimeout(showResults, 300);
            }
        }
        nextStage();
    }

    function showResults() {
        processingBar.classList.remove('active');
        progressFill.style.width = '0%';
        progressFill.style.background = '';
        demoResults.classList.add('active');
        demoResults.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

        if (processBtn) {
            processBtn.disabled = false;
        }
    }
}

/* -------------------------------------------
   RESULT CARDS (expand/collapse)
   ------------------------------------------- */
function initResultCards() {
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.result-header');
        if (!header) return;

        const card = header.closest('.result-card');
        const isExpanded = card.classList.toggle('expanded');
        header.setAttribute('aria-expanded', isExpanded);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const header = e.target.closest('.result-header');
            if (header) {
                e.preventDefault();
                header.click();
            }
        }
    });
}

/* -------------------------------------------
   ACTIVE NAV HIGHLIGHTING
   ------------------------------------------- */
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-80px 0px -40% 0px'
    });

    sections.forEach(section => observer.observe(section));
}

/* ============================================
   ACCESS CODE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('access-modal');
    const input = document.getElementById('access-code');
    const btn = document.getElementById('access-btn');
    const error = document.getElementById('access-error');

    // Check if already authorized
    if (localStorage.getItem('ma_access_granted') === 'true') {
        if (modal) modal.style.display = 'none';
    } else {
        if (modal) modal.style.display = 'flex';
    }

    function check() {
        const val = input.value.trim().toLowerCase();
        if (val === 'spg2025' || val === 'admin') {
            localStorage.setItem('ma_access_granted', 'true');
            modal.style.opacity = '0';
            setTimeout(() => modal.style.display = 'none', 500);
        } else {
            error.style.display = 'block';
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        }
    }

    if (btn) btn.addEventListener('click', check);
    if (input) input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') check();
        error.style.display = 'none';
    });
});

/* ============================================
   GOOGLE DRIVE LINK HANDLER
   ============================================ */
function initDriveLink() {
    const form = document.getElementById('drive-link-form');
    const input = document.getElementById('drive-link-input');
    const msg = document.getElementById('drive-link-message');
    const btn = form?.querySelector('button');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const link = input.value.trim();
        if (!link) return;

        // Loading state
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.innerHTML = 'Loading... <span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-left:8px;"></span>';
        msg.textContent = '';
        msg.style.color = 'var(--text-secondary)';

        try {
            const response = await fetch('https://xcorre.app.n8n.cloud/webhook/39efc486-e1f0-47c0-80fd-63cf484f5357', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link: link })
            });

            if (response.ok) {
                msg.textContent = '✅ Analysis started successfully! Check Dashboard.';
                msg.style.color = 'var(--sp-green)';
                input.value = '';

                // Add a small link to dashboard
                setTimeout(() => {
                    msg.innerHTML += ' <a href="dashboard.html" style="text-decoration:underline;">View Dashboard</a>';
                }, 500);
            } else {
                throw new Error('Webhook failed');
            }
        } catch (error) {
            console.error(error);
            msg.textContent = '❌ Request failed. Please check the link and try again.';
            msg.style.color = 'var(--sp-red)';
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}
