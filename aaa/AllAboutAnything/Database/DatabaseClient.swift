import ComposableArchitecture
import Foundation
import GRDB

struct HomeItemWithCustomization: Equatable, Sendable {
	let item: HomeItem
	let customization: HomeItemCustomization?
}

struct DatabaseClient: Sendable {
	var fetchHomeItems: @Sendable () throws -> [HomeItemWithCustomization]
	var updateCustomization: @Sendable (_ itemId: String, _ sortOrder: Int, _ isVisible: Bool) throws -> Void
	var seedIfNeeded: @Sendable () throws -> Void
}

extension DatabaseClient {
	static func live(database: AppDatabase) -> DatabaseClient {
		DatabaseClient(
			fetchHomeItems: {
				try database.dbQueue.read { db in
					let rows = try Row.fetchAll(db, sql: """
						SELECT homeItem.*, homeItemCustomization.sortOrder, homeItemCustomization.isVisible
						FROM homeItem
						LEFT JOIN homeItemCustomization ON homeItem.id = homeItemCustomization.itemId
						ORDER BY homeItemCustomization.sortOrder NULLS LAST, homeItem.id
						""")

					return try rows.map { row in
						let item = try HomeItem(row: row)
						let customization: HomeItemCustomization?
						if let sortOrder: Int = row["sortOrder"],
						   let isVisible: Bool = row["isVisible"] {
							customization = HomeItemCustomization(
								itemId: item.id,
								sortOrder: sortOrder,
								isVisible: isVisible
							)
						} else {
							customization = nil
						}
						return HomeItemWithCustomization(item: item, customization: customization)
					}
				}
			},
			updateCustomization: { itemId, sortOrder, isVisible in
				try database.dbQueue.write { db in
					let customization = HomeItemCustomization(
						itemId: itemId,
						sortOrder: sortOrder,
						isVisible: isVisible
					)
					try customization.upsert(db)
				}
			},
			seedIfNeeded: {
				try database.seedIfNeeded()
			}
		)
	}
}

extension DatabaseClient: DependencyKey {
	static let liveValue: DatabaseClient = {
		let path = URL.documentsDirectory.appending(path: "db.sqlite").path()
		let dbQueue = try! DatabaseQueue(path: path)
		let database = try! AppDatabase(dbQueue: dbQueue)
		return .live(database: database)
	}()

	static let testValue = DatabaseClient(
		fetchHomeItems: { fatalError("fetchHomeItems not overridden in test") },
		updateCustomization: { _, _, _ in fatalError("updateCustomization not overridden in test") },
		seedIfNeeded: { fatalError("seedIfNeeded not overridden in test") }
	)
}

extension DependencyValues {
	var databaseClient: DatabaseClient {
		get { self[DatabaseClient.self] }
		set { self[DatabaseClient.self] = newValue }
	}
}
