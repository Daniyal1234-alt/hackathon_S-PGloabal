import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuration
const SUPABASE_URL = 'https://kqaapsafjbnqqrgbjjbb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYWFwc2FmamJucXFyZ2JqamJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwMzk0MywiZXhwIjoyMDg2Mzc5OTQzfQ.74cSemjE6TlV68ZKoeYJrDNoFqT9tslvaNYYcipouHk'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// DOM Elements
const tableBody = document.getElementById('dashboard-table-body')
const loadingSpinner = document.getElementById('loading-spinner')
const liveBadge = document.getElementById('live-indicator')
const errorMsg = document.getElementById('dashboard-error')

// Stats Elements
const statTotalDocs = document.getElementById('stat-total-docs')
const statAvgConfidence = document.getElementById('stat-avg-confidence')
const statProcessing = document.getElementById('stat-processing')

// Modal Elements
const modal = document.getElementById('analysis-modal')

// Auto Arrange Elements
const autoArrangeBtn = document.getElementById('auto-arrange-btn')
const N8N_AUTO_ARRANGE_URL = 'https://xcorre.app.n8n.cloud/webhook/896c72d4-19c5-4ffb-b471-2788fdbde5ba'

async function initDashboard() {
  try {
    initAutoArrange()
    await fetchDocuments()
    subscribeToChanges()
  } catch (err) {
    console.error('Dashboard Init Error:', err)
    showError('Failed to initialize dashboard connection.')
  }
}

function initAutoArrange() {
  if (!autoArrangeBtn) return;

  autoArrangeBtn.addEventListener('click', async () => {
    const icon = document.getElementById('arrange-icon');
    const text = document.getElementById('arrange-text');
    const originalIcon = icon.textContent;

    // Loading State
    autoArrangeBtn.disabled = true;
    autoArrangeBtn.style.opacity = '0.8';
    icon.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid white;border-right-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></span>';
    text.textContent = 'Processing...';

    try {
      const response = await fetch(N8N_AUTO_ARRANGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_arrange', timestamp: new Date().toISOString() })
      });

      if (response.ok) {
        alert('✅ Google Drive files have been organized successfully!');
      } else {
        throw new Error('Webhook returned error');
      }
    } catch (err) {
      console.error('Auto Arrange Error:', err);
      alert('❌ Failed to trigger auto-arrange. Please try again.');
    } finally {
      // Reset UI
      autoArrangeBtn.disabled = false;
      autoArrangeBtn.style.opacity = '1';
      icon.textContent = originalIcon;
      text.textContent = 'Auto Arrange Drive';
    }
  });
}

async function fetchDocuments() {
  loadingSpinner.style.display = 'block'
  errorMsg.style.display = 'none'

  const { data, error } = await supabase
    .from('ma_documents')
    .select('*')
    .order('upload_date', { ascending: false })
    .limit(50)

  loadingSpinner.style.display = 'none'

  if (error) {
    console.error('Supabase Error:', error)
    showError(error.message)
    return
  }

  renderTable(data)
  updateStats(data)
}

function subscribeToChanges() {
  supabase
    .channel('ma_documents_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ma_documents' },
      (payload) => {
        if (liveBadge) {
          liveBadge.classList.add('pulse')
          setTimeout(() => liveBadge.classList.remove('pulse'), 2000)
        }
        fetchDocuments()
      }
    )
    .subscribe()
}

function renderTable(documents) {
  if (!documents || documents.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No documents found. Upload some PDF files to get started.</td></tr>'
    return
  }

  tableBody.innerHTML = documents.map(doc => {
    const status = doc.processing_status || 'pending'
    const filename = doc.file_name || 'Unknown File'
    const dateStr = doc.upload_date ? new Date(doc.upload_date).toLocaleString() : '-'
    const confidence = doc.confidence_score ? `${doc.confidence_score}%` : '-'
    const id = doc.document_id

    const statusClass = getStatusClass(status)

    return `
            <tr>
                <td>
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <span class="filename" title="${filename}">${filename}</span>
                    </div>
                </td>
                <td>${dateStr}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>${confidence}</td>
                <td>
                    <button class="btn-sm" onclick="viewDetails('${id}')">View Analysis</button>
                </td>
            </tr>
        `
  }).join('')
}

function updateStats(docs) {
  if (!docs) return
  statTotalDocs.textContent = docs.length

  const processing = docs.filter(d => (d.processing_status || '').toLowerCase() === 'processing').length
  statProcessing.textContent = processing

  const completed = docs.filter(d => d.confidence_score > 0)
  if (completed.length > 0) {
    const avg = completed.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0) / completed.length
    statAvgConfidence.textContent = `${Math.round(avg)}%`
  } else {
    statAvgConfidence.textContent = '-'
  }
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'completed': return 'badge-success'
    case 'processing': return 'badge-warning'
    case 'failed': return 'badge-danger'
    default: return 'badge-neutral'
  }
}

function showError(msg) {
  if (errorMsg) {
    errorMsg.textContent = `Error: ${msg}`
    errorMsg.style.display = 'block'
  }
}

// Global functions for HTML access
window.viewDetails = async (id) => {
  const { data, error } = await supabase
    .from('ma_documents')
    .select('*')
    .eq('document_id', id)
    .single()

  if (data) {
    populateModal(data)
    modal.style.display = 'flex'
    document.body.style.overflow = 'hidden' // Prevent bg scrolling
  } else {
    alert('Could not fetch details.')
  }
}

window.closeModal = () => {
  if (modal) {
    modal.style.display = 'none'
    document.body.style.overflow = ''
  }
}

// Close when clicking outside
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) window.closeModal()
  })
}

function populateModal(data) {
  // Helper to safely set text
  const setText = (id, val) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val || '-'
  }

  setText('modal-filename', data.file_name)
  setText('modal-id', data.document_id)
  setText('modal-date', data.processed_date ? new Date(data.processed_date).toLocaleString() : '-')

  // M&A Card
  setText('modal-is-ma', data.is_ma_related ? 'Yes' : 'No')
  setText('modal-ma-confidence', data.confidence_score ? `${data.confidence_score}%` : '-')
  setText('modal-trans-type', data.transaction_type)
  setText('modal-deal-value', data.deal_value)

  // Tech Card
  setText('modal-is-tech', data.is_tech_related ? 'Yes' : 'No')
  setText('modal-tech-confidence', data.tech_confidence_score ? `${data.tech_confidence_score}%` : '-')
  setText('modal-industry', data.industry_classification)

  // Insights
  const insightsList = document.getElementById('modal-insights')
  if (insightsList) {
    insightsList.innerHTML = ''
    const points = data.key_points || []
    if (points.length > 0) {
      points.forEach(point => {
        const li = document.createElement('li')
        li.textContent = point
        li.style.marginBottom = '8px'
        insightsList.appendChild(li)
      })
    } else {
      insightsList.innerHTML = '<li style="color:var(--text-muted); list-style:none;">No specific insights extracted.</li>'
    }
  }

  // Reasoning
  setText('modal-reasoning', data.reasoning || data.context || 'No reasoning provided.')
}

// Start
document.addEventListener('DOMContentLoaded', initDashboard)
