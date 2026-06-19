export type Role = 'admin' | 'member' | null;

export type Permission =
  | 'view'
  | 'editData'
  | 'addNotes'
  | 'useAI'
  | 'delete'
  | 'manageUsers'
  | 'manageSettings'
  | 'exportData'
  | 'adminTools';

export interface PermissionContext {
  enabled: boolean;   // is the auth system active?
  role: Role;
  canDelete: boolean; // per-project delete grant for members
}

/**
 * Single source of truth for "is this user allowed to X".
 * When auth is disabled, everything is allowed (current app behaviour).
 */
export function can(perm: Permission, ctx: PermissionContext): boolean {
  if (!ctx.enabled) return true;
  if (ctx.role === 'admin') return true;
  if (ctx.role === 'member') {
    switch (perm) {
      case 'view':
      case 'editData':
      case 'addNotes':
      case 'useAI':
      case 'exportData':
        return true;
      case 'delete':
        return ctx.canDelete; // only if explicitly allowed on the project
      case 'manageUsers':
      case 'manageSettings':
      case 'adminTools':
        return false;
      default:
        return false;
    }
  }
  return false;
}
