import Foundation
import GRDB

enum AppDatabaseError: Error {
	case missingSeedResource
}

struct AppDatabase: Sendable {
	let dbQueue: DatabaseQueue

	init(dbQueue: DatabaseQueue) throws {
		self.dbQueue = dbQueue
		try Self.migrator.migrate(dbQueue)
	}

	private static var migrator: DatabaseMigrator {
		var migrator = DatabaseMigrator()

		migrator.registerMigration("createHomeItem") { db in
			try db.create(table: "homeItem") { t in
				t.primaryKey("id", .text)
				t.column("title", .text).notNull()
				t.column("sfSymbol", .text).notNull()
				t.column("tintColor", .text).notNull()
				t.column("destinationView", .text)
				t.column("destinationUrl", .text)
				t.check(sql: "(destinationView IS NOT NULL) != (destinationUrl IS NOT NULL)")
			}
		}

		migrator.registerMigration("createHomeItemCustomization") { db in
			try db.create(table: "homeItemCustomization") { t in
				t.primaryKey("itemId", .text)
					.references("homeItem", column: "id")
				t.column("sortOrder", .integer).notNull()
				t.column("isVisible", .boolean).notNull()
			}
		}

		return migrator
	}

	func seedIfNeeded(seedURL: URL? = Bundle.main.url(forResource: "default-items", withExtension: "json")) throws {
		try dbQueue.write { db in
			let count = try HomeItem.fetchCount(db)
			guard count == 0 else { return }

			guard let url = seedURL else {
				throw AppDatabaseError.missingSeedResource
			}

			let data = try Data(contentsOf: url)
			let items = try JSONDecoder().decode([HomeItem].self, from: data)
			for item in items {
				try item.insert(db)
			}
		}
	}
}
