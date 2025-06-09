<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-bg">
      <div class="admin-main">
        <div class="admin-header">
          <img src="/static/pepe-admin.jpg" alt="Admin Icon" class="admin-icon" />
          <h1 class="admin-title">Admin Dashboard</h1>
        </div>
        
        <!-- Overview content only shown on the main admin route -->
        <div v-if="$route.path === '/admin'">
          <div class="admin-tickers">
            <div class="ticker">
              <div class="ticker-value">{{ clockedInAgents }}</div>
              <div class="ticker-label">Agents Logged In Today</div>
            </div>
            <div class="ticker">
              <div class="ticker-value">{{ activeAgents }}</div>
              <div class="ticker-label">Active</div>
            </div>
            <div class="ticker">
              <div class="ticker-value">{{ breakViolations }}</div>
              <div class="ticker-label">Break Violations</div>
            </div>
          </div>
          <!-- Active Agents List -->
          <div class="active-agents-list">
            <h3>Active Agents</h3>
            <div v-if="activeAgentsList.length === 0" class="no-agents">
              No agents currently active
            </div>
            <ul v-else class="agents-list">
              <li v-for="agent in activeAgentsList" :key="agent.userId" class="agent-item">
                <span class="agent-name">{{ getDisplayName(agent.userId) }}</span>
                <span class="agent-status">{{ agent.status }}</span>
                <span class="agent-time">Since {{ new Date(agent.since).toLocaleTimeString() }}</span>
              </li>
            </ul>
          </div>
          
          <!-- Key Areas of Concern -->
          <div class="admin-concerns">
            <div class="concerns-header">
              <h3>Key Areas of Concern</h3>
            </div>
            <div class="concerns-content">
              <!-- Break Violations -->
              <div class="concern-section">
                <h4>Break Violations</h4>
                <div v-if="breakViolationsList.length === 0" class="no-concerns">
                  No break violations today
                </div>
                <ul v-else class="concerns-list">
                  <li v-for="violation in breakViolationsList" :key="violation.$id" class="concern-item">
                    <span class="concern-user">{{ getDisplayName(violation.user_Id) }}</span>
                    <span class="concern-detail">{{ violation.breakType }} over by {{ violation.overBy }} minutes</span>
                    <span class="concern-time">{{ new Date(violation.timestamp).toLocaleTimeString() }}</span>
                  </li>
                </ul>
              </div>
              
              <!-- Late Clock-ins -->
              <div class="concern-section">
                <h4>Late Clock-ins (After 8:10 AM)</h4>
                <div v-if="lateClockIns.length === 0" class="no-concerns">
                  No late clock-ins today
                </div>
                <ul v-else class="concerns-list">
                  <li v-for="late in lateClockIns" :key="late.$id" class="concern-item">
                    <span class="concern-user">{{ getDisplayName(late.user_Id) }}</span>
                    <span class="concern-detail">Clocked in at {{ new Date(late.timestamp).toLocaleTimeString() }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Today's Activity Log -->
          <div class="admin-activity-log">
            <div class="activity-header" @click="toggleActivityLog">
              <h3>Today's Activity Log</h3>
              <span class="toggle-icon">{{ activityLogExpanded ? '▼' : '►' }}</span>
            </div>
            <div v-if="activityLogExpanded">
              <div v-if="todayActivities.length === 0" class="no-activities">
                No activities recorded today
              </div>
              <ul v-else class="activity-list">
                <li v-for="activity in todayActivities.slice(0, activityLogExpanded ? 20 : 10)" :key="activity.$id" class="activity-item">
                  <span class="activity-time">{{ new Date(activity.timestamp).toLocaleTimeString() }}</span>
                  <span class="activity-user">{{ getDisplayName(activity.user_Id) }}</span>
                  <span class="activity-status">{{ activity.Status }}</span>
                </li>
              </ul>
              <div v-if="todayActivities.length > 20" class="show-more">
                <button @click="loadMoreActivities">Show more</button>
              </div>
            </div>
          </div>
        </div>

        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-agents-list {
  margin-bottom: 40px;
  background: rgba(45, 55, 72, 0.8);
  border-radius: 16px;
  padding: 24px;
}

.active-agents-list h3 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #ffc107;
}

