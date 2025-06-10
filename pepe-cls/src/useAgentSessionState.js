import { ref, onMounted } from 'vue'
import { getUserId, fetchTodayActivities } from './appwriteAgentSession'

export function useAgentSessionState() {
  const sessionState = ref({
    clockedIn: false,
    lastStatus: '',
    lastActivity: null,
    loading: true
  })
  const userId = ref('')

  // Helper function to get today's date range
  function getTodayRange() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    return { todayStart, todayEnd }
  }

  async function checkSessionState() {
    sessionState.value.loading = true
    userId.value = await getUserId()
    
    try {
      // Get today's activities using timestamp range
      const activities = await fetchTodayActivities(userId.value)
      
      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      // Use today's latest activity if available
      const todayLatest = activities[0]
      
      if (todayLatest) {
        sessionState.value.lastActivity = todayLatest
        sessionState.value.lastStatus = todayLatest.Status
        
        // Determine UI step based on last status
        let step = 'clockin'
        let clockedIn = false
        
        switch (todayLatest.Status) {
          case 'Clocked in':
          case 'Back from Lunch':
          case 'Back from Short Break':
          case 'Back from Bathroom Break':
            step = 'main'; clockedIn = true; break
          case 'Started Lunch':
            step = 'backlunch'; clockedIn = true; break
          case 'Started Short Break':
            step = 'backshortbreak'; clockedIn = true; break
          case 'Started Bathroom Break':
            step = 'backbathroombreak'; clockedIn = true; break
          case 'Clocked out':
          default:
            step = 'clockin'; clockedIn = false; break
        }
        
        sessionState.value.clockedIn = clockedIn
        sessionState.value.uiStep = step
      } else {
        // No activity today, allow clock-in
        sessionState.value.lastActivity = null
        sessionState.value.lastStatus = ''
        sessionState.value.clockedIn = false
        sessionState.value.uiStep = 'clockin'
      }
    } catch (error) {
      console.error('Error checking session state:', error)
      // Failsafe: allow clock-in if there's an error
      sessionState.value.lastActivity = null
      sessionState.value.lastStatus = ''
      sessionState.value.clockedIn = false
      sessionState.value.uiStep = 'clockin'
    }
    
    sessionState.value.loading = false
  }

  onMounted(() => {
    checkSessionState()
  })

  return {
    sessionState,
    checkSessionState,
    userId
  }
}