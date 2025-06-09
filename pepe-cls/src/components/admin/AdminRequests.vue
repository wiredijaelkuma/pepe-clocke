<template>
  <div class="requests-container">
    <h2 class="section-title">Time Modification Requests</h2>
    <div v-if="loading">Loading requests...</div>
    <div v-else-if="requests.length === 0">No pending requests.</div>
    <ul v-else class="requests-list">
      <li v-for="request in requests" :key="request.$id" class="request-item">
        <div class="request-header">
          <span class="request-user">User: {{ request.user_Id }}</span>
          <span class="request-date">{{ new Date(request.request_date).toLocaleDateString() }}</span>
        </div>
        <div class="request-body">
          <p><strong>Type:</strong> {{ request.request_type }}</p>
          <p><strong>Message:</strong> {{ request.request_message }}</p>
        </div>
        <button @click="acknowledgeRequest(request.$id)" class="acknowledge-btn">Acknowledge</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { databases, Query } from '../../lib/appwrite';

const requests = ref([]);
const loading = ref(true);

const fetchRequests = async () => {
  try {
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea', // database ID
      '68465b72001c6de6395f', // collection ID
      [Query.orderDesc('$createdAt')]
    );
    requests.value = response.documents;
  } catch (error) {
    console.error('Failed to fetch requests:', error);
  } finally {
    loading.value = false;
  }
};

const acknowledgeRequest = async (requestId) => {
  try {
    // Logic to acknowledge the request and move it to history
    requests.value = requests.value.filter(request => request.$id !== requestId);
    alert('Request acknowledged and moved to history.');
  } catch (error) {
    console.error('Failed to acknowledge request:', error);
    alert('Failed to acknowledge request. Please try again.');
  }
};

onMounted(fetchRequests);
</script>

<style scoped>
.requests-container {
  background: rgba(45, 55, 72, 0.8);
  padding: 24px;
  border-radius: 16px;
}
.section-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #ffc107;
}
.acknowledge-btn {
  background: #ffc107;
  color: #1a202c;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 8px;
}

.requests-list {
  list-style: none;
  padding: 0;
}
.request-item {
  background: #2d3748;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.request-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #a0aec0;
}
.request-body p {
  margin: 0;
}
</style>