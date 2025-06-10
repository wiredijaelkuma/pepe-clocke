import { ref, onMounted } from 'vue';
import { databases, Query } from './lib/appwrite';
import { getUserId } from './appwriteAgentSession';

export function useAdminMessages() {
  const messages = ref([]);
  const pendingMessages = ref(0);
  const loading = ref(true);

  // Helper function to get today's date range
  function getTodayRange() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    return { todayStart, todayEnd };
  }

  const fetchMessages = async () => {
    try {
      const userId = await getUserId();
      const { todayStart, todayEnd } = getTodayRange();
      
      const response = await databases.listDocuments(
        '684639c3000fbbd515ea', // database ID
        '684654f10018b0311641', // collection ID
        [
          Query.equal('user_Id', userId),
          Query.greaterThanEqual('timestamp', todayStart),
          Query.lessThan('timestamp', todayEnd)
        ]
      );
      
      messages.value = response.documents;
      pendingMessages.value = response.documents.length;
    } catch (error) {
      console.error('Failed to fetch admin messages:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchMessages);

  return {
    messages,
    pendingMessages,
    loading,
    fetchMessages,
  };
}