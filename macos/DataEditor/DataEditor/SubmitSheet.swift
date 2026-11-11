import DataEditorKit
import SwiftUI

/// Asks what changed, signs in to GitHub if need be, and submits. A failure
/// stays on the sheet with the summary kept, so the contributor can try again.
struct SubmitSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var summary = ""
    @State private var code: DeviceFlow.DeviceCode?
    @State private var sending: Task<Void, Never>?
    /// Set while the model sends the changes. Stopping then could leave a
    /// branch or pull request half made, so the sheet cannot be closed.
    @State private var sendingToGitHub = false
    @State private var error: String?

    /// Whether Submit may be clicked: a summary to title the pull request, no
    /// submission already under way, and a build that can sign in to GitHub.
    static func canSubmit(summary: String, working: Bool, clientID: String) -> Bool {
        !summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !working && !clientID.isEmpty
    }

    var body: some View {
        let working = sending != nil
        Form {
            if model.githubClientID.isEmpty {
                Text("This copy of the Data Editor can't submit changes.")
                    .foregroundStyle(.red)
            }
            TextField("What changed?", text: $summary, prompt: Text("e.g. Close The Cage at 9 p.m. on Fridays"))
                .accessibilityIdentifier("submit-summary")
            if let code {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Sign in to GitHub").font(.headline)
                    Text("Enter this code on the page that opened:")
                    Text(code.userCode).font(.title.monospaced()).textSelection(.enabled)
                    Button("Open github.com/login/device") { openURL(code.verificationURL) }
                }
            }
            if let error {
                Text(error).foregroundStyle(.red).textSelection(.enabled)
            }
        }
        .formStyle(.grouped)
        .frame(width: 460)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() }.disabled(sendingToGitHub) }
            ToolbarItem(placement: .confirmationAction) {
                Button(working ? "Submitting…" : "Submit") { sending = Task { await submit() } }
                    .disabled(!Self.canSubmit(summary: summary, working: working, clientID: model.githubClientID))
                    .accessibilityIdentifier("submit-confirm")
            }
        }
        .interactiveDismissDisabled(sendingToGitHub)
        // stops waiting for a sign-in nobody will finish; the sheet stays open while sending
        .onDisappear { sending?.cancel() }
    }

    private func submit() async {
        defer {
            sending = nil
            code = nil
        }
        error = nil
        do {
            if model.tokens.read() == nil { try await signIn() }
            do {
                try await send()
            } catch SubmitError.signInRequired {
                // the saved token was revoked or expired; GitHub has forgotten it
                try await signIn()
                try await send()
            }
            dismiss()
        } catch {
            // a cancelled submission belongs to a sheet that has closed
            if !Task.isCancelled { self.error = error.localizedDescription }
        }
    }

    /// Sends the changes, unless the sheet closed during the sign-in before it.
    private func send() async throws {
        try Task.checkCancellation()
        sendingToGitHub = true
        defer { sendingToGitHub = false }
        try await model.submit(summary: summary)
    }

    private func signIn() async throws {
        let flow = DeviceFlow(clientID: model.githubClientID)
        let code = try await flow.start()
        self.code = code
        openURL(code.verificationURL)
        model.tokens.write(try await flow.token(for: code))
        self.code = nil
    }
}
