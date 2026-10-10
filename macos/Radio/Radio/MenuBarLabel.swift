import AppKit

/// Draws the menu bar item as one template image, with the radio symbol and the
/// title each centered on the bar.
///
/// The menu bar centers a symbol by its alignment box, and the radio symbol's
/// box covers only its body, below the antenna: drawn as a symbol, the radio
/// sits 2pt above the items beside it, and a title set beside it lines up with
/// the box rather than the drawing. As one image there is no box to misplace.
enum MenuBarLabel {
    static let height = NSStatusBar.system.thickness
    private static let spacing: CGFloat = 4
    private static let font = NSFont.menuBarFont(ofSize: 0)

    private static let symbol = NSImage(systemSymbolName: "radio", accessibilityDescription: nil)!
        .withSymbolConfiguration(.init(pointSize: font.pointSize, weight: .regular))!

    static var iconWidth: CGFloat { symbol.size.width }

    /// The radio, followed by `title` unless it is empty.
    static func image(title: String) -> NSImage {
        let symbol = symbol
        let text = NSAttributedString(string: title, attributes: [.font: font, .foregroundColor: NSColor.black])
        let textWidth = title.isEmpty ? 0 : spacing + ceil(text.size().width)
        let size = NSSize(width: ceil(symbol.size.width) + textWidth, height: height)

        let image = NSImage(size: size, flipped: false) { _ in
            // The symbol's ink is even within its image, so centering the image centers the drawing.
            symbol.draw(in: NSRect(x: 0, y: (size.height - symbol.size.height) / 2, width: symbol.size.width, height: symbol.size.height))
            if !title.isEmpty {
                // Center the capitals; drawing starts at the descender, below the baseline.
                let baseline = (size.height - font.capHeight) / 2
                text.draw(at: NSPoint(x: ceil(symbol.size.width) + spacing, y: baseline + font.descender))
            }
            return true
        }
        image.isTemplate = true
        image.accessibilityDescription = title.isEmpty ? "Radio" : title
        return image
    }
}
