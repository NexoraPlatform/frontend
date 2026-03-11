import Foundation

enum AdminServicesStatusFilter: String, CaseIterable, Identifiable {
    case all
    case active
    case draft
    case suspended

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.services.filters.all"
        case .active:
            return "admin.services.statuses.ACTIVE"
        case .draft:
            return "admin.services.statuses.DRAFT"
        case .suspended:
            return "admin.services.statuses.SUSPENDED"
        }
    }

    var statusValue: String? {
        switch self {
        case .all:
            return nil
        case .active:
            return "ACTIVE"
        case .draft:
            return "DRAFT"
        case .suspended:
            return "SUSPENDED"
        }
    }
}

enum AdminServiceStatusAction: String {
    case view
    case approve
    case feature
    case suspend
}

enum AdminServiceEditorMode: Equatable {
    case create
    case edit(serviceID: String)

    var isEdit: Bool {
        if case .edit = self {
            return true
        }
        return false
    }
}

struct AdminServiceEditorDraft: Equatable {
    var name: String = ""
    var slug: String = ""
    var description: String = ""
    var requirements: String = ""
    var categoryID: String = ""
    var categorySlug: String?
    var deliveryProvider: String = ""
    var skills: [String] = []
    var tags: [String] = []
    var status: String = "DRAFT"

    var isCreateValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !slug.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !categoryID.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !deliveryProvider.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    mutating func apply(_ detail: AdminServiceDetail) {
        name = detail.name
        slug = detail.slug
        description = detail.description
        requirements = detail.requirements
        categoryID = detail.categoryID
        categorySlug = detail.categorySlug
        deliveryProvider = detail.deliveryProvider
        skills = detail.skills
        tags = detail.tags
        status = detail.status
    }
}
