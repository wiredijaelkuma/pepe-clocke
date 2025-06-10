<template>
  <div class="agent-management-container">
    <h2 class="section-title">Agent Management</h2>
    
    <div class="agent-filters">
      <div class="filter-group">
        <label for="agent-select">Agent:</label>
        <select id="agent-select" v-model="selectedAgent" class="filter-dropdown">
          <option value="">Select Agent</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">{{ agent.name }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="date-select">Date:</label>
        <input id="date-select" type="date" v-model="selectedDate" class="filter-dropdown" />
      </div>
      
      <button @click="fetchAgentLogs" class="filter-btn">Filter</button>
    </div>
    
    <div class="agent-details">
      <h3>{{ selectedAgent ? getAgentName(selectedAgent) + "'s" : "All Agents'" }} Time Logs</h3>
      
      <div class="action-buttons">
        <button @click="showAddLogModal = true" class="add-btn">
          <i class="add-icon">+</i> Add Time Log
        </button>
      </div>
      
      <div v-if="loading" class="loading">Loading agent logs...</div>
      <div v-else-if="agentLogs.length === 0" class="no-logs">No logs found for this agent on the selected date.</div>
      <div v-else class="logs-container">
        <ul class="logs-list">
          <li v-for="log in agentLogs" :key="log.$id" class="log-item">
            <div class="log-details">
              <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
              <span class="log-status">{{ log.Status }}</span>
            </div>
            <div class="log-actions">
              <button @click="editLog(log)" class="edit-btn">Edit</button>
              <button @click="confirmDelete(log.$id)" class="delete-btn">Delete</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Add/Edit Log Modal -->
    <div v-if="showAddLogModal" class="modal">
      <div class="modal-content">
        <span class="close-btn" @click="showAddLogModal = false">&times;</span>
        <h3>{{ editingLogId ? 'Edit' : 'Add' }} Time Log</h3>
        
        <div class="form-group">
          <label for="log-agent">Agent:</label>
          <select id="log-agent" v-model="newLog.userId" class="form-input" :disabled="editingLogId">
            <option value="">Select Agent</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">{{ agent.name }}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="log-status">Status:</label>
          <select id="log-status" v-model="newLog.status" class="form-input">
            <option value="">Select Status</option>
            <option value="Clocked in">Clocked in</option>
            <option value="Clocked out">Clocked out</option>
            <option value="Started Lunch">Started Lunch</option>
            <option value="Back from Lunch">Back from Lunch</option>
            <option value="Started Short Break">Started Short Break</option>
            <option value="Back from Short Break">Back from Short Break</option>
            <option value="Started Bathroom Break">Started Bathroom Break</option>
            <option value="Back from Bathroom Break">Back from Bathroom Break</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="log-date">Date:</label>
          <input id="log-date" type="date" v-model="newLog.date" class="form-input" />
        </div>
        
        <div class="form-group">
          <label for="log-time">Time:</label>
          <input id="log-time" type="time" v-model="newLog.time" class="form-input" />
        </div>
        
        <div class="form-actions">
          <button @click="saveLog" class="submit-btn" :disabled="!isFormValid">
            {{ editingLogId ? 'Update' : 'Add' }} Log
          </button>
          <button @click="showAddLogModal = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this time log?</p>
        <div class="form-actions">
          <button @click="deleteLog" class="delete-confirm-btn">Delete</button>
          <button @click="showConfirmModal = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { databases, Query } from '../../lib/appwrite';

const agents = ref([]);
const selectedAgent = ref('');
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const agentLogs = ref([]);
const loading = ref(false);
const showAddLogModal = ref(false);
const showConfirmModal = ref(false);
const logToDelete = ref(null);
const editingLogId = ref(null);

const newLog = ref({
  userId: '',
  status: '',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5)
});

const isFormValid = computed(() => {
  return newLog.value.userId && newLog.value.status && newLog.value.date && newLog.value.time;
});

// Format date and time for display
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Helper function to get date range
function getDateRange(date) {
  // Create date objects at midnight for the date
  const start = new Date(date + 'T00:00:00');
  const end = new Date(date + 'T23:59:59');
  
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  console.log('Date range:', startISO, 'to', endISO);
  return { startISO, endISO };
}

// Watch for changes in selected agent or date
watch([selectedAgent, selectedDate], () => {
  fetchAgentLogs();
});

onMounted(async () => {
  await fetchAgents();
});

