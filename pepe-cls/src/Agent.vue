<template>
  <div class="agent-bg">
    <div class="agent-main">
      <!-- Sidebar toggle and sidebar removed; handled by AgentLayout.vue -->
      <!-- Logo at top -->
      <div class="agent-logo-wrap">
        <img src="/static/pepe-clocked.jpg" alt="Agent Logo" class="agent-logo" />
        <div class="admin-access">
          <img src="/static/key.svg" alt="Admin Portal" @click="goToAdminPortal" class="admin-key" />
        </div>
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
      <div class="agent-clock-container" id="clock-container">
        <div class="agent-clock" id="clock">{{ time }}</div>
        <button v-if="step === 'clockin'" class="clock-in-button" :disabled="sessionState.clockedIn || sessionState.loading" @click="clockIn().then(afterActivity)">
          <img src="/static/clock.svg" class="btn-icon" /> Clock In
        </button>
      </div>
      <!-- Status -->
      <div class="agent-status">Status: <b>{{ status }}</b></div>
      <!-- Activity Buttons -->
      <div v-if="sessionState.lastStatus !== 'Clocked out'" class="agent-buttons-grid">
        <!-- Clock In button moved to clock container -->
        <!-- Main activity options as 2x2 grid -->
        <template v-if="step === 'main'">
          <button v-if="!lunchUsed" class="agent-btn agent-btn-orange" @click="startLunch().then(afterActivity)">
            <img src="/static/home.svg" class="btn-icon" /> Lunch (45 min)
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
      <!-- Daily Log - Agent's personal log only -->
      <div class="agent-log">
        <h3>My Activity Log</h3>
        <div v-if="todayActivities.length === 0" class="no-activities">
          No activities recorded today
        </div>
        <ul v-else>
          <li v-for="activity in (logExpanded ? todayActivities : todayActivities.slice(0,2))" :key="activity.$id">
            <span class="log-time">{{ new Date(activity.timestamp).toLocaleTimeString() }}</span>
            <span> — {{ activity.Status }}</span>
          </li>
        </ul>
        <div v-if="todayActivities.length > 2" class="log-expand-btn-wrap">
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
import { useRouter } from 'vue-router'
import { useAgentButtons } from './useAgentButtons.js'
import { useAgentSessionState } from './useAgentSessionState.js'
import { useAgentProfiles } from './useAgentProfiles'
import { databases, Query, account } from './lib/appwrite'
import { authorizedUserEmails } from './authorizedUsers'

const logExpanded = ref(false)
const activeAgents = ref(0)
const router = useRouter()
const todayActivities = ref([])
const userProfiles = ref({})

// Fetch agent profile for display name
const { getCurrentUserProfile } = useAgentProfiles()
const displayName = ref('')
onMounted(async () => {
  try {
    const profile = await getCurrentUserProfile()
    displayName.value = (profile && profile.approved) ? profile.displayName : ''
  } catch (error) {
    console.error('Error initializing agent:', error)
  }
})

// Session state listener
const { sessionState, checkSessionState } = useAgentSessionState()

const tickerColor = computed(() => {
  if (activeAgents.value < 5) return 'ticker-red'
  if (activeAgents.value <= 8) return 'ticker-yellow'
  return 'ticker-green'
})

async function goToAdminPortal() {
  try {
    const user = await account.get();
    if (authorizedUserEmails.includes(user.email.toLowerCase())) {
      router.push('/admin');
    } else {
      alert('You are not authorized to access the admin portal.');
    }
  } catch (error) {
    console.error('Admin access error:', error);
    alert('Unable to verify admin access.');
  }
}