.agents-list {
  list-style: none;
  padding: 0;
}

.agent-item {
  display: flex;
  justify-content: space-between;
  background: rgba(26, 32, 44, 0.6);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  color: #fff;
}

.agent-name {
  font-weight: bold;
  color: #4285F4;
}

.agent-status {
  color: #fff;
}

.agent-time {
  color: #ffc107;
  font-family: monospace;
}

.no-agents {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 16px;
}

.admin-activity-log {
  background: rgba(45, 55, 72, 0.8);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 16px;
}

.activity-header h3 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffc107;
  margin: 0;
}

.toggle-icon {
  color: #ffc107;
  font-size: 1.2rem;
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  background: rgba(26, 32, 44, 0.6);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  color: #fff;
}

.activity-time {
  color: #ffc107;
  font-family: monospace;
}

.activity-user {
  font-weight: bold;
  color: #4285F4;
}

.no-activities, .no-concerns {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 16px;
}

.show-more {
  text-align: center;
  margin-top: 16px;
}

.admin-concerns {
  background: rgba(45, 55, 72, 0.8);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
}

.concerns-header h3 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #ffc107;
}

.concern-section {
  margin-bottom: 24px;
}

.concern-section h4 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 12px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
}

.concerns-list {
  list-style: none;
  padding: 0;
}

.concern-item {
  display: flex;
  justify-content: space-between;
  background: rgba(26, 32, 44, 0.6);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  color: #fff;
}

.concern-user {
  font-weight: bold;
  color: #4285F4;
}

.concern-detail {
  color: #fff;
}

.concern-time {
  color: #ffc107;
  font-family: monospace;
}

