import { ref } from 'vue'
import { databases, account, Query } from './lib/appwrite'

const DB_ID = '684639c3000fbbd515ea' // your database ID
const COLLECTION_ID = '68465330002c380c2975' // agent_profiles

export function useAgentProfiles() {
  const profiles = ref([])
  const loading = ref(true)

  async function fetchProfiles() {
    loading.value = true
    try {
      const result = await databases.listDocuments(DB_ID, COLLECTION_ID)
      profiles.value = result.documents
    } catch (e) {
      profiles.value = []
    }
    loading.value = false
  }

  async function getCurrentUserProfile() {
    const user = await account.get()
    const result = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('user_Id', user.$id)
    ])
    return result.documents[0] || null
  }

  async function setDisplayName(userId, displayName, approved) {
    // Find existing profile
    const result = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('user_Id', userId)
    ])
    if (result.documents.length > 0) {
      // Update
      return databases.updateDocument(DB_ID, COLLECTION_ID, result.documents[0].$id, {
        displayName,
        approved
      })
    } else {
      // Create
      return databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
        user_Id: userId,
        displayName,
        approved
      })
    }
  }

  return {
    profiles,
    loading,
    fetchProfiles,
    getCurrentUserProfile,
    setDisplayName
  }
}
