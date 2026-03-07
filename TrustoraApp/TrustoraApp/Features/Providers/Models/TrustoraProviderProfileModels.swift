import Foundation

enum ProviderProfileTab: String, CaseIterable, Identifiable {
    case basic
    case availability
    case languages
    case experience
    case education
    case portfolio

    var id: String { rawValue }
}

enum ProviderProfileWeekDay: String, CaseIterable, Identifiable {
    case monday
    case tuesday
    case wednesday
    case thursday
    case friday
    case saturday
    case sunday

    var id: String { rawValue }
}

struct ProviderProfileWorkingHour: Equatable {
    var start: String
    var end: String
    var enabled: Bool

    static func defaults(for day: ProviderProfileWeekDay) -> ProviderProfileWorkingHour {
        switch day {
        case .monday, .tuesday, .wednesday, .thursday, .friday:
            return ProviderProfileWorkingHour(start: "09:00", end: "18:00", enabled: true)
        case .saturday, .sunday:
            return ProviderProfileWorkingHour(start: "10:00", end: "14:00", enabled: false)
        }
    }
}

struct ProviderProfileAvailability: Equatable {
    var status: String
    var hoursPerWeek: String
    var timezone: String
    var responseTime: String
    var workingHours: [ProviderProfileWeekDay: ProviderProfileWorkingHour]

    static var empty: ProviderProfileAvailability {
        var hours: [ProviderProfileWeekDay: ProviderProfileWorkingHour] = [:]
        for day in ProviderProfileWeekDay.allCases {
            hours[day] = .defaults(for: day)
        }

        return ProviderProfileAvailability(
            status: "AVAILABLE",
            hoursPerWeek: "40",
            timezone: "Europe/Bucharest",
            responseTime: "2",
            workingHours: hours
        )
    }
}

struct ProviderProfileLanguageOption: Identifiable, Equatable {
    let id: String
    let name: String
    let code: String
    let locale: String?
    let flag: String
    let timezone: String?
}

struct ProviderProfileLanguageEntry: Identifiable, Equatable {
    let id: UUID
    var name: String
    var level: String
    var flag: String

    init(id: UUID = UUID(), name: String, level: String, flag: String) {
        self.id = id
        self.name = name
        self.level = level
        self.flag = flag
    }
}

struct ProviderProfileCertification: Identifiable, Equatable {
    let id: UUID
    var name: String
    var issuer: String
    var date: String
    var credentialID: String
    var verified: Bool

    init(
        id: UUID = UUID(),
        name: String,
        issuer: String,
        date: String,
        credentialID: String,
        verified: Bool
    ) {
        self.id = id
        self.name = name
        self.issuer = issuer
        self.date = date
        self.credentialID = credentialID
        self.verified = verified
    }
}

struct ProviderProfileEducation: Identifiable, Equatable {
    let id: UUID
    var degree: String
    var institution: String
    var attendedFrom: String
    var attendedTo: String
    var studyArea: String

    init(
        id: UUID = UUID(),
        degree: String,
        institution: String,
        attendedFrom: String,
        attendedTo: String,
        studyArea: String
    ) {
        self.id = id
        self.degree = degree
        self.institution = institution
        self.attendedFrom = attendedFrom
        self.attendedTo = attendedTo
        self.studyArea = studyArea
    }
}

struct ProviderProfileWorkHistory: Identifiable, Equatable {
    let id: UUID
    var title: String
    var position: String
    var company: String
    var city: String
    var country: String
    var startDate: String
    var endDate: String
    var description: String
    var currentWorking: Bool

    init(
        id: UUID = UUID(),
        title: String,
        position: String,
        company: String,
        city: String,
        country: String,
        startDate: String,
        endDate: String,
        description: String,
        currentWorking: Bool
    ) {
        self.id = id
        self.title = title
        self.position = position
        self.company = company
        self.city = city
        self.country = country
        self.startDate = startDate
        self.endDate = endDate
        self.description = description
        self.currentWorking = currentWorking
    }
}

struct ProviderProfilePortfolio: Identifiable, Equatable {
    let id: UUID
    var title: String
    var description: String
    var image: String
    var role: String
    var technologies: [String]
    var url: String

    init(
        id: UUID = UUID(),
        title: String,
        description: String,
        image: String,
        role: String,
        technologies: [String],
        url: String
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.image = image
        self.role = role
        self.technologies = technologies
        self.url = url
    }
}

struct ProviderProfileTrustMetrics: Equatable {
    var rating: String
    var reviewCount: String
    var jobSuccessScore: String
    var totalProjectsCompleted: String
    var responseRate: String
    var averageResponseTimeMinutes: String
    var kycStatus: String
    var testVerified: Bool
    var callVerified: Bool
    var totalEarned: String?
    var badges: [String]

    static let empty = ProviderProfileTrustMetrics(
        rating: "-",
        reviewCount: "0",
        jobSuccessScore: "-",
        totalProjectsCompleted: "0",
        responseRate: "-",
        averageResponseTimeMinutes: "-",
        kycStatus: "-",
        testVerified: false,
        callVerified: false,
        totalEarned: nil,
        badges: []
    )
}

struct ProviderProfileData: Equatable {
    var firstName: String
    var lastName: String
    var email: String
    var phone: String
    var bio: String
    var company: String
    var website: String
    var location: String
    var avatar: String
    var companyName: String
    var taxID: String
    var tradeRegistryNumber: String
    var billingAddress: String
    var billingCity: String
    var billingState: String
    var billingPostalCode: String
    var availability: ProviderProfileAvailability
    var languages: [ProviderProfileLanguageEntry]
    var certifications: [ProviderProfileCertification]
    var education: [ProviderProfileEducation]
    var workHistory: [ProviderProfileWorkHistory]
    var portfolio: [ProviderProfilePortfolio]
    var trustMetrics: ProviderProfileTrustMetrics

