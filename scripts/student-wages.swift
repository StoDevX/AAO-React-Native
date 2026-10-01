// Turns the WordPress REST response for St. Olaf's student compensation page
// into data/student-wages.yaml. Everything here is pure -- no network, no
// filesystem -- so scripts/student-wages.test.swift exercises it against a
// saved response. scripts/scrape-student-wages.swift does the I/O.
//
// The REST API rather than the page itself: the page repeats the article,
// tables included, inside a JSON-LD block, and the API returns it once.

import Foundation
import HTMLText

public let sourcePage = URL(
	string: "https://wp.stolaf.edu/studentemployment/student-employment-compensation-philosophy/",
)!

public let sourceAPI = URL(
	string: "https://wp.stolaf.edu/studentemployment/wp-json/wp/v2/pages?slug=student-employment-compensation-philosophy&_fields=modified,content",
)!

/// The pay structures and tiers the app's `JobCode` type allows, in file order.
public let structures = ["ST", "NST", "OSA"]
public let tiers = [1, 2, 3]

/// Dollars an hour, by pay structure and then tier: the shape of the data file.
public typealias Wages = [String: [Int: Double]]

/// Why the page could not become a wage table. The message names what changed.
public struct WageError: Error, CustomStringConvertible {
	public let message: String
	public var description: String { "student-wages: \(message)" }

	public init(message: String) {
		self.message = message
	}
}

/// One page from the WordPress REST API, trimmed to the fields we request.
public struct Page: Decodable, Sendable {
	public struct Content: Decodable, Sendable {
		public let rendered: String?
	}

	public let modified: String?
	public let content: Content?

	public init(modified: String?, content: Content?) {
		self.modified = modified
		self.content = content
	}
}

/// The article's HTML and modified time, from the API's one-page list.
public func pageContent(_ pages: [Page]) throws(WageError) -> (html: String, modified: String) {
	guard pages.count == 1, let page = pages.first else {
		throw WageError(message: "expected one page from the API, got \(pages.count) pages")
	}
	guard let html = page.content?.rendered else {
		throw WageError(message: "the page has no content.rendered")
	}
	return (html, page.modified ?? "unknown")
}

/// Every structure's rate for every tier. Throws rather than return a partial
/// table: a code missing, repeated, unknown, or without a rate means the page
/// changed shape, and a person should look before anything is written.
public func parseWages(_ html: String) throws(WageError) -> Wages {
	var found: [String: Double] = [:]
	for row in html.matches(of: /<tr\b[^>]*>(.*?)<\/tr>/.dotMatchesNewlines()) {
		let cells = htmlText(String(row.output.1))
		// The header row names no code.
		guard let code = cells.firstMatch(of: /\(([A-Z]+)(\d+)\)/) else { continue }

		let structure = String(code.output.1)
		let key = "\(structure)\(code.output.2)"
		guard structures.contains(structure), let tier = Int(code.output.2), tiers.contains(tier)
		else {
			throw WageError(message: "unknown pay code \(key)")
		}
		guard found[key] == nil else {
			throw WageError(message: "\(key) appears twice")
		}
		guard let rate = cells.firstMatch(of: /\$(\d+(?:\.\d{1,2})?)\s*\/\s*hour/) else {
			throw WageError(message: "no hourly rate in the \(key) row: \"\(cells)\"")
		}
		found[key] = Double(rate.output.1)
	}

	let codes = structures.flatMap { structure in tiers.map { "\(structure)\($0)" } }
	let missing = codes.filter { found[$0] == nil }
	guard missing.isEmpty else {
		throw WageError(message: "missing \(missing.joined(separator: ", "))")
	}

	return Dictionary(uniqueKeysWithValues: structures.map { structure in
		(structure, Dictionary(uniqueKeysWithValues: tiers.map { ($0, found["\(structure)\($0)"]!) }))
	})
}

private let header = """
	# Dollars an hour for student work, by pay structure and tier, from
	# \(sourcePage)
	# scripts/scrape-student-wages.mjs rewrites this file from that page; see AGENTS.md.

	"""

/// The whole of data/student-wages.yaml for these rates.
public func renderWages(_ wages: Wages) -> String {
	let lines = structures.map { structure in
		let rates = tiers.map { tier in
			"\(tier): \(String(format: "%.2f", wages[structure]![tier]!))"
		}
		return "\(structure): {\(rates.joined(separator: ", "))}"
	}
	return header + lines.joined(separator: "\n") + "\n"
}

/// A rate that differs between two tables. `nil` means the table lacks it.
public struct WageChange: Equatable, Sendable {
	public let code: String
	public let from: Double?
	public let to: Double?

	public init(code: String, from: Double?, to: Double?) {
		self.code = code
		self.from = from
		self.to = to
	}
}

/// Each rate that differs between two tables, as a pay code with old and new rates.
public func diffWages(_ ours: Wages?, _ theirs: Wages) -> [WageChange] {
	structures
		.flatMap { structure in
			tiers.map { tier in
				WageChange(
					code: "\(structure)\(tier)",
					from: ours?[structure]?[tier],
					to: theirs[structure]?[tier],
				)
			}
		}
		.filter { $0.from != $0.to }
}
