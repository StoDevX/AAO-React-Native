import DataEditorKit
import SwiftUI

/// The week at a glance: one line per day, from the day the week starts on here, one lane per schedule.
struct WeekTimeline: View {
    @Environment(AppModel.self) private var model
    let services: [Service]
    private let colors: [Color] = [.accentColor, .orange, .green, .purple, .pink, .teal]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(model.week, id: \.self) { day in
                HStack(spacing: 8) {
                    Text(day.label).font(.caption.monospaced()).frame(width: 32, alignment: .leading)
                    GeometryReader { geometry in
                        ZStack(alignment: .topLeading) {
                            RoundedRectangle(cornerRadius: 3).fill(.quaternary)
                            ForEach(Array(services.enumerated()), id: \.offset) { lane, service in
                                // two rows can cover the same stretch, so a segment is not its own identity
                                ForEach(Array(service.rows.flatMap { $0.segments() }.filter { $0.day == day }.enumerated()), id: \.offset) { _, segment in
                                    let width = geometry.size.width
                                    let laneHeight = geometry.size.height / CGFloat(max(services.count, 1))
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(colors[lane % colors.count])
                                        .frame(width: width * CGFloat(segment.end - segment.start) / 1440, height: laneHeight - 1)
                                        .offset(x: width * CGFloat(segment.start) / 1440, y: CGFloat(lane) * laneHeight)
                                        .help("\(service.title): \(ClockTime(minutes: segment.start).text) to \(ClockTime(minutes: segment.end).text)")
                                }
                            }
                        }
                    }
                    .frame(height: 14)
                }
            }
            HStack {
                ForEach(Array(services.enumerated()), id: \.offset) { lane, service in
                    Label(service.title, systemImage: "circle.fill").foregroundStyle(colors[lane % colors.count]).font(.caption)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("The week's hours")
    }
}
