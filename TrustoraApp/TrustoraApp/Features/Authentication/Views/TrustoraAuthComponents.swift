import SwiftUI

struct AuthHeroHeader: View {
    let badge: String
    let titlePrefix: String
    let titleBrand: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color(hex: 0x1BC47D))
                    .frame(width: 8, height: 8)

                Text(badge)
                    .font(TrustoraTypography.label)
                    .foregroundStyle(Color(hex: 0x166043))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Capsule().fill(Color(hex: 0x1BC47D, opacity: 0.14)))
            .overlay(
                Capsule()
                    .stroke(Color(hex: 0x1BC47D, opacity: 0.34), lineWidth: 1)
            )

            (Text(titlePrefix + " ")
                .foregroundStyle(TrustoraTheme.primaryText)
             + Text(titleBrand)
                .foregroundStyle(TrustoraTheme.accent))
            .font(TrustoraTypography.pageTitle)
            .fixedSize(horizontal: false, vertical: true)

            Text(subtitle)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct AuthBenefitPill: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(Color(hex: 0x1BC47D))
                .frame(width: 8, height: 8)
                .padding(.top, 4)

            Text(text)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(Color.white.opacity(0.86))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xD9E4EF), lineWidth: 1)
        )
    }
}

struct AuthIconField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    let icon: String
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(width: 16)

                TextField(placeholder, text: $text)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(keyboardType)
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.primaryText)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: 0xCBD5E1), lineWidth: 1)
            )
        }
    }
}

struct AuthSecureIconField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    let icon: String
    @Binding var isVisible: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(width: 16)

                Group {
                    if isVisible {
                        TextField(placeholder, text: $text)
                    } else {
                        SecureField(placeholder, text: $text)
                    }
                }
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primaryText)

                Button {
                    isVisible.toggle()
                } label: {
                    Image(systemName: isVisible ? "eye.slash.fill" : "eye.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x64748B))
                        .frame(width: 20, height: 20)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: 0xCBD5E1), lineWidth: 1)
            )
        }
    }
}

struct AuthErrorBanner: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Color(hex: 0xB91C1C))
                .font(.system(size: 13, weight: .bold))

            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color(hex: 0x7F1D1D))
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(10)
        .background(Color(hex: 0xFEE2E2))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xFCA5A5), lineWidth: 1)
        )
    }
}
