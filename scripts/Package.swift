// swift-tools-version: 6.2

// The Swift build and CI scripts. Each file sits beside the .mjs scripts and
// is named into a target by hand, since SwiftPM's default layout would move it
// under Sources/.

import Foundation
import PackageDescription

private let files = (try? FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)) ?? []

/// A target over these files in this directory. SwiftPM warns about every
/// other file it finds in a target's path, so the rest are excluded.
private func flat(_ sources: [String]) -> (path: String, exclude: [String], sources: [String]) {
	(".", files.filter { !sources.contains($0) }, sources)
}

private let htmlText = flat(["html-text.swift"])
private let studentWages = flat(["student-wages.swift"])
private let scrapeStudentWages = flat(["scrape-student-wages.swift"])
private let tests = flat(["html-text.test.swift", "student-wages.test.swift"])

let package = Package(
	name: "scripts",
	platforms: [.macOS(.v26)],
	dependencies: [
		.package(url: "https://github.com/jpsim/Yams.git", from: "6.2.2"),
	],
	targets: [
		.target(
			name: "HTMLText",
			path: htmlText.path,
			exclude: htmlText.exclude,
			sources: htmlText.sources,
		),
		.target(
			name: "StudentWages",
			dependencies: ["HTMLText"],
			path: studentWages.path,
			exclude: studentWages.exclude,
			sources: studentWages.sources,
		),
		.executableTarget(
			name: "scrape-student-wages",
			dependencies: ["StudentWages", "Yams"],
			path: scrapeStudentWages.path,
			exclude: scrapeStudentWages.exclude,
			sources: scrapeStudentWages.sources,
		),
		.testTarget(
			name: "ScriptTests",
			dependencies: ["HTMLText", "StudentWages", "Yams"],
			path: tests.path,
			exclude: tests.exclude,
			sources: tests.sources,
		),
	],
)
