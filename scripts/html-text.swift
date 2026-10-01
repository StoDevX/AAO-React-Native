// Turns fragments of scraped HTML into plain text. Pure, like the parsers
// that use it: scripts/student-wages.swift.

import Foundation

private let named: [String: String] = [
	"nbsp": " ", "amp": "&", "lt": "<", "gt": ">", "quot": "\"", "apos": "'",
]

/// Decodes numeric and the common named character references.
public func decodeEntities(_ html: String) -> String {
	html.replacing(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/) { match in
		let body = match.output.1
		let scalar: Unicode.Scalar? =
			if body.hasPrefix("#x") || body.hasPrefix("#X") {
				UInt32(body.dropFirst(2), radix: 16).flatMap(Unicode.Scalar.init)
			} else if body.hasPrefix("#") {
				UInt32(body.dropFirst()).flatMap(Unicode.Scalar.init)
			} else {
				nil
			}
		if let scalar { return String(scalar) }
		return named[body.lowercased()] ?? String(match.output.0)
	}
}

/// The text of an HTML fragment: tags become spaces, runs of whitespace one space.
public func htmlText(_ html: String) -> String {
	decodeEntities(html.replacing(/<[^>]+>/, with: " "))
		.replacing(/\s+/, with: " ")
		.trimmingCharacters(in: .whitespaces)
}
