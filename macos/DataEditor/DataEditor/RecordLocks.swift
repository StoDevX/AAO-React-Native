import DataEditorKit
import Foundation

/// What may change a record, and what an edit to it does besides.
extension AppModel {
    /// Why `file` of `set` cannot be edited now, or nil if it can: the set is
    /// read only, a generator writes the file, the data is updating, or the
    /// file changed on GitHub too.
    static func lockReason(set: DataSet, file: String, updating: Bool, conflicted: Bool) -> String? {
        if let readOnly = set.readOnly { return readOnly }
        if let generated = set.generated, generated.files.contains((file as NSString).lastPathComponent) { return generated.by }
        if updating { return "Editing waits while the data updates." }
        if conflicted { return "This file changed on GitHub too." }
        return nil
    }

    /// The top-level fields of `file` a scrape writes, which its form shows but does not edit.
    static func scrapedFields(set: DataSet, file: String) -> Set<String> {
        guard let scraped = set.scraped, scraped.files.contains((file as NSString).lastPathComponent) else { return [] }
        return Set(scraped.fields)
    }

    /// `ops` with `field` set to `today` as well, unless they set it already:
    /// a set whose scrape keeps a hand edit dated after its source is stamped on every edit.
    static func stamped(_ ops: [EditOp], field: String?, today: String) -> [EditOp] {
        guard let field, !ops.contains(where: { $0.path == [.key(field)] }) else { return ops }
        return ops + [.set([.key(field)], .string(today))]
    }

    /// Today's date in Minnesota, at midnight UTC, the form the KSTO schedule's `updated` takes.
    static func stampForToday(_ now: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/Chicago")!
        let day = calendar.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02dT00:00:00Z", day.year!, day.month!, day.day!)
    }

    /// Whether `file` is data the helper reads, rather than a prose document edited as text.
    static func loadsAsData(_ file: String, catalog: DataSetCatalog?) -> Bool {
        guard let set = catalog?.set(for: file) else { return true }
        return catalog?.sets[set]?.shape != .document
    }

    /// What a set that steers a scrape or generator says above its records.
    static func steersNotice(_ steers: DataSet.Steers) -> String {
        "An edit here changes \(steers.what) the next time \(steers.run) runs. The preview won't show it."
    }
}
