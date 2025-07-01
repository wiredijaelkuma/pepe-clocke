<template>
  <div :class="['admin-sidebar', { collapsed: isCollapsed }]">
    <button @click="toggleSidebar" class="toggle-btn">
      <img src="/static/three-dots.svg" alt="Toggle Sidebar" />
    </button>
    <ul v-if="!isCollapsed">
      <li><router-link to="/admin">Overview</router-link></li>
      <li><router-link to="/admin/requests">Requests</router-link></li>
      <li><router-link to="/admin/agent-management">Agent Management</router-link></li>
      <li><router-link to="/admin/time-log">Time Log</router-link></li>
      <li><router-link to="/admin/payroll">Payroll</router-link></li>
      <li><router-link to="/admin/profiles">Agent Profiles</router-link></li>
      <li class="home-link"><router-link to="/agent">Return to Agent</router-link></li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.admin-sidebar {
  width: 240px;
  background: url('/static/tj-sunrise.jpg') center center/cover no-repeat;
  padding: 20px;
  height: 100vh;
  color: #fff;
  transition: width 0.3s ease;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  position: relative;
}

.admin-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.8), rgba(254, 180, 123, 0.8));
  z-index: -1;
}
.admin-sidebar.collapsed {
  width: 60px;
}
.toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin-bottom: 20px;
}
a {
  display: block;
  text-decoration: none;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
a:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

li:hover {
  background-color: transparent;
}

.home-link a {
  background-color: rgba(66, 133, 244, 0.3);
  margin-top: 30px;
}

.home-link a:hover {
  background-color: rgba(66, 133, 244, 0.5);
}
</style>