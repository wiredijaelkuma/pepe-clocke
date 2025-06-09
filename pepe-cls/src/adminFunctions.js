import { databases } from './lib/appwrite';

const DB_ID = '684639c3000fbbd515ea'; // agent_sessions database ID

// Function to log admin notifications
export async function logAdminNotification(userId, breakType, overBy) {
  const COLLECTION_ID = '684654f10018b0311641'; // admin_notifications collection ID
  return databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
    user_Id: userId,
    breakType,
    overBy,
    timestamp: new Date().toISOString(),
  });
}

// Function to handle agent time off requests
export async function handleAgentTimeOff(userId, requestType, requestDate, requestMessage) {
  const COLLECTION_ID = '68465b72001c6de6395f'; // message_center collection ID
  return databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
    user_Id: userId,
    request_type: requestType,
    request_date: requestDate,
    request_message: requestMessage,
  });
}
