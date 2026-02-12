/**
 * Services Barrel Export
 * Centralized exports for all services with backwards compatibility
 */

// Service exports
export * from './auth.service';
export * from './early-access.service';
export * from './user.service';

// Re-export individual services as named exports
export { default as authService } from './auth.service';
export { default as earlyAccessService } from './early-access.service';
export { default as userService } from './user.service';

/**
 * @deprecated Use individual service imports instead
 * 
 * Instead of:
 * ```
 * import { ApiClient } from '@/services';
 * const api = new ApiClient(API_URL);
 * ```
 * 
 * Use:
 * ```
 * import { authService, userService } from '@/services';
 * await authService.login(credentials);
 * ```
 */
export { ApiClient, apiClient } from '../lib/api';
