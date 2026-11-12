import AppKit
import DataEditorKit
import SwiftUI

/// A row's days as one segmented control with each day its own segment,
/// any number of them on. SwiftUI's segmented picker holds one value, so
/// this is AppKit's control in its select-any mode.
struct DayPicker: NSViewRepresentable {
    let week: [Weekday]
    let days: [Weekday]
    /// Takes the days chosen, never none: a row needs at least one, so the last can't be turned off
    let change: (([Weekday]) -> Void)

    /// The days chosen in the order the files list them, Monday first, so a
    /// Mac whose week starts on Sunday writes the same file as any other.
    static func daysToSave(_ chosen: [Weekday]) -> [Weekday] {
        Weekday.allCases.filter(chosen.contains)
    }

    func makeNSView(context: Context) -> NSSegmentedControl {
        let control = NSSegmentedControl(labels: week.map(\.label), trackingMode: .selectAny,
                                         target: context.coordinator, action: #selector(Coordinator.changed(_:)))
        control.setContentHuggingPriority(.required, for: .horizontal)
        return control
    }

    func updateNSView(_ control: NSSegmentedControl, context: Context) {
        context.coordinator.parent = self
        for (segment, day) in week.enumerated() {
            control.setLabel(day.label, forSegment: segment)
            control.setSelected(days.contains(day), forSegment: segment)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    final class Coordinator: NSObject {
        var parent: DayPicker
        init(parent: DayPicker) { self.parent = parent }

        @objc func changed(_ control: NSSegmentedControl) {
            let chosen = parent.week.enumerated().filter { control.isSelected(forSegment: $0.offset) }.map(\.element)
            guard !chosen.isEmpty else {
                // put back the day just turned off
                for (segment, day) in parent.week.enumerated() { control.setSelected(parent.days.contains(day), forSegment: segment) }
                return
            }
            parent.change(DayPicker.daysToSave(chosen))
        }
    }
}