async function fetchAgents() {
  try {
    // Fetch all profiles
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    // Create a list of agents with id and name
    const agentsList = response.documents.map(profile => ({
      id: profile.user_Id,
      name: profile.displayName || profile.user_Id
    }));
    
    agents.value = agentsList.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch agents:', error);
  }
}

async function fetchAgentLogs() {
  loading.value = true;
  try {
    const { startISO, endISO } = getDateRange(selectedDate.value);
    
    let queries = [
      Query.greaterThanEqual('timestamp', startISO),
      Query.lessThan('timestamp', endISO),
      Query.orderDesc('timestamp')
    ];
    
    // Add user filter if an agent is selected
    if (selectedAgent.value) {
      queries.push(Query.equal('user_Id', selectedAgent.value));
    }
    
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      queries
    );
    
    agentLogs.value = response.documents;
  } catch (error) {
    console.error('Failed to fetch agent logs:', error);
  } finally {
    loading.value = false;
  }
}

function getAgentName(agentId) {
  const agent = agents.value.find(a => a.id === agentId);
  return agent ? agent.name : agentId;
}

function editLog(log) {
  editingLogId.value = log.$id;
  
  const logDate = new Date(log.timestamp);
  
  newLog.value = {
    userId: log.user_Id,
    status: log.Status,
    date: logDate.toISOString().slice(0, 10),
    time: logDate.toTimeString().slice(0, 5)
  };
  
  showAddLogModal.value = true;
}

function confirmDelete(logId) {
  logToDelete.value = logId;
  showConfirmModal.value = true;
}

async function deleteLog() {
  if (!logToDelete.value) return;
  
  try {
    await databases.deleteDocument(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      logToDelete.value
    );
    
    // Refresh agent logs
    await fetchAgentLogs();
    
    showConfirmModal.value = false;
    logToDelete.value = null;
    
    alert('Time log deleted successfully');
  } catch (error) {
    console.error('Failed to delete time log:', error);
    alert('Failed to delete time log. Please try again.');
  }
}

async function saveLog() {
  if (!isFormValid.value) return;
  
  try {
    // Combine date and time into timestamp
    const timestamp = new Date(`${newLog.value.date}T${newLog.value.time}`).toISOString();
    const today = new Date(newLog.value.date).toISOString().slice(0, 10);
    
    if (editingLogId.value) {
      // Update existing log
      await databases.updateDocument(
        '684639c3000fbbd515ea',
        '68463a24000779b721a1',
        editingLogId.value,
        {
          Status: newLog.value.status,
          date: today,
          timestamp: timestamp
        }
      );
    } else {
      // Create new log
      await databases.createDocument(
        '684639c3000fbbd515ea',
        '68463a24000779b721a1',
        'unique()',
        {
          user_Id: newLog.value.userId,
          Status: newLog.value.status,
          date: today,
          timestamp: timestamp
        }
      );
    }
    
    // Reset form and close modal
    newLog.value = {
      userId: '',
      status: '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5)
    };
    
    editingLogId.value = null;
    showAddLogModal.value = false;
    
    // Refresh agent logs
    await fetchAgentLogs();
    
    alert(editingLogId.value ? 'Time log updated successfully' : 'Time log added successfully');
  } catch (error) {
    console.error('Failed to save time log:', error);
    alert('Failed to save time log. Please try again.');
  }
}
</script>

<style scoped>
.agent-management-container {
  background: rgba(45, 55, 72, 0.8);
  padding: 24px;
  border-radius: 16px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #ffc107;
}

.agent-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.filter-dropdown {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 16px;
  color: #333;
  min-width: 180px;
  font-weight: 500;
}

.filter-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.agent-details {
  margin-top: 24px;
}

.agent-details h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #ffc107;
}

.action-buttons {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.add-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-icon {
  font-style: normal;
  font-weight: bold;
  font-size: 1.2rem;
}

.logs-container {
  max-height: 500px;
  overflow-y: auto;
}

.logs-list {
  list-style: none;
  padding: 0;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2d3748;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.log-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-time {
  color: #ffc107;
  font-family: monospace;
}

.log-status {
  font-weight: bold;
}

.log-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.loading, .no-logs {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 16px;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #2d3748;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a0aec0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #e2e8f0;
}

.form-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
}

.submit-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.submit-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.cancel-btn {
  background: #718096;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.delete-confirm-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
</style>