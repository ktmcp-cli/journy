import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.journy.io';

function getHeaders() {
  const apiKey = getConfig('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured. Run: journy config set --api-key YOUR_KEY');
  }
  return {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json'
  };
}

async function request(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: getHeaders()
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(`API Error: ${error.response.data.message}`);
    }
    if (error.response?.status === 401) {
      throw new Error('Unauthorized: Invalid API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded (1800 requests/min)');
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// Users
// ============================================================

/**
 * Create or update a user
 */
export async function upsertUser(userId, email, properties = {}) {
  const data = {
    identification: { userId }
  };

  if (email) {
    data.identification.email = email;
  }

  if (Object.keys(properties).length > 0) {
    data.properties = properties;
  }

  return await request('POST', '/users/upsert', data);
}

/**
 * Delete a user
 */
export async function deleteUser(userId, email) {
  const identification = {};
  if (userId) identification.userId = userId;
  if (email) identification.email = email;

  return await request('DELETE', '/users', { identification });
}

// ============================================================
// Accounts
// ============================================================

/**
 * Create or update an account
 */
export async function upsertAccount(accountId, domain, properties = {}) {
  const data = {
    identification: { accountId }
  };

  if (domain) {
    data.identification.domain = domain;
  }

  if (Object.keys(properties).length > 0) {
    data.properties = properties;
  }

  return await request('POST', '/accounts/upsert', data);
}

/**
 * Delete an account
 */
export async function deleteAccount(accountId, domain) {
  const identification = {};
  if (accountId) identification.accountId = accountId;
  if (domain) identification.domain = domain;

  return await request('DELETE', '/accounts', { identification });
}

/**
 * Add users to an account
 */
export async function addUsersToAccount(accountId, userIds) {
  const data = {
    identification: { accountId },
    users: userIds.map(userId => ({ identification: { userId } }))
  };

  return await request('POST', '/accounts/users/add', data);
}

/**
 * Remove users from an account
 */
export async function removeUsersFromAccount(accountId, userIds) {
  const data = {
    identification: { accountId },
    users: userIds.map(userId => ({ identification: { userId } }))
  };

  return await request('POST', '/accounts/users/remove', data);
}

// ============================================================
// Events
// ============================================================

/**
 * Track an event
 */
export async function trackEvent(eventName, userId, accountId, metadata = {}) {
  const data = { name: eventName };

  if (userId) {
    data.userId = userId;
  }

  if (accountId) {
    data.accountId = accountId;
  }

  if (Object.keys(metadata).length > 0) {
    data.metadata = metadata;
  }

  return await request('POST', '/track', data);
}

/**
 * Get list of available events
 */
export async function getEvents() {
  return await request('GET', '/events');
}

// ============================================================
// Properties
// ============================================================

/**
 * Get user properties
 */
export async function getUserProperties() {
  return await request('GET', '/properties/users');
}

/**
 * Get account properties
 */
export async function getAccountProperties() {
  return await request('GET', '/properties/accounts');
}

// ============================================================
// Segments
// ============================================================

/**
 * Get user segments
 */
export async function getUserSegments() {
  return await request('GET', '/segments/users');
}

/**
 * Get account segments
 */
export async function getAccountSegments() {
  return await request('GET', '/segments/accounts');
}

// ============================================================
// Link (User to Account)
// ============================================================

/**
 * Link a user to an account
 */
export async function linkUserToAccount(userId, accountId) {
  const data = {
    user: { identification: { userId } },
    account: { identification: { accountId } }
  };

  return await request('POST', '/link', data);
}

// ============================================================
// Validation
// ============================================================

/**
 * Validate API key
 */
export async function validateApiKey() {
  return await request('GET', '/validate');
}

// ============================================================
// Tracking Snippet
// ============================================================

/**
 * Get tracking snippet
 */
export async function getTrackingSnippet() {
  return await request('GET', '/tracking/snippet');
}
