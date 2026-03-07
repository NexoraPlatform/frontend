import SwiftUI


struct TrustoraAuthFlowView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    let strings: (String) -> String

    @State private var mode: TrustoraAuthMode

    @State private var signInEmail = ""
    @State private var signInPassword = ""
    @State private var showSignInPassword = false
    @State private var signInError = ""

    @State private var signUpFirstName = ""
    @State private var signUpLastName = ""
    @State private var signUpEmail = ""
    @State private var signUpPhone = ""
    @State private var signUpRole = "CLIENT"
    @State private var signUpCompany = ""
    @State private var signUpCompanyName = ""
    @State private var signUpTaxID = ""
    @State private var signUpTradeRegistry = ""
    @State private var signUpBillingAddress = ""
    @State private var signUpBillingCity = ""
    @State private var signUpBillingState = ""
    @State private var signUpBillingPostalCode = ""
    @State private var signUpPassword = ""
    @State private var signUpConfirmPassword = ""
    @State private var showSignUpPassword = false
    @State private var showSignUpConfirmPassword = false
    @State private var signUpAgreeTerms = false
    @State private var signUpError = ""

    init(
        initialMode: TrustoraAuthMode,
        authSession: AuthSessionStore,
        strings: @escaping (String) -> String
    ) {
        self.authSession = authSession
        self.strings = strings
        _mode = State(initialValue: initialMode)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TrustoraMetrics.sectionSpacing) {
                    authModeSwitcher

                    if mode == .signIn {
                        signInSection
                    } else {
                        signUpSection
                    }
                }
                .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 20)
                .padding(.bottom, TrustoraMetrics.pageBottomPadding)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(
                LinearGradient(
                    colors: [TrustoraTheme.background, Color(hex: 0xEAFBF3)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            )
            .navigationTitle(mode == .signIn ? s("auth.signin.card_title") : s("auth.signup.card_title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    BrandLockup(
                        compact: true,
                        tagline: s("common.trustora_tagline"),
                        showsLogoIcon: false
                    )
                        .scaleEffect(0.75, anchor: .leading)
                        .frame(maxWidth: 170, alignment: .leading)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(TrustoraTheme.primaryText)
                            .frame(width: 30, height: 30)
                            .background(TrustoraTheme.surface.opacity(0.88), in: Circle())
                    }
                }
            }
        }
    }

    private var authModeSwitcher: some View {
        HStack(spacing: 8) {
            modeButton(mode: .signIn, title: s("auth.signin.submit"))
            modeButton(mode: .signUp, title: s("auth.signup.submit"))
        }
        .padding(4)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(
            Capsule()
                .stroke(TrustoraTheme.border.opacity(0.8), lineWidth: 1)
        )
    }

    private func modeButton(mode candidate: TrustoraAuthMode, title: String) -> some View {
        let isActive = mode == candidate

        return Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) {
                mode = candidate
                signInError = ""
                signUpError = ""
            }
        } label: {
            Text(title)
                .font(TrustoraTypography.label)
                .foregroundStyle(isActive ? TrustoraTheme.accentButtonText : TrustoraTheme.secondaryText)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(
                    Capsule()
                        .fill(isActive ? Color(hex: 0x1BC47D).opacity(0.9) : Color.clear)
                )
        }
        .buttonStyle(.plain)
    }

    private var signInSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            AuthHeroHeader(
                badge: s("auth.signin.badge"),
                titlePrefix: s("auth.signin.title_prefix"),
                titleBrand: s("auth.signin.title_brand"),
                subtitle: s("auth.signin.subtitle")
            )

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                AuthBenefitPill(text: s("auth.signin.benefits.verified_contracts"))
                AuthBenefitPill(text: s("auth.signin.benefits.automated_escrow"))
                AuthBenefitPill(text: s("auth.signin.benefits.project_timeline"))
                AuthBenefitPill(text: s("auth.signin.benefits.support"))
            }

            VStack(alignment: .leading, spacing: 12) {
                authCardHeader(
                    title: s("auth.signin.card_title"),
                    description: s("auth.signin.card_description")
                )

                if !signInError.isEmpty {
                    AuthErrorBanner(text: signInError)
                }

                AuthIconField(
                    title: s("auth.signin.email_label"),
                    text: $signInEmail,
                    placeholder: s("auth.signin.email_placeholder"),
                    icon: "envelope.fill",
                    keyboardType: .emailAddress
                )

                AuthSecureIconField(
                    title: s("auth.signin.password_label"),
                    text: $signInPassword,
                    placeholder: s("auth.signin.password_placeholder"),
                    icon: "lock.fill",
                    isVisible: $showSignInPassword
                )

                Text(s("auth.signin.forgot_password"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x0C8F5D))

                Button {
                    submitSignIn()
                } label: {
                    HStack(spacing: 8) {
                        if authSession.isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 13, weight: .black))
                        }

                        Text(authSession.isLoading ? s("auth.signin.loading") : s("auth.signin.submit"))
                            .font(.system(size: 15, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(Color(hex: 0x1BC47D))
                    .foregroundStyle(Color(hex: 0x071A12))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(authSession.isLoading)

                HStack(spacing: 4) {
                    Text(s("auth.signin.no_account"))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) {
                            mode = .signUp
                            signInError = ""
                        }
                    } label: {
                        Text(s("auth.signin.register"))
                            .foregroundStyle(Color(hex: 0x0C8F5D))
                    }
                    .buttonStyle(.plain)
                }
                .font(.system(size: 13, weight: .semibold))
                .frame(maxWidth: .infinity)
            }
            .padding(16)
            .background(TrustoraTheme.surface.opacity(0.92))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(TrustoraTheme.border, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.08), radius: 16, x: 0, y: 8)
        }
    }

    private var signUpSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            AuthHeroHeader(
                badge: s("auth.signup.badge"),
                titlePrefix: s("auth.signup.title_prefix"),
                titleBrand: s("auth.signup.title_brand"),
                subtitle: s("auth.signup.subtitle")
            )

            VStack(spacing: 8) {
                AuthBenefitPill(text: s("auth.signup.benefits.digital_contracts"))
                AuthBenefitPill(text: s("auth.signup.benefits.fast_verifications"))
                AuthBenefitPill(text: s("auth.signup.benefits.unified_dashboard"))
            }

            VStack(alignment: .leading, spacing: 12) {
                authCardHeader(
                    title: s("auth.signup.card_title"),
                    description: s("auth.signup.card_description")
                )

                if !signUpError.isEmpty {
                    AuthErrorBanner(text: signUpError)
                }

                HStack(spacing: 8) {
                    AuthIconField(
                        title: s("auth.signup.first_name_label"),
                        text: $signUpFirstName,
                        placeholder: s("auth.signup.first_name_placeholder"),
                        icon: "person.fill"
                    )

                    AuthIconField(
                        title: s("auth.signup.last_name_label"),
                        text: $signUpLastName,
                        placeholder: s("auth.signup.last_name_placeholder"),
                        icon: "person.fill"
                    )
                }

                AuthIconField(
                    title: s("auth.signup.email_label"),
                    text: $signUpEmail,
                    placeholder: s("auth.signup.email_placeholder"),
                    icon: "envelope.fill",
                    keyboardType: .emailAddress
                )

                HStack(spacing: 8) {
                    AuthIconField(
                        title: s("auth.signup.phone_label"),
                        text: $signUpPhone,
                        placeholder: s("auth.signup.phone_placeholder"),
                        icon: "phone.fill",
                        keyboardType: .phonePad
                    )

                    VStack(alignment: .leading, spacing: 6) {
                        Text(s("auth.signup.role_label"))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x334155))

                        Picker(s("auth.signup.role_label"), selection: $signUpRole) {
                            Text(s("auth.signup.role_client")).tag("CLIENT")
                            Text(s("auth.signup.role_provider")).tag("PROVIDER")
                        }
                        .pickerStyle(.menu)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 11)
                        .background(TrustoraTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: 0xCBD5E1), lineWidth: 1)
                        )
                    }
                }

                AuthIconField(
                    title: s("auth.signup.company_label"),
                    text: $signUpCompany,
                    placeholder: s("auth.signup.company_placeholder"),
                    icon: "building.2.fill"
                )

                VStack(alignment: .leading, spacing: 8) {
                    Text(s("common.billing.section_title"))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(hex: 0x0F172A))

                    Text(s("common.billing.section_description"))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: 0x64748B))

                    AuthIconField(
                        title: s("common.billing.company_name_label"),
                        text: $signUpCompanyName,
                        placeholder: s("common.billing.company_name_placeholder"),
                        icon: "building.columns.fill"
                    )

                    HStack(spacing: 8) {
                        AuthIconField(
                            title: s("common.billing.tax_id_label"),
                            text: $signUpTaxID,
                            placeholder: s("common.billing.tax_id_placeholder"),
                            icon: "doc.text.fill"
                        )

                        AuthIconField(
                            title: s("common.billing.trade_registry_number_label"),
                            text: $signUpTradeRegistry,
                            placeholder: s("common.billing.trade_registry_number_placeholder"),
                            icon: "number.square.fill"
                        )
                    }

                    AuthIconField(
                        title: s("common.billing.billing_address_label"),
                        text: $signUpBillingAddress,
                        placeholder: s("common.billing.billing_address_placeholder"),
                        icon: "mappin.and.ellipse"
                    )

                    HStack(spacing: 8) {
                        AuthIconField(
                            title: s("common.billing.billing_city_label"),
                            text: $signUpBillingCity,
                            placeholder: s("common.billing.billing_city_placeholder"),
                            icon: "building.fill"
                        )

                        AuthIconField(
                            title: s("common.billing.billing_state_label"),
                            text: $signUpBillingState,
                            placeholder: s("common.billing.billing_state_placeholder"),
                            icon: "globe.europe.africa.fill"
                        )
                    }

                    AuthIconField(
                        title: s("common.billing.billing_postal_code_label"),
                        text: $signUpBillingPostalCode,
                        placeholder: s("common.billing.billing_postal_code_placeholder"),
                        icon: "envelope.badge.fill"
                    )
                }
                .padding(12)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )

                HStack(spacing: 8) {
                    AuthSecureIconField(
                        title: s("auth.signup.password_label"),
                        text: $signUpPassword,
                        placeholder: s("auth.signup.password_placeholder"),
                        icon: "lock.fill",
                        isVisible: $showSignUpPassword
                    )

                    AuthSecureIconField(
                        title: s("auth.signup.confirm_password_label"),
                        text: $signUpConfirmPassword,
                        placeholder: s("auth.signup.confirm_password_placeholder"),
                        icon: "lock.fill",
                        isVisible: $showSignUpConfirmPassword
                    )
                }

                Toggle(isOn: $signUpAgreeTerms) {
                    Text(
                        s("auth.signup.terms_prefix")
                            + " "
                            + s("auth.signup.terms_link")
                            + " "
                            + s("auth.signup.terms_and")
                            + " "
                            + s("auth.signup.privacy_link")
                    )
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: 0x334155))
                }
                .toggleStyle(.switch)

                Button {
                    submitSignUp()
                } label: {
                    HStack(spacing: 8) {
                        if authSession.isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Image(systemName: "person.badge.plus")
                                .font(.system(size: 13, weight: .black))
                        }

                        Text(authSession.isLoading ? s("auth.signup.loading") : s("auth.signup.submit"))
                            .font(.system(size: 15, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(Color(hex: 0x1BC47D))
                    .foregroundStyle(Color(hex: 0x071A12))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(authSession.isLoading)

                HStack(spacing: 4) {
                    Text(s("auth.signup.has_account"))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) {
                            mode = .signIn
                            signUpError = ""
                        }
                    } label: {
                        Text(s("auth.signup.signin"))
                            .foregroundStyle(Color(hex: 0x0C8F5D))
                    }
                    .buttonStyle(.plain)
                }
                .font(.system(size: 13, weight: .semibold))
                .frame(maxWidth: .infinity)
            }
            .padding(16)
            .background(TrustoraTheme.surface.opacity(0.94))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(TrustoraTheme.border, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.08), radius: 16, x: 0, y: 8)
        }
    }

    private func submitSignIn() {
        signInError = ""

        let normalizedEmail = signInEmail.trimmed
        guard !normalizedEmail.isEmpty, !signInPassword.isEmpty else {
            signInError = s("auth.signin.generic_error")
            return
        }

        Task {
            do {
                try await authSession.signIn(email: normalizedEmail, password: signInPassword)
                dismiss()
            } catch {
                signInError = error.localizedDescription
            }
        }
    }

    private func submitSignUp() {
        signUpError = ""

        guard !signUpFirstName.trimmed.isEmpty,
              !signUpLastName.trimmed.isEmpty,
              !signUpEmail.trimmed.isEmpty,
              !signUpPassword.isEmpty
        else {
            signUpError = s("auth.signup.generic_error")
            return
        }

        guard signUpPassword == signUpConfirmPassword else {
            signUpError = s("auth.signup.error_password_mismatch")
            return
        }

        guard signUpAgreeTerms else {
            signUpError = s("auth.signup.error_terms_required")
            return
        }

        if signUpCompanyName.nilIfEmpty != nil,
           (signUpTaxID.nilIfEmpty == nil || signUpBillingAddress.nilIfEmpty == nil) {
            signUpError = s("common.billing.tax_id_required_hint")
            return
        }

        let fallbackCompanyName = signUpCompany.nilIfEmpty

        let payload = TrustoraRegisterPayload(
            firstName: signUpFirstName.trimmed,
            lastName: signUpLastName.trimmed,
            email: signUpEmail.trimmed,
            phone: signUpPhone.nilIfEmpty,
            password: signUpPassword,
            role: signUpRole,
            company: fallbackCompanyName,
            companyName: signUpCompanyName.nilIfEmpty ?? fallbackCompanyName,
            taxID: signUpTaxID.nilIfEmpty,
            tradeRegistryNumber: signUpTradeRegistry.nilIfEmpty,
            billingAddress: signUpBillingAddress.nilIfEmpty,
            billingCity: signUpBillingCity.nilIfEmpty,
            billingState: signUpBillingState.nilIfEmpty,
            billingPostalCode: signUpBillingPostalCode.nilIfEmpty
        )

        Task {
            do {
                try await authSession.signUp(payload: payload)
                dismiss()
            } catch {
                signUpError = error.localizedDescription
            }
        }
    }

    private func authCardHeader(title: String, description: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(TrustoraTheme.primaryText)

            Text(description)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
        }
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}
