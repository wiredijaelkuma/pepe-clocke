import { fetchTodayActivities } from './appwriteAgentSession'

// Allowed durations in minutes
const BREAK_LIMITS = {
  'Short Break': 15,
  'Bathroom Break': 15,
  'Lunch': 30
}

// Returns array of overage violations for a user for today
export async function checkUserBreakOverages(userId) {
  try {
    const activities = await fetchTodayActivities(userId)
    const violations = []
    const breakTypes = [
      { start: 'Started Short Break', end: 'Back from Short Break', label: 'Short Break' },
      { start: 'Started Bathroom Break', end: 'Back from Bathroom Break', label: 'Bathroom Break' },
      { start: 'Started Lunch', end: 'Back from Lunch', label: 'Lunch' }
    ]
    
    for (const { start, end, label } of breakTypes) {
      // Find all start/end pairs
      let i = 0
      while (i < activities.length) {
        if (activities[i].Status === start) {
          const startTime = new Date(activities[i].timestamp)
          // Find the next matching end
          let j = i + 1
          while (j < activities.length && activities[j].Status !== end) j++
          if (j < activities.length) {
            const endTime = new Date(activities[j].timestamp)
            const diffMin = (endTime - startTime) / 60000
            
            // Only report if over by at least 2 minutes (avoid false positives)
            if (diffMin > BREAK_LIMITS[label] + 2) {
              violations.push({
                type: label,
                overBy: Math.round(diffMin - BREAK_LIMITS[label]),
                start: startTime,
                end: endTime
              })
            }
            i = j + 1
          } else {
            // No matching end, skip
            i++
          }
        } else {
          i++
        }
      }
    }
    return violations
  } catch (error) {
    console.log('Error checking break overages (non-critical):', error.message);
    return [];
  }
}

// Returns array of all users' overages for today (for admin)
export async function checkAllBreakOverages(fetchAllTodayActivities) {
  try {
    const activities = await fetchAllTodayActivities()
    // Group by user
    const byUser = {}
    activities.forEach(a => {
      if (!byUser[a.user_Id]) byUser[a.user_Id] = []
      byUser[a.user_Id].push(a)
    })
    const allViolations = []
    for (const userId in byUser) {
      const v = await checkUserBreakOverages(userId, byUser[userId])
      v.forEach(violation => allViolations.push({ user: userId, ...violation }))
    }
    return allViolations
  } catch (error) {
    console.log('Error checking all break overages (non-critical):', error.message);
    return [];
  }
}