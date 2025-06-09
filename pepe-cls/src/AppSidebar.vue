<template>
  <div class="sidebar" :class="{ 'sidebar-open': open }">
    <div class="sidebar-section" @click="toggleAdminMessages">
      <img src="/static/flag.svg" alt="Admin Messages" />
      <span>Admin Messages ({{ pendingMessages }})</span>
    </div>
    <div v-if="showAdminMessages" class="admin-messages">
      <div v-if="loading">Loading...</div>
      <div v-else-if="messages.length === 0">No new messages.</div>
      <ul v-else>
        <li v-for="message in messages" :key="message.$id">
          {{ message.breakType }} over by {{ message.overBy }} minutes on {{ new Date(message.timestamp).toLocaleDateString() }}
        </li>
      </ul>
    </div>
    <div class="sidebar-section" @click="openTimeRequestPopup">
      <img src="/static/calendar.svg" alt="Time Modification Requests" />
      <span>Time Modification Requests</span>
    </div>
    <div class="sidebar-section" @click="toggleLinks">
      <img src="/static/link.svg" alt="Links" />
      <span>Links</span>
    </div>
    <div v-if="showLinks" class="links">
      <ul>
        <li><a href="https://login.forthcrm.com/login.php" target="_blank">Forth</a></li>
        <li><a href="https://respro.motiondebt.com/users/sign_in" target="_blank">Motion</a></li>
        <li><a href="https://elitelegalpractice.my.salesforce.com/" target="_blank">Salesforce</a></li>
      </ul>
    </div>
    <TimeRequestPopup 
      :visible="isPopupVisible" 
      :userId="userId" 
      @close="closeTimeRequestPopup" 
      @requestSubmitted="handleRequestSubmitted" 
    />
    <div class="logout-icon" @click="logout">
      <img src="/static/out.svg" alt="Logout" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TimeRequestPopup from './TimeRequestPopup.vue';
import { account } from './lib/appwrite';
import { useAdminMessages } from './useAdminMessages';

defineProps({
  open: Boolean,
});

const router = useRouter();
const isPopupVisible = ref(false);
const userId = ref('');
const showAdminMessages = ref(false);
const showLinks = ref(false);

const { messages, pendingMessages, loading, fetchMessages } = useAdminMessages();

onMounted(async () => {
  try {
    const user = await account.get();
    userId.value = user.$id;
    fetchMessages();
  } catch {
    router.push('/');
  }
});

const openTimeRequestPopup = () => {
  isPopupVisible.value = true;
};

const closeTimeRequestPopup = () => {
  isPopupVisible.value = false;
};

const handleRequestSubmitted = () => {
  alert('Your request has been submitted successfully.');
};

const toggleAdminMessages = () => {
  showAdminMessages.value = !showAdminMessages.value;
};

const toggleLinks = () => {
  showLinks.value = !showLinks.value;
};

const logout = async () => {
  try {
    await account.deleteSession('current');
    router.push('/');
  } catch (error) {
    console.error('Logout failed', error);
  }
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: url('/static/tj-sunrise.jpg') center center/cover no-repeat;
  padding: 20px;
  position: fixed;
  top: 0;
  right: -300px;
  height: 100vh;
  transition: right 0.3s ease;
  z-index: 10000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.85), rgba(254, 180, 123, 0.85));
  z-index: -1;
}

.sidebar-open {
  right: 0;
}

button {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}

.sidebar-section {
  margin-top: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.sidebar-section:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.sidebar-section img {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.links ul {
  list-style-type: none;
  padding: 0 0 0 36px;
  margin-top: 8px;
}

.links li {
  margin-bottom: 12px;
}

.links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.links a:hover {
  background-color: rgba(255, 255, 255, 0.2);
  text-decoration: underline;
}

.key-button {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.key-button img {
  width: 30px;
  cursor: pointer;
}

.logout-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  padding: 12px;
  cursor: pointer;
  background-color: rgba(217, 83, 79, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.logout-icon:hover {
  background-color: rgba(217, 83, 79, 0.3);
  transform: translateY(-2px);
}

.logout-icon img {
  width: 24px;
  height: 24px;
}
</style>