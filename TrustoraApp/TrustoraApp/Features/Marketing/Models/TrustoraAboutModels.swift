import SwiftUI

struct AboutStat: Identifiable {
    let id: String
    let number: String
    let label: String
}

struct AboutValue: Identifiable {
    let id: String
    let iconName: String
    let title: String
    let description: String
}

struct AboutMissionPoint: Identifiable {
    let id: String
    let title: String
    let description: String
}

struct AboutTimelineEntry: Identifiable {
    let id: String
    let year: String
    let title: String
    let description: String
}

struct AboutTeamMember: Identifiable {
    let id: String
    let name: String
    let role: String
    let description: String
    let avatarURL: String
}
