<template>
  <div class="admin-notifications">
    <h2>Admin Notifications</h2>
    <ul>
      <li v-for="notification in messages" :key="notification.$id">
        User {{ notification.user_Id }} - {{ notification.breakType }} over by {{ notification.overBy }} minutes on {{ new Date(notification.timestamp).toLocaleString() }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { databases, Query } from './lib/appwrite';

const messages = ref([]);
const DB_ID = '684639c3000fbbd515ea';
const COLLECTION_ID = '684654f10018b0311641'; // admin_notifications collection
let pollingInterval = null;

const fetchMessages = async () => {
  try {
    const result = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(10)
    ]);
    messages.value = result.documents;
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  }
};

const startPolling = () => {
  fetchMessages();
  pollingInterval = setInterval(fetchMessages, 60000); // Poll every 60 seconds
};

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
};

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.admin-notifications {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}
</style>
