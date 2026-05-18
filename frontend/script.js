const API_URL = '/api/applications';

// DOM Elements
const modal = document.getElementById('modal');
const appForm = document.getElementById('app-form');
const addBtn = document.getElementById('add-btn');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const modalTitle = document.getElementById('modal-title');

// Form Inputs
const idInput = document.getElementById('app-id');
const companyInput = document.getElementById('company');
const roleInput = document.getElementById('role');
const statusInput = document.getElementById('status');
const dateInput = document.getElementById('date_applied');
const notesInput = document.getElementById('notes');

// State
let applications = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchApplications();
    setupEventListeners();
    setupDragAndDrop();
    
    // Set default date to today for new applications
    dateInput.valueAsDate = new Date();
});

// Fetch all applications
async function fetchApplications() {
    try {
        const response = await fetch(API_URL);
        applications = await response.json();
        renderBoard();
    } catch (error) {
        console.error('Error fetching applications:', error);
    }
}

// Render the kanban board
function renderBoard() {
    const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    
    statuses.forEach(status => {
        const listEl = document.getElementById(`list-${status.toLowerCase()}`);
        const countEl = document.getElementById(`count-${status.toLowerCase()}`);
        
        listEl.innerHTML = '';
        const filteredApps = applications.filter(app => app.status === status);
        countEl.textContent = filteredApps.length;
        
        filteredApps.forEach(app => {
            const card = createCard(app);
            listEl.appendChild(card);
        });
    });
}

// Create a single card element
function createCard(app) {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.id = app.id;
    
    const formattedDate = new Date(app.date_applied).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    card.innerHTML = `
        <div class="card-company">${app.company}</div>
        <div class="card-role">${app.role}</div>
        ${app.notes ? `<div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${app.notes}</div>` : ''}
        <div class="card-footer">
            <div class="card-date">
                <i class="fa-regular fa-calendar"></i>
                <span>${formattedDate}</span>
            </div>
            <div class="card-actions">
                <button class="action-btn edit" onclick="editApp(${app.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteApp(${app.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;

    // Drag events
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', app.id);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
}

// Setup Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', () => {
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appData = {
            company: companyInput.value,
            role: roleInput.value,
            status: statusInput.value,
            date_applied: dateInput.value,
            notes: notesInput.value
        };

        const id = idInput.value;

        try {
            if (id) {
                // Update
                await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appData)
                });
            } else {
                // Create
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appData)
                });
            }
            closeModal();
            fetchApplications();
        } catch (error) {
            console.error('Error saving application:', error);
        }
    });
}

// Setup Drag and Drop
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            const list = column.querySelector('.card-list');
            if (draggingCard && list) {
                list.appendChild(draggingCard);
            }
        });

        column.addEventListener('drop', async e => {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            if (!draggingCard) return;
            
            const appId = draggingCard.dataset.id;
            const newStatus = column.dataset.status;
            
            const app = applications.find(a => a.id == appId);
            if (app && app.status !== newStatus) {
                // Update status in backend
                const updatedData = { ...app, status: newStatus };
                try {
                    await fetch(`${API_URL}/${appId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });
                    fetchApplications(); // Refresh data
                } catch (error) {
                    console.error('Error updating status:', error);
                    fetchApplications(); // Revert on error
                }
            }
        });
    });
}

// Global functions for card actions
window.editApp = (id) => {
    const app = applications.find(a => a.id === id);
    if (app) {
        openModal(app);
    }
};

window.deleteApp = async (id) => {
    if (confirm('Are you sure you want to delete this application?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchApplications();
        } catch (error) {
            console.error('Error deleting application:', error);
        }
    }
};

function openModal(app = null) {
    if (app) {
        modalTitle.textContent = 'Edit Application';
        idInput.value = app.id;
        companyInput.value = app.company;
        roleInput.value = app.role;
        statusInput.value = app.status;
        dateInput.value = app.date_applied;
        notesInput.value = app.notes || '';
    } else {
        modalTitle.textContent = 'New Application';
        appForm.reset();
        idInput.value = '';
        dateInput.valueAsDate = new Date();
    }
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}
