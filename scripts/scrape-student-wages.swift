// Brings data/student-wages.yaml into line with St. Olaf's published student
// wage table. It writes the whole file or nothing: a page missing, repeating
// or adding a pay code throws in parseWages before anything is written, so a
// changed page can never empty the table.

import Foundation
import StudentWages
import Yams

#if canImport(FoundationNetworking)
	import FoundationNetworking
#endif

private let dataFile = URL(filePath: #filePath)
	.deletingLastPathComponent()
	.appending(path: "../data/student-wages.yaml")
	.standardized

private func money(_ rate: Double?) -> String {
	rate.map { String(format: "$%.2f", $0) } ?? "nothing"
}

@main struct ScrapeStudentWages {
	static func main() async {
		do {
			try await scrape()
		} catch {
			// A thrown error escaping main traps, which reads as a crash.
			FileHandle.standardError.write(Data("\(error)\n".utf8))
			exit(1)
		}
	}

	private static func scrape() async throws {
		let check = CommandLine.arguments.contains("--check")

		let (body, response) = try await URLSession.shared.data(from: sourceAPI)
		if let status = (response as? HTTPURLResponse)?.statusCode, !(200..<300).contains(status) {
			throw WageError(message: "\(sourceAPI) responded with \(status)")
		}
		let (html, modified) = try pageContent(JSONDecoder().decode([Page].self, from: body))
		let theirs = try parseWages(html)

		let current = try String(contentsOf: dataFile, encoding: .utf8)
		let next = renderWages(theirs)
		let changes = diffWages(try? YAMLDecoder().decode(Wages.self, from: current), theirs)

		if next != current && !check {
			try next.write(to: dataFile, atomically: true, encoding: .utf8)
		}

		var report = ["## Student wages", "", "Source: \(sourcePage) (modified \(modified))", ""]
		if next == current {
			report.append("No change — what we ship already matches the page.")
		} else if changes.isEmpty {
			report.append(
				"Rates match, but `data/student-wages.yaml` is laid out differently from what this script writes.",
			)
		} else {
			report += [check ? "Out of date:" : "Updated:", ""]
			report += changes.map { "- \($0.code): \(money($0.from)) → \(money($0.to))" }
		}

		let summary = report.joined(separator: "\n")
		print(summary)
		if let path = ProcessInfo.processInfo.environment["GITHUB_STEP_SUMMARY"],
			let handle = FileHandle(forWritingAtPath: path)
		{
			defer { try? handle.close() }
			try handle.seekToEnd()
			try handle.write(contentsOf: Data("\(summary)\n".utf8))
		}

		// --check is the pull-request dry run: a non-zero exit means the page
		// and the data have diverged.
		if check && next != current { exit(1) }
	}
}