    static let empty = ProviderProfileData(
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        company: "",
        website: "",
        location: "",
        avatar: "",
        companyName: "",
        taxID: "",
        tradeRegistryNumber: "",
        billingAddress: "",
        billingCity: "",
        billingState: "",
        billingPostalCode: "",
        availability: .empty,
        languages: [],
        certifications: [],
        education: [],
        workHistory: [],
        portfolio: [],
        trustMetrics: .empty
    )
}

enum ProviderProfileValidationField: String, Hashable {
    case firstName
    case lastName
    case email
    case phone
    case bio
    case availabilityStatus
    case hoursPerWeek
}

struct ProviderProfileUpdatePayload {
    let profile: ProviderProfileData

    func requestBody() throws -> Data {
        var availabilityPayload: [String: Any] = [
            "status": normalizedStatus(profile.availability.status),
            "hoursPerWeek": Int(trimmed(profile.availability.hoursPerWeek)) ?? "",
            "timezone": trimmedOrFallback(profile.availability.timezone, fallback: "Europe/Bucharest"),
            "responseTime": normalizedDigits(profile.availability.responseTime, fallback: "2"),
            "workingHours": [:] as [String: [String: Any]],
        ]

        var workingHoursPayload: [String: [String: Any]] = [:]
        for day in ProviderProfileWeekDay.allCases {
            let current = profile.availability.workingHours[day] ?? .defaults(for: day)
            workingHoursPayload[day.rawValue] = [
                "start": normalizedTime(current.start, fallback: ProviderProfileWorkingHour.defaults(for: day).start),
                "end": normalizedTime(current.end, fallback: ProviderProfileWorkingHour.defaults(for: day).end),
                "enabled": current.enabled,
            ]
        }
        availabilityPayload["workingHours"] = workingHoursPayload

        let payload: [String: Any] = [
            "firstName": trimmed(profile.firstName),
            "lastName": trimmed(profile.lastName),
            "email": trimmed(profile.email),
            "phone": trimmed(profile.phone),
            "bio": trimmed(profile.bio),
            "company": trimmed(profile.company),
            "website": trimmed(profile.website),
            "location": trimmed(profile.location),
            "avatar": trimmed(profile.avatar),
            "availability": availabilityPayload,
            "languages": profile.languages.map { language in
                [
                    "name": trimmed(language.name),
                    "level": trimmedOrFallback(language.level, fallback: "Basic"),
                    "flag": trimmed(language.flag),
                ]
            },
            "skills": [],
            "certifications": profile.certifications.map { certification in
                [
                    "name": trimmed(certification.name),
                    "issuer": trimmed(certification.issuer),
                    "date": trimmed(certification.date),
                    "credentialId": trimmed(certification.credentialID),
                    "verified": certification.verified,
                ]
            },
            "education": profile.education.map { education in
                [
                    "degree": trimmed(education.degree),
                    "institution": trimmed(education.institution),
                    "attended_from": trimmed(education.attendedFrom),
                    "attended_to": trimmed(education.attendedTo),
                    "study_area": trimmed(education.studyArea),
                ]
            },
            "workHistory": profile.workHistory.map { work in
                [
                    "title": trimmed(work.title),
                    "position": trimmed(work.position),
                    "company": trimmed(work.company),
                    "city": trimmed(work.city),
                    "country": trimmed(work.country),
                    "start_date": trimmed(work.startDate),
                    "end_date": trimmed(work.endDate),
                    "description": trimmed(work.description),
                    "current_working": work.currentWorking,
                ]
            },
            "portfolio": profile.portfolio.map { item in
                [
                    "title": trimmed(item.title),
                    "description": trimmed(item.description),
                    "image": trimmed(item.image),
                    "role": trimmed(item.role),
                    "technologies": item.technologies.map { trimmed($0) }.filter { !$0.isEmpty },
                    "url": trimmed(item.url),
                ]
            },
            "company_name": trimmed(profile.companyName),
            "tax_id": trimmed(profile.taxID),
            "trade_registry_number": trimmed(profile.tradeRegistryNumber),
            "billing_address": trimmed(profile.billingAddress),
            "billing_city": trimmed(profile.billingCity),
            "billing_state": trimmed(profile.billingState),
            "billing_postal_code": trimmed(profile.billingPostalCode),
        ]

        return try JSONSerialization.data(withJSONObject: payload, options: [])
    }

    private func normalizedStatus(_ status: String) -> String {
        let uppercased = trimmed(status).uppercased()
        if ["AVAILABLE", "BUSY", "UNAVAILABLE"].contains(uppercased) {
            return uppercased
        }
        return "AVAILABLE"
    }

    private func normalizedDigits(_ value: String, fallback: String) -> String {
        let digits = value.filter(\.isNumber)
        return digits.isEmpty ? fallback : digits
    }

    private func normalizedTime(_ value: String, fallback: String) -> String {
        let trimmed = trimmed(value)
        guard !trimmed.isEmpty else {
            return fallback
        }

        if trimmed.count >= 5 {
            return String(trimmed.prefix(5))
        }

        return fallback
    }

    private func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func trimmedOrFallback(_ value: String, fallback: String) -> String {
        let value = trimmed(value)
        return value.isEmpty ? fallback : value
    }
}
