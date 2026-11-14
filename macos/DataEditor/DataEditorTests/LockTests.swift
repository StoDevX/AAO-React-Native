import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

/// The real catalog's sets that lock, as the helper sends them.
private let catalog = try! JSONDecoder().decode(DataSetCatalog.self, from: Data(#"""
    {"groups": [], "sets": {
      "student-wages": {"title": "Student Wages", "record": "Wage Table", "shape": "file", "path": "student-wages.yaml", "schema": "student-wages", "readOnly": "Updated monthly from St. Olaf's student compensation page"},
      "bus-times": {"title": "Bus Times", "record": "Bus Line", "shape": "folder", "path": "bus-times", "schema": "bus-times", "ordered": true, "generated": {"files": ["3-red-line.yaml", "4-blue-line.yaml"], "by": "Generated weekly from the Hiawathaland GTFS feed"}},
      "building-hours": {"title": "Hours", "record": "Building", "shape": "folder", "path": "building-hours", "schema": "building-hours", "ordered": true, "form": "hours", "scraped": {"files": ["1-1-cage.yaml", "1-3-stav.yaml"], "fields": ["schedule"], "by": "Updated weekly from Bon Appétit's café pages"}},
      "bonapp-overrides": {"title": "Dining Scrape", "record": "Venue", "shape": "list", "path": "_scrapes/bonapp-overrides.yaml", "list": ["venues"], "schema": "_bonapp-overrides", "steers": {"what": "Stav and the Cage's hours", "run": "the weekly Bon Appétit scrape"}}
    }}
    """#.utf8))

@MainActor
struct LockTests {
    private func set(_ name: String) -> DataSet { catalog.sets[name]! }

    @Test func wagesAreReadOnly() {
        #expect(AppModel.lockReason(set: set("student-wages"), file: "student-wages.yaml", updating: false, conflicted: false)
            == "Updated monthly from St. Olaf's student compensation page")
    }

    @Test func redLineIsGenerated() {
        #expect(AppModel.lockReason(set: set("bus-times"), file: "bus-times/3-red-line.yaml", updating: false, conflicted: false)
            == "Generated weekly from the Hiawathaland GTFS feed")
    }

    @Test func expressIsEditable() {
        #expect(AppModel.lockReason(set: set("bus-times"), file: "bus-times/1-express.yaml", updating: false, conflicted: false) == nil)
    }

    @Test func aConflictLocksAnEditableRecord() {
        #expect(AppModel.lockReason(set: set("bus-times"), file: "bus-times/1-express.yaml", updating: false, conflicted: true)
            == "This file changed on GitHub too.")
    }

    @Test func stavScheduleIsScraped() {
        #expect(AppModel.scrapedFields(set: set("building-hours"), file: "building-hours/1-3-stav.yaml") == ["schedule"])
        #expect(AppModel.scrapedFields(set: set("building-hours"), file: "building-hours/2-1-rolvaag.yaml").isEmpty)
    }

    @Test func kstoEditsAreStamped() {
        let ops: [EditOp] = [.set(["shows", 0, "title"], .string("Jazz"))]
        #expect(AppModel.stamped(ops, field: "updated", today: "2026-11-12T00:00:00Z")
            == ops + [.set(["updated"], .string("2026-11-12T00:00:00Z"))])
    }

    @Test func anEditThatSetsTheStampIsLeftAlone() {
        let ops: [EditOp] = [.set(["updated"], .string("2026-10-08T00:00:00Z"))]
        #expect(AppModel.stamped(ops, field: "updated", today: "2026-11-12T00:00:00Z") == ops)
        #expect(AppModel.stamped(ops, field: nil, today: "2026-11-12T00:00:00Z") == ops)
    }

    @Test func saysWhenASteeringEditTakesEffect() {
        #expect(AppModel.steersNotice(set("bonapp-overrides").steers!)
            == "An edit here changes Stav and the Cage's hours the next time the weekly Bon Appétit scrape runs. The preview won't show it.")
    }
}

@MainActor
struct DocumentFileTests {
    private let catalog = try! JSONDecoder().decode(DataSetCatalog.self, from: Data(#"{"groups":[],"sets":{"privacy":{"title":"Privacy Policy","record":"Privacy Policy","shape":"document","path":"privacy.md"},"faqs":{"title":"FAQs & Notices","record":"FAQ","shape":"list","path":"faqs.yaml","list":["faqs"],"schema":"faqs"}}}"#.utf8))

    /// A prose document is text, which the helper would read as YAML and report as broken.
    @Test func aDocumentIsNotLoadedAsData() {
        #expect(!AppModel.loadsAsData("privacy.md", catalog: catalog))
        #expect(AppModel.loadsAsData("faqs.yaml", catalog: catalog))
        #expect(AppModel.loadsAsData("building-hours/1-1-cage.yaml", catalog: nil))
    }
}

@MainActor
struct NamedFileTests {
    private func set(_ name: String) -> DataSet { catalog.sets[name]! }

    /// A scrape writes The Cage's file by name, and a generator the Red Line's; renaming or removing either duplicates it at the next run.
    @Test func filesAScrapeOrGeneratorNamesKeepTheirNames() {
        #expect(AppModel.keepsItsName(set: set("building-hours"), file: "building-hours/1-1-cage.yaml"))
        #expect(AppModel.keepsItsName(set: set("bus-times"), file: "bus-times/3-red-line.yaml"))
        #expect(!AppModel.keepsItsName(set: set("bus-times"), file: "bus-times/1-express.yaml"))
    }

    @Test func aSetWhoseFilesAreNamedElsewhereKeepsItsOrder() {
        #expect(!AppModel.reorders(set("building-hours")))
        #expect(!AppModel.reorders(set("bus-times")))
        #expect(AppModel.reorders(set("bonapp-overrides")))
    }
}
