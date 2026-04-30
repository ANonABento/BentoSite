export const CONTACT_FIELD_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  messageMin: 10,
  messageMax: 4000,
} as const;

export const CONTACT_HONEYPOT_FIELD = 'company';

export const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

