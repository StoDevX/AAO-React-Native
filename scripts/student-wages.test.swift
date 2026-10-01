import Foundation
import StudentWages
import Testing
import Yams

private let here = URL(filePath: #filePath).deletingLastPathComponent()

private let response = try! JSONDecoder().decode(
	[Page].self,
	from: Data(contentsOf: here.appending(path: "fixtures/student-wages/compensation.json")),
)

private let published: Wages = [
	"ST": [1: 12, 2: 12.5, 3: 13],
	"NST": [1: 13.5, 2: 14.5, 3: 15.5],
	"OSA": [1: 12.5, 2: 13.25, 3: 14],
]

private let rows = [
	("Standard Tier 1 (ST1)", "$12.00/hour"),
	("Standard Tier 2 (ST2)", "$12.50/hour"),
	("Standard Tier 3 (ST3)", "$13.00/hour"),
	("Non-Standard Tier 1 (NST1)", "$13.50/hour"),
	("Non-Standard Tier 2 (NST2)", "$14.50/hour"),
	("Non-Standard Tier 3 (NST3)", "$15.50/hour"),
	("Office of Student Activities Tier 1 (OSA1)", "$12.50/hour"),
	("Office of Student Activities Tier 2 (OSA2)", "$13.25/hour"),
	("Office of Student Activities Tier 3 (OSA3)", "$14.00/hour"),
]

/// A table in the page's own shape, with a header row, from (label, rate) pairs.
private func table(_ rows: [(String, String)]) -> String {
	let body = rows.map { label, rate in
		#"<tr class="wpdt-cell-row "><td>\#(label)</td><td>Duties.</td><td>\#(rate)</td></tr>"#
	}
	return "<table><thead><tr><th>Tier</th><th>Description</th><th>Pay Rate</th></tr></thead><tbody>\(body.joined())</tbody></table>"
}

/// The message `body` throws, which must be a `WageError`.
private func message(_ body: () throws -> some Any) -> String? {
	#expect(throws: WageError.self) { _ = try body() }?.message
}

@Test func `parses all nine rates from the published page`() throws {
	#expect(try parseWages(pageContent(response).html) == published)
}

@Test func `reads when the page was last modified`() throws {
	#expect(try pageContent(response).modified.contains(/^\d{4}-\d{2}-\d{2}T/))
}

// A renamed slug returns an empty list rather than a 404.
@Test func `refuses a response with no page in it`() {
	#expect(message { try pageContent([]) }?.contains("expected one page") == true)
}

@Test func `refuses a page with no rendered content`() {
	let page = Page(modified: "x", content: nil)
	#expect(message { try pageContent([page]) }?.contains("content.rendered") == true)
}

@Test func `throws when a whole structure is gone`() {
	let html = table(rows.filter { !$0.0.contains("OSA") })
	#expect(message { try parseWages(html) }?.contains("missing OSA1, OSA2, OSA3") == true)
}

// A page with its tables removed must fail rather than empty the table.
@Test func `throws when the page has no tables`() {
	#expect(message { try parseWages("<p>Down for maintenance.</p>") }?.contains("missing ST1") == true)
}

@Test func `throws on a code the app does not know`() {
	let html = table(rows + [("Standard Tier 4 (ST4)", "$13.50/hour")])
	#expect(message { try parseWages(html) }?.contains("unknown pay code ST4") == true)
}

@Test func `throws on a code listed twice`() {
	let html = table(rows + [("Standard Tier 1 (ST1)", "$12.25/hour")])
	#expect(message { try parseWages(html) }?.contains("ST1 appears twice") == true)
}

@Test func `throws when a code row has no rate`() {
	let html = table(rows.map { label, rate in (label, label.contains("(ST1)") ? "TBD" : rate) })
	#expect(message { try parseWages(html) }?.contains("no hourly rate in the ST1 row") == true)
}

@Test func `reads a rate without cents, with spaces or an entity before the slash`() throws {
	let html = table(rows.map { label, rate in
		if label.contains("(ST1)") { return (label, "$12/hour") }
		if label.contains("(ST2)") { return (label, "$12.50&nbsp;/ hour") }
		return (label, rate)
	})
	let wages = try parseWages(html)
	#expect(wages["ST"]?[1] == 12)
	#expect(wages["ST"]?[2] == 12.5)
}

@Test func `renders each structure on one line, to the cent`() {
	let yaml = renderWages(published)
	#expect(yaml.contains(/(?m)^ST: \{1: 12\.00, 2: 12\.50, 3: 13\.00\}$/))
	#expect(yaml.contains(/(?m)^OSA: \{1: 12\.50, 2: 13\.25, 3: 14\.00\}$/))
	#expect(yaml.contains("student-employment-compensation-philosophy"))
}

@Test func `renders a file that reads back as the same rates`() throws {
	#expect(try YAMLDecoder().decode(Wages.self, from: renderWages(published)) == published)
}

@Test func `lists each changed rate`() {
	var theirs = published
	theirs["NST"]?[2] = 14.75
	#expect(diffWages(published, theirs) == [WageChange(code: "NST2", from: 14.5, to: 14.75)])
}

@Test func `lists nothing when the rates match`() {
	#expect(diffWages(published, published) == [])
}

// A committed file laid out differently from what the scrape writes would
// open a formatting-only pull request every month.
@Test func `the committed data file is exactly what the scrape writes`() throws {
	let committed = try String(
		contentsOf: here.appending(path: "../data/student-wages.yaml"),
		encoding: .utf8,
	)
	#expect(try renderWages(YAMLDecoder().decode(Wages.self, from: committed)) == committed)
}
