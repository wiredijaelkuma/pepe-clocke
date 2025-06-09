<template>
  <div class="agent-bg">
    <div class="agent-main">
      <!-- Sidebar toggle and sidebar removed; handled by AgentLayout.vue -->
      <!-- Logo at top -->
      <div class="agent-logo-wrap">
        <img src="/static/pepe-clocked.jpg" alt="Agent Logo" class="agent-logo" />
      </div>
      <!-- Loading Spinner -->
      <div v-if="sessionState.loading" class="agent-spinner-wrap">
        <img src="/static/small-pepe-circle.jpg" alt="Loading..." class="agent-spinner" />
      </div>
      <!-- Ticker -->
      <div v-else class="agent-ticker" :class="tickerColor">
        <img src="/static/agent.svg" alt="Active Agents" class="ticker-icon" />
        <span class="ticker-text">Active Agents: <b>{{ activeAgents }}</b></span>
      </div>
      <!-- Icon above clock (removed, now at top) -->
      <!-- Realtime Clock -->
      <div class="agent-clock" id="clock">{{ time }}</div>
      <!-- Status -->
      <div class="agent-status">Status: <b>{{ status }}</b></div>
      <div v-if="isAuthorized" class="admin-portal-btn-wrap">
        <button @click="goToAdminPortal" class="admin-portal-btn">
          <img src="/static/key.svg" alt="Admin Portal" />
          Admin Portal
        </button>
      </div>
      <!-- Activity Buttons -->
      <div v-if="sessionState.lastStatus !== 'Clocked out'" class="agent-buttons-grid">
        <button v-if="step === 'clockin'" class="agent-btn agent-btn-blue" :disabled="sessionState.clockedIn || sessionState.loading" @click="clockIn().then(afterActivity)">
          <img src="/static/clock.svg" class="btn-icon" /> Clock In
        </button>
        <!-- Main activity options as 2x2 grid -->
        <template v-if="step === 'main'">
          <button v-if="!lunchUsed" class="agent-btn agent-btn-orange" @click="startLunch().then(afterActivity)">
            <img src="/static/home.svg" class="btn-icon" /> Lunch (30 min)
          </button>
          <button v-if="shortBreaksUsed < 2" class="agent-btn agent-btn-gold" @click="startShortBreak().then(afterActivity)">
            <img src="/static/arrow-door.svg" class="btn-icon" /> Short Break (15 min)
          </button>
          <button v-if="bathroomBreaksUsed < 5" class="agent-btn agent-btn-pink" @click="startBathroomBreak().then(afterActivity)">
            <img src="/static/donuts.svg" class="btn-icon" /> Bathroom Break (15 min)
          </button>
          <button class="agent-btn agent-btn-red" @click="clockOut().then(afterActivity)">
            <img src="/static/clock.svg" class="btn-icon" /> Clock Out
          </button>
        </template>
        <!-- Back from activity buttons -->
        <button v-if="step === 'backlunch'" class="agent-btn agent-btn-orange" @click="backFromLunch().then(afterActivity)">
          <img src="/static/home.svg" class="btn-icon" /> Back from Lunch
        </button>
        <button v-if="step === 'backshortbreak'" class="agent-btn agent-btn-gold" @click="backFromShortBreak().then(afterActivity)">
          <img src="/static/arrow-door.svg" class="btn-icon" /> Back from Break
        </button>
        <button v-if="step === 'backbathroombreak'" class="agent-btn agent-btn-pink" @click="backFromBathroomBreak().then(afterActivity)">
          <img src="/static/donuts.svg" class="btn-icon" /> Back from Break
        </button>
      </div>
      <div v-else class="session-complete-msg">
        <div class="session-complete-title">Your session is complete for today.</div>
        <div class="session-complete-sub">If you believe this is an error, please contact your admin.</div>
      </div>
      <!-- Daily Log -->
      <div class="agent-log">
        <h3>My Activity Log</h3>
        <ul>
          <li v-for="entry in (logExpanded ? log : log.slice(0,2))" :key="entry.time">
            <span class="log-time">{{ entry.time }}</span>
            <span v-if="displayName"> — <span class="log-action">{{ displayName }}</span></span>
            <span v-else> — <span class="log-action">You</span></span>
            <span> — {{ entry.action }}</span>
          </li>
        </ul>
        <div v-if="log.length > 2" class="log-expand-btn-wrap">
          <button class="log-expand-btn" @click="logExpanded = !logExpanded">
            {{ logExpanded ? 'Show less' : 'Show more' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAgentButtons } from './useAgentButtons.js'
import { useAgentSessionState } from './useAgentSessionState.js'
import { useAgentProfiles } from './useAgentProfiles'
import { databases, Query, account } from './lib/appwrite'
import { authorizedUserEmails } from './authorizedUsers'
import { useRouter } from 'vue-router'

const router = useRouter()
const logExpanded = ref(false)
const isAuthorized = ref(false)
const activeAgents = ref(0)

// Fetch agent profile for display name
const { getCurrentUserProfile } = useAgentProfiles()
const displayName = ref('')
onMounted(async () => {
  const profile = await getCurrentUserProfile()
  displayName.value = (profile && profile.approved) ? profile.displayName : ''
  try {
    const user = await account.get();
    isAuthorized.value = authorizedUserEmails.includes(user.email);
  } catch {
    // not logged in
  }
})

function goToAdminPortal() {
  router.push('/admin');
}

// Session state listener
const { sessionState, checkSessionState } = useAgentSessionState()

const tickerColor = computed(() => {
  if (activeAgents.value < 5) return 'ticker-red'
  if (activeAgents.value <= 8) return 'ticker-yellow'
  return 'ticker-green'
})

async function fetchActiveAgents() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    // Get all activities for today
    const result = await databases.listDocuments(
      '684639c3000fbbd515ea', // database ID (fixed)
      '68463a24000779b721a1', // collection ID
      [
        Query.equal('date', today)
      ]
    )
    
    // Track active users (clocked in but not on break)
    const activeUsers = new Set();
    
    // Process in chronological order
    [...result.documents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(record => {
        const userId = record.user_Id;
        const status = record.Status;
        
        if (status === 'Clocked in') {
          activeUsers.add(userId);
        } else if (status === 'Clocked out') {
          activeUsers.delete(userId);
        } else if (status.includes('Started') && (status.includes('Break') || status.includes('Lunch'))) {
          activeUsers.delete(userId);
        } else if (status.includes('Back from') && (status.includes('Break') || status.includes('Lunch'))) {
          activeUsers.add(userId);
        }
      });
    
    activeAgents.value = activeUsers.size;
  } catch (error) {
    console.log('Error fetching active agents (non-critical):', error.message);
    activeAgents.value = 0
  }
}

