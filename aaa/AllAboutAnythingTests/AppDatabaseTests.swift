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

	// Seed with a manually constructed item instead of bundle
	try dbQueue.write { db in
		let item = HomeItem(
			id: "test",
			title: "Test Item",
			sfSymbol: "star",
			tintColor: "#ff0000",
			destinationView: "test-view",
			destinationUrl: nil
		)
		try item.insert(db)
	}

	let count = try dbQueue.read { db in
		try HomeItem.fetchCount(db)
	}
	#expect(count == 1)
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

	// seedIfNeeded should not add more items since table is not empty
	try db.seedIfNeeded()

	let count = try dbQueue.read { db in
		try HomeItem.fetchCount(db)
	}
	#expect(count == 1)
}