.show-more button {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.show-more button:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { databases, Query } from './lib/appwrite';
import AdminSidebar from './AdminSidebar.vue';

const clockedInAgents = ref(0);
const activeAgents = ref(0);
const activeAgentsList = ref([]);
const breakViolations = ref(0);
const breakViolationsList = ref([]);
const lateClockIns = ref([]);
const clockedInAgentList = ref([]);
const todayActivities = ref([]);
const userProfiles = ref({});
const activityLogExpanded = ref(false);
const activityDisplayCount = ref(10);
let pollingInterval = null;

const fetchData = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // Fetch all activities for today - first try with date field
    let response;
    try {
      response = await databases.listDocuments(
        '684639c3000fbbd515ea', // database ID
        '68463a24000779b721a1', // collection ID
        [
          Query.equal('date', today),
          Query.orderDesc('timestamp')
        ]
      );
    } catch (dateError) {
      // If date field fails, try with timestamp range
      response = await databases.listDocuments(
        '684639c3000fbbd515ea', // database ID
        '68463a24000779b721a1', // collection ID
        [
          Query.greaterThanEqual('timestamp', today + 'T00:00:00.000Z'),
          Query.lessThan('timestamp', today + 'T23:59:59.999Z'),
          Query.orderDesc('timestamp')
        ]
      );
    }

    const allToday = response.documents;
    todayActivities.value = allToday;
    
    // Fetch user profiles for display names
    const profilesResponse = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    profilesResponse.documents.forEach(profile => {
      if (profile.user_Id && profile.displayName) {
        userProfiles.value[profile.user_Id] = profile.displayName;
      }
    });
    
    // Get currently active agents (clocked in but not on break or lunch)
    const activeUsers = new Set();
    const activeAgentsData = [];
    const userStatus = {};
    const userTimestamp = {};
    
    // Process in chronological order to track current status
    [...allToday].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(record => {
        const userId = record.user_Id;
        const status = record.Status;
        const timestamp = record.timestamp;
        
        if (status === 'Clocked in') {
          activeUsers.add(userId);
          userStatus[userId] = 'Working';
          userTimestamp[userId] = timestamp;
        } else if (status === 'Clocked out') {
          activeUsers.delete(userId);
          delete userStatus[userId];
          delete userTimestamp[userId];
        } else if (status.includes('Started') && (status.includes('Break') || status.includes('Lunch'))) {
          activeUsers.delete(userId);
          userStatus[userId] = status.replace('Started ', 'On ');
          userTimestamp[userId] = timestamp;
        } else if (status.includes('Back from') && (status.includes('Break') || status.includes('Lunch'))) {
          activeUsers.add(userId);
          userStatus[userId] = 'Working';
          userTimestamp[userId] = timestamp;
        }
      });
    
    // Build active agents list with details
    for (const userId of Object.keys(userStatus)) {
      activeAgentsData.push({
        userId,
        status: userStatus[userId],
        since: userTimestamp[userId]
      });
    }
    
    activeAgents.value = activeUsers.size;
    activeAgentsList.value = activeAgentsData;
    
    // Get break violations from admin notifications - try without date filters first
    let violationsResponse;
    try {
      violationsResponse = await databases.listDocuments(
        '684639c3000fbbd515ea',
        '684654f10018b0311641'
      );
    } catch (error) {
      console.error('Error fetching violations:', error);
      violationsResponse = { documents: [], total: 0 };
    }
    
    breakViolations.value = violationsResponse.total;
    breakViolationsList.value = violationsResponse.documents;
    
    // Find late clock-ins (after 8:10 AM)
    const lateTime = new Date(today);
    lateTime.setHours(8, 10, 0); // 8:10 AM
    
    const lateClockInsData = allToday.filter(activity => {
      if (activity.Status === 'Clocked in') {
        const activityTime = new Date(activity.timestamp);
        // Check if it's the same day and after 8:10 AM
        return activityTime > lateTime && 
               activityTime.toISOString().slice(0, 10) === today;
      }
      return false;
    });
    
    // Process user break status
    const userBreakStatus = {};
    
    // Process in chronological order (oldest to newest)
    [...allToday].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(record => {
        const userId = record.user_Id;
        const status = record.Status;
        
        if (status.includes('Started') && (status.includes('Break') || status.includes('Lunch'))) {
          userBreakStatus[userId] = true;
        } else if (status.includes('Back from') && (status.includes('Break') || status.includes('Lunch'))) {
          userBreakStatus[userId] = false;
        }
      });
    
    // Get unique user IDs for each category
    const uniqueUsers = [...new Set(allToday.map(d => d.user_Id))];
    
    clockedInAgents.value = uniqueUsers.length;
    // activeAgents.value is set above
    
    // Store late clock-ins
    lateClockIns.value = lateClockInsData;
    
    // Process the agent list with more information
    clockedInAgentList.value = allToday;
    
    // No chart to refresh

  } catch (error) {
    console.error('Failed to fetch admin data:', error);
  }
};

function getDisplayName(userId) {
  return userProfiles.value[userId] || userId;
}

function toggleActivityLog() {
  activityLogExpanded.value = !activityLogExpanded.value;
}

function loadMoreActivities() {
  activityDisplayCount.value += 20;
}

// Chart functionality removed

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

onMounted(async () => {
  try {
    // Initial data fetch
    await fetchData();
    
    // Start polling for updates - only every 5 minutes
    pollingInterval = setInterval(async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error('Error in polling interval:', error);
      }
    }, 300000); // Poll every 5 minutes
  } catch (error) {
    console.error('Error in onMounted:', error);
  }
});

onUnmounted(stopPolling);
</script>

<style scoped>
.admin-layout {
  display: flex;
  background-color: #1a202c;
}
.admin-bg {
  flex-grow: 1;
  min-height: 100vh;
  background: url('/static/tj-sunrise.jpg') center center/cover no-repeat;
  padding: 40px;
}
.admin-main {
  background: rgba(26, 32, 44, 0.8);
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  padding: 48px;
  color: #fff;
}
.admin-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
}
.admin-icon {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 24px;
  border: 4px solid #fdc500;
}
.admin-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffc107;
}
.admin-tickers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 40px;
}
.ticker {
  background: linear-gradient(145deg, #ffc107, #ff9800);
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  color: #1a202c;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ticker-value {
  font-size: 3rem;
  font-weight: bold;
  color: #1a202c;
  text-shadow: 0 1px 2px rgba(255,255,255,0.2);
}
.ticker-label {
  font-size: 1.1rem;
  margin-top: 8px;
  color: #1a202c;
  font-weight: 600;
}
</style>
