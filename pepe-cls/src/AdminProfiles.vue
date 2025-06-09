<template>
  <div class="admin-profiles-bg">
    <div class="admin-profiles-card">
      <h2>Agent Profile Management</h2>
      <div v-if="loading" class="admin-profiles-loading">Loading...</div>
      <table v-else class="admin-profiles-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Display Name</th>
            <th>Approved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="profile in profiles" :key="profile.user_Id">
            <td>{{ profile.user_Id }}</td>
            <td>
              <input v-model="profile.displayName" class="admin-profiles-input" />
            </td>
            <td>
              <input type="checkbox" v-model="profile.approved" />
            </td>
            <td>
              <button @click="saveProfile(profile)" class="admin-profiles-save">Save</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="saveMsg" class="admin-profiles-msg">{{ saveMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAgentProfiles } from './useAgentProfiles'

const { profiles, loading, fetchProfiles, setDisplayName } = useAgentProfiles()
const saveMsg = ref('')

onMounted(() => {
  fetchProfiles()
})

async function saveProfile(profile) {
  await setDisplayName(profile.user_Id, profile.displayName, profile.approved)
  saveMsg.value = 'Profile saved!'
  setTimeout(() => { saveMsg.value = '' }, 2000)
  fetchProfiles()
}
</script>

<style scoped>
.admin-profiles-bg {
  min-height: 100vh;
  background: #f4f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-profiles-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.10);
  padding: 36px 32px 32px 32px;
  min-width: 480px;
  max-width: 90vw;
}
.admin-profiles-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 18px;
}
.admin-profiles-table th, .admin-profiles-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}
.admin-profiles-input {
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #bdbdbd;
}
.admin-profiles-save {
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.admin-profiles-save:hover {
  background: #357ae8;
}
.admin-profiles-loading {
  font-size: 1.1rem;
  color: #888;
  margin-bottom: 12px;
}
.admin-profiles-msg {
  margin-top: 12px;
  color: #388e3c;
  font-weight: 600;
}
</style>
