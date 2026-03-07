import Foundation
import SwiftUI

struct AdminDashboardStatCard: Identifiable {
    let id = UUID()
    let titleKey: String
    let value: Double
    let current: Double
    let change: Double
    let isCurrency: Bool
    let icon: String
    let color: Color
}

struct AdminDashboardQuickAction: Identifiable {
    let id = UUID()
    let titleKey: String
    let descriptionKey: String
    let icon: String
}

struct AdminDashboardSection: Identifiable {
    enum Access {
        case admin
        case superuser
        case roles([String], permissions: [String] = [])
    }

    let id = UUID()
    let titleKey: String
    let descriptionKey: String
    let statsKey: String?
    let statsCount: Int?
    let icon: String
    let pendingCount: Int
    let access: Access
}

