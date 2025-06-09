<template>
  <div class="agent-layout-bg">
    <div class="agent-layout-main">
      <AgentDashboard />
    </div>
    <AppSidebar :open="sidebarOpen" />
    <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
      <img src="/static/three-dots.svg" alt="Sidebar" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AgentDashboard from './AgentDashboard.vue'
import AppSidebar from './AppSidebar.vue'

const sidebarOpen = ref(false)
</script>

<style scoped>
.agent-layout-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('/static/tijuana-sky.jpg') center center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.agent-layout-main {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  padding: 20px;
}
.sidebar-toggle {
  position: fixed;
  top: 32px;
  right: 16px;
  background: linear-gradient(145deg, #ffc107, #ff9800);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  cursor: pointer;
  transition: transform 0.2s;
}

.sidebar-toggle:hover {
  transform: scale(1.1);
}
.sidebar-toggle img {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}
</style>
