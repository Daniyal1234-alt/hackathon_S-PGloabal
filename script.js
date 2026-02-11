/* ============================================
   M&A Intelligence Hub - JavaScript
   FDSS Fast Hackathon 2025 | S&P Global
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
   DEMO SECTION
   ------------------------------------------- */
function initDemo() {
    const sampleDocs = document.querySelectorAll('.sample-doc');
    const processBtn = document.getElementById('process-btn');
    const processingBar = document.getElementById('processing-bar');
    const progressFill = document.getElementById('progress-fill');
    const processText = document.getElementById('process-text');
    const demoResults = document.getElementById('demo-results');
    const uploadZone = document.getElementById('upload-zone');

    let selectedDocs = new Set();

    // Toggle doc selection
    sampleDocs.forEach(doc => {
        doc.addEventListener('click', () => {
            const id = doc.dataset.doc;
            if (selectedDocs.has(id)) {
                selectedDocs.delete(id);
                doc.classList.remove('selected');
            } else {
                selectedDocs.add(id);
                doc.classList.add('selected');
            }
            processBtn.disabled = selectedDocs.size === 0;
        });
    });

    // Upload zone click selects all
    uploadZone?.addEventListener('click', () => {
        sampleDocs.forEach(doc => {
            selectedDocs.add(doc.dataset.doc);
            doc.classList.add('selected');
        });
        processBtn.disabled = false;
    });

    // Process
    processBtn?.addEventListener('click', () => {
        runProcessing();
    });

    function runProcessing() {
        processBtn.disabled = true;
        processingBar.classList.add('active');
        demoResults.classList.remove('active');

        const stages = [
            { text: 'Uploading documents to pipeline...', pct: 15 },
            { text: 'Extracting text content...', pct: 30 },
            { text: 'Running Claude AI analysis...', pct: 55 },
            { text: 'Classifying M&A relevance...', pct: 75 },
            { text: 'Categorizing technology sectors...', pct: 90 },
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
        demoResults.classList.add('active');

        // Trigger reveal animation on result cards
        demoResults.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('visible');
        });

        // Reset
        processBtn.disabled = false;
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
