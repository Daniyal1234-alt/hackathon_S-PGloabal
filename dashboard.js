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

async function initDashboard() {
  console.log('Initializing Dashboard...')
  try {
    await fetchDocuments()
    subscribeToChanges()
  } catch (err) {
    console.error('Dashboard Init Error:', err)
    showError('Failed to initialize dashboard connection.')
  }
}

async function fetchDocuments() {
  loadingSpinner.style.display = 'block'
  errorMsg.style.display = 'none'

  const { data, error } = await supabase
    .from('ma_documents')
    .select('*')
    .order('created_at', { ascending: false })
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
        console.log('Real-time change received!', payload)
        liveBadge.classList.add('pulse')
        setTimeout(() => liveBadge.classList.remove('pulse'), 2000)
        fetchDocuments() // Simple refresh
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
    const statusClass = getStatusClass(doc.status)
    const confidence = doc.confidence_score ? `${Math.round(doc.confidence_score * 100)}%` : '-'
    const date = new Date(doc.created_at).toLocaleString()

    return `
            <tr class="fade-in">
                <td>
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <span class="filename" title="${doc.filename}">${doc.filename}</span>
                    </div>
                </td>
                <td>${date}</td>
                <td><span class="badge ${statusClass}">${doc.status || 'Pending'}</span></td>
                <td>${confidence}</td>
                <td>
                    <button class="btn-sm" onclick="viewDetails('${doc.id}')">View Analysis</button>
                </td>
            </tr>
        `
  }).join('')
}

function updateStats(docs) {
  if (!docs) return
  statTotalDocs.textContent = docs.length

  const processing = docs.filter(d => d.status === 'processing').length
  statProcessing.textContent = processing

  const completed = docs.filter(d => d.confidence_score !== null)
  if (completed.length > 0) {
    const avg = completed.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0) / completed.length
    statAvgConfidence.textContent = `${Math.round(avg * 100)}%`
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
  errorMsg.textContent = `Error: ${msg}`
  errorMsg.style.display = 'block'
}

// Make viewDetails globally accessible
window.viewDetails = async (id) => {
  alert(`Showing details for Document ID: ${id}\n(Modal implementation pending full data structure)`)
  // In a full implementation, we would fetch the specific row and show the JSON analysis
}

// Start
document.addEventListener('DOMContentLoaded', initDashboard)
