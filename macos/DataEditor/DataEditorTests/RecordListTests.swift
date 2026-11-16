import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

struct RecordListTests {
    private func records(_ rows: [(file: String, title: String, section: String?)]) -> [RecordSummary] {
        rows.map { RecordSummary(set: "building-hours", ref: RecordRef(file: $0.file, path: []), title: $0.title,
                                 subtitle: nil, section: $0.section, editable: true) }
    }

    /// The phone app's hours list: categories where their first building comes, buildings as the helper lists them.
    @Test func groupsBySectionInTheOrderGiven() {
        let listed = records([
            ("1-3-stav.yaml", "Stav Hall", "Food"),
            ("2-1-bookstore.yaml", "Bookstore", "Shops"),
            ("1-1-cage.yaml", "The Cage", "Food"),
            ("3-1-post-office.yaml", "Post Office", "Services"),
        ])
        let sections = RecordList.sections(of: listed)
        #expect(sections.map(\.title) == ["Food", "Shops", "Services"])
        #expect(sections[0].records.map(\.title) == ["Stav Hall", "The Cage"])
    }

    /// As in the phone app, a record with no section goes with any in a section named Other.
    @Test func putsRecordsWithNoSectionUnderOther() {
        let listed = records([
            ("1.yaml", "First", nil),
            ("2.yaml", "Second", "Food"),
            ("3.yaml", "Third", "Other"),
        ])
        let sections = RecordList.sections(of: listed)
        #expect(sections.map(\.title) == ["Other", "Food"])
        #expect(sections[0].records.map(\.title) == ["First", "Third"])
    }

    /// A set none of whose records has a section, as the dictionary, is one list without a header.
    @Test func listsAnUnsectionedSetWithoutAHeader() {
        let listed = records([("aac.yaml", "AAC", nil), ("ace.yaml", "ACE", nil)])
        let sections = RecordList.sections(of: listed)
        #expect(sections.map(\.title) == [nil])
        #expect(sections[0].records.count == 2)
    }
}

struct DataSetListTests {
    @Test func listsTheGroupsAndTheirSetsInCatalogOrder() throws {
        let json = #"{"groups":[{"title":"Help","sets":["faqs","contact-info"]},{"title":"App","sets":["privacy"]}],"sets":{"faqs":{"title":"FAQs & Notices","record":"FAQ","shape":"list","path":"faqs.yaml","list":["faqs"],"schema":"faqs"},"contact-info":{"title":"Important Contacts","record":"Contact","shape":"folder","path":"contact-info","schema":"contact-info"},"privacy":{"title":"Privacy Policy","record":"Privacy Policy","shape":"document","path":"privacy.md"}}}"#
        let catalog = try JSONDecoder().decode(DataSetCatalog.self, from: Data(json.utf8))
        let sections = DataSetList.sections(of: catalog)
        #expect(sections.map(\.title) == ["Help", "App"])
        #expect(sections[0].sets.map(\.title) == ["FAQs & Notices", "Important Contacts"])
        #expect(sections[0].sets.map(\.id) == ["faqs", "contact-info"])
    }
}

@MainActor
struct ChangesetRecordsTests {
    private let catalog = try! JSONDecoder().decode(DataSetCatalog.self, from: Data(#"{"groups":[],"sets":{"building-hours":{"title":"Hours","record":"Building","shape":"folder","path":"building-hours","schema":"building-hours"},"faqs":{"title":"FAQs & Notices","record":"FAQ","shape":"list","path":"faqs.yaml","list":["faqs"],"schema":"faqs"}}}"#.utf8))

    @Test func listsAPullRequestsFilesUnderTheirSetsByTitle() {
        let history = history(record(7, .open, paths: ["data/building-hours/1-1-cage.yaml", "data/faqs.yaml", "data/building-hours/9-9-gone.yaml"]))
        let cage = RecordSummary(set: "building-hours", ref: RecordRef(file: "building-hours/1-1-cage.yaml", path: []),
                                 title: "The Cage", subtitle: nil, section: "Food", editable: true)
        let listed = changesetRecords(.pullRequest(number: 7), catalog: catalog, records: ["building-hours": [cage]], history: history)
        #expect(listed["building-hours"]?.map(\.title) == ["The Cage", "9-9-gone.yaml"])
        #expect(listed["faqs"]?.map(\.title) == ["FAQs & Notices"])
    }
}
