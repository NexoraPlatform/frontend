import SwiftUI

struct TrustoraCreateProjectView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @Environment(\.scenePhase) private var scenePhase

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String

    let strings: (String) -> String
    let onCreated: ((DashboardProjectSummary?) -> Void)?

    @StateObject private var viewModel = TrustoraCreateProjectViewModel()
    @State private var searchDebounceTask: Task<Void, Never>?

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary

    init(
        authSession: AuthSessionStore,
        appLanguageRaw: Binding<String>,
        appCurrencyRaw: Binding<String>,
        strings: @escaping (String) -> String,
        onCreated: ((DashboardProjectSummary?) -> Void)? = nil
    ) {
        self.authSession = authSession
        _appLanguageRaw = appLanguageRaw
        _appCurrencyRaw = appCurrencyRaw
        self.strings = strings
        self.onCreated = onCreated
    }

    private var appLanguage: AppLanguage {
        AppLanguage(rawValue: appLanguageRaw) ?? .system
    }

    private var appCurrency: AppCurrency {
        AppCurrency(rawValue: appCurrencyRaw) ?? .defaultCurrency
    }

    private var resolvedLanguageCode: String {
        if appLanguage == .system {
            let preferred = Locale.preferredLanguages.first ?? "en"
            let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
            return code == "ro" ? "ro" : "en"
        }

        return appLanguage.rawValue
    }

    private var activeStepLabel: String {
        "\(currentStepIndex + 1)/\(viewModel.wizardSteps.count)"
    }

    private var currentStepIndex: Int {
        viewModel.wizardSteps.firstIndex(of: viewModel.step) ?? 0
    }

    private var canGoBack: Bool {
        currentStepIndex > 0 && !viewModel.isCreatingProject
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                ScrollView {
                    VStack(spacing: 12) {
                        if let errorMessage = viewModel.errorMessage, !errorMessage.isEmpty {
                            banner(text: localizedRuntimeMessage(errorMessage), color: Color.red.opacity(0.15), textColor: Color.red)
                        }

                        if let successMessage = viewModel.successMessage, !successMessage.isEmpty {
                            banner(text: localizedRuntimeMessage(successMessage), color: trustoraGreen.opacity(0.15), textColor: trustoraGreen)
                        }

                        stepProgress
                        stepContent
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .padding(.bottom, 140)
                }
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) {
                actionBar
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                    .background(.ultraThinMaterial)
            }
            .navigationBarHidden(true)
        }
        .task {
            await initialLoadServicesIfNeeded()
        }
        .onChange(of: viewModel.serviceSearch) {
            searchDebounceTask?.cancel()
            searchDebounceTask = Task {
                try? await Task.sleep(nanoseconds: 300_000_000)
                guard !Task.isCancelled else { return }
                await initialLoadServicesIfNeeded()
            }
        }
        .onDisappear {
            searchDebounceTask?.cancel()
        }
        .onChange(of: viewModel.step) {
            guard viewModel.step == .connections, authSession.accessToken != nil else { return }
            Task {
                await authSession.reloadProfile()
            }
        }
        .onChange(of: scenePhase) {
            guard scenePhase == .active else { return }
            guard viewModel.step == .connections, authSession.accessToken != nil else { return }
            Task {
                await authSession.reloadProfile()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .trustoraRealtimeAIBriefGenerated)) { notification in
            guard viewModel.step == .briefing, viewModel.mode == .ai else { return }
            guard let token = authSession.accessToken else { return }
            let payload = notification.userInfo?["payload"] ?? notification.userInfo ?? [:]
            Task {
                await viewModel.consumeRealtimeBriefGenerated(
                    payload: payload,
                    token: token,
                    language: resolvedLanguageCode
                )
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .trustoraRealtimeAIBriefFailed)) { notification in
            guard viewModel.step == .briefing, viewModel.mode == .ai else { return }
            let payload = notification.userInfo?["payload"] ?? notification.userInfo ?? [:]
            viewModel.consumeRealtimeBriefFailed(payload: payload)
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .frame(width: 34, height: 34)
                        .background(TrustoraTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 2) {
                    Text(s("project.new.title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(midnightBlue)
                        .lineLimit(1)

                    Text(s("project.new.subtitle"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(1)
                }

                Spacer()

                Text(activeStepLabel)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(TrustoraTheme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(TrustoraTheme.border, lineWidth: 1)
                    )
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
            .padding(.bottom, 8)
            .background(.ultraThinMaterial)
            .overlay(alignment: .bottom) {
                Divider().overlay(TrustoraTheme.border)
            }
        }
    }

    private var stepProgress: some View {
        HStack(spacing: 8) {
            ForEach(Array(viewModel.wizardSteps.enumerated()), id: \.offset) { index, item in
                Capsule()
                    .fill(index <= currentStepIndex ? trustoraGreen : TrustoraTheme.border.opacity(0.8))
                    .frame(height: 6)
            }
        }
        .padding(.horizontal, 4)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch viewModel.step {
        case .intent:
            intentStep
        case .recommendation:
            recommendationStep
        case .briefing:
            briefingStep
        case .providers:
            providersStep
        case .connections:
            connectionsStep
        case .review:
            reviewStep
        }
    }

    private var intentStep: some View {
        VStack(spacing: 12) {
            sectionCard(title: s("project.new.mode.title"), subtitle: s("project.new.mode.subtitle")) {
                HStack(spacing: 8) {
                    modeButton(.ai, icon: "sparkles")
                    modeButton(.manual, icon: "slider.horizontal.3")
                }
            }

            sectionCard(title: s("project.new.intent.title"), subtitle: s("project.new.intent.subtitle")) {
                VStack(spacing: 8) {
                    TextEditor(text: $viewModel.intent)
                        .font(.system(size: 14, weight: .medium))
                        .frame(minHeight: 110)
                        .padding(8)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )

                    Text(s("project.new.intent.helper"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }

            if viewModel.mode == .manual {
                manualIntentSection
            }
        }
    }

    private var manualIntentSection: some View {
        sectionCard(title: s("project.new.manual.details.title"), subtitle: s("project.new.manual.details.subtitle")) {
            VStack(spacing: 10) {
                fieldLabel(s("project.new.fields.project_title"))
                TextField(s("project.new.fields.project_title.placeholder"), text: $viewModel.manualTitle)
                    .textInputAutocapitalization(.words)
                    .autocorrectionDisabled()
                    .trustoraInputStyle()

                fieldLabel(s("project.new.fields.duration"))
                TextField(s("project.new.fields.duration.placeholder"), text: $viewModel.manualDuration)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .trustoraInputStyle()

                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        fieldLabel(s("project.new.fields.payment_plan"))
                        Menu {
                            Button("FULL") { viewModel.manualPaymentPlan = "FULL" }
                            Button("MILESTONE") { viewModel.manualPaymentPlan = "MILESTONE" }
                            Button("MONTHLY") { viewModel.manualPaymentPlan = "MONTHLY" }
                        } label: {
                            pickerChip(text: viewModel.manualPaymentPlan)
                        }
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        fieldLabel(s("project.new.fields.currency"))
                        Menu {
                            ForEach(AppCurrency.allCases) { currency in
                                Button(currency.rawValue) {
                                    viewModel.manualCurrency = currency.rawValue
                                }
                            }
                        } label: {
                            pickerChip(text: viewModel.manualCurrency)
                        }
                    }
                }

                fieldLabel(s("project.new.fields.requirements"))
                TextEditor(text: $viewModel.manualSpecificRequirements)
                    .font(.system(size: 13, weight: .medium))
                    .frame(minHeight: 88)
                    .padding(8)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(TrustoraTheme.border, lineWidth: 1)
                    )

                Divider().overlay(TrustoraTheme.border)
                    .padding(.vertical, 2)

                fieldLabel(s("project.new.services.search"))
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    TextField(s("project.new.services.search.placeholder"), text: $viewModel.serviceSearch)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.system(size: 13, weight: .medium))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(TrustoraTheme.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )

                if viewModel.groupedServices.isEmpty {
                    Text(viewModel.isLoadingServices ? s("project.new.loading.services") : s("project.new.services.empty"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 4)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.groupedServices) { service in
                            let isSelected = viewModel.selectedManualServiceIDs.contains(service.id)

                            Button {
                                viewModel.toggleManualService(service, selected: !isSelected)
                            } label: {
                                HStack(alignment: .top, spacing: 10) {
                                    Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(isSelected ? trustoraGreen : TrustoraTheme.tertiaryText)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(service.name)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(midnightBlue)
                                            .multilineTextAlignment(.leading)

                                        Text("\(service.categoryName) • \(deliveryProviderTitle(service.deliveryProvider))")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundStyle(TrustoraTheme.tertiaryText)

                                        if !service.description.isEmpty {
                                            Text(service.description)
                                                .font(.system(size: 11, weight: .medium))
                                                .foregroundStyle(TrustoraTheme.secondaryText)
                                                .lineLimit(2)
                                        }
                                    }

                                    Spacer(minLength: 0)
                                }
                                .padding(10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(TrustoraTheme.mutedSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(isSelected ? trustoraGreen : TrustoraTheme.border, lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                            .onAppear {
                                guard viewModel.shouldLoadNextServicesPage(after: service.id) else { return }
                                Task {
                                    await loadMoreServices()
                                }
                            }
                        }

                        if viewModel.isLoadingMoreServices {
                            ProgressView()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, 8)
                        }
                    }
                }

                if !viewModel.manualLines.isEmpty {
                    Divider().overlay(TrustoraTheme.border)
                        .padding(.vertical, 4)

                    VStack(spacing: 10) {
                        ForEach(viewModel.manualLines) { line in
                            manualLineCard(line)
                        }
                    }
                }
            }
        }
    }

    private func manualLineCard(_ line: ProjectCreationLineDraft) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(line.serviceName)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(midnightBlue)
                Spacer()
                Text(deliveryProviderTitle(line.deliveryProvider))
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            fieldLabel(s("project.new.fields.line_description"))
            TextField(s("project.new.fields.line_description.placeholder"), text: Binding(
                get: {
                    line.description
                },
                set: { next in
                    viewModel.updateManualLine(line.id, description: next)
                }
            ))
            .trustoraInputStyle()

            fieldLabel(s("project.new.fields.line_budget_percentage"))
            TextField("0", text: Binding(
                get: { line.budgetPercentage },
                set: { next in
                    viewModel.updateManualLine(line.id, budgetPercentage: next)
                }
            ))
            .keyboardType(.decimalPad)
            .trustoraInputStyle()

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    fieldLabel(s("project.new.fields.milestones"))
                    Spacer()
                    Button {
                        viewModel.addManualMilestone(to: line.id)
                    } label: {
                        Label(s("project.new.actions.add_milestone"), systemImage: "plus")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(trustoraGreen)
                    }
                    .buttonStyle(.plain)
                }

                if line.milestones.isEmpty {
                    Text(s("project.new.fields.milestones.empty"))
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                } else {
                    ForEach(line.milestones) { milestone in
                        manualMilestoneCard(lineID: line.id, milestone: milestone)
                    }
                }
            }
        }
        .padding(12)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private func manualMilestoneCard(lineID: String, milestone: ProjectCreationMilestoneDraft) -> some View {
        VStack(spacing: 8) {
            TextField(s("project.new.fields.milestone_title"), text: Binding(
                get: { milestone.title },
                set: { next in
                    viewModel.updateManualMilestone(lineID: lineID, milestoneID: milestone.id, title: next)
                }
            ))
            .trustoraInputStyle()

            TextField(s("project.new.fields.milestone_description"), text: Binding(
                get: { milestone.description },
                set: { next in
                    viewModel.updateManualMilestone(lineID: lineID, milestoneID: milestone.id, description: next)
                }
            ))
            .trustoraInputStyle()

            HStack(spacing: 8) {
                TextField(s("project.new.fields.milestone_amount"), text: Binding(
                    get: { milestone.amount },
                    set: { next in
                        viewModel.updateManualMilestone(lineID: lineID, milestoneID: milestone.id, amount: next)
                    }
                ))
                .keyboardType(.decimalPad)
                .trustoraInputStyle()

                TextField(s("project.new.fields.milestone_percentage"), text: Binding(
                    get: { milestone.percentage },
                    set: { next in
                        viewModel.updateManualMilestone(lineID: lineID, milestoneID: milestone.id, percentage: next)
                    }
                ))
                .keyboardType(.decimalPad)
                .trustoraInputStyle()
            }

            HStack {
                Spacer()
                Button(role: .destructive) {
                    viewModel.removeManualMilestone(lineID: lineID, milestoneID: milestone.id)
                } label: {
                    Text(s("project.new.actions.remove_milestone"))
                        .font(.system(size: 11, weight: .bold))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private var recommendationStep: some View {
        sectionCard(title: s("project.new.recommendation.title"), subtitle: s("project.new.recommendation.subtitle")) {
            if viewModel.recommendations.isEmpty {
                Text(s("project.new.recommendation.empty"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.recommendations) { recommendation in
                        let isSelected = viewModel.selectedRecommendationIDs.contains(recommendation.id)

                        Button {
                            viewModel.toggleRecommendation(recommendation.id)
                        } label: {
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(isSelected ? trustoraGreen : TrustoraTheme.tertiaryText)

                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 6) {
                                        Text(recommendation.serviceName)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(midnightBlue)
                                        if recommendation.isAlternative {
                                            Text(s("project.new.recommendation.alternative"))
                                                .font(.system(size: 9, weight: .black))
                                                .foregroundStyle(Color.orange)
                                        }
                                    }

                                    Text(deliveryProviderTitle(recommendation.deliveryProvider))
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(TrustoraTheme.tertiaryText)

                                    if !recommendation.description.isEmpty {
                                        Text(recommendation.description)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(TrustoraTheme.secondaryText)
                                            .lineLimit(2)
                                    }
                                }

                                Spacer(minLength: 0)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(TrustoraTheme.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(isSelected ? trustoraGreen : TrustoraTheme.border, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var briefingStep: some View {
        sectionCard(title: s("project.new.brief.title"), subtitle: s("project.new.brief.subtitle")) {
            if viewModel.isLoadingBrief {
                HStack(spacing: 10) {
                    ProgressView()
                    Text(s("project.new.loading.brief"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                switch viewModel.aiStatus {
                case .processing:
                    Text(s("project.new.brief.processing"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                case .clarify:
                    VStack(alignment: .leading, spacing: 8) {
                        if viewModel.aiQuestions.isEmpty {
                            Text(s("project.new.brief.clarify.empty"))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                        } else {
                            ForEach(Array(viewModel.aiQuestions.enumerated()), id: \.offset) { index, question in
                                Text("\(index + 1). \(question)")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(midnightBlue)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        TextEditor(text: $viewModel.aiClarificationAnswer)
                            .font(.system(size: 13, weight: .medium))
                            .frame(minHeight: 90)
                            .padding(8)
                            .background(TrustoraTheme.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(TrustoraTheme.border, lineWidth: 1)
                            )

                        Button {
                            Task {
                                await sendClarification()
                            }
                        } label: {
                            Text(s("project.new.actions.send_clarification"))
                                .frame(maxWidth: .infinity)
                        }
                        .trustoraPrimaryButtonStyle()
                        .disabled(viewModel.aiClarificationAnswer.trimmed.isEmpty || viewModel.isLoadingBrief)
                    }
                case .final:
                    briefSummarySection
                }
            }
        }
    }

    private var briefSummarySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let brief = viewModel.brief {
                Text(brief.title)
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(midnightBlue)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if !brief.description.isEmpty {
                    Text(brief.description)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                HStack(spacing: 8) {
                    TextField(s("project.new.fields.total_budget"), text: $viewModel.totalBudget)
                        .keyboardType(.decimalPad)
                        .trustoraInputStyle()

                    TextField(s("project.new.fields.duration"), text: $viewModel.editableDuration)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .trustoraInputStyle()
                }

                Menu {
                    Button("FULL") { viewModel.editablePaymentPlan = "FULL" }
                    Button("MILESTONE") { viewModel.editablePaymentPlan = "MILESTONE" }
                    Button("MONTHLY") { viewModel.editablePaymentPlan = "MONTHLY" }
                } label: {
                    pickerChip(
                        text: viewModel.editablePaymentPlan.trimmed.nilIfEmpty ?? (viewModel.brief?.paymentPlan ?? "MILESTONE")
                    )
                }

                ForEach(viewModel.reviewLines) { line in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(line.serviceName)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(midnightBlue)
                        if !line.milestones.isEmpty {
                            ForEach(line.milestones) { milestone in
                                Text("• \(milestone.title) — \(formatAmount(milestone.amount, currency: appCurrency.rawValue))")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(TrustoraTheme.border, lineWidth: 1)
                    )
                }
            } else {
                Text(s("project.new.brief.empty"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var providersStep: some View {
        sectionCard(title: s("project.new.providers.title"), subtitle: s("project.new.providers.subtitle")) {
            if viewModel.isLoadingProviders {
                HStack(spacing: 10) {
                    ProgressView()
                    Text(s("project.new.loading.providers"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else if viewModel.recommendedProviders.isEmpty {
                Text(s("project.new.providers.empty"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.reviewLines) { line in
                        providerServiceCard(line)
                    }
                }
            }
        }
    }

    private func providerServiceCard(_ line: ProjectCreationBriefLine) -> some View {
        let providers = viewModel.providerOptions(for: line.serviceName)

        return VStack(alignment: .leading, spacing: 8) {
            Text(line.serviceName)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(midnightBlue)

            if providers.isEmpty {
                Text(s("project.new.providers.no_candidates"))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                ForEach(providers) { provider in
                    Button {
                        viewModel.toggleProvider(serviceName: line.serviceName, providerID: provider.id)
                    } label: {
                        HStack(spacing: 10) {
                            AuthAvatarFallback(provider: provider)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(provider.displayName)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(midnightBlue)

                                if let score = provider.matchScore {
                                    Text(sf("project.new.providers.match", ["score": String(format: "%.0f", score)]))
                                        .font(.system(size: 10, weight: .semibold))
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }
                            }

                            Spacer()

                            Image(systemName: viewModel.isProviderSelected(serviceName: line.serviceName, providerID: provider.id) ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(viewModel.isProviderSelected(serviceName: line.serviceName, providerID: provider.id) ? trustoraGreen : TrustoraTheme.tertiaryText)
                        }
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }

            if !line.milestones.isEmpty {
                Divider().overlay(TrustoraTheme.border)
                ForEach(line.milestones) { milestone in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(milestone.title)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(midnightBlue)

                        Menu {
                            ForEach(providers) { provider in
                                if viewModel.isProviderSelected(serviceName: line.serviceName, providerID: provider.id) {
                                    Button(provider.displayName) {
                                        viewModel.assignMilestone(
                                            serviceName: line.serviceName,
                                            lineID: line.id,
                                            milestoneID: milestone.id,
                                            providerID: provider.id
                                        )
                                    }
                                }
                            }

                            if viewModel.selectedProviderIDForMilestone(serviceName: line.serviceName, lineID: line.id, milestoneID: milestone.id) != nil {
                                Divider()
                                Button(s("project.new.providers.clear_assignment")) {
                                    viewModel.removeMilestoneAssignment(
                                        serviceName: line.serviceName,
                                        lineID: line.id,
                                        milestoneID: milestone.id
                                    )
                                }
                            }
                        } label: {
                            let selectedProviderName: String = {
                                guard let selectedID = viewModel.selectedProviderIDForMilestone(serviceName: line.serviceName, lineID: line.id, milestoneID: milestone.id) else {
                                    return s("project.new.providers.assign")
                                }
                                return viewModel.providerByID(serviceName: line.serviceName, providerID: selectedID)?.displayName
                                ?? s("project.new.providers.assign")
                            }()

                            pickerChip(text: selectedProviderName)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(12)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private var reviewStep: some View {
        sectionCard(title: s("project.new.review.title"), subtitle: s("project.new.review.subtitle")) {
            VStack(alignment: .leading, spacing: 8) {
                if let brief = viewModel.brief {
                    infoRow(label: s("project.new.review.project_title"), value: brief.title)
                    infoRow(label: s("project.new.review.budget"), value: formatAmount(viewModel.parsedTotalBudget, currency: appCurrency.rawValue))
                    infoRow(label: s("project.new.review.duration"), value: viewModel.editableDuration.trimmed.nilIfEmpty ?? brief.duration)
                    infoRow(label: s("project.new.review.payment_plan"), value: viewModel.editablePaymentPlan.trimmed.nilIfEmpty ?? brief.paymentPlan)

                    Divider().overlay(TrustoraTheme.border)

                    ForEach(viewModel.reviewLines) { line in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(line.serviceName)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(midnightBlue)

                            ForEach(line.milestones) { milestone in
                                let assignedProviderName: String = {
                                    guard let selectedID = viewModel.selectedProviderIDForMilestone(serviceName: line.serviceName, lineID: line.id, milestoneID: milestone.id) else {
                                        return s("project.new.review.unassigned")
                                    }
                                    return viewModel.providerByID(serviceName: line.serviceName, providerID: selectedID)?.displayName ?? s("project.new.review.unassigned")
                                }()

                                Text("• \(milestone.title) — \(formatAmount(milestone.amount, currency: appCurrency.rawValue)) — \(assignedProviderName)")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )
                    }
                }
            }
        }
    }

    private var connectionsStep: some View {
        sectionCard(title: s("project.new.connections.title"), subtitle: s("project.new.connections.subtitle")) {
            let required = viewModel.requiredOAuthProviders()
            let connected = viewModel.connectedOAuthProviders(user: authSession.user)
            let missing = viewModel.missingOAuthProviders(user: authSession.user)

            if required.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(trustoraGreen)
                    Text(s("project.new.connections.none_required"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(midnightBlue)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(trustoraGreen.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(required) { provider in
                        let isConnected = connected.contains(provider)
                        let services = viewModel.requiredServices(for: provider)

                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 8) {
                                Image(systemName: oauthProviderSymbol(provider))
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(midnightBlue)

                                Text(oauthProviderTitle(provider))
                                    .font(.system(size: 13, weight: .black))
                                    .foregroundStyle(midnightBlue)

                                Spacer()

                                Text(isConnected ? s("project.new.connections.connected") : s("project.new.connections.not_connected"))
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(isConnected ? trustoraGreen : Color.orange)
                            }

                            if !services.isEmpty {
                                Text("\(s("project.new.connections.required_for")): \(services.joined(separator: ", "))")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                            }

                            if isConnected {
                                HStack(spacing: 6) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(trustoraGreen)
                                    Text(s("project.new.connections.connected"))
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundStyle(trustoraGreen)
                                }
                            } else {
                                Button {
                                    connectOAuthProvider(provider)
                                } label: {
                                    Text(s("project.new.connections.connect"))
                                        .frame(maxWidth: .infinity)
                                }
                                .trustoraPrimaryButtonStyle()
                            }
                        }
                        .padding(10)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(isConnected ? trustoraGreen.opacity(0.45) : TrustoraTheme.border, lineWidth: 1)
                        )
                    }
                }

                if !missing.isEmpty {
                    Text(s("project.new.connections.missing_required"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color.orange)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.orange.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private var actionBar: some View {
        HStack(spacing: 10) {
            if canGoBack {
                Button {
                    viewModel.goToPreviousStep()
                } label: {
                    Text(s("project.new.actions.back"))
                        .frame(maxWidth: .infinity)
                }
                .trustoraSecondaryButtonStyle()
            }

            Button {
                Task {
                    await handlePrimaryAction()
                }
            } label: {
                if viewModel.isCreatingProject || viewModel.isLoadingRecommendation || viewModel.isLoadingBrief || viewModel.isLoadingProviders {
                    HStack(spacing: 8) {
                        ProgressView()
                        Text(primaryButtonTitle)
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    Text(primaryButtonTitle)
                        .frame(maxWidth: .infinity)
                }
            }
            .trustoraPrimaryButtonStyle()
            .disabled(isPrimaryActionDisabled)
        }
        .padding(.top, 10)
    }

    private var primaryButtonTitle: String {
        switch viewModel.step {
        case .intent:
            return viewModel.mode == .manual ? s("project.new.actions.continue_providers") : s("project.new.actions.generate_recommendation")
        case .recommendation:
            return s("project.new.actions.generate_brief")
        case .briefing:
            if viewModel.aiStatus == .final {
                return s("project.new.actions.continue_providers")
            }
            if viewModel.aiStatus == .clarify {
                return s("project.new.actions.send_clarification")
            }
            return s("project.new.actions.waiting")
        case .providers:
            return s("project.new.actions.continue_connections")
        case .connections:
            return s("project.new.actions.continue_review")
        case .review:
            return s("project.new.actions.create_project")
        }
    }

    private var isPrimaryActionDisabled: Bool {
        guard authSession.accessToken != nil, authSession.user != nil else { return true }

        if viewModel.isCreatingProject || viewModel.isLoadingRecommendation || viewModel.isLoadingBrief || viewModel.isLoadingProviders {
            return true
        }

        switch viewModel.step {
        case .intent:
            if viewModel.mode == .manual {
                return viewModel.intent.trimmed.isEmpty
            }
            return viewModel.intent.trimmed.isEmpty
        case .recommendation:
            return viewModel.selectedRecommendationIDs.isEmpty
        case .briefing:
            if viewModel.aiStatus == .final {
                return viewModel.brief == nil
            }
            if viewModel.aiStatus == .clarify {
                return viewModel.aiClarificationAnswer.trimmed.isEmpty
            }
            return true
        case .providers:
            return viewModel.brief == nil
        case .connections:
            return !viewModel.canContinueFromConnections(user: authSession.user)
        case .review:
            return viewModel.brief == nil || viewModel.parsedTotalBudget <= 0
        }
    }

    private func handlePrimaryAction() async {
        guard let token = authSession.accessToken else { return }

        switch viewModel.step {
        case .intent:
            if viewModel.mode == .manual {
                await viewModel.continueManualFlowToProviders(token: token, language: resolvedLanguageCode)
            } else {
                await viewModel.requestRecommendations(token: token, language: resolvedLanguageCode)
            }
        case .recommendation:
            await viewModel.confirmRecommendationAndStartBrief(token: token, language: resolvedLanguageCode)
        case .briefing:
            if viewModel.aiStatus == .final {
                await viewModel.continueFromBriefToProviders(token: token, language: resolvedLanguageCode)
            } else if viewModel.aiStatus == .clarify {
                await viewModel.sendClarification(token: token, language: resolvedLanguageCode)
            }
        case .providers:
            viewModel.transition(to: .connections)
        case .connections:
            viewModel.continueToReview()
        case .review:
            guard let user = authSession.user else { return }
            let success = await viewModel.createProject(
                token: token,
                user: user,
                language: resolvedLanguageCode,
                currency: appCurrency
            )
            if success {
                onCreated?(viewModel.createdProject)
                dismiss()
            }
        }
    }

    private func sendClarification() async {
        guard let token = authSession.accessToken else { return }
        await viewModel.sendClarification(token: token, language: resolvedLanguageCode)
    }

    private func initialLoadServicesIfNeeded() async {
        guard let token = authSession.accessToken else { return }
        await viewModel.loadGroupedServices(
            reset: true,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreServices() async {
        guard let token = authSession.accessToken else { return }
        await viewModel.loadGroupedServices(
            reset: false,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func deliveryProviderTitle(_ provider: String) -> String {
        switch provider.lowercased() {
        case "github":
            return "GitHub"
        case "figma":
            return "Figma"
        case "google_drive":
            return "Google Drive"
        case "google_analytics":
            return "Google Analytics"
        default:
            return s("project.new.provider.manual_upload")
        }
    }

    private func oauthProviderTitle(_ provider: ProjectCreationOAuthProvider) -> String {
        switch provider {
        case .github:
            return "GitHub"
        case .figma:
            return "Figma"
        case .google:
            return "Google"
        }
    }

    private func oauthProviderSymbol(_ provider: ProjectCreationOAuthProvider) -> String {
        switch provider {
        case .github:
            return "chevron.left.forwardslash.chevron.right"
        case .figma:
            return "square.2.layers.3d"
        case .google:
            return "globe"
        }
    }

    private func connectOAuthProvider(_ provider: ProjectCreationOAuthProvider) {
        guard let url = TrustoraAPIClient.shared.oauthRedirectURL(for: provider) else {
            viewModel.errorMessage = "project.new.error.oauth_url_missing"
            return
        }

        NotificationCenter.default.post(
            name: .trustoraProjectOAuthConnectRequested,
            object: nil,
            userInfo: ["provider": provider.rawValue]
        )
        openURL(url)
    }

    private func s(_ key: String) -> String {
        strings(key)
    }

    private func sf(_ key: String, _ placeholders: [String: String]) -> String {
        var text = s(key)
        for (name, value) in placeholders {
            text = text.replacingOccurrences(of: "{\(name)}", with: value)
        }
        return text
    }

    private func localizedRuntimeMessage(_ text: String) -> String {
        if text.hasPrefix("project.new.") {
            return s(text)
        }
        return text
    }

    private func formatAmount(_ value: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "\(value) \(currency)"
    }

    private func modeButton(_ mode: ProjectCreationMode, icon: String) -> some View {
        let isActive = viewModel.mode == mode
        return Button {
            viewModel.applyMode(mode)
        } label: {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .bold))
                Text(mode == .ai ? s("project.new.mode.ai") : s("project.new.mode.manual"))
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(isActive ? Color(hex: 0x04120C) : TrustoraTheme.secondaryText)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(isActive ? trustoraGreen.opacity(0.92) : TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isActive ? trustoraGreen : TrustoraTheme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func sectionCard<Content: View>(
        title: String,
        subtitle: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(midnightBlue)
                Text(subtitle)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private func fieldLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(TrustoraTheme.secondaryText)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func pickerChip(text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(midnightBlue)
                .lineLimit(1)

            Spacer(minLength: 8)

            Image(systemName: "chevron.down")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private func banner(text: String, color: Color, textColor: Color) -> some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(textColor)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(midnightBlue)
        }
    }
}

private struct AuthAvatarFallback: View {
    let provider: ProjectCreationProviderCandidate

    var body: some View {
        Group {
            if let avatarURL = provider.avatarURL,
               let url = URL(string: avatarURL),
               !avatarURL.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallback
                    }
                }
            } else {
                fallback
            }
        }
        .frame(width: 30, height: 30)
        .clipShape(Circle())
        .overlay(
            Circle().stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private var fallback: some View {
        ZStack {
            Circle().fill(TrustoraTheme.mutedSurface)
            Text(initials)
                .font(.system(size: 11, weight: .black))
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
    }

    private var initials: String {
        let first = provider.firstName.first.map(String.init) ?? ""
        let last = provider.lastName.first.map(String.init) ?? ""
        let value = (first + last).uppercased()
        return value.isEmpty ? "P" : value
    }
}

private extension View {
    func trustoraInputStyle() -> some View {
        self
            .font(.system(size: 13, weight: .medium))
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(TrustoraTheme.border, lineWidth: 1)
            )
    }

    func trustoraPrimaryButtonStyle() -> some View {
        self
            .font(.system(size: 13, weight: .black))
            .foregroundStyle(Color(hex: 0x04120C))
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(TrustoraTheme.accent)
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    func trustoraSecondaryButtonStyle() -> some View {
        self
            .font(.system(size: 13, weight: .black))
            .foregroundStyle(TrustoraTheme.secondaryText)
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(TrustoraTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(TrustoraTheme.border, lineWidth: 1)
            )
    }
}
