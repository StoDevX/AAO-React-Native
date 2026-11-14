import DataEditorKit
import SwiftUI

/// A small square of one of the app's gradients, as a picker's menu draws
/// beside the gradient's name. A menu item shows an image, not a view, so the
/// swatch is drawn into one.
struct GradientSwatch {
    /// the gradient's two `color(display-p3 …)` stops
    let stops: [String]

    private var colors: [Color] {
        stops.compactMap { ColorValue(.string($0)) }.map { Color(.displayP3, red: $0.unit[0], green: $0.unit[1], blue: $0.unit[2]) }
    }

    @MainActor var image: Image? {
        let swatch = RoundedRectangle(cornerRadius: 3)
            .fill(LinearGradient(colors: colors, startPoint: .top, endPoint: .bottom))
            .frame(width: 14, height: 14)
        let renderer = ImageRenderer(content: swatch)
        renderer.scale = NSScreen.main?.backingScaleFactor ?? 2
        return renderer.nsImage.map { Image(nsImage: $0) }
    }
}
