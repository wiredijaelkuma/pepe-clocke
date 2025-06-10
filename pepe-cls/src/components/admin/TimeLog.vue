<template>
  <div class="time-log-container">
    <h2 class="section-title">Time Log</h2>
    <div class="time-log-sections">
      <button @click="activeSection = 'daily'" :class="{ active: activeSection === 'daily' }">Daily</button>
      <button @click="activeSection = 'weekly'" :class="{ active: activeSection === 'weekly' }">Weekly</button>
      <button @click="activeSection = 'custom'" :class="{ active: activeSection === 'custom' }">Custom</button>
    </div>
    <div class="filters">
      <div class="filter-group">
        <label for="agent-select">Agent:</label>
        <select id="agent-select" v-model="selectedAgent" class="filter-dropdown">
          <option value="">All Agents</option>
          <option v-for="agent in uniqueAgents" :key="agent.id" :value="agent.id">{{ agent.name }}</option>
        </select>
      </div>
      
      <div class="filter-group" v-if="activeSection === 'daily'">
        <label for="date-select">Date:</label>
        <input id="date-select" type="date" v-model="selectedDate" class="filter-dropdown" />
      </div>
      
      <div class="filter-group" v-if="activeSection === 'weekly'">
        <label for="week-select">Week:</label>
        <select id="week-select" v-model="selectedWeek" class="filter-dropdown">
          <option v-for="week in availableWeeks" :key="week.value" :value="week.value">{{ week.label }}</option>
        </select>
      </div>
      
      <div v-if="activeSection === 'custom'" class="custom-date-range">
        <div class="filter-group">
          <label for="start-date">Start Date:</label>
          <input id="start-date" type="date" v-model="customStartDate" class="filter-dropdown" />
        </div>
        <div class="filter-group">
          <label for="end-date">End Date:</label>
          <input id="end-date" type="date" v-model="customEndDate" class="filter-dropdown" />
        </div>
      </div>
      
      <button @click="downloadLogs" class="download-btn">
        <i class="download-icon">↓</i> Download Logs
      </button>
    </div>
    
    <div class="time-log-content">
      <div v-if="loading">Loading time logs...</div>
      <div v-else-if="filteredTimeLogs.length === 0">No time logs found.</div>
      <div v-else class="time-log-scroll">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search logs..." 
            class="search-input"
          />
        </div>
        <ul class="time-log-list">
          <li v-for="log in searchedLogs" :key="log.$id" class="time-log-item">
            <span class="log-user">{{ getUserDisplayName(log.user_Id) }}</span>
            <span class="log-status">{{ log.Status }}</span>
            <span class="log-timestamp">{{ formatDate(log.timestamp) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { databases, Query } from '../../lib/appwrite';

const timeLogs = ref([]);
const loading = ref(true);
const activeSection = ref('daily');
const uniqueAgents = ref([]);
const selectedAgent = ref('');
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const selectedWeek = ref('');
const availableWeeks = ref([]);
const userProfiles = ref({});
const customStartDate = ref(new Date().toISOString().slice(0, 10));
const customEndDate = ref(new Date().toISOString().slice(0, 10));
const searchQuery = ref('');

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Helper function to get date range
function getDateRange(startDate, endDate) {
  // Create date objects at midnight for the start and end dates
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  console.log('Date range:', startISO, 'to', endISO);
  return { startISO, endISO };
}

onMounted(() => {
  generateWeeks();
  fetchTimeLogs();
});

function generateWeeks() {
  const weeks = [];
  const currentDate = new Date();
  
  // Generate weeks for the last 4 weeks
  for (let i = 0; i < 4; i++) {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (i * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startStr = startOfWeek.toISOString().slice(0, 10);
    const endStr = endOfWeek.toISOString().slice(0, 10);
    
    weeks.push({
      label: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      value: `${startStr}|${endStr}`
    });
  }
  
  availableWeeks.value = weeks;
  selectedWeek.value = weeks[0].value;
}

// Watch for changes in date selection
watch([selectedDate, selectedWeek, customStartDate, customEndDate, activeSection], () => {
  fetchTimeLogs();
});

const fetchTimeLogs = async () => {
  loading.value = true;
  try {
    let dateQueries = [];
    let startDate, endDate;
    
    // Set up date range based on active section
    if (activeSection.value === 'daily') {
      startDate = selectedDate.value;
      endDate = selectedDate.value;
    } else if (activeSection.value === 'weekly') {
      if (selectedWeek.value) {
        [startDate, endDate] = selectedWeek.value.split('|');
      }
    } else if (activeSection.value === 'custom') {
      startDate = customStartDate.value;
      endDate = customEndDate.value;
    }
    
    const { startISO, endISO } = getDateRange(startDate, endDate);
    dateQueries = [
      Query.greaterThanEqual('timestamp', startISO),
      Query.lessThan('timestamp', endISO)
    ];
    
    console.log('Fetching logs between:', startISO, 'and', endISO);
    
    // Fetch time logs with date filters
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      [
        ...dateQueries,
        Query.orderDesc('timestamp'),
        Query.limit(1000)
      ]
    );
    
    console.log('Fetched logs:', response.documents.length);
    if (response.documents.length > 0) {
      console.log('Sample document timestamp:', response.documents[0].timestamp);
    }
    timeLogs.value = response.documents;
    
    // Get unique user IDs
    const userIds = [...new Set(response.documents.map(doc => doc.user_Id))];
    
    // Fetch user profiles for display names
    await fetchUserProfiles();
    
    // Create uniqueAgents with name and id
    uniqueAgents.value = userIds.map(id => ({
      id,
      name: userProfiles.value[id] || id
    })).sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Failed to fetch time logs:', error);
  } finally {
    loading.value = false;
  }
};

const fetchUserProfiles = async () => {
  try {
    // Fetch all profiles
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    // Create a map of user_Id to displayName
    const profiles = {};
    response.documents.forEach(profile => {
      if (profile.user_Id) {
        profiles[profile.user_Id] = profile.displayName || '';
      }
    });
    
    userProfiles.value = profiles;
  } catch (error) {
    console.error('Failed to fetch user profiles:', error);
  }
};

const getUserDisplayName = (userId) => {
  return userProfiles.value[userId] || userId;
};

const filteredTimeLogs = computed(() => {
  let logs = timeLogs.value;
  
  // Filter by agent if selected
  if (selectedAgent.value) {
    logs = logs.filter(log => log.user_Id === selectedAgent.value);
  }
  
  return logs;
});

const searchedLogs = computed(() => {
  if (!searchQuery.value) return filteredTimeLogs.value;
  
  const query = searchQuery.value.toLowerCase();
  return filteredTimeLogs.value.filter(log => {
    const userName = getUserDisplayName(log.user_Id).toLowerCase();
    const status = log.Status.toLowerCase();
    const timestamp = formatDate(log.timestamp).toLowerCase();
    
    return userName.includes(query) || 
           status.includes(query) || 
           timestamp.includes(query);
  });
});

const downloadLogs = () => {
  // Create CSV content with display names
  const data = filteredTimeLogs.value.map(log => {
    const date = new Date(log.timestamp);
    return {
      user: getUserDisplayName(log.user_Id),
      userId: log.user_Id,
      status: log.Status,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      timestamp: date.toISOString()
    };
  });
  
  const csvContent = "data:text/csv;charset=utf-8,"
    + ["User,User ID,Status,Date,Time,Timestamp"].join(",") + "\n"
    + data.map(e => Object.values(e).map(val => `"${val}"`).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  
  // Name the file based on the date range
  let fileName = "time_logs";
  if (activeSection.value === 'daily') {
    fileName += `_${selectedDate.value}`;
  } else if (activeSection.value === 'weekly') {
    const [start, end] = selectedWeek.value.split('|');
    fileName += `_${start}_to_${end}`;
  } else if (activeSection.value === 'custom') {
    fileName += `_${customStartDate.value}_to_${customEndDate.value}`;
  }
  
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.time-log-container {
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
.time-log-sections {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.time-log-sections button {
  background: #2d3748;
  color: #a0aec0;
  border: none;
  padding: 16px 24px;
  border-radius: 16px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
  font-size: 1.1rem;
}
.time-log-sections button:hover {
  background: #ffc107;
  color: #1a202c;
}
.time-log-sections button.active {
  background: #ffc107;
  color: #1a202c;
}
.filters {
  display: flex;
  flex-wrap: wrap;
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

.custom-date-range {
  display: flex;
  gap: 16px;
}

.download-btn {
  background: #ffc107;
  color: #1a202c;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.download-btn:hover {
  background: #e0a800;
}

.download-icon {
  font-style: normal;
  font-weight: bold;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;
}

.time-log-scroll {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.time-log-list {
  list-style: none;
  padding: 0;
}

.time-log-item {
  display: flex;
  justify-content: space-between;
  background: #2d3748;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.log-user {
  font-weight: bold;
  color: #4285F4;
  flex: 1;
}

.log-status {
  flex: 1;
}

.log-timestamp {
  color: #ffc107;
  font-family: monospace;
  flex: 1;
}
</style>