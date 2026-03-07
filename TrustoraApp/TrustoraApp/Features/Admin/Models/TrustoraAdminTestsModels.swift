import Foundation

enum AdminTestsLevelFilter: String, CaseIterable, Identifiable {
    case all
    case junior
    case mediu
    case senior
    case expert

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.tests.levels.all"
        case .junior:
            return "admin.tests.levels.JUNIOR"
        case .mediu:
            return "admin.tests.levels.MEDIU"
        case .senior:
            return "admin.tests.levels.SENIOR"
        case .expert:
            return "admin.tests.levels.EXPERT"
        }
    }

    var levelValue: String? {
        switch self {
        case .all:
            return nil
        case .junior:
            return "JUNIOR"
        case .mediu:
            return "MEDIU"
        case .senior:
            return "SENIOR"
        case .expert:
            return "EXPERT"
        }
    }
}

enum AdminTestsStatusFilter: String, CaseIterable, Identifiable {
    case all
    case active
    case inactive
    case draft

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.tests.statuses.all"
        case .active:
            return "admin.tests.statuses.ACTIVE"
        case .inactive:
            return "admin.tests.statuses.INACTIVE"
        case .draft:
            return "admin.tests.statuses.DRAFT"
        }
    }

    var statusValue: String? {
        switch self {
        case .all:
            return nil
        case .active:
            return "ACTIVE"
        case .inactive:
            return "INACTIVE"
        case .draft:
            return "DRAFT"
        }
    }
}

enum AdminTestEditorMode: Equatable {
    case create
    case edit(testID: String)

    var isEdit: Bool {
        if case .edit = self {
            return true
        }
        return false
    }
}

struct AdminTestEditorQuestionDraft: Identifiable, Equatable {
    let id: String
    var type: String
    var question: String
    var points: Int
    var options: [String]
    var correctAnswers: [String]
    var explanation: String
    var codeTemplate: String
    var codeSolution: String
    var expectedOutput: String
    var testCases: [AdminTestQuestionTestCase]

    nonisolated init(
        id: String = UUID().uuidString,
        type: String = "SINGLE_CHOICE",
        question: String = "",
        points: Int = 10,
        options: [String] = ["", "", "", ""],
        correctAnswers: [String] = [],
        explanation: String = "",
        codeTemplate: String = "",
        codeSolution: String = "",
        expectedOutput: String = "",
        testCases: [AdminTestQuestionTestCase] = []
    ) {
        self.id = id
        self.type = type
        self.question = question
        self.points = points
        self.options = options
        self.correctAnswers = correctAnswers
        self.explanation = explanation
        self.codeTemplate = codeTemplate
        self.codeSolution = codeSolution
        self.expectedOutput = expectedOutput
        self.testCases = testCases
    }

    var normalizedType: String {
        AdminTestQuestion.normalizedQuestionType(type)
    }

    var isChoiceType: Bool {
        normalizedType == "SINGLE_CHOICE" || normalizedType == "MULTIPLE_CHOICE"
    }

    var isCodeType: Bool {
        normalizedType == "CODE_WRITING"
    }

    var isTextInputType: Bool {
        normalizedType == "TEXT_INPUT"
    }

    func asPayloadQuestion() -> AdminTestQuestionPayload {
        AdminTestQuestionPayload(
            id: id,
            type: normalizedType,
            question: question,
            points: points,
            options: options,
            correctAnswers: correctAnswers,
            explanation: explanation,
            codeTemplate: codeTemplate,
            codeSolution: codeSolution,
            expectedOutput: expectedOutput,
            testCases: testCases
        )
    }

    nonisolated static func from(_ question: AdminTestQuestion) -> AdminTestEditorQuestionDraft {
        var options = question.options
        if options.isEmpty {
            options = ["", "", "", ""]
        }

        return AdminTestEditorQuestionDraft(
            id: question.id,
            type: question.type,
            question: question.question,
            points: question.points,
            options: options,
            correctAnswers: question.correctAnswers,
            explanation: question.explanation,
            codeTemplate: question.codeTemplate,
            codeSolution: question.codeSolution,
            expectedOutput: question.expectedOutput,
            testCases: question.testCases
        )
    }
}

struct AdminTestEditorDraft: Equatable {
    var title: String = ""
    var description: String = ""
    var serviceID: String = ""
    var level: String = "JUNIOR"
    var timeLimit: Int = 60
    var passingScore: Int = 70
    var status: String = "DRAFT"
    var questions: [AdminTestEditorQuestionDraft] = []

    var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !serviceID.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !questions.isEmpty
    }

    mutating func apply(_ detail: AdminTestDetail) {
        title = detail.title
        description = detail.description
        serviceID = detail.serviceID
        level = detail.level
        timeLimit = detail.timeLimit
        passingScore = detail.passingScore
        status = detail.status
        questions = detail.questions.map(AdminTestEditorQuestionDraft.from)
    }

    func createPayload() -> AdminCreateTestPayload {
        AdminCreateTestPayload(
            title: title,
            description: description,
            serviceID: serviceID,
            level: level,
            timeLimit: timeLimit,
            passingScore: passingScore,
            status: status,
            questions: questions.map { $0.asPayloadQuestion() }
        )
    }

    func updatePayload() -> AdminUpdateTestPayload {
        AdminUpdateTestPayload(
            title: title,
            description: description,
            serviceID: serviceID,
            level: level,
            timeLimit: timeLimit,
            passingScore: passingScore,
            status: status,
            questions: questions.map { $0.asPayloadQuestion() }
        )
    }
}
