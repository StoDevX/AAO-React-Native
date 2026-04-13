import Testing
import GRDB
@testable import AllAboutAnything

@Test func fetchHomeItemsReturnsAllItems() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)
	let client = DatabaseClient.live(database: db)

	try dbQueue.write { db in
		try HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil).insert(db)
		try HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: nil, destinationUrl: "https://b.com").insert(db)
	}

	let items = try client.fetchHomeItems()
	#expect(items.count == 2)
	#expect(items[0].item.id == "a")
	#expect(items[0].customization == nil)
}

@Test func fetchHomeItemsIncludesCustomizations() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)
	let client = DatabaseClient.live(database: db)

	try dbQueue.write { db in
		try HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil).insert(db)
		try HomeItemCustomization(itemId: "a", sortOrder: 5, isVisible: false).insert(db)
	}

	let items = try client.fetchHomeItems()
	#expect(items.count == 1)
	#expect(items[0].customization?.sortOrder == 5)
	#expect(items[0].customization?.isVisible == false)
}

@Test func fetchHomeItemsPreservesInsertionOrderWithoutCustomizations() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)
	let client = DatabaseClient.live(database: db)

	try dbQueue.write { db in
		// Insert in non-alphabetical order — test that rowid ordering preserves this
		try HomeItem(id: "zebra", title: "Z", sfSymbol: "z", tintColor: "#000", destinationView: "z", destinationUrl: nil).insert(db)
		try HomeItem(id: "apple", title: "A", sfSymbol: "a", tintColor: "#000", destinationView: "a", destinationUrl: nil).insert(db)
		try HomeItem(id: "mango", title: "M", sfSymbol: "m", tintColor: "#000", destinationView: "m", destinationUrl: nil).insert(db)
	}

	let items = try client.fetchHomeItems()
	#expect(items.map(\.item.id) == ["zebra", "apple", "mango"])
}

@Test func updateCustomizationUpsertsRow() throws {
	let dbQueue = try DatabaseQueue()
	let db = try AppDatabase(dbQueue: dbQueue)
	let client = DatabaseClient.live(database: db)

	try dbQueue.write { db in
		try HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil).insert(db)
	}

	try client.updateCustomization("a", 3, true)

	var items = try client.fetchHomeItems()
	#expect(items[0].customization?.sortOrder == 3)
	#expect(items[0].customization?.isVisible == true)

	try client.updateCustomization("a", 7, false)

	items = try client.fetchHomeItems()
	#expect(items[0].customization?.sortOrder == 7)
	#expect(items[0].customization?.isVisible == false)
}
