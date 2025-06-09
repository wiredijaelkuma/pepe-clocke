// Local browser push notification helper
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
}

// Track shown notifications to avoid duplicates
const shownNotifications = new Set();

export function sendLocalNotification(title, body) {
  const notificationKey = `${title}:${body}`;
  
  // Only show if not already shown
  if (!shownNotifications.has(notificationKey) && 
      'Notification' in window && 
      Notification.permission === 'granted') {
    new Notification(title, { body });
    shownNotifications.add(notificationKey);
  }
}
