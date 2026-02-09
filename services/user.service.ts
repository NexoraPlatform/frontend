/**
 * User Management Service
 * Handles user CRUD operations, permissions, and roles (admin)
 */

import { http } from '@/lib/fetch-client';

export const userService = {
    /**
     * Get users list with filters (admin)
     */
    async getUsers(params?: any) {
        return http.get('/admin/users', { params });
    },

    /**
     * Get user by ID (admin)
     */
    async getUserById(userId: number) {
        return http.get(`/admin/users/${userId}`);
    },

    /**
     * Create new user (admin)
     */
    async createUser(userData: any) {
        return http.post('/admin/users', userData);
    },

    /**
     * Update user (admin)
     */
    async updateUser(userId: number, userData: any) {
        return http.patch(`/admin/users/${userId}`, { userData });
    },

    /**
     * Delete user (admin)
     */
    async deleteUser(userId: string) {
        return http.delete(`/admin/users/${userId}`);
    },

    /**
     * Set user as superadmin (admin)
     */
    async setSuperadmin(userId: number | string) {
        return http.post(`/admin/access/users/${userId}/make-super`);
    },

    /**
     * Remove superadmin status (admin)
     */
    async removeSuperadmin(userId: number | string) {
        return http.post(`/admin/access/users/${userId}/remove-super`);
    },

    /**
     * Create role (admin)
     */
    async createRole(data: any) {
        return http.post('/admin/access/', data);
    },

    /**
     * Get permissions list (admin)
     */
    async getPermissions() {
        return http.get('/admin/access/permissions');
    },

    /**
     * Allow user permission (admin)
     */
    async allowUserPermission(userId: number, permissionSlug: string) {
        return http.post(`/admin/access/${userId}/allow-permission`, {
            permission: permissionSlug,
        });
    },

    /**
     * Deny user permission (admin)
     */
    async denyUserPermission(userId: number, permissionSlug: string) {
        return http.post(`/admin/access/${userId}/deny-permission`, {
            permission: permissionSlug,
        });
    },

    /**
     * Remove user permission (admin)
     */
    async removeUserPermission(userId: number, slug: string) {
        return http.delete(`/admin/access/${userId}/permissions`, {
            body: { permission: slug },
        });
    },

    /**
     * Get role by ID (admin)
     */
    async getRole(roleId: number) {
        return http.get(`/admin/access/${roleId}`);
    },

    /**
     * Update role (admin)
     */
    async updateRole(roleId: number, data: any) {
        return http.patch(`/admin/access/${roleId}`, data);
    },

    /**
     * Update role sort order (admin)
     */
    async updateRoleSortOrder(roleId: number, sortOrder: number) {
        return http.patch(`/admin/access/${roleId}/sort-order`, { sortOrder });
    },
};

export default userService;
