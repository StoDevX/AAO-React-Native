import DataEditorKit
import Testing
@testable import DataEditor

/// The control a list item or map entry gets, from the repo's own schemas.
@MainActor
struct ItemControlTests {
    /// The fields of one bus schedule, as the form draws them.
    private func scheduleFields() async throws -> [FormField] {
        let (model, _) = try await modelOnRepoData()
        let schema = try #require(await model.schema(for: "bus-times"))
        let schedules = try #require(formFields(schema: schema).first { $0.key == "schedules" })
        guard case .list(.object(let fields), _) = schedules.kind else { throw Unexpected() }
        return fields
    }

    private struct Unexpected: Error {}

    private func kind(of key: String, in fields: [FormField]) throws -> FieldKind {
        try #require(fields.first { $0.key == key }).kind
    }

    /// A row of times opens to a field for each time, rather than one text field holding the row.
    @Test func aTimetableRowOpensToItsTimes() async throws {
        guard case .list(let row, _) = try kind(of: "times", in: try await scheduleFields()) else { throw Unexpected() }
        guard case .list = ItemControl(row) else { Issue.record("a row of times is \(ItemControl(row))"); return }
    }

    /// A stop's coordinates are two numbers, each its own field.
    @Test func aStopsCoordinatesOpenToTheirNumbers() async throws {
        guard case .map(let pair) = try kind(of: "coordinates", in: try await scheduleFields()) else { throw Unexpected() }
        guard case .list = ItemControl(pair) else { Issue.record("a coordinate pair is \(ItemControl(pair))"); return }
    }

    @Test func aStopIsOneField() async throws {
        guard case .list(let stop, _) = try kind(of: "stops", in: try await scheduleFields()) else { throw Unexpected() }
        guard case .field = ItemControl(stop) else { Issue.record("a stop is \(ItemControl(stop))"); return }
    }
}
