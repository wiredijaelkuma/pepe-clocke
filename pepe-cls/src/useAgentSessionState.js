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

  async function checkSessionState() {
    sessionState.value.loading = true
    userId.value = await getUserId()
    const activities = await fetchTodayActivities(userId.value)
    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const last = activities[0]
    sessionState.value.lastActivity = last
    sessionState.value.lastStatus = last ? last.Status : ''
    // Determine UI step based on last status
    let step = 'clockin'
    let clockedIn = false
    if (last) {
      switch (last.Status) {
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
    }
    sessionState.value.clockedIn = clockedIn
    sessionState.value.uiStep = step
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
