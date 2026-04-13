import Foundation
import Testing
import GRDB
@testable import AllAboutAnything

@Test func migrationCreatesHomeItemTable() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	try dbQueue.read { db in
		let columns = try db.columns(in: "homeItem")
		let columnNames = columns.map(\.name)
		#expect(columnNames.contains("id"))
		#expect(columnNames.contains("title"))
		#expect(columnNames.contains("sfSymbol"))
		#expect(columnNames.contains("tintColor"))
		#expect(columnNames.contains("destinationView"))
		#expect(columnNames.contains("destinationUrl"))
	}
}

@Test func migrationCreatesHomeItemCustomizationTable() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	try dbQueue.read { db in
		let columns = try db.columns(in: "homeItemCustomization")
		let columnNames = columns.map(\.name)
		#expect(columnNames.contains("itemId"))
		#expect(columnNames.contains("sortOrder"))
		#expect(columnNames.contains("isVisible"))
	}
}

@Test func xorConstraintRejectsBothDestinationsNull() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	#expect(throws: (any Error).self) {
		try dbQueue.write { db in
			try db.execute(
				sql: """
					INSERT INTO homeItem (id, title, sfSymbol, tintColor, destinationView, destinationUrl)
					VALUES ('test', 'Test', 'star', '#000', NULL, NULL)
					"""
			)
		}
	}
}

@Test func xorConstraintRejectsBothDestinationsSet() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	#expect(throws: (any Error).self) {
		try dbQueue.write { db in
			try db.execute(
				sql: """
					INSERT INTO homeItem (id, title, sfSymbol, tintColor, destinationView, destinationUrl)
					VALUES ('test', 'Test', 'star', '#000', 'view', 'https://example.com')
					"""
			)
		}
	}
}

@Test func seedInsertsItemsFromJSON() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	let tempDir = FileManager.default.temporaryDirectory
		.appendingPathComponent(UUID().uuidString, isDirectory: true)
	try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
	defer { try? FileManager.default.removeItem(at: tempDir) }

	let jsonURL = tempDir.appendingPathComponent("default-items.json")
	let fixtureJSON = """
		[
			{"id": "a", "title": "A", "sfSymbol": "star", "tintColor": "#000", "destinationView": "a"},
			{"id": "b", "title": "B", "sfSymbol": "circle", "tintColor": "#111", "destinationUrl": "https://b.com"}
		]
		"""
	try fixtureJSON.write(to: jsonURL, atomically: true, encoding: .utf8)

	try db.seedIfNeeded(seedURL: jsonURL)

	let items = try dbQueue.read { db in
		try HomeItem.fetchAll(db)
	}
	#expect(items.count == 2)
	#expect(items.contains(where: { $0.id == "a" && $0.destinationView == "a" }))
	#expect(items.contains(where: { $0.id == "b" && $0.destinationUrl == "https://b.com" }))
}

@Test func seedSkipsWhenItemsExist() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	try dbQueue.write { db in
		let item = HomeItem(
			id: "existing",
			title: "Existing",
			sfSymbol: "star",
			tintColor: "#000",
			destinationView: "test",
			destinationUrl: nil
		)
		try item.insert(db)
	}

	// seedIfNeeded should early-return because count > 0, even with nil seedURL
	try db.seedIfNeeded(seedURL: nil)

	let count = try dbQueue.read { db in
		try HomeItem.fetchCount(db)
	}
	#expect(count == 1)
}

@Test func seedThrowsWhenResourceMissingAndTableEmpty() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)

	#expect(throws: AppDatabaseError.self) {
		try db.seedIfNeeded(seedURL: nil)
	}
}
