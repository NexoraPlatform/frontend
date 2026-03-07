import Foundation

enum AdminCategoryEditorMode: Equatable {
    case create
    case edit(categoryID: String)

    var isEdit: Bool {
        if case .edit = self {
            return true
        }
        return false
    }
}

struct AdminCategoryEditorDraft: Equatable {
    var name: String = ""
    var slug: String = ""
    var description: String = ""
    var icon: String = ""
    var parentID: String = ""
    var sortOrder: Int = 0

    var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !slug.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    mutating func apply(_ detail: AdminCategoryDetail) {
        name = detail.name
        slug = detail.slug
        description = detail.description
        icon = detail.icon
        parentID = detail.parentID ?? ""
        sortOrder = detail.sortOrder
    }
}
