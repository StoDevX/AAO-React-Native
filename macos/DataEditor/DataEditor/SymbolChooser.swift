import AppKit
import SwiftUI

/// SF Symbols a contributor picks by sight: the ones the data uses, and others
/// a campus app tends to need. macOS has no public list of every symbol, so
/// this is a chosen few; any other name can still be typed.
enum SymbolChooser {
    static let curated: [String] = [
        // in the data already
        "atom", "bed.double.fill", "bicycle", "book.fill", "brain.head.profile", "briefcase.fill", "building.2.fill",
        "building.columns.fill", "cross.case.fill", "desktopcomputer", "ellipsis.circle.fill", "envelope.circle",
        "exclamationmark.circle", "eye.slash.fill", "figure.run", "figure.walk", "flask.fill", "fork.knife",
        "globe.americas.fill", "graduationcap.fill", "hand.raised.fill", "hands.and.sparkles.fill", "hands.sparkles.fill",
        "heart.circle.fill", "house.fill", "info.circle.fill", "light.beacon.max.fill", "lightbulb.fill", "megaphone.fill",
        "music.note", "paintpalette.fill", "parkingsign", "person.2.fill", "person.3.sequence.fill",
        "shield.lefthalf.filled", "sparkles", "sportscourt.fill", "star.fill", "stethoscope", "testtube.2",
        "theatermasks.fill", "tree.fill", "trophy.fill", "wrench.and.screwdriver.fill",
        // food and drink
        "cup.and.saucer.fill", "cup.and.saucer", "mug.fill", "takeoutbag.and.cup.and.straw.fill", "birthday.cake.fill",
        "carrot.fill", "leaf.fill", "wineglass.fill", "fish.fill", "frying.pan.fill", "refrigerator.fill",
        // getting around
        "bus.fill", "car.fill", "tram.fill", "airplane", "figure.walk.motion", "map.fill", "mappin.and.ellipse",
        "location.fill", "signpost.right.fill", "bicycle.circle.fill", "scooter",
        // places
        "building.fill", "house.lodge.fill", "tent.fill", "books.vertical.fill", "theatermask.and.paintbrush.fill",
        "music.mic", "pianokeys", "guitars.fill", "film.fill", "camera.fill", "photo.fill", "dumbbell.fill",
        "figure.pool.swim", "soccerball", "basketball.fill", "football.fill", "baseball.fill", "tennisball.fill",
        // help and safety
        "phone.fill", "phone.circle.fill", "envelope.fill", "message.fill", "bubble.left.and.bubble.right.fill",
        "exclamationmark.triangle.fill", "bell.fill", "lock.fill", "key.fill", "shield.fill", "cross.fill",
        "heart.fill", "pills.fill", "bandage.fill", "brain", "hand.thumbsup.fill", "questionmark.circle.fill",
        "lifepreserver.fill", "flame.fill", "bolt.fill", "drop.fill", "snowflake", "sun.max.fill", "moon.fill",
        "cloud.rain.fill",
        // study and work
        "pencil", "doc.text.fill", "folder.fill", "calendar", "clock.fill", "printer.fill", "laptopcomputer",
        "wifi", "network", "server.rack", "magnifyingglass", "newspaper.fill", "radio.fill", "antenna.radiowaves.left.and.right",
        "dollarsign.circle.fill", "creditcard.fill", "cart.fill", "bag.fill", "gift.fill", "tag.fill", "hammer.fill",
        "paintbrush.fill", "scissors", "ruler.fill", "function", "chart.bar.fill", "person.fill", "person.crop.circle.fill",
        "person.3.fill", "figure.2", "hands.clap.fill", "flag.fill", "globe", "link", "info.circle", "gearshape.fill",
    ]

    /// Whether the system draws a symbol called `name`.
    static func isSymbol(_ name: String) -> Bool {
        NSImage(systemSymbolName: name, accessibilityDescription: nil) != nil
    }

    /// The curated symbols whose names hold `search`, or all of them for an empty search.
    static func matching(_ search: String) -> [String] {
        let words = search.lowercased().split(separator: " ")
        return curated.filter { name in words.allSatisfy { name.contains($0) } }
    }

    /// What the grid offers for `search`: the curated matches, led by the
    /// symbol `search` names exactly when the list lacks it.
    static func offered(_ search: String) -> [String] {
        let name = search.trimmingCharacters(in: .whitespaces)
        let found = matching(name)
        return !name.isEmpty && !found.contains(name) && isSymbol(name) ? [name] + found : found
    }
}

/// An icon field: a button showing the symbol and its name, which opens a grid
/// to choose another from. A name the file holds that no symbol has is shown,
/// with a word on what to do.
struct SymbolField: View {
    let title: String
    let value: String?
    let identifier: String
    let set: (String) -> Void
    @State private var choosing = false

    var body: some View {
        LabeledContent(title) {
            VStack(alignment: .trailing, spacing: 4) {
                Button { choosing = true } label: {
                    HStack(spacing: 6) {
                        if let value, SymbolChooser.isSymbol(value) {
                            Image(systemName: value)
                        } else {
                            Image(systemName: "questionmark.square.dashed").foregroundStyle(.secondary)
                        }
                        Text(value ?? "None")
                        Image(systemName: "chevron.up.chevron.down").imageScale(.small).foregroundStyle(.secondary)
                    }
                }
                .accessibilityIdentifier(identifier)
                .popover(isPresented: $choosing, arrowEdge: .leading) {
                    SymbolGrid(current: value) { name in
                        choosing = false
                        if name != value { set(name) }
                    }
                }
                if let value, !value.isEmpty, !SymbolChooser.isSymbol(value) {
                    Text("“\(value)” isn't an SF Symbol. Choose one from the list.")
                        .font(.caption)
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("symbol-problem-" + identifier)
                }
            }
        }
    }
}

/// A searchable grid of symbols; choosing one hands its name to `choose`.
struct SymbolGrid: View {
    /// the symbol chosen now, marked in the grid
    let current: String?
    let choose: (String) -> Void
    @State private var search = ""

    var body: some View {
        VStack(alignment: .leading) {
            TextField("Search", text: $search, prompt: Text("Search symbols"))
                .textFieldStyle(.roundedBorder)
                // the popover takes the form's alignment, which right-aligns its fields
                .multilineTextAlignment(.leading)
                .accessibilityIdentifier("symbol-search")
            ScrollView {
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(36)), count: 8)) {
                    ForEach(SymbolChooser.offered(search), id: \.self) { name in
                        Button { choose(name) } label: {
                            Image(systemName: name).font(.title3).frame(width: 32, height: 32)
                                .background(name == current ? AnyShapeStyle(.tint.opacity(0.25)) : AnyShapeStyle(.clear),
                                            in: RoundedRectangle(cornerRadius: 6))
                        }
                        .buttonStyle(.borderless)
                        .help(name)
                        .accessibilityLabel(name)
                        .accessibilityIdentifier("symbol-" + name)
                    }
                }
            }
            .frame(height: 240)
        }
        .padding(12)
        .frame(width: 8 * 36 + 7 * 8 + 24)
    }
}
