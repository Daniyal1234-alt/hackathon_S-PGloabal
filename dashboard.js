/**
 * M&A Intelligence Hub - Dashboard Logic
 * Fetches real-time data from Supabase
 */

const { createClient } = supabase;

// Initialize Supabase
const sbParam = {
    url: window.SUPABASE_CONFIG.url,
    key: window.SUPABASE_CONFIG.key
};

const supabaseClient = createClient(sbParam.url, sbParam.key);

// DOM Elements
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refresh-btn');
const modal = document.getElementById('detail-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

// State
let allDocuments = [];

// Fetch initial data
fetchDocuments();

// Event Listeners
refreshBtn.addEventListener('click', fetchDocuments);
searchInput.addEventListener('input', (e) => filterDocuments(e.target.value));
closeModal.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

async function fetchDocuments() {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('ma_documents')
        .select('*')
        .order('processed_date', { ascending: false });

    if (error) {
        console.error('Error fetching documents:', error);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--sp-red);">Error loading data: ${error.message}</td></tr>`;
        return;
    }

    allDocuments = data || [];
    updateMetrics();
    renderTable(allDocuments);
}

function updateMetrics() {
    const total = allDocuments.length;
    const maRelated = allDocuments.filter(d => d.is_ma_related).length;
    const techRelated = allDocuments.filter(d => d.is_tech_related).length;

    const avgConf = total > 0
        ? Math.round(allDocuments.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / total)
        : 0;

    document.getElementById('total-docs').textContent = total;
    animateValue(document.getElementById('ma-docs'), 0, maRelated, 1000);
    animateValue(document.getElementById('tech-docs'), 0, techRelated, 1000);
    document.getElementById('avg-confidence').textContent = avgConf + '%';
}

function renderTable(docs) {
    if (docs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No documents found.</td></tr>';
        return;
    }

    tableBody.innerHTML = docs.map(doc => {
        const statusClass = getStatusClass(doc.processing_status);
        const maScoreClass = getScoreClass(doc.confidence_score);
        const techScoreClass = getScoreClass(doc.tech_confidence_score);

        return `
      <tr onclick="showDetails('${doc.document_id}')">
        <td><span class="status-badge ${statusClass}">${doc.processing_status || 'Unknown'}</span></td>
        <td><strong>${doc.file_name}</strong></td>
        <td>${doc.transaction_type || '-'}</td>
        <td class="score-cell ${maScoreClass}">${doc.confidence_score}%</td>
        <td class="score-cell ${techScoreClass}">${doc.tech_confidence_score}%</td>
        <td>${doc.deal_value || '-'}</td>
        <td>${new Date(doc.processed_date).toLocaleDateString()}</td>
        <td><button class="btn btn-sm btn-ghost">View</button></td>
      </tr>
    `;
    }).join('');
}

function filterDocuments(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = allDocuments.filter(doc =>
        (doc.file_name && doc.file_name.toLowerCase().includes(lowerQuery)) ||
        (doc.acquiring_company && doc.acquiring_company.toLowerCase().includes(lowerQuery)) ||
        (doc.target_company && doc.target_company.toLowerCase().includes(lowerQuery)) ||
        (doc.context && doc.context.toLowerCase().includes(lowerQuery))
    );
    renderTable(filtered);
}

function showDetails(id) {
    const doc = allDocuments.find(d => d.document_id === id);
    if (!doc) return;

    const maIndicators = (doc.ma_indicators || []).map(i => `<span class="feature-tag">${i}</span>`).join('');
    const keyPoints = (doc.key_points || []).map(p => `<li>${p}</li>`).join('');

    modalBody.innerHTML = `
    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 20px;">
      <h2 style="color: var(--sp-navy); margin-bottom: 8px;">${doc.file_name}</h2>
      <div style="display: flex; gap: 12px; font-size: 0.875rem; color: var(--text-secondary);">
        <span>ID: ${doc.document_id}</span>
        <span>Processed: ${new Date(doc.processed_date).toLocaleString()}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
      <div style="background: var(--bg-light); padding: 20px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 12px; color: var(--sp-royal-blue);">M&A Analysis</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Is M&A Related:</span>
          <strong>${doc.is_ma_related ? 'Yes' : 'No'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Confidence Score:</span>
          <strong>${doc.confidence_score}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Transaction Type:</span>
          <strong>${doc.transaction_type}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Deal Value:</span>
          <strong>${doc.deal_value || 'Unknown'}</strong>
        </div>
      </div>

      <div style="background: var(--bg-light); padding: 20px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 12px; color: var(--sp-royal-blue);">Tech Classification</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Is Tech Related:</span>
          <strong>${doc.is_tech_related ? 'Yes' : 'No'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Tech Confidence:</span>
          <strong>${doc.tech_confidence_score}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Industry:</span>
          <strong>${doc.industry_classification}</strong>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Key Insights</h4>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        ${keyPoints || '<li>No key points extracted.</li>'}
      </ul>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">AI Reasoning</h4>
      <p style="background: var(--bg-light); padding: 16px; border-left: 4px solid var(--sp-royal-blue); border-radius: 4px;">
        ${doc.reasoning || 'No reasoning provided.'}
      </p>
    </div>

     <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Raw Text Excerpt</h4>
      <p style="font-size: 0.8rem; color: var(--text-secondary); background: #f5f5f5; padding: 12px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
        ${doc.raw_text_excerpt || 'No excerpt available.'}
      </p>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 12px;">
      <button class="btn btn-secondary" onclick="document.querySelector('.close-modal').click()">Close</button>
      <a href="${doc.file_url || '#'}" target="_blank" class="btn btn-primary" ${!doc.file_url ? 'disabled' : ''}>View Original File</a>
    </div>
  `;

    modal.classList.add('active');
}

// Helpers
function getStatusClass(status) {
    if (!status) return 'info';
    status = status.toLowerCase();
    if (status === 'completed' || status === 'processed') return 'success';
    if (status === 'failed' || status === 'error') return 'error';
    if (status === 'pending') return 'warning';
    return 'info';
}

function getScoreClass(score) {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
