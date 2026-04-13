import Foundation
import GRDB

struct HomeItemCustomization: Codable, Identifiable, Equatable, Sendable {
	var itemId: String
	var sortOrder: Int
	var isVisible: Bool

	var id: String { itemId }
}

extension HomeItemCustomization: FetchableRecord, PersistableRecord {
	static let databaseTableName = "homeItemCustomization"

	enum Columns {
		static let itemId = Column(CodingKeys.itemId)
		static let sortOrder = Column(CodingKeys.sortOrder)
		static let isVisible = Column(CodingKeys.isVisible)
	}
}
