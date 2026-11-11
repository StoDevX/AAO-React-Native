import DataEditorKit
import SwiftUI

/// What the toolbar's preview control offers for each state of ccc.
struct PreviewControl: Equatable {
    enum Click: Equatable {
        /// starts the preview
        case start
        /// opens the popover with the status and the phone instructions
        case showStatus
    }

    let title: String
    let click: Click
    let offersStop: Bool
    /// after a crash or a refused port, which ccc does not recover from by itself
    let offersStartAgain: Bool

    /// - Parameter servePortInUse: whether the app could not serve the data on its own port
    init(_ status: CccRunner.Status, servePortInUse: Bool = false) {
        switch status {
        case .stopped: (title, click, offersStop, offersStartAgain) = ("Start Preview", .start, false, false)
        case .starting: (title, click, offersStop, offersStartAgain) = ("Starting preview…", .showStatus, true, false)
        case .running: (title, click, offersStop, offersStartAgain) = ("Preview on", .showStatus, true, false)
        case .portInUse: (title, click, offersStop, offersStartAgain) = ("Port 8787 is in use", .showStatus, true, true)
        case .crashed: (title, click, offersStop, offersStartAgain) = (servePortInUse ? "Port \(AppModel.port) is in use" : "Preview stopped", .showStatus, true, true)
        }
    }
}

/// Starts the phone preview, and once started says how it is going and how to point the phone here.
struct ServerStatusView: View {
    @Environment(AppModel.self) private var model
    @State private var showing = false

    private var color: Color {
        switch model.cccStatus {
        case .running: .green
        case .starting: .yellow
        case .portInUse, .crashed: .red
        case .stopped: .secondary
        }
    }

    var body: some View {
        let control = PreviewControl(model.cccStatus, servePortInUse: model.servePortInUse)
        Button {
            switch control.click {
            case .start: Task { await model.startPreview() }
            case .showStatus: showing.toggle()
            }
        } label: {
            if control.click == .start {
                Label(control.title, systemImage: "iphone")
            } else {
                Label(control.title, systemImage: "circle.fill").foregroundStyle(color)
            }
        }
        // the toolbar draws only the icon, so the title shows on hover
        .help(control.title)
        .accessibilityIdentifier("server-status")
        .popover(isPresented: $showing) {
            VStack(alignment: .leading, spacing: 12) {
                Text("See your edits on your phone").font(.headline)
                Text("""
                1. Make sure your phone is on the same Wi-Fi as this Mac.
                2. In All About Olaf, turn on dev mode from the notice on the Home screen.
                3. Go to Developer → Server URL and choose “ccc-server edu.stolaf (\(Host.current().localizedName ?? "this Mac"))”.
                4. Pull to refresh the hours.
                """)
                if model.cccStatus == .portInUse {
                    Text("Another program is using port 8787, probably another copy of ccc-server. Quit it first.").foregroundStyle(.red)
                }
                if model.servePortInUse {
                    Text("Another program is using port \(AppModel.port), probably another copy of the Data Editor. Quit it first.").foregroundStyle(.red)
                }
                HStack {
                    if control.offersStartAgain {
                        Button("Start the preview again") { Task { await model.startPreview() } }
                    }
                    if control.offersStop {
                        Button("Stop Preview") {
                            showing = false
                            Task { await model.stopPreview() }
                        }
                    }
                }
                DisclosureGroup("Log") {
                    ScrollView { Text(model.cccLog.suffix(40).joined(separator: "\n")).font(.caption.monospaced()).textSelection(.enabled) }
                        .frame(height: 160)
                }
            }
            .padding()
            .frame(width: 420)
        }
    }
}
