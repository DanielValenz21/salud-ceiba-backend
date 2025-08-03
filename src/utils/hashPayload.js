import crypto from 'crypto';

/**
 * Builds a SHA-256 hash of the given payload.
 * @param {object} payload
 * @returns {string} hex digest
 */
export const buildHash = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
