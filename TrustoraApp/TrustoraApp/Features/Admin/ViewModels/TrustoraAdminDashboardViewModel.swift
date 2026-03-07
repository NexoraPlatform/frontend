import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminDashboardViewModel: ObservableObject {
    @Published var stats: AdminDashboardStats?
    @Published var recentActivities: [DashboardRecentActivity] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func load(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        isLoading = true
        errorMessage = nil

        do {
            async let fetchedStats = TrustoraAPIClient.shared.getAdminDashboardStats(
                language: language,
                currency: currency,
                bearerToken: token
            )

            async let fetchedActivities = TrustoraAPIClient.shared.getRecentActivitiesQuick(
                language: language,
                bearerToken: token
            )

            stats = try await fetchedStats
            recentActivities = Array(try await fetchedActivities.prefix(5))
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func statsCards() -> [AdminDashboardStatCard] {
        guard let stats else {
            return []
        }

        return [
            AdminDashboardStatCard(
                titleKey: "admin.dashboard.stats.users",
                value: Double(stats.totalUsers),
                current: Double(stats.currentMonthUsers),
                change: stats.currentMonthVsLastMonthUsers,
                isCurrency: false,
                icon: "person.3.fill",
                color: Color(hex: 0x2563EB)
            ),
            AdminDashboardStatCard(
                titleKey: "admin.dashboard.stats.services",
                value: Double(stats.activeServices),
                current: Double(stats.currentMonthServices),
                change: stats.currentMonthVsLastMonthServices,
                isCurrency: false,
                icon: "square.grid.2x2.fill",
                color: Color(hex: 0x16A34A)
            ),
            AdminDashboardStatCard(
                titleKey: "admin.dashboard.stats.revenue",
                value: stats.totalRevenue,
                current: stats.currentMonthRevenue,
                change: stats.currentMonthVsLastMonthRevenue,
                isCurrency: true,
                icon: "dollarsign.circle.fill",
                color: Color(hex: 0xCA8A04)
            ),
            AdminDashboardStatCard(
                titleKey: "admin.dashboard.stats.projects",
                value: Double(stats.totalProjects),
                current: Double(stats.currentMonthProjects),
                change: stats.currentMonthVsLastMonthProjects,
                isCurrency: false,
                icon: "chart.line.uptrend.xyaxis.circle.fill",
                color: Color(hex: 0x9333EA)
            ),
        ]
    }

    func quickActions() -> [AdminDashboardQuickAction] {
        [
            AdminDashboardQuickAction(
                titleKey: "admin.dashboard.quick_actions.add_user.title",
                descriptionKey: "admin.dashboard.quick_actions.add_user.description",
                icon: "person.badge.plus"
            ),
            AdminDashboardQuickAction(
                titleKey: "admin.dashboard.quick_actions.add_category.title",
                descriptionKey: "admin.dashboard.quick_actions.add_category.description",
                icon: "folder.badge.plus"
            ),
            AdminDashboardQuickAction(
                titleKey: "admin.dashboard.quick_actions.add_test.title",
                descriptionKey: "admin.dashboard.quick_actions.add_test.description",
                icon: "book.closed.fill"
            ),
            AdminDashboardQuickAction(
                titleKey: "admin.dashboard.quick_actions.view_reports.title",
                descriptionKey: "admin.dashboard.quick_actions.view_reports.description",
                icon: "chart.bar.doc.horizontal.fill"
            ),
        ]
    }

    func sections() -> [AdminDashboardSection] {
        let stats = self.stats

        return [
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.users.title",
                descriptionKey: "admin.dashboard.sections.users.description",
                statsKey: "admin.dashboard.sections.users.stats_template",
                statsCount: stats?.totalUsers ?? 0,
                icon: "person.3.fill",
                pendingCount: stats?.pendingUsers ?? 0,
                access: .roles(["admin"], permissions: ["users.read"])
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.early_access.title",
                descriptionKey: "admin.dashboard.sections.early_access.description",
                statsKey: "admin.dashboard.sections.early_access.stats",
                statsCount: nil,
                icon: "person.badge.clock.fill",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.services.title",
                descriptionKey: "admin.dashboard.sections.services.description",
                statsKey: "admin.dashboard.sections.services.stats_template",
                statsCount: stats?.activeServices ?? 0,
                icon: "square.grid.2x2.fill",
                pendingCount: stats?.pendingServices ?? 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.categories.title",
                descriptionKey: "admin.dashboard.sections.categories.description",
                statsKey: "admin.dashboard.sections.categories.stats",
                statsCount: nil,
                icon: "folder.fill",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.tests.title",
                descriptionKey: "admin.dashboard.sections.tests.description",
                statsKey: "admin.dashboard.sections.tests.stats",
                statsCount: nil,
                icon: "book.closed.fill",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.calls.title",
                descriptionKey: "admin.dashboard.sections.calls.description",
                statsKey: "admin.dashboard.sections.calls.stats_template",
                statsCount: stats?.totalScheduleCalls ?? 0,
                icon: "phone.fill",
                pendingCount: stats?.pendingCalls ?? 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.projects.title",
                descriptionKey: "admin.dashboard.sections.projects.description",
                statsKey: "admin.dashboard.sections.projects.stats_template",
                statsCount: stats?.totalProjects ?? 0,
                icon: "chart.line.uptrend.xyaxis",
                pendingCount: stats?.totalPendingProjects ?? 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.disputes.title",
                descriptionKey: "admin.dashboard.sections.disputes.description",
                statsKey: "admin.dashboard.sections.disputes.stats",
                statsCount: nil,
                icon: "shield.lefthalf.filled",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.legal_clauses.title",
                descriptionKey: "admin.dashboard.sections.legal_clauses.description",
                statsKey: "admin.dashboard.sections.legal_clauses.stats",
                statsCount: nil,
                icon: "doc.text.fill",
                pendingCount: 0,
                access: .roles(["admin", "legal"], permissions: ["legal.clauses.read"])
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.newsletter.title",
                descriptionKey: "admin.dashboard.sections.newsletter.description",
                statsKey: "admin.dashboard.sections.newsletter.stats",
                statsCount: nil,
                icon: "bell.fill",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.activities.title",
                descriptionKey: "admin.dashboard.sections.activities.description",
                statsKey: nil,
                statsCount: nil,
                icon: "clock.arrow.circlepath",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.audit_logs.title",
                descriptionKey: "admin.dashboard.sections.audit_logs.description",
                statsKey: nil,
                statsCount: nil,
                icon: "clock.badge.exclamationmark.fill",
                pendingCount: 0,
                access: .admin
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.roles.title",
                descriptionKey: "admin.dashboard.sections.roles.description",
                statsKey: "admin.dashboard.sections.roles.stats",
                statsCount: nil,
                icon: "person.crop.rectangle.stack.fill",
                pendingCount: 0,
                access: .superuser
            ),
            AdminDashboardSection(
                titleKey: "admin.dashboard.sections.analytics.title",
                descriptionKey: "admin.dashboard.sections.analytics.description",
                statsKey: "admin.dashboard.sections.analytics.stats",
                statsCount: nil,
                icon: "chart.bar.fill",
                pendingCount: 0,
                access: .admin
            ),
        ]
    }

    func systemStatus() -> [(labelKey: String, valueKey: String)] {
        [
            ("admin.dashboard.system_status.server_status", "admin.dashboard.system_status.online"),
            ("admin.dashboard.system_status.database", "admin.dashboard.system_status.healthy"),
            ("admin.dashboard.system_status.api_response", "admin.dashboard.system_status.fast"),
            ("admin.dashboard.system_status.provider_rates", "admin.dashboard.system_status.flexible"),
            ("admin.dashboard.system_status.competency_tests", "admin.dashboard.system_status.active"),
        ]
    }

    func canAccess(_ section: AdminDashboardSection, user: TrustoraAuthUser?) -> Bool {
        guard let user else {
            return false
        }

        if user.isSuperuser == true {
            return true
        }

        switch section.access {
        case .admin:
            return user.hasRole("admin")
        case .superuser:
            return user.isSuperuser == true
        case let .roles(roles, permissions):
            let hasRole = roles.contains { user.hasRole($0) }
            if !hasRole {
                return false
            }
            guard !permissions.isEmpty else {
                return true
            }
            let normalizedPermissions = Set((user.permissions ?? []).map { $0.lowercased() })
            return permissions.allSatisfy { normalizedPermissions.contains($0.lowercased()) }
        }
    }
}
