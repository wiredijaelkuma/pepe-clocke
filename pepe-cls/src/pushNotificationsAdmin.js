import { databases } from './lib/appwrite'

const DB_ID = '684639c3000fbbd515ea' // your database ID
const COLLECTION_ID = '684654f10018b0311641' // admin notifications collection

export async function logAdminNotification(userId, breakType, overBy) {
  try {
    return databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
      user_Id: userId,
      breakType,
      overBy,
      timestamp: new Date().toISOString()
      // Removed the 'date' field that was causing the error
    });
  } catch (error) {
    console.log('Notification error (non-critical):', error.message);
    // Silently fail - don't disrupt the user experience for notifications
    return null;
  }
}