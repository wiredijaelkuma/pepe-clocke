import { Client, Account, Databases, Query, ID } from 'appwrite'

const getEndpoint = () => {
  // Hardcoded for GitHub Pages since env vars don't work there
  return 'https://fra.cloud.appwrite.io/v1'
}

const getProjectId = () => {
  // Hardcoded for GitHub Pages since env vars don't work there
  return '6846140e000a316ba80b'
}

const getProjectName = () => {
  // Hardcoded for GitHub Pages since env vars don't work there
  return 'pepe-clocke'
}

const client = new Client().setEndpoint(getEndpoint()).setProject(getProjectId())

const account = new Account(client)
const databases = new Databases(client)

export { client, account, databases, getEndpoint, getProjectName, getProjectId, Query, ID }