async function fetchActiveAgents() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const result = await databases.listDocuments(
      '684639c3000fbbd515ea', // database ID (fixed)
      '68463a24000779b721a1', // collection ID
      [
        Query.equal('Status', 'Clocked in'),
        Query.equal('date', today)
      ]
    )
    activeAgents.value = result.total
  } catch {
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

function getDisplayName(userId) {
  const profiles = userProfiles.value || {};
  return profiles[userId] || userId;
}

async function fetchTodayActivities() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const user = await account.get();
    const result = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      [
        Query.equal('user_Id', user.$id),
        Query.equal('date', today),
        Query.orderDesc('timestamp')
      ]
    );
    
    // Get user profiles to display names
    const profilesResult = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    userProfiles.value = {};
    profilesResult.documents.forEach(profile => {
      if (profile.user_Id) {
        userProfiles.value[profile.user_Id] = profile.displayName;
      }
    });
    
    todayActivities.value = result.documents;
    
    // Check if user has already clocked in/out today
    const clockedIn = result.documents.some(doc => doc.Status === 'Clocked in');
    const clockedOut = result.documents.some(doc => doc.Status === 'Clocked out');
    
    if (clockedOut) {
      sessionState.value.lastStatus = 'Clocked out';
      status.value = 'Clocked out';
      step.value = '';
    } else if (clockedIn) {
      sessionState.value.clockedIn = true;
      status.value = 'Clocked in';
      step.value = 'main';
    }
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    todayActivities.value = [];
  }
}

onMounted(() => {
  fetchActiveAgents();
  fetchTodayActivities();
  setInterval(fetchActiveAgents, 10000);
  setInterval(fetchTodayActivities, 30000);
  setInterval(() => {
    const now = new Date();
    time.value = now.toLocaleTimeString();
  }, 1000);
})
</script>

<style scoped>
.agent-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('/static/tijuana-sky.jpg') center center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}
.agent-main {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.10);
  padding: 40px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 350px;
  position: relative;
}
.agent-ticker {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
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
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px auto;
  position: relative;
}
.agent-logo {
  width: 220px;
  height: 220px;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 4px 32px rgba(0,0,0,0.13);
  border: 6px solid #fff;
}
.admin-access {
  position: absolute;
  bottom: 0;
  right: 0;
}
.admin-key {
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 50%;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.2s;
}
.admin-key:hover {
  transform: scale(1.1);
}
/* Remove old avatar styles */
.agent-avatar-wrap { display: none; }
.agent-avatar { display: none; }
.agent-clock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 300px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.agent-clock {
  font-size: 4rem;
  font-weight: 900;
  color: white;
  letter-spacing: 2px;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  margin-bottom: 10px;
}

.clock-in-button {
  background: #4285F4;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(66,133,244,0.15);
  transition: background 0.2s, transform 0.2s;
}

.clock-in-button:hover {
  background: #357ae8;
  transform: translateY(-2px);
}

.clock-in-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}
.agent-status {
  font-size: 1.1rem;
  margin-bottom: 28px;
}
.agent-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
  margin-bottom: 32px;
  max-width: 600px;
}
.agent-buttons-grid:has(> :only-child) {
  grid-template-columns: 1fr;
}
@media (max-width: 500px) {
  .agent-buttons-grid {
    grid-template-columns: 1fr;
  }
}
.agent-btn {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 22px 0;
  width: 100%;
  min-height: 64px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(66,133,244,0.10);
  transition: background 0.2s;
  font-family: inherit;
  letter-spacing: 0.5px;
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
  background: #e3f2fd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(66,133,244,0.07);
  padding: 28px 18px 18px 18px;
  margin-top: 10px;
  text-align: center;
}
.session-complete-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 8px;
}
.session-complete-sub {
  font-size: 1.05rem;
  color: #333;
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
  background: rgba(255,255,255,0.85);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(66,133,244,0.07);
  padding: 24px;
  margin-top: 20px;
  text-align: center;
}
.agent-log h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #222;
  text-align: center;
}
.agent-log ul {
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}
.agent-log li {
  font-size: 1rem;
  margin-bottom: 6px;
  color: #333;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.no-activities {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 10px;
}
.log-time {
  color: #4285F4;
  font-family: monospace;
  font-size: 0.98rem;
}
.log-action {
  font-weight: 500;
}
.log-expand-btn-wrap {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}
.log-expand-btn {
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.log-expand-btn:hover {
  background: #357ae8;
}
</style>
