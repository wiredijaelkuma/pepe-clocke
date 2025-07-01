import { ref, onMounted } from 'vue'
import { getUserId, logActivityToAppwrite, fetchLatestActivity } from './appwriteAgentSession'
import { checkUserBreakOverages } from './breakOverageChecker'
import { requestNotificationPermission, sendLocalNotification } from './pushNotifications'
import { logAdminNotification } from './pushNotificationsAdmin'
import { databases, Query } from './lib/appwrite'

export function useAgentButtons(activeAgents) {
  const status = ref('Not clocked in')
  const step = ref('clockin')
  const lunchUsed = ref(false)
  const shortBreaksUsed = ref(0)
  const bathroomBreaksUsed = ref(0)
  const log = ref([])
  const userId = ref('')

  // Get user ID from Appwrite on first use
  onMounted(() => {
    getUserId().then(id => { userId.value = id })
    requestNotificationPermission()
  })

  function addLog(action) {
    const now = new Date()
    log.value.unshift({
      action,
      time: now.toLocaleTimeString()
    })
  }

  // Check for late clock-in (after 8:10 AM)
  function checkLateClockIn() {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const lateTime = new Date(today + 'T08:10:00')
    
    if (now > lateTime) {
      // Log late clock-in notification
      logAdminNotification(userId.value, 'Late Clock-in', Math.round((now - lateTime) / 60000))
      sendLocalNotification('Late Clock-in', `You clocked in ${Math.round((now - lateTime) / 60000)} minutes late.`)
    }
  }

  async function clockIn() {
    status.value = 'Clocked in'
    step.value = 'main'
    addLog('Clocked in')
    
    // Check for late clock-in
    checkLateClockIn()
    
    if (userId.value) {
      await logActivityToAppwrite(userId.value, 'Clocked in')
    }
  }

  async function startLunch() {
    if (!lunchUsed.value) {
      if (activeAgents.value < 5 && !window.confirm('Warning: Fewer than 5 agents are active. Are you sure you want to take a break?')) return;
      status.value = 'On Lunch'
      step.value = 'backlunch'
      lunchUsed.value = true
      addLog('Started Lunch')
      if (userId.value) {
        await logActivityToAppwrite(userId.value, 'Started Lunch')
      }
    }
  }

  async function backFromLunch() {
    status.value = 'Clocked in'
    step.value = 'main'
    addLog('Back from Lunch')
    if (userId.value) {
      await logActivityToAppwrite(userId.value, 'Back from Lunch')
      // Check for overage
      const violations = await checkUserBreakOverages(userId.value)
      const lunchOver = violations.find(v => v.type === 'Lunch')
      if (lunchOver && lunchOver.overBy > 0) {
        window.alert(`You exceeded your lunch break by ${lunchOver.overBy} minutes. This has been reported to your admin.`)
        sendLocalNotification('Lunch Break Overage', `You exceeded your lunch break by ${lunchOver.overBy} minutes.`)
        await logAdminNotification(userId.value, 'Lunch', lunchOver.overBy)
      }
    }
  }

  async function startShortBreak() {
    if (shortBreaksUsed.value < 2) {
      if (activeAgents.value < 5 && !window.confirm('Warning: Fewer than 5 agents are active. Are you sure you want to take a break?')) return;
      status.value = 'On Short Break'
      step.value = 'backshortbreak'
      shortBreaksUsed.value++
      addLog('Started Short Break')
      if (userId.value) {
        await logActivityToAppwrite(userId.value, 'Started Short Break')
      }
    }
  }

  async function backFromShortBreak() {
    status.value = 'Clocked in'
    step.value = 'main'
    addLog('Back from Short Break')
    if (userId.value) {
      await logActivityToAppwrite(userId.value, 'Back from Short Break')
      // Check for overage
      const violations = await checkUserBreakOverages(userId.value)
      const shortOver = violations.find(v => v.type === 'Short Break')
      if (shortOver && shortOver.overBy > 0) {
        window.alert(`You exceeded your short break by ${shortOver.overBy} minutes. This has been reported to your admin.`)
        sendLocalNotification('Short Break Overage', `You exceeded your short break by ${shortOver.overBy} minutes.`)
        await logAdminNotification(userId.value, 'Short Break', shortOver.overBy)
      }
    }
  }

  async function startBathroomBreak() {
    if (bathroomBreaksUsed.value < 5) {
      if (activeAgents.value < 5 && !window.confirm('Warning: Fewer than 5 agents are active. Are you sure you want to take a break?')) return;
      status.value = 'On Bathroom Break'
      step.value = 'backbathroombreak'
      bathroomBreaksUsed.value++
      addLog('Started Bathroom Break')
      if (userId.value) {
        await logActivityToAppwrite(userId.value, 'Started Bathroom Break')
      }
    }
  }

  async function backFromBathroomBreak() {
    status.value = 'Clocked in'
    step.value = 'main'
    addLog('Back from Bathroom Break')
    if (userId.value) {
      await logActivityToAppwrite(userId.value, 'Back from Bathroom Break')
      // Check for overage
      const violations = await checkUserBreakOverages(userId.value)
      const bathOver = violations.find(v => v.type === 'Bathroom Break')
      if (bathOver && bathOver.overBy > 0) {
        window.alert(`You exceeded your bathroom break by ${bathOver.overBy} minutes. This has been reported to your admin.`)
        sendLocalNotification('Bathroom Break Overage', `You exceeded your bathroom break by ${bathOver.overBy} minutes.`)
        await logAdminNotification(userId.value, 'Bathroom Break', bathOver.overBy)
      }
    }
  }

  async function clockOut() {
    if (confirm('Are you sure you want to clock out?')) {
      status.value = 'Clocked out'
      step.value = ''
      addLog('Clocked out')
      if (userId.value) {
        await logActivityToAppwrite(userId.value, 'Clocked out')
      }
    }
  }

  // Function to get agent log from Appwrite
  async function getAgentLog(userId) {
    if (!userId) return [];
    
    const today = new Date().toISOString().slice(0, 10);
    try {
      const result = await databases.listDocuments(
        '684639c3000fbbd515ea',
        '68463a24000779b721a1',
        [
          Query.equal('user_Id', userId),
          Query.equal('date', today),
          Query.orderDesc('timestamp')
        ]
      );
      
      return result.documents.map(doc => ({
        action: doc.Status,
        time: new Date(doc.timestamp).toLocaleTimeString()
      }));
    } catch (error) {
      console.error('Error fetching agent log:', error);
      return [];
    }
  }

  return {
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
    clockOut,
    getAgentLog
  }
}