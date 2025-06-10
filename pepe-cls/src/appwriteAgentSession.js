import { account, databases, Query } from './lib/appwrite'

const DB_ID = '684639c3000fbbd515ea'
const COLLECTION_ID = '68463a24000779b721a1' // agent_activity

// Get the start and end of today in ISO format
function getTodayRange() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  return { todayStart, todayEnd }
}

export async function getUserId() {
  const user = await account.get()
  return user.$id
}

export async function logActivityToAppwrite(userId, status) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  return databases.createDocument(
    DB_ID,
    COLLECTION_ID,
    'unique()',
    {
      user_Id: userId,
      Status: status,
      date: today,
      timestamp: now.toISOString()
    }
  )
}

export async function fetchTodayActivities(userId) {
  const { todayStart, todayEnd } = getTodayRange()
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTION_ID,
    [
      Query.equal('user_Id', userId),
      Query.greaterThanEqual('timestamp', todayStart),
      Query.lessThan('timestamp', todayEnd)
    ]
  )
  return result.documents
}

// Check if user has clocked in today using timestamp - CRITICAL FIX
export async function hasUserClockedInToday(userId) {
  const { todayStart, todayEnd } = getTodayRange()
  console.log(`Checking if user ${userId} has clocked in between ${todayStart} and ${todayEnd}`)
  
  try {
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTION_ID,
      [
        Query.equal('user_Id', userId),
        Query.equal('Status', 'Clocked in'),
        Query.greaterThanEqual('timestamp', todayStart),
        Query.lessThan('timestamp', todayEnd)
      ]
    )
    
    console.log(`Found ${result.documents.length} clock-in records for today`)
    return result.total > 0
  } catch (error) {
    console.error('Error checking if user clocked in today:', error)
    return false
  }
}

// Get the most recent activity for a user
export async function fetchLatestActivity(userId) {
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTION_ID,
    [
      Query.equal('user_Id', userId),
      Query.orderDesc('timestamp'),
      Query.limit(1)
    ]
  )
  return result.documents[0] || null
}

// Get all activities for today using timestamp
export async function fetchAllTodayActivities() {
  const { todayStart, todayEnd } = getTodayRange()
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTION_ID,
    [
      Query.greaterThanEqual('timestamp', todayStart),
      Query.lessThan('timestamp', todayEnd)
    ]
  )
  return result.documents
}