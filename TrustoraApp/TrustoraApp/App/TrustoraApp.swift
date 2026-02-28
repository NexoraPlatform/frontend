//
//  TrustoraAppApp.swift
//  TrustoraApp
//
//  Created by Arsene Claudiu Ion on 27.02.2026.
//

import SwiftUI

@main
struct TrustoraApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
