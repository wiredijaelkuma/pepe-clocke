import { account, databases, Query } from './lib/appwrite'

const DB_ID = '684639c3000fbbd515ea'
const COLLECTION_ID = '68463a24000779b721a1' // agent_activity

export async function getUserId() {
  const user = await account.get()
  return user.$id
}

export async function logActivityToAppwrite(userId, status) {
  const today = new Date().toISOString().slice(0, 10)
  return databases.createDocument(
    DB_ID,
    COLLECTION_ID,
    'unique()',
    {
      user_Id: userId,
      Status: status,
      date: today,
      timestamp: new Date().toISOString()
    }
  )
}

export async function fetchTodayActivities(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTION_ID,
    [
      Query.equal('user_Id', userId),
      Query.equal('date', today)
    ]
  )
  return result.documents
}

export async function fetchAllTodayActivities() {
  const today = new Date().toISOString().slice(0, 10)
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTION_ID,
    [
      Query.equal('date', today)
    ]
  )
  return result.documents
}
