<template>
  <div class="login-bg">
    <div class="login-container">
      <img
        src="/static/pepe-okay-lucha.jpg"
        alt="Welcome Icon"
        class="login-icon"
      />
      <h1 class="login-title">Welcome to the Agent Portal</h1>
      <button class="login-google-btn" @click="loginWithGoogle">
        Login with Google
      </button>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { account } from './lib/appwrite';
import { useRouter } from 'vue-router';

const router = useRouter();
const error = ref('');

async function loginWithGoogle() {
  try {
    error.value = '';
    
    // Try to get current session first
    try {
      const session = await account.get();
      console.log('Existing session found:', session);
      router.push('/agent');
      return;
    } catch (sessionError) {
      console.log('No existing session, proceeding with login');
    }
    
    // Create OAuth session
    await account.createOAuth2Session(
      'google',
      window.location.origin + '/#/agent',
      window.location.origin + '/#/'
    );
  } catch (err) {
    console.error('Login failed:', err);
    error.value = 'Login failed. Please try again.';
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('/static/tj-sunrise.jpg') center center/cover no-repeat fixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  background: linear-gradient(to bottom, rgba(255, 126, 95, 0.7), rgba(254, 180, 123, 0.7));
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.2);
  padding: 48px 32px 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 100%;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-icon {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 50%;
  margin-bottom: 32px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.3);
  border: 6px solid rgba(255, 255, 255, 0.3);
}

.login-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 36px;
  color: white;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.login-google-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 18px 0;
  width: 100%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.2s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.login-google-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.error-message {
  color: #fff;
  background-color: rgba(255, 0, 0, 0.3);
  padding: 10px;
  border-radius: 5px;
  margin-top: 20px;
  text-align: center;
  width: 100%;
}
</style>