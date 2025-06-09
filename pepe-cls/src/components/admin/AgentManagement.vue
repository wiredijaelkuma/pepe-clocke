<template>
  <div class="agent-management-container">
    <h2 class="section-title">Agent Management</h2>
    <div v-if="loading">Loading agents...</div>
    <div v-else-if="agents.length === 0">No agents found.</div>
    <ul v-else class="agents-list">
      <li v-for="agent in agents" :key="agent.userId" class="agent-item">
        <div class="agent-info">
          <span class="agent-id">User ID: {{ agent.userId }}</span>
          <span class="agent-name" v-if="agent.displayName">Current Name: {{ agent.displayName }}</span>
          <input type="text" v-model="agent.newDisplayName" placeholder="Display Name" maxlength="60" class="display-name-input" />
        </div>
        <button @click="updateProfile(agent)" class="update-btn" :disabled="!agent.newDisplayName">
          {{ agent.profileExists ? 'Update' : 'Create' }} Profile
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { databases, Query, ID } from '../../lib/appwrite';

const agents = ref([]);
const loading = ref(true);

const fetchAgents = async () => {
  try {
    // 1. Fetch all unique user IDs from agent_activity
    const activityResponse = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1'
    );
    
    // Get unique user IDs
    const userIds = [...new Set(activityResponse.documents.map(doc => doc.user_Id))];
    
    if (userIds.length === 0) {
      loading.value = false;
      return;
    }

    // 2. For each user ID, check if a profile exists in agent_profiles
    const agentData = await Promise.all(userIds.map(async (userId) => {
      try {
        const profileResponse = await databases.listDocuments(
          '684639c3000fbbd515ea',
          '68465330002c380c2975',
          [Query.equal('user_Id', userId)]
        );
        const profile = profileResponse.documents[0];
        return {
          userId,
          displayName: profile ? profile.displayName : '',
          newDisplayName: profile ? profile.displayName : '',
          profileId: profile ? profile.$id : null,
          profileExists: !!profile,
        };
      } catch (err) {
        console.error(`Error fetching profile for user ${userId}:`, err);
        return {
          userId,
          displayName: '',
          newDisplayName: '',
          profileId: null,
          profileExists: false,
        };
      }
    }));
    
    agents.value = agentData.filter(agent => agent !== null);

  } catch (error) {
    console.error('Failed to fetch agents:', error);
  } finally {
    loading.value = false;
  }
};

const updateProfile = async (agent) => {
  try {
    const data = {
      user_Id: agent.userId,
      displayName: agent.newDisplayName || agent.displayName,
      approved: true,
    };
    if (agent.profileExists) {
      // Update existing profile
      await databases.updateDocument(
        '684639c3000fbbd515ea',
        '68465330002c380c2975',
        agent.profileId,
        data
      );
    } else {
      // Create new profile
      await databases.createDocument(
        '684639c3000fbbd515ea',
        '68465330002c380c2975',
        ID.unique(),
        data
      );
    }
    alert(`Profile for ${agent.userId} has been saved.`);
    fetchAgents(); // Refresh list
  } catch (error) {
    console.error('Failed to update profile:', error);
    alert('Failed to save profile. Please try again.');
  }
};

onMounted(fetchAgents);
</script>

<style scoped>
.agent-management-container {
  background: rgba(45, 55, 72, 0.8);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.section-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #ffc107;
  text-align: center;
}
.agents-list {
  list-style: none;
  padding: 0;
}
.agent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2d3748;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.agent-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.agent-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.agent-name {
  font-weight: bold;
  color: #ffc107;
  margin-bottom: 8px;
}
.agent-id {
  font-size: 0.9rem;
  color: #a0aec0;
}
.display-name-input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  padding: 8px 12px;
  color: #333;
  width: 200px;
  font-weight: 500;
}
.update-btn {
  background: #ffc107;
  color: #1a202c;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
}
.update-btn:hover {
  background: #ffca28;
}
.update-btn:disabled {
  background: #4a5568;
  color: #a0aec0;
  cursor: not-allowed;
}
.agent-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
}
.status-approved {
  background-color: #48bb78;
  color: #fff;
}
.status-pending {
  background-color: #f6e05e;
  color: #1a202c;
}
</style>