const time = ref('--:--:--')

const {
  status,
  step,
  lunchUsed,
  shortBreaksUsed,
  bathroomBreaksUsed,
  log,
  clockIn,
  startLunch,
  backFromLunch,
  startShortBreak,
  backFromShortBreak,
  startBathroomBreak,
  backFromBathroomBreak,
  clockOut
} = useAgentButtons(activeAgents)

// Watch for session state changes and update UI accordingly
watch(
  () => sessionState.value.uiStep,
  (uiStep) => {
    switch (uiStep) {
      case 'main':
        status.value = 'Clocked in'; step.value = 'main'; break
      case 'backlunch':
        status.value = 'On Lunch'; step.value = 'backlunch'; break
      case 'backshortbreak':
        status.value = 'On Short Break'; step.value = 'backshortbreak'; break
      case 'backbathroombreak':
        status.value = 'On Bathroom Break'; step.value = 'backbathroombreak'; break
      case 'clockin':
      default:
        status.value = 'Not clocked in'; step.value = 'clockin'; break
    }
  },
  { immediate: true }
)

// After any activity, refresh session state
async function afterActivity() {
  await checkSessionState()
}

// Function to update the activity log
async function updateActivityLog() {
  try {
    const user = await account.get();
    const { getAgentLog } = useAgentButtons(activeAgents);
    const updatedLog = await getAgentLog(user.$id);
    if (updatedLog && updatedLog.length > 0) {
      log.value = updatedLog;
    }
  } catch (error) {
    console.log('Failed to update activity log (non-critical):', error.message);
  }
}

// Single onMounted to avoid duplicates
onMounted(() => {
  fetchActiveAgents()
  updateActivityLog()
  setInterval(fetchActiveAgents, 300000) // Poll every 5 minutes
  setInterval(updateActivityLog, 300000) // Poll every 5 minutes
  setInterval(() => {
    const now = new Date()
    time.value = now.toLocaleTimeString()
  }, 1000)
})
</script>

