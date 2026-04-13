import Foundation
import GRDB

struct HomeItem: Codable, Identifiable, Equatable, Sendable {
	var id: String
	var title: String
	var sfSymbol: String
	var tintColor: String
	var destinationView: String?
	var destinationUrl: String?
}

extension HomeItem: FetchableRecord, PersistableRecord {
	static let databaseTableName = "homeItem"

	enum Columns {
		static let id = Column(CodingKeys.id)
		static let title = Column(CodingKeys.title)
		static let sfSymbol = Column(CodingKeys.sfSymbol)
		static let tintColor = Column(CodingKeys.tintColor)
		static let destinationView = Column(CodingKeys.destinationView)
		static let destinationUrl = Column(CodingKeys.destinationUrl)
	}
}
