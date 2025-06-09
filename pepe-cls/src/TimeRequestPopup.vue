<template>
  <div v-if="visible" class="popup-overlay">
    <div class="popup-content">
      <h2>Request Time Change/Time Off</h2>
      <form @submit.prevent="submitRequest">
        <div class="form-group">
          <label for="requestType">Request Type</label>
          <select v-model="requestType" id="requestType" class="styled-select" required>
            <option value="i accidentally clicked a button">I accidentally clicked a button</option>
            <option value="I clocked out by accident">I clocked out by accident</option>
            <option value="I need help (tech support)">I need help (tech support)</option>
            <option value="time off">Time Off</option>
          </select>
        </div>
        <div class="form-group">
          <label for="requestDate">Request Date</label>
          <input type="date" id="requestDate" v-model="requestDate" :disabled="requestType !== 'time off'" required />
        </div>
        <div class="form-group">
          <label for="requestMessage">Comments</label>
          <textarea id="requestMessage" v-model="requestMessage" maxlength="100" placeholder="Enter your comments here..." required></textarea>
        </div>
        <div class="button-group">
          <button type="submit" class="primary-button">Submit Request</button>
          <button type="button" class="secondary-button" @click="closePopup">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { databases } from './lib/appwrite';
import { ID } from 'appwrite';

const props = defineProps({
  visible: Boolean,
  userId: String,
});

const emit = defineEmits(['close', 'requestSubmitted']);

const requestType = ref('I clicked a button');
const requestDate = ref(new Date().toISOString().slice(0, 10));
const requestMessage = ref('');

watch(() => props.visible, (newValue) => {
  if (newValue) {
    requestDate.value = new Date().toISOString().slice(0, 10);
  }
});

const submitRequest = async () => {
  if (props.userId) {
    try {
      await databases.createDocument(
        '684639c3000fbbd515ea', // database ID
        '68465b72001c6de6395f', // collection ID
        ID.unique(),
        {
          user_Id: props.userId,
          request_type: requestType.value,
          request_date: requestDate.value,
          request_message: requestMessage.value,
          timestamp: new Date().toISOString(),
        }
      );
      emit('requestSubmitted');
      clearForm();
      closePopup();
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again.');
    }
  }
};

const clearForm = () => {
  requestType.value = 'I clicked a button';
  requestDate.value = new Date().toISOString().slice(0, 10);
  requestMessage.value = '';
};

const closePopup = () => {
  emit('close');
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.popup-content h2 {
  margin-top: 0;
  margin-bottom: 24px;
  text-align: center;
  color: #333;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.styled-select, input[type="date"] {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  transition: border-color 0.2s;
  background-color: #f9f9f9;
}

.styled-select:focus, input[type="date"]:focus, textarea:focus {
  outline: none;
  border-color: #4285F4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

textarea {
  width: 100%;
  height: 80px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  background-color: #f9f9f9;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.primary-button {
  background-color: #4285F4;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  min-width: 120px;
}

.primary-button:hover {
  background-color: #357ae8;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
}

.secondary-button {
  background-color: #f4f4f4;
  color: #333;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  min-width: 120px;
}

.secondary-button:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}
</style>