<style scoped>
.agent-bg {
  min-height: 100vh;
  width: 100%;
  background: url('/static/tijuana-sky.jpg') center center/cover no-repeat fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-x: auto;
}
.agent-main {
  background: transparent;
  border-radius: 24px;
  box-shadow: none;
  padding: 40px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  position: relative;
  overflow-x: visible;
}
.agent-ticker {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.ticker-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}
.ticker-text {
  font-size: 1.1rem;
  font-weight: 600;
}
.ticker-red {
  background: #ffebee;
  border-radius: 10px;
  color: #c62828;
  box-shadow: 0 2px 8px rgba(198,40,40,0.07);
}
.ticker-yellow {
  background: #fffde7;
  border-radius: 10px;
  color: #f9a825;
  box-shadow: 0 2px 8px rgba(249,168,37,0.07);
}
.ticker-green {
  background: #e8f5e9;
  border-radius: 10px;
  color: #388e3c;
  box-shadow: 0 2px 8px rgba(56,142,60,0.07);
}
.agent-logo-wrap {
  width: 100%;
  max-width: 400px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px auto;
  padding: 10px;
}
.agent-logo {
  width: 100%;
  height: auto;
  max-width: 300px;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 4px 32px rgba(0,0,0,0.3);
  border: 6px solid rgba(255, 126, 95, 0.7);
}
/* Remove old avatar styles */
.agent-avatar-wrap { display: none; }
.agent-avatar { display: none; }
.agent-clock {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 18px;
  color: white;
  letter-spacing: 2px;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  padding: 10px 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.agent-status {
  font-size: 1.1rem;
  margin-bottom: 20px;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: inline-block;
}
.agent-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 18px;
  width: 100%;
  margin-bottom: 32px;
}
.agent-buttons-grid:has(> :only-child) {
  grid-template-columns: 1fr;
  max-width: 300px;
  margin: 0 auto;
}
@media (max-width: 800px) {
  .agent-buttons-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 500px) {
  .agent-buttons-grid {
    grid-template-columns: 1fr;
  }
}
.agent-btn {
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 15px 0;
  width: 100%;
  min-height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.2s;
  font-family: inherit;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.agent-btn:hover {
  transform: translateY(-2px);
}
.agent-btn-blue {
  background: #4285F4;
}
.agent-btn-blue:hover {
  background: #357ae8;
}
.agent-btn-orange {
  background: #ff9800;
}
.agent-btn-orange:hover {
  background: #e67c00;
}
.agent-btn-gold {
  background: #ffd600;
  color: #222;
}
.agent-btn-gold:hover {
  background: #ffb300;
  color: #222;
}
.agent-btn-pink {
  background: #e040fb;
}
.agent-btn-pink:hover {
  background: #ad1fa3;
}
.agent-btn-red {
  background: #d32f2f;
}
.agent-btn-red:hover {
  background: #b71c1c;
}
.btn-icon {
  width: 24px;
  height: 24px;
}
.sidebar-toggle {
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  cursor: pointer;
}
.agent-sidebar {
  position: fixed;
  top: 50%;
  right: 40px;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.97);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
  padding: 18px 24px;
  min-width: 220px;
  z-index: 1000;
}
.agent-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.agent-sidebar li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 1rem;
  font-weight: 500;
}
.sidebar-links {
  margin-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sidebar-links a {
  color: #4285F4;
  text-decoration: underline;
  font-size: 0.98rem;
}
.session-complete-msg {
  width: 100%;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  padding: 28px 18px 18px 18px;
  margin-top: 10px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.session-complete-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.session-complete-sub {
  font-size: 1.05rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.agent-spinner-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px 0 32px 0;
}
.agent-spinner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.agent-log {
  width: 100%;
  max-width: 600px;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  padding: 24px;
  margin-top: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.agent-log h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: white;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.agent-log ul {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.agent-log li {
  justify-content: center;
}
.agent-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.agent-log li {
  font-size: 1rem;
  margin-bottom: 6px;
  color: white;
  display: flex;
  gap: 8px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.log-time {
  color: #fff;
  font-family: monospace;
  font-size: 0.98rem;
  font-weight: bold;
}
.log-action {
  font-weight: 700;
  color: #fff;
}
.log-expand-btn-wrap {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}
.log-expand-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.log-expand-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
.admin-portal-btn-wrap {
  margin-top: 20px;
}
.admin-portal-btn {
  background: linear-gradient(145deg, #ffc107, #ff9800);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.admin-portal-btn:hover {
  transform: translateY(-2px);
}
.admin-portal-btn img {
  width: 20px;
  filter: brightness(0) invert(1);
}
</style>