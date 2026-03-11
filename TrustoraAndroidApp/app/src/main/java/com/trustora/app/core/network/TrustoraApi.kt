package com.trustora.app.core.network

import com.google.gson.JsonElement
import com.google.gson.JsonObject
import retrofit2.http.DELETE
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.Part
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

interface TrustoraApi {
    @POST("auth/mobile/login")
    suspend fun login(@Body payload: LoginPayload): JsonElement

    @POST("auth/register")
    suspend fun register(@Body payload: RegisterPayload): JsonElement

    @GET("auth/mobile/me")
    suspend fun me(
        @Header("Authorization") bearerToken: String,
        @Query("include") include: String = "connected_accounts",
    ): JsonElement

    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") bearerToken: String): JsonElement

    @GET("categories")
    suspend fun getCategories(
        @Query("language") language: String,
    ): JsonElement

    @GET("services")
    suspend fun getServices(
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("categoryId") categoryId: String?,
        @Query("skills") skills: List<String>?,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("services/categories/grouped")
    suspend fun getProjectCreationServices(
        @Header("Authorization") bearerToken: String,
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("search") search: String?,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("ai/recommend-services")
    suspend fun recommendProjectCreationServices(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @POST("ai/brief-builder")
    suspend fun buildProjectCreationBrief(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @POST("ai/recommend-providers")
    suspend fun recommendProjectCreationProviders(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("ai/brief-builder/{id}")
    suspend fun getProjectCreationBriefResult(
        @Path("id") id: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @POST("projects")
    suspend fun createClientProject(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("dashboard/stats")
    suspend fun getDashboardStats(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/stats")
    suspend fun getAdminDashboardStats(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/access")
    suspend fun getAdminRoles(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("page_size") pageSize: Int,
        @Query("search") search: String?,
    ): JsonElement

    @GET("admin/access/{roleId}")
    suspend fun getAdminRole(
        @Path("roleId") roleId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/access/permissions")
    suspend fun getAdminPermissionGroups(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/access/slug/{roleSlug}/permissions")
    suspend fun getAdminRolePermissionSlugs(
        @Path("roleSlug") roleSlug: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/access")
    suspend fun createAdminRole(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/access/{roleId}")
    suspend fun updateAdminRole(
        @Path("roleId") roleId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/access/{roleId}/sort-order")
    suspend fun updateAdminRoleSortOrder(
        @Path("roleId") roleId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PUT("admin/access/{roleId}/sync-permission")
    suspend fun updateAdminRolePermissionsBySlug(
        @Path("roleId") roleId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("roles/{roleId}")
    suspend fun deleteAdminRole(
        @Path("roleId") roleId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/users")
    suspend fun getAdminUsers(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @POST("admin/users")
    suspend fun createAdminUser(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/users/{userId}/status")
    suspend fun updateAdminUserStatus(
        @Path("userId") userId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("admin/users/{userId}")
    suspend fun deleteAdminUser(
        @Path("userId") userId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("early-access/grouped")
    suspend fun getAdminEarlyAccessGrouped(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @GET("activities")
    suspend fun getAdminActivities(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
    ): JsonElement

    @GET("admin/audit-logs")
    suspend fun getAdminAuditLogs(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("event") event: String?,
        @Query("user_id") userId: Int?,
        @Query("subject_type") subjectType: String?,
        @Query("date_from") dateFrom: String?,
        @Query("date_to") dateTo: String?,
    ): JsonElement

    @GET("admin/calls")
    suspend fun getAdminCalls(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @PATCH("admin/calls/{callId}/status")
    suspend fun updateAdminCallStatus(
        @Path("callId") callId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("admin/orders")
    suspend fun getAdminOrders(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @GET("orders/{orderId}")
    suspend fun getAdminOrder(
        @Path("orderId") orderId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @PATCH("orders/{orderId}")
    suspend fun updateAdminOrder(
        @Path("orderId") orderId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("admin/services")
    suspend fun getAdminServices(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @GET("services/{serviceId}")
    suspend fun getAdminService(
        @Path("serviceId") serviceId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/services")
    suspend fun createAdminService(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/services/{serviceId}")
    suspend fun updateAdminService(
        @Path("serviceId") serviceId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/services/{serviceId}/status")
    suspend fun updateAdminServiceStatus(
        @Path("serviceId") serviceId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("admin/services/{serviceId}")
    suspend fun deleteAdminService(
        @Path("serviceId") serviceId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/categories")
    suspend fun getAdminCategories(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @GET("admin/categories/{categoryId}")
    suspend fun getAdminCategory(
        @Path("categoryId") categoryId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/categories")
    suspend fun createAdminCategory(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/categories/{categoryId}")
    suspend fun updateAdminCategory(
        @Path("categoryId") categoryId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("admin/categories/{categoryId}")
    suspend fun deleteAdminCategory(
        @Path("categoryId") categoryId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/tests")
    suspend fun getAdminTests(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int,
    ): JsonElement

    @GET("tests/{testId}")
    suspend fun getAdminTest(
        @Path("testId") testId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/tests")
    suspend fun createAdminTest(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("tests/{testId}")
    suspend fun updateAdminTest(
        @Path("testId") testId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("tests/{testId}")
    suspend fun deleteAdminTest(
        @Path("testId") testId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @PATCH("tests/{testId}/status")
    suspend fun updateAdminTestStatus(
        @Path("testId") testId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("admin/tests/{testId}/statistics")
    suspend fun getAdminTestStatistics(
        @Path("testId") testId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("categories")
    suspend fun getAdminServiceCategories(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @GET("admin/categories/{categoryId}/slug")
    suspend fun getAdminServiceCategorySlug(
        @Path("categoryId") categoryId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/categories/{categoryId}/slug")
    suspend fun getAdminCategorySlug(
        @Path("categoryId") categoryId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("admin/legal/clauses")
    suspend fun getAdminLegalClauses(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @QueryMap params: Map<String, String>,
    ): JsonElement

    @GET("admin/legal/clauses/{clauseId}")
    suspend fun getAdminLegalClause(
        @Path("clauseId") clauseId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("lang") languageFilter: String?,
    ): JsonElement

    @GET("admin/legal/clauses/category")
    suspend fun getAdminLegalClauseCategories(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/legal/clauses")
    suspend fun createAdminLegalClause(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @PATCH("admin/legal/clauses/{clauseId}")
    suspend fun updateAdminLegalClause(
        @Path("clauseId") clauseId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @DELETE("admin/legal/clauses/{clauseId}")
    suspend fun deleteAdminLegalClause(
        @Path("clauseId") clauseId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("newsletter/templates")
    suspend fun getAdminNewsletterTemplates(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("newsletter/templates/{template}")
    suspend fun getAdminNewsletterTemplateContent(
        @Path("template") template: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("newsletter")
    suspend fun getAdminNewsletterSubscribers(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Query("per_page") perPage: Int,
        @Query("only_active") onlyActive: Boolean,
    ): JsonElement

    @POST("newsletter/send")
    suspend fun sendAdminNewsletter(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("general/delivery-providers")
    suspend fun getAdminServiceDeliveryProviders(
        @Header("Authorization") bearerToken: String?,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @POST("admin/access/users/{userId}/make-super")
    suspend fun makeAdminUserSuper(
        @Path("userId") userId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject = JsonObject(),
    ): JsonElement

    @POST("admin/access/users/{userId}/remove-super")
    suspend fun removeAdminUserSuper(
        @Path("userId") userId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject = JsonObject(),
    ): JsonElement

    @GET("activities/recent")
    suspend fun getRecentActivities(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @GET("projects/requests")
    suspend fun getProviderProjectRequests(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("projects/my-requests")
    suspend fun getClientProjectRequests(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("services/popular")
    suspend fun getPopularServices(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("users/providers/{providerId}/services")
    suspend fun getProviderServices(
        @Path("providerId") providerId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
    ): JsonElement

    @GET("users/providers/profile")
    suspend fun getProviderProfile(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @PATCH("users/profile")
    suspend fun updateProviderProfile(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("languages")
    suspend fun getProviderProfileLanguages(
        @Query("language") language: String,
    ): JsonElement

    @Multipart
    @POST("users/avatar")
    suspend fun uploadProviderAvatar(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String?,
        @Part avatar: okhttp3.MultipartBody.Part,
    ): JsonElement

    @GET("chat/groups")
    suspend fun getChatGroups(
        @Header("Authorization") bearerToken: String,
    ): JsonElement

    @GET("chat/groups/{groupId}/messages")
    suspend fun getChatMessages(
        @Path("groupId") groupId: String,
        @Header("Authorization") bearerToken: String,
        @Query("page") page: Int,
        @Query("limit") limit: Int,
    ): JsonElement

    @POST("chat/groups/{groupId}/messages")
    suspend fun sendChatMessage(
        @Path("groupId") groupId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @POST("chat/groups/{groupId}/read")
    suspend fun markChatGroupRead(
        @Path("groupId") groupId: String,
        @Header("Authorization") bearerToken: String,
        @Body payload: JsonObject = JsonObject(),
    ): JsonElement

    @POST("projects/{projectId}/respond")
    suspend fun respondToProjectRequest(
        @Path("projectId") projectId: String,
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Body payload: JsonObject,
    ): JsonElement

    @POST("projects/{projectId}/markMilestone")
    suspend fun markProjectMilestone(
        @Path("projectId") projectId: String,
        @Header("Authorization") bearerToken: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("rapyd/balance")
    suspend fun getRapydWalletBalances(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @POST("rapyd/onboard")
    suspend fun rapydOnboarding(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
    ): JsonElement

    @POST("rapyd/payout/bank")
    suspend fun createRapydPayoutBank(
        @Header("Authorization") bearerToken: String,
        @Query("language") language: String,
        @Query("currency") currency: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("companies/search")
    suspend fun searchCompanies(
        @Query("q") query: String,
        @Query("limit") limit: Int = 10,
    ): JsonElement

    @GET("users/currencies")
    suspend fun getCurrencies(
        @Header("Authorization") bearerToken: String?,
        @Query("search") search: String?,
    ): JsonElement

    @PATCH("users/update/company")
    suspend fun updateUserCompanyDetails(
        @Header("Authorization") bearerToken: String,
        @Body payload: JsonObject,
    ): JsonElement

    @GET("users/company/editors")
    suspend fun getCompanyManagers(
        @Header("Authorization") bearerToken: String,
        @Query("company_id") companyId: String,
    ): JsonElement

    @GET("users/company/members")
    suspend fun getCompanyMembers(
        @Header("Authorization") bearerToken: String,
        @Query("company_id") companyId: String,
    ): JsonElement

    @GET("users/company/search/users")
    suspend fun searchUsersForCompany(
        @Header("Authorization") bearerToken: String,
        @Query("search") search: String,
    ): JsonElement

    @PATCH("users/company/access")
    suspend fun updateCompanyEditorsOrOwnership(
        @Header("Authorization") bearerToken: String,
        @Body payload: JsonObject,
    ): JsonElement
}
