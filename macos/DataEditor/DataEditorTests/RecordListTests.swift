import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct BuildingListTests {
    private func buildings(_ rows: [(file: String, name: String, category: String)]) throws -> [BuildingSummary] {
        let json = rows.map { ["file": $0.file, "name": $0.name, "category": $0.category] }
        return try JSONDecoder().decode([BuildingSummary].self, from: JSONSerialization.data(withJSONObject: json))
    }

    /// The phone app's hours list: categories where their first building comes, buildings as the helper lists them.
    @Test func groupsByCategoryInTheOrderGiven() throws {
        let listed = try buildings([
            ("1-3-stav.yaml", "Stav Hall", "Food"),
            ("2-1-bookstore.yaml", "Bookstore", "Shops"),
            ("1-1-cage.yaml", "The Cage", "Food"),
            ("3-1-post-office.yaml", "Post Office", "Services"),
        ])
        let sections = BuildingList.sections(of: listed)
        #expect(sections.map(\.title) == ["Food", "Shops", "Services"])
        #expect(sections[0].buildings.map(\.name) == ["Stav Hall", "The Cage"])
    }

    /// As in the phone app, a building with no category goes with any in a category named Other.
    @Test func putsBuildingsWithNoCategoryUnderOther() throws {
        let listed = try buildings([
            ("1.yaml", "First", ""),
            ("2.yaml", "Second", "Food"),
            ("3.yaml", "Third", "Other"),
        ])
        let sections = BuildingList.sections(of: listed)
        #expect(sections.map(\.title) == ["Other", "Food"])
        #expect(sections[0].buildings.map(\.name) == ["First", "Third"])
    }
}
