// Master switch for the auth + roles system.
// Default OFF → the app behaves exactly as it does today (no login, full access).
// Set NEXT_PUBLIC_AUTH_ENABLED=true (after running the SQL migration and creating
// the users) to turn on authentication, roles and Row Level Security gating.
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
