import IssueReporting
import SwiftUI

extension Color {
	init(hex: String) {
		let trimmed = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))

		guard trimmed.count == 6 else {
			reportIssue("Color(hex:) expected 6 hex digits, got \"\(hex)\"")
			self.init(white: 0)
			return
		}

		let scanner = Scanner(string: trimmed)
		var rgbValue: UInt64 = 0
		guard scanner.scanHexInt64(&rgbValue) else {
			reportIssue("Color(hex:) could not parse \"\(hex)\" as hex")
			self.init(white: 0)
			return
		}

		let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
		let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
		let b = Double(rgbValue & 0x0000FF) / 255.0

		self.init(red: r, green: g, blue: b)
	}
}
