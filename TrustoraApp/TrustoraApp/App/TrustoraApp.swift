//
//  TrustoraAppApp.swift
//  TrustoraApp
//
//  Created by Arsene Claudiu Ion on 27.02.2026.
//

import SwiftUI

@main
struct TrustoraApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()
    @AppStorage(AppThemeMode.storageKey) private var appThemeRaw = AppThemeMode.system.rawValue

    private var appTheme: AppThemeMode {
        AppThemeMode(rawValue: appThemeRaw) ?? .system
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(appTheme.colorScheme)
        }
    }
}
