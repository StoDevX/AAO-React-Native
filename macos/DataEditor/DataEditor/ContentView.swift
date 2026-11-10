import SwiftUI

/// The main window. Stands in until the editor's views are written.
struct ContentView: View {
    var body: some View { Text("Data Editor") }
}

/// The Data Browser window. Stands in until the browser is written.
struct DataBrowserView: View {
    var body: some View { Text("Data Browser") }
}

/// The list of changed files. Stands in until the review sheet is written.
struct ChangesView: View {
    var body: some View { Text("Changes") }
}
