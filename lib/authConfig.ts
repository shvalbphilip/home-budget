// Master switch for the auth + roles system.
// Default OFF → the app behaves exactly as it does today (no login, full access).
// Set NEXT_PUBLIC_AUTH_ENABLED=true (after running the SQL migration and creating
// the users) to turn on authentication, roles and Row Level Security gating.
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

// Optional second factor: require an SMS one-time code after email/password sign-in
// (skipped when the user signs in with Google). Needs an SMS provider configured in
// Supabase (Auth → Providers → Phone). See SETUP_AUTH.md.
export const SMS_2FA_ENABLED = process.env.NEXT_PUBLIC_SMS_2FA_ENABLED === 'true';

// Is Google sign-in offered on the login screen? (Also enable the provider in Supabase.)
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'false';
