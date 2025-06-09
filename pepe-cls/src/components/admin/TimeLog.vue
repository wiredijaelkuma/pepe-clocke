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
          <option v-for="agent in uniqueAgents" :key="agent" :value="agent">{{ agent }}</option>
        </select>
      </div>
      
      <div class="filter-group" v-if="activeSection === 'daily' || activeSection === 'custom'">
        <label for="date-select">Date:</label>
        <input id="date-select" type="date" v-model="selectedDate" class="filter-dropdown" />
      </div>
      
      <div class="filter-group" v-if="activeSection === 'weekly'">
        <label for="week-select">Week:</label>
        <select id="week-select" v-model="selectedWeek" class="filter-dropdown">
          <option v-for="week in availableWeeks" :key="week" :value="week">{{ week }}</option>
        </select>
      </div>
      
      <button @click="downloadLogs" class="download-btn">
        <i class="download-icon">↓</i> Download Logs
      </button>
    </div>
    <div class="time-log-content">
      <div v-if="loading">Loading time logs...</div>
      <div v-else-if="filteredTimeLogs.length === 0">No time logs found.</div>
      <div v-else>
        <ul class="time-log-list">
          <li v-for="log in filteredTimeLogs" :key="log.$id" class="time-log-item">
            <span class="log-user">User: {{ getUserDisplayName(log.user_Id) }}</span>
            <span class="log-status">{{ log.Status }}</span>
            <span class="log-timestamp">{{ new Date(log.timestamp).toLocaleString() }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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

onMounted(() => {
  fetchTimeLogs();
  // Example logic to populate availableWeeks
  const currentDate = new Date();
  for (let i = 0; i < 4; i++) {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (i * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    availableWeeks.value.push(`${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`);
  }
});

const fetchTimeLogs = async () => {
  loading.value = true;
  try {
    // Fetch time logs
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      [Query.orderDesc('timestamp')]
    );
    timeLogs.value = response.documents;
    
    // Get unique user IDs
    const userIds = [...new Set(response.documents.map(doc => doc.user_Id))];
    uniqueAgents.value = userIds;
    
    // Fetch user profiles for display names
    await fetchUserProfiles(userIds);
  } catch (error) {
    console.error('Failed to fetch time logs:', error);
  } finally {
    loading.value = false;
  }
};

const fetchUserProfiles = async (userIds) => {
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
    console.log('Fetched profiles:', profiles);
  } catch (error) {
    console.error('Failed to fetch user profiles:', error);
  }
};

const getUserDisplayName = (userId) => {
  const displayName = userProfiles.value[userId];
  if (displayName) {
    return `${displayName} (${userId})`;
  }
  return userId;
};

const filteredTimeLogs = computed(() => {
  let logs = timeLogs.value;
  
  // Filter by agent if selected
  if (selectedAgent.value) {
    logs = logs.filter(log => log.user_Id === selectedAgent.value);
  }
  
  // Apply date filters based on active section
  if (activeSection.value === 'daily') {
    logs = logs.filter(log => new Date(log.timestamp).toISOString().slice(0, 10) === selectedDate.value);
  } else if (activeSection.value === 'weekly') {
    // Parse the selected week range
    if (selectedWeek.value) {
      const [startDateStr] = selectedWeek.value.split(' - ');
      const startOfWeek = new Date(startDateStr);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      });
    }
  } else if (activeSection.value === 'custom') {
    // For custom, we just use the selected date
    logs = logs.filter(log => new Date(log.timestamp).toISOString().slice(0, 10) === selectedDate.value);
  }
  
  return logs;
});

const downloadLogs = () => {
  const data = filteredTimeLogs.value.map(log => ({
    user: log.user_Id,
    status: log.Status,
    timestamp: new Date(log.timestamp).toLocaleString(),
  }));
  const csvContent = "data:text/csv;charset=utf-8,"
    + ["User,Status,Timestamp"].join(",") + "\n"
    + data.map(e => Object.values(e).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "time_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(fetchTimeLogs);
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
}
</style>