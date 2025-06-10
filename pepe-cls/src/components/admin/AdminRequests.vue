<template>
  <div class="requests-container">
    <h2 class="section-title">Time Modification Requests</h2>
    
    <div class="request-tabs">
      <button 
        @click="activeTab = 'pending'" 
        :class="{ active: activeTab === 'pending' }"
      >
        Pending Requests
      </button>
      <button 
        @click="activeTab = 'acknowledged'" 
        :class="{ active: activeTab === 'acknowledged' }"
      >
        Acknowledged Requests
      </button>
      <button 
        @click="activeTab = 'violations'" 
        :class="{ active: activeTab === 'violations' }"
      >
        Break Violations
      </button>
    </div>
    
    <!-- Pending Requests Tab -->
    <div v-if="activeTab === 'pending'">
      <div v-if="loading">Loading requests...</div>
      <div v-else-if="pendingRequests.length === 0">No pending requests.</div>
      <ul v-else class="requests-list">
        <li v-for="request in pendingRequests" :key="request.$id" class="request-item">
          <div class="request-header">
            <span class="request-user">User: {{ getUserDisplayName(request.user_Id) }}</span>
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
    
    <!-- Acknowledged Requests Tab -->
    <div v-if="activeTab === 'acknowledged'">
      <div v-if="loading">Loading acknowledged requests...</div>
      <div v-else-if="acknowledgedRequests.length === 0">No acknowledged requests.</div>
      <ul v-else class="requests-list">
        <li v-for="request in acknowledgedRequests" :key="request.$id" class="request-item">
          <div class="request-header">
            <span class="request-user">User: {{ getUserDisplayName(request.user_Id) }}</span>
            <span class="request-date">{{ new Date(request.request_date).toLocaleDateString() }}</span>
          </div>
          <div class="request-body">
            <p><strong>Type:</strong> {{ request.request_type }}</p>
            <p><strong>Message:</strong> {{ request.request_message }}</p>
            <p><strong>Acknowledged:</strong> {{ new Date(request.acknowledged_date).toLocaleString() }}</p>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Break Violations Tab -->
    <div v-if="activeTab === 'violations'">
      <div class="filters">
        <div class="filter-group">
          <label for="violation-date-start">Start Date:</label>
          <input id="violation-date-start" type="date" v-model="violationStartDate" class="filter-dropdown" />
        </div>
        <div class="filter-group">
          <label for="violation-date-end">End Date:</label>
          <input id="violation-date-end" type="date" v-model="violationEndDate" class="filter-dropdown" />
        </div>
        <button @click="fetchViolations" class="filter-btn">Filter</button>
      </div>
      
      <div v-if="loadingViolations">Loading violations...</div>
      <div v-else-if="violations.length === 0">No break violations found for the selected date range.</div>
      <div v-else class="violations-container">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search violations..." 
            class="search-input"
          />
        </div>
        <ul class="violations-list">
          <li v-for="violation in filteredViolations" :key="violation.$id" class="violation-item">
            <div class="violation-header">
              <span class="violation-user">{{ getUserDisplayName(violation.user_Id) }}</span>
              <span class="violation-time">{{ formatDate(violation.timestamp) }}</span>
            </div>
            <div class="violation-body">
              <p><strong>Break Type:</strong> {{ violation.breakType }}</p>
              <p><strong>Over By:</strong> {{ violation.overBy }} minutes</p>
            </div>
            <span v-if="violation.acknowledged" class="acknowledged-tag">Acknowledged</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { databases, Query } from '../../lib/appwrite';

const pendingRequests = ref([]);
const acknowledgedRequests = ref([]);
const violations = ref([]);
const loading = ref(true);
const loadingViolations = ref(false);
const activeTab = ref('pending');
const userProfiles = ref({});
const violationStartDate = ref(new Date().toISOString().slice(0, 10));
const violationEndDate = ref(new Date().toISOString().slice(0, 10));
const searchQuery = ref('');

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Helper function to get date range
function getDateRange(startDate, endDate) {
  // Create date objects at midnight for the start and end dates
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  
  console.log('Date range:', startISO, 'to', endISO);
  return { startISO, endISO };
}

const fetchRequests = async () => {
  loading.value = true;
  try {
    // Fetch pending requests
    const pendingResponse = await databases.listDocuments(
      '684639c3000fbbd515ea', // database ID
      '68465b72001c6de6395f', // collection ID
      [
        Query.equal('status', 'pending'),
        Query.orderDesc('$createdAt')
      ]
    );
    pendingRequests.value = pendingResponse.documents;
    
    // Fetch acknowledged requests
    const acknowledgedResponse = await databases.listDocuments(
      '684639c3000fbbd515ea', // database ID
      '68465b72001c6de6395f', // collection ID
      [
        Query.equal('status', 'acknowledged'),
        Query.orderDesc('$createdAt')
      ]
    );
    acknowledgedRequests.value = acknowledgedResponse.documents;
    
    // Fetch user profiles
    await fetchUserProfiles();
  } catch (error) {
    console.error('Failed to fetch requests:', error);
  } finally {
    loading.value = false;
  }
};

const fetchViolations = async () => {
  loadingViolations.value = true;
  try {
    const { startISO, endISO } = getDateRange(violationStartDate.value, violationEndDate.value);
    
    console.log('Fetching violations between:', startISO, 'and', endISO);
    
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '684654f10018b0311641',
      [
        Query.greaterThanEqual('timestamp', startISO),
        Query.lessThan('timestamp', endISO),
        Query.orderDesc('timestamp'),
        Query.limit(1000)
      ]
    );
    
    console.log('Fetched violations:', response.documents.length);
    if (response.documents.length > 0) {
      console.log('Sample violation timestamp:', response.documents[0].timestamp);
    }
    violations.value = response.documents;
    
    // Ensure user profiles are loaded
    await fetchUserProfiles();
  } catch (error) {
    console.error('Failed to fetch violations:', error);
  } finally {
    loadingViolations.value = false;
  }
};

const fetchUserProfiles = async () => {
  try {
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    const profiles = {};
    response.documents.forEach(profile => {
      if (profile.user_Id) {
        profiles[profile.user_Id] = profile.displayName || '';
      }
    });
    
    userProfiles.value = profiles;
  } catch (error) {
    console.error('Failed to fetch user profiles:', error);
  }
};

const getUserDisplayName = (userId) => {
  return userProfiles.value[userId] || userId;
};

const filteredViolations = computed(() => {
  if (!searchQuery.value) return violations.value;
  
  const query = searchQuery.value.toLowerCase();
  return violations.value.filter(violation => {
    const userName = getUserDisplayName(violation.user_Id).toLowerCase();
    const breakType = violation.breakType.toLowerCase();
    const timestamp = formatDate(violation.timestamp).toLowerCase();
    
    return userName.includes(query) || 
           breakType.includes(query) || 
           timestamp.includes(query);
  });
});

const acknowledgeRequest = async (requestId) => {
  try {
    // Update the request status to acknowledged
    await databases.updateDocument(
      '684639c3000fbbd515ea',
      '68465b72001c6de6395f',
      requestId,
      {
        status: 'acknowledged',
        acknowledged_date: new Date().toISOString()
      }
    );
    
    // Refresh the requests
    await fetchRequests();
    
    alert('Request acknowledged successfully.');
  } catch (error) {
    console.error('Failed to acknowledge request:', error);
    alert('Failed to acknowledge request. Please try again.');
  }
};

const acknowledgeViolation = async (violationId) => {
  try {
    // Update the violation to mark as acknowledged
    await databases.updateDocument(
      '684639c3000fbbd515ea',
      '684654f10018b0311641',
      violationId,
      {
        acknowledged: true,
        acknowledged_date: new Date().toISOString()
      }
    );
    
    // Refresh the violations
    await fetchViolations();
    
    alert('Violation acknowledged successfully.');
  } catch (error) {
    console.error('Failed to acknowledge violation:', error);
    alert('Failed to acknowledge violation. Please try again.');
  }
};

onMounted(() => {
  fetchRequests();
  fetchViolations();
});
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

.request-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.request-tabs button {
  background: #2d3748;
  color: #a0aec0;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
}

.request-tabs button:hover {
  background: rgba(255, 193, 7, 0.7);
  color: #1a202c;
}

.request-tabs button.active {
  background: #ffc107;
  color: #1a202c;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.filter-dropdown {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 16px;
  color: #333;
  min-width: 180px;
  font-weight: 500;
}

.filter-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;
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

.requests-list, .violations-list {
  list-style: none;
  padding: 0;
}

.violations-container {
  max-height: 500px;
  overflow-y: auto;
}

.request-item, .violation-item {
  background: #2d3748;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.request-header, .violation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #a0aec0;
}

.request-body p, .violation-body p {
  margin: 8px 0;
}

.request-user, .violation-user {
  font-weight: bold;
  color: #4285F4;
}

.violation-time {
  color: #ffc107;
  font-family: monospace;
}

.acknowledged-tag {
  display: inline-block;
  background: rgba(56, 142, 60, 0.3);
  color: #81c784;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 8px;
}
</style>