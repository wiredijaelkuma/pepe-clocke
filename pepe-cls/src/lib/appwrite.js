import { Client, Account, Databases, Query, ID } from 'appwrite'

const getEndpoint = () => {
  // Fallback for production if env vars aren't loaded properly
  return import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
}

const getProjectId = () => {
  // Fallback for production if env vars aren't loaded properly
  return import.meta.env.VITE_APPWRITE_PROJECT_ID || '6846140e000a316ba80b'
}

const getProjectName = () => {
  // Fallback for production if env vars aren't loaded properly
  return import.meta.env.VITE_APPWRITE_PROJECT_NAME || 'pepe-clocke'
}

const client = new Client().setEndpoint(getEndpoint()).setProject(getProjectId())

const account = new Account(client)
const databases = new Databases(client)

export { client, account, databases, getEndpoint, getProjectName, getProjectId, Query, ID }