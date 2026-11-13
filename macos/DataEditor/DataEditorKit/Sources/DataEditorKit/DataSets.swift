import Foundation

/// The data sets the editor offers, from `data/_datasets.yaml`, in the groups its sidebar shows.
public struct DataSetCatalog: Decodable, Hashable, Sendable {
    public struct Group: Decodable, Hashable, Sendable {
        public let title: String
        public let sets: [String]
        public init(title: String, sets: [String]) {
            self.title = title
            self.sets = sets
        }
    }

    public let groups: [Group]
    public let sets: [String: DataSet]

    public init(groups: [Group], sets: [String: DataSet]) {
        self.groups = groups
        self.sets = sets
    }

    /// The set whose records `file` holds, by name: the set named for the file
    /// itself first, as `bus-times/_curation.yaml` is, then the folder set it is in.
    public func set(for file: String) -> String? {
        if let exact = sets.first(where: { $0.value.shape != .folder && $0.value.path == file }) { return exact.key }
        let folder = (file as NSString).deletingLastPathComponent
        return sets.first { $0.value.shape == .folder && $0.value.path == folder }?.key
    }
}

/// One data set: where its records live, how a record is named, and what may change it.
public struct DataSet: Decodable, Hashable, Sendable {
    public enum Shape: String, Decodable, Sendable {
        /// one record per file in `path`
        case folder
        /// one record per item or entry of the list at `list` in the file `path`
        case list
        /// the whole file at `path` is one record
        case file
        /// the file at `path` is prose, edited as text
        case document
    }

    public enum Form: String, Decodable, Sendable { case generated, hours, breaks }

    /// Files a scrape writes, and the fields of them it owns.
    public struct Scraped: Decodable, Hashable, Sendable {
        public let files: [String]
        public let fields: [String]
        public let by: String
    }

    /// Files a generator writes whole.
    public struct Generated: Decodable, Hashable, Sendable {
        public let files: [String]
        public let by: String
    }

    /// The scrape or generator a set steers: an edit changes `what` when `run` next runs.
    public struct Steers: Decodable, Hashable, Sendable {
        public let what: String
        public let run: String
        public init(what: String, run: String) {
            self.what = what
            self.run = run
        }
    }

    public let title: String
    /// What one record is called: "New Contact", "Untitled Contact".
    public let record: String
    public let shape: Shape
    public let path: String
    public let list: [PathKey]?
    public let schema: String?
    public let sectionField: String?
    public let ordered: Bool
    public let form: Form
    public let scraped: Scraped?
    public let generated: Generated?
    public let readOnly: String?
    public let maintainedBy: String?
    public let steers: Steers?
    public let stampOnSave: String?

    private enum CodingKeys: String, CodingKey {
        case title, record, shape, path, list, schema, sectionField, ordered, form, scraped, generated
        case readOnly, maintainedBy, steers, stampOnSave
    }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        title = try container.decode(String.self, forKey: .title)
        record = try container.decode(String.self, forKey: .record)
        shape = try container.decode(Shape.self, forKey: .shape)
        path = try container.decode(String.self, forKey: .path)
        list = try container.decodeIfPresent([PathKey].self, forKey: .list)
        schema = try container.decodeIfPresent(String.self, forKey: .schema)
        sectionField = try container.decodeIfPresent(String.self, forKey: .sectionField)
        ordered = try container.decodeIfPresent(Bool.self, forKey: .ordered) ?? false
        form = try container.decodeIfPresent(Form.self, forKey: .form) ?? .generated
        scraped = try container.decodeIfPresent(Scraped.self, forKey: .scraped)
        generated = try container.decodeIfPresent(Generated.self, forKey: .generated)
        readOnly = try container.decodeIfPresent(String.self, forKey: .readOnly)
        maintainedBy = try container.decodeIfPresent(String.self, forKey: .maintainedBy)
        steers = try container.decodeIfPresent(Steers.self, forKey: .steers)
        stampOnSave = try container.decodeIfPresent(String.self, forKey: .stampOnSave)
    }
}

/// Where a record is: its file, and the path to it inside the file (empty for the whole file).
public struct RecordRef: Hashable, Codable, Sendable {
    public let file: String
    public let path: [PathKey]
    public init(file: String, path: [PathKey]) {
        self.file = file
        self.path = path
    }
}

/// A record as a set's list shows it.
public struct RecordSummary: Decodable, Hashable, Sendable, Identifiable {
    public let set: String
    public let ref: RecordRef
    public let title: String
    public let subtitle: String?
    public let section: String?
    /// False for a read-only set's records and a generator's files.
    public let editable: Bool
    public var id: RecordRef { ref }

    public init(set: String, ref: RecordRef, title: String, subtitle: String?, section: String?, editable: Bool) {
        self.set = set
        self.ref = ref
        self.title = title
        self.subtitle = subtitle
        self.section = section
        self.editable = editable
    }

    private enum CodingKeys: String, CodingKey { case set, file, path, title, subtitle, section, editable }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        set = try container.decode(String.self, forKey: .set)
        ref = RecordRef(file: try container.decode(String.self, forKey: .file),
                        path: try container.decode([PathKey].self, forKey: .path))
        title = try container.decode(String.self, forKey: .title)
        subtitle = try container.decodeIfPresent(String.self, forKey: .subtitle)
        section = try container.decodeIfPresent(String.self, forKey: .section)
        editable = try container.decode(Bool.self, forKey: .editable)
    }
}

/// A set's records after a call, what is wrong with the files it touched, and the record it made.
public struct RecordsReply: Decodable, Hashable, Sendable {
    public let records: [RecordSummary]
    public let problems: [Problem]
    public let created: RecordSummary?
}

private struct SetParams: Encodable, Sendable { let set: String }
private struct CreateParams: Encodable, Sendable { let set: String; let title: String; let section: String? }
private struct RecordParams: Encodable, Sendable { let set: String; let file: String; let path: [PathKey] }
private struct ReorderParams: Encodable, Sendable { let set: String; let order: [RecordRef] }
private struct FileOnlyParams: Encodable, Sendable { let file: String }
private struct WriteTextParams: Encodable, Sendable { let file: String; let text: String }

extension HelperClient {
    public func datasets() async throws -> DataSetCatalog { try await call("datasets", [String: String]()) }
    public func records(set: String) async throws -> RecordsReply { try await call("records", SetParams(set: set)) }
    /// The schema of one record of `set`, its references inlined.
    public func schema(set: String) async throws -> JSONValue { try await call("schema", SetParams(set: set)) }
    public func create(set: String, title: String, section: String?) async throws -> RecordsReply {
        try await call("create", CreateParams(set: set, title: title, section: section))
    }
    public func remove(set: String, record: RecordRef) async throws -> RecordsReply {
        try await call("remove", RecordParams(set: set, file: record.file, path: record.path))
    }
    public func reorder(set: String, order: [RecordRef]) async throws -> RecordsReply {
        try await call("reorder", ReorderParams(set: set, order: order))
    }
    public func readText(_ file: String) async throws -> String { try await call("readText", FileOnlyParams(file: file)) }
    public func writeText(_ file: String, _ text: String) async throws {
        let _: JSONValue = try await call("writeText", WriteTextParams(file: file, text: text))
    }
}
