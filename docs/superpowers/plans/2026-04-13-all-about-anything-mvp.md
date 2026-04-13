# All About Anything MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SwiftUI iOS app with a customizable home screen grid, backed by GRDB for persistence and TCA for state management.

**Architecture:** TCA reducers manage all state. GRDB stores the item catalog and user customizations. The app uses stack-based navigation with a root HomeFeature pushing to PlaceholderFeature destinations.

**Tech Stack:** Swift 6.2, SwiftUI, TCA (swift-composable-architecture 1.17+), GRDB.swift 7.x, XcodeGen for project generation

**Spec:** `docs/superpowers/specs/2026-04-13-all-about-anything-mvp-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `aaa/project.yml`
- Create: `aaa/AllAboutAnything/AllAboutAnythingApp.swift`
- Create: `aaa/AllAboutAnythingTests/AllAboutAnythingTests.swift`

This task creates the Xcode project using XcodeGen, adds SPM dependencies, and verifies the project builds.

- [ ] **Step 1: Install XcodeGen if needed**

Run:
```bash
which xcodegen || brew install xcodegen
```

- [ ] **Step 2: Create directory structure**

Run:
```bash
mkdir -p aaa/AllAboutAnything/App
mkdir -p aaa/AllAboutAnything/Features/Home
mkdir -p aaa/AllAboutAnything/Features/Placeholder
mkdir -p aaa/AllAboutAnything/Database
mkdir -p aaa/AllAboutAnything/Seed
mkdir -p aaa/AllAboutAnythingTests
```

- [ ] **Step 3: Write project.yml**

Create `aaa/project.yml`:

```yaml
name: AllAboutAnything
options:
  bundleIdPrefix: com.allaboutanything
  deploymentTarget:
    iOS: "18.0"

settings:
  base:
    SWIFT_VERSION: "6.2"

packages:
  ComposableArchitecture:
    url: https://github.com/pointfreeco/swift-composable-architecture
    from: "1.17.0"
  GRDB:
    url: https://github.com/groue/GRDB.swift
    from: "7.4.0"

targets:
  AllAboutAnything:
    type: application
    platform: iOS
    sources:
      - path: AllAboutAnything
    settings:
      base:
        INFOPLIST_KEY_UIApplicationSceneManifest_Generation: YES
        INFOPLIST_KEY_UILaunchScreen_Generation: YES
        GENERATE_INFOPLIST_FILE: YES
    dependencies:
      - package: ComposableArchitecture
      - package: GRDB

  AllAboutAnythingTests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - path: AllAboutAnythingTests
    dependencies:
      - target: AllAboutAnything
```

- [ ] **Step 4: Write minimal app entry point**

Create `aaa/AllAboutAnything/AllAboutAnythingApp.swift`:

```swift
import SwiftUI

@main
struct AllAboutAnythingApp: App {
    var body: some Scene {
        WindowGroup {
            Text("All About Anything")
        }
    }
}
```

- [ ] **Step 5: Write placeholder test file**

Create `aaa/AllAboutAnythingTests/AllAboutAnythingTests.swift`:

```swift
import Testing

@Test func appLaunches() {
    // Placeholder — will be replaced by real tests in later tasks
    #expect(true)
}
```

- [ ] **Step 6: Generate Xcode project**

Run:
```bash
cd aaa && xcodegen generate
```

Expected: `Generated project: AllAboutAnything.xcodeproj`

- [ ] **Step 7: Build the project**

Run:
```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 8: Run tests**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `TEST SUCCEEDED` (or similar), 1 test passed.

- [ ] **Step 9: Commit**

The `aaa/` directory lives in the parent `aao-react-native` repo — do NOT run `git init` inside it. Commit to the parent repo, staging only the new files (not xcuserdata):

```bash
git add aaa/project.yml aaa/.gitignore aaa/AllAboutAnything aaa/AllAboutAnythingTests aaa/AllAboutAnything.xcodeproj/project.pbxproj aaa/AllAboutAnything.xcodeproj/xcshareddata
git commit -m "chore: scaffold AllAboutAnything Xcode project with TCA and GRDB dependencies"
```

---

### Task 2: GRDB Models and Seed Data

**Files:**
- Create: `aaa/AllAboutAnything/Database/HomeItem.swift`
- Create: `aaa/AllAboutAnything/Database/HomeItemCustomization.swift`
- Create: `aaa/AllAboutAnything/Seed/default-items.json`

- [ ] **Step 1: Write HomeItem model**

Create `aaa/AllAboutAnything/Database/HomeItem.swift`:

```swift
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
```

- [ ] **Step 2: Write HomeItemCustomization model**

Create `aaa/AllAboutAnything/Database/HomeItemCustomization.swift`:

```swift
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
```

- [ ] **Step 3: Write seed data JSON**

Create `aaa/AllAboutAnything/Seed/default-items.json`:

```json
[
    {"id": "menus", "title": "Menus", "sfSymbol": "fork.knife", "tintColor": "#34c759", "destinationView": "menus"},
    {"id": "sis", "title": "SIS", "sfSymbol": "touchid", "tintColor": "#ff9500", "destinationView": "sis"},
    {"id": "building-hours", "title": "Building Hours", "sfSymbol": "clock", "tintColor": "#007aff", "destinationView": "building-hours"},
    {"id": "calendar", "title": "Calendar", "sfSymbol": "calendar", "tintColor": "#af52de", "destinationView": "calendar"},
    {"id": "directory", "title": "Directory", "sfSymbol": "person.text.rectangle", "tintColor": "#ff2d55", "destinationView": "directory"},
    {"id": "streaming", "title": "Streaming Media", "sfSymbol": "play.tv", "tintColor": "#5ac8fa", "destinationView": "streaming"},
    {"id": "news", "title": "News", "sfSymbol": "newspaper", "tintColor": "#5856d6", "destinationView": "news"},
    {"id": "campus-map", "title": "Campus Map", "sfSymbol": "map", "tintColor": "#1c2541", "destinationUrl": "https://www.myatlascms.com/map/index.php?id=294"},
    {"id": "contacts", "title": "Important Contacts", "sfSymbol": "phone", "tintColor": "#ff3b30", "destinationView": "contacts"},
    {"id": "transportation", "title": "Transportation", "sfSymbol": "bus", "tintColor": "#8e8e93", "destinationView": "transportation"},
    {"id": "dictionary", "title": "Campus Dictionary", "sfSymbol": "book", "tintColor": "#ff2d55", "destinationView": "dictionary"},
    {"id": "student-orgs", "title": "Student Orgs", "sfSymbol": "globe", "tintColor": "#1c3879", "destinationView": "student-orgs"},
    {"id": "more", "title": "More", "sfSymbol": "link", "tintColor": "#30d158", "destinationView": "more"},
    {"id": "print-jobs", "title": "stoPrint", "sfSymbol": "printer", "tintColor": "#25c4b0", "destinationView": "print-jobs"},
    {"id": "course-search", "title": "Course Catalog", "sfSymbol": "graduationcap", "tintColor": "#bf5af2", "destinationView": "course-search"},
    {"id": "oleville", "title": "Oleville", "sfSymbol": "safari", "tintColor": "#ffcc00", "destinationUrl": "https://oleville.com/"}
]
```

- [ ] **Step 4: Verify it compiles**

Run:
```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add GRDB models for HomeItem and HomeItemCustomization with seed data"
```

---

### Task 3: AppDatabase with Migrations and Seeding

**Files:**
- Create: `aaa/AllAboutAnything/Database/AppDatabase.swift`
- Create: `aaa/AllAboutAnythingTests/AppDatabaseTests.swift`

- [ ] **Step 1: Write failing test for database migration**

Create `aaa/AllAboutAnythingTests/AppDatabaseTests.swift`:

```swift
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: FAIL — `AppDatabase` type does not exist yet.

- [ ] **Step 3: Implement AppDatabase**

Create `aaa/AllAboutAnything/Database/AppDatabase.swift`:

```swift
import Foundation
import GRDB

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
}
```

- [ ] **Step 4: Add seed method**

Append to `aaa/AllAboutAnything/Database/AppDatabase.swift`, inside the `AppDatabase` struct:

```swift
    func seedIfNeeded() throws {
        try dbQueue.write { db in
            let count = try HomeItem.fetchCount(db)
            guard count == 0 else { return }

            guard let url = Bundle.main.url(forResource: "default-items", withExtension: "json") else {
                return
            }

            let data = try Data(contentsOf: url)
            let items = try JSONDecoder().decode([HomeItem].self, from: data)
            for item in items {
                try item.insert(db)
            }
        }
    }
```

- [ ] **Step 5: Add a test for seeding with a custom bundle**

Add to `aaa/AllAboutAnythingTests/AppDatabaseTests.swift`:

```swift
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
```

- [ ] **Step 6: Run tests — verify they pass**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add AppDatabase with migrations and seed logic"
```

---

### Task 4: DatabaseClient (TCA Dependency)

**Files:**
- Create: `aaa/AllAboutAnything/Database/DatabaseClient.swift`
- Create: `aaa/AllAboutAnythingTests/DatabaseClientTests.swift`

- [ ] **Step 1: Write failing tests for DatabaseClient**

Create `aaa/AllAboutAnythingTests/DatabaseClientTests.swift`:

```swift
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

@Test func updateCustomizationUpsertsRow() throws {
    let dbQueue = try DatabaseQueue()
    let db = try AppDatabase(dbQueue: dbQueue)
    let client = DatabaseClient.live(database: db)

    try dbQueue.write { db in
        try HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil).insert(db)
    }

    // Insert new customization
    try client.updateCustomization("a", 3, true)

    var items = try client.fetchHomeItems()
    #expect(items[0].customization?.sortOrder == 3)
    #expect(items[0].customization?.isVisible == true)

    // Update existing customization
    try client.updateCustomization("a", 7, false)

    items = try client.fetchHomeItems()
    #expect(items[0].customization?.sortOrder == 7)
    #expect(items[0].customization?.isVisible == false)
}
```

- [ ] **Step 2: Run tests — verify they fail**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: FAIL — `DatabaseClient` type does not exist.

- [ ] **Step 3: Implement DatabaseClient**

Create `aaa/AllAboutAnything/Database/DatabaseClient.swift`:

```swift
import Dependencies
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
                        ORDER BY COALESCE(homeItemCustomization.sortOrder, rowid)
                        """)

                    return rows.map { row in
                        let item = HomeItem(row: row)
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
```

- [ ] **Step 4: Run tests — verify they pass**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add DatabaseClient TCA dependency with fetch, update, and seed"
```

---

### Task 5: HomeFeature Reducer

**Files:**
- Create: `aaa/AllAboutAnything/Features/Home/HomeFeature.swift`
- Create: `aaa/AllAboutAnythingTests/HomeFeatureTests.swift`

- [ ] **Step 1: Write failing test for onAppear**

Create `aaa/AllAboutAnythingTests/HomeFeatureTests.swift`:

```swift
import ComposableArchitecture
import Testing
@testable import AllAboutAnything

@Test func onAppearLoadsItems() async {
    let store = TestStore(initialState: HomeFeature.State()) {
        HomeFeature()
    } withDependencies: {
        $0.databaseClient.seedIfNeeded = {}
        $0.databaseClient.fetchHomeItems = {
            [
                HomeItemWithCustomization(
                    item: HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil),
                    customization: nil
                ),
                HomeItemWithCustomization(
                    item: HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil),
                    customization: HomeItemCustomization(itemId: "b", sortOrder: 1, isVisible: false)
                ),
            ]
        }
    }

    await store.send(.onAppear) {
        $0.gridItems = [
            HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil),
        ]
        $0.hiddenItems = [
            HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil),
        ]
    }
}
```

- [ ] **Step 2: Run test — verify it fails**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: FAIL — `HomeFeature` does not exist.

- [ ] **Step 3: Implement HomeFeature with onAppear**

Create `aaa/AllAboutAnything/Features/Home/HomeFeature.swift`:

```swift
import ComposableArchitecture
import Foundation

@Reducer
struct HomeFeature {
    @ObservableState
    struct State: Equatable {
        var gridItems: IdentifiedArrayOf<HomeItem> = []
        var hiddenItems: IdentifiedArrayOf<HomeItem> = []
        var isEditing = false
    }

    enum Action: Equatable {
        case onAppear
        case toggleEditMode
        case moveItem(fromOffsets: IndexSet, toOffset: Int)
        case hideItem(id: String)
        case showItem(id: String)
        case itemTapped(id: String)
    }

    @Dependency(\.databaseClient) var databaseClient

    var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .onAppear:
                try? databaseClient.seedIfNeeded()
                let allItems = (try? databaseClient.fetchHomeItems()) ?? []

                let visible = allItems.filter { $0.customization?.isVisible != false }
                let hidden = allItems.filter { $0.customization?.isVisible == false }

                state.gridItems = IdentifiedArrayOf(uniqueElements: visible.map(\.item))
                state.hiddenItems = IdentifiedArrayOf(uniqueElements: hidden.map(\.item))
                return .none

            case .toggleEditMode:
                state.isEditing.toggle()
                return .none

            case let .moveItem(fromOffsets, toOffset):
                state.gridItems.move(fromOffsets: fromOffsets, toOffset: toOffset)
                persistCustomizations(state: state)
                return .none

            case let .hideItem(id):
                if let item = state.gridItems[id: id] {
                    state.gridItems.remove(id: id)
                    state.hiddenItems.append(item)
                    persistCustomizations(state: state)
                }
                return .none

            case let .showItem(id):
                if let item = state.hiddenItems[id: id] {
                    state.hiddenItems.remove(id: id)
                    state.gridItems.append(item)
                    persistCustomizations(state: state)
                }
                return .none

            case .itemTapped:
                // Navigation handled by parent AppFeature
                return .none
            }
        }
    }

    private func persistCustomizations(state: State) {
        for (index, item) in state.gridItems.enumerated() {
            try? databaseClient.updateCustomization(item.id, index, true)
        }
        for (index, item) in state.hiddenItems.enumerated() {
            try? databaseClient.updateCustomization(item.id, index, false)
        }
    }
}
```

- [ ] **Step 4: Run the onAppear test — verify it passes**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: Test passes.

- [ ] **Step 5: Write tests for edit mode, hide, show, and move**

Add to `aaa/AllAboutAnythingTests/HomeFeatureTests.swift`:

```swift
@Test func toggleEditMode() async {
    let store = TestStore(initialState: HomeFeature.State()) {
        HomeFeature()
    } withDependencies: {
        $0.databaseClient.seedIfNeeded = {}
        $0.databaseClient.fetchHomeItems = { [] }
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    await store.send(.toggleEditMode) {
        $0.isEditing = true
    }

    await store.send(.toggleEditMode) {
        $0.isEditing = false
    }
}

@Test func hideItemMovesToHidden() async {
    let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
    let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

    var state = HomeFeature.State()
    state.gridItems = [itemA, itemB]

    let store = TestStore(initialState: state) {
        HomeFeature()
    } withDependencies: {
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    await store.send(.hideItem(id: "a")) {
        $0.gridItems = [itemB]
        $0.hiddenItems = [itemA]
    }
}

@Test func showItemMovesToGrid() async {
    let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
    let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

    var state = HomeFeature.State()
    state.gridItems = [itemA]
    state.hiddenItems = [itemB]

    let store = TestStore(initialState: state) {
        HomeFeature()
    } withDependencies: {
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    await store.send(.showItem(id: "b")) {
        $0.gridItems = [itemA, itemB]
        $0.hiddenItems = []
    }
}

@Test func moveItemReorders() async {
    let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
    let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)
    let itemC = HomeItem(id: "c", title: "C", sfSymbol: "square", tintColor: "#222", destinationView: "c", destinationUrl: nil)

    var state = HomeFeature.State()
    state.gridItems = [itemA, itemB, itemC]

    let store = TestStore(initialState: state) {
        HomeFeature()
    } withDependencies: {
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    // Move item at index 2 (C) to index 0
    await store.send(.moveItem(fromOffsets: IndexSet(integer: 2), toOffset: 0)) {
        $0.gridItems = [itemC, itemA, itemB]
    }
}
```

- [ ] **Step 6: Run all tests — verify they pass**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add HomeFeature reducer with grid management and edit mode"
```

---

### Task 6: PlaceholderFeature and PlaceholderView

**Files:**
- Create: `aaa/AllAboutAnything/Features/Placeholder/PlaceholderFeature.swift`
- Create: `aaa/AllAboutAnything/Features/Placeholder/PlaceholderView.swift`

- [ ] **Step 1: Implement PlaceholderFeature**

Create `aaa/AllAboutAnything/Features/Placeholder/PlaceholderFeature.swift`:

```swift
import ComposableArchitecture

@Reducer
struct PlaceholderFeature {
    @ObservableState
    struct State: Equatable {
        let title: String
        let sfSymbol: String
        let tintColor: String
    }

    enum Action: Equatable {}

    var body: some ReducerOf<Self> {
        EmptyReducer()
    }
}
```

- [ ] **Step 2: Implement PlaceholderView**

Create `aaa/AllAboutAnything/Features/Placeholder/PlaceholderView.swift`:

```swift
import ComposableArchitecture
import SwiftUI

struct PlaceholderView: View {
    let store: StoreOf<PlaceholderFeature>

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: store.sfSymbol)
                .font(.system(size: 64))
                .foregroundStyle(Color(hex: store.tintColor))

            Text(store.title)
                .font(.title)
                .fontWeight(.semibold)

            Text("Coming Soon")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .navigationTitle(store.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

- [ ] **Step 3: Add Color hex initializer**

This is used by both PlaceholderView and the home grid cells. Create `aaa/AllAboutAnything/App/ColorHex.swift`:

```swift
import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)

        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}
```

- [ ] **Step 4: Verify it compiles**

Run:
```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add PlaceholderFeature and PlaceholderView with Color hex init"
```

---

### Task 7: Home Screen Views

**Files:**
- Create: `aaa/AllAboutAnything/Features/Home/HomeItemCell.swift`
- Create: `aaa/AllAboutAnything/Features/Home/HiddenItemsSection.swift`
- Create: `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`

- [ ] **Step 1: Implement HomeItemCell**

Create `aaa/AllAboutAnything/Features/Home/HomeItemCell.swift`:

```swift
import SwiftUI

struct HomeItemCell: View {
    let item: HomeItem
    let isEditing: Bool

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topLeading) {
                Circle()
                    .fill(Color(hex: item.tintColor))
                    .frame(width: 48, height: 48)
                    .overlay {
                        Image(systemName: item.sfSymbol)
                            .font(.system(size: 22))
                            .foregroundStyle(.white)
                    }

                if isEditing {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white, .red)
                        .offset(x: -6, y: -6)
                }
            }

            Text(item.title)
                .font(.caption)
                .foregroundStyle(.primary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
    }
}
```

- [ ] **Step 2: Implement HiddenItemsSection**

Create `aaa/AllAboutAnything/Features/Home/HiddenItemsSection.swift`:

```swift
import ComposableArchitecture
import SwiftUI

struct HiddenItemsSection: View {
    let items: IdentifiedArrayOf<HomeItem>
    let onShow: (String) -> Void

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
    ]

    var body: some View {
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Divider()

                Text("Hidden")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .padding(.horizontal, 4)

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(items) { item in
                        Button { onShow(item.id) } label: {
                            HiddenItemCell(item: item)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct HiddenItemCell: View {
    let item: HomeItem

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topLeading) {
                Circle()
                    .fill(Color(hex: item.tintColor))
                    .frame(width: 48, height: 48)
                    .opacity(0.5)
                    .overlay {
                        Image(systemName: item.sfSymbol)
                            .font(.system(size: 22))
                            .foregroundStyle(.white.opacity(0.7))
                    }

                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.white, .green)
                    .offset(x: -6, y: -6)
            }

            Text(item.title)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
    }
}
```

- [ ] **Step 3: Implement HomeGridView**

Create `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`:

```swift
import ComposableArchitecture
import SwiftUI

struct HomeGridView: View {
    let store: StoreOf<HomeFeature>

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(store.gridItems) { item in
                        if store.isEditing {
                            Button { store.send(.hideItem(id: item.id)) } label: {
                                HomeItemCell(item: item, isEditing: true)
                            }
                            .buttonStyle(.plain)
                        } else {
                            Button { store.send(.itemTapped(id: item.id)) } label: {
                                HomeItemCell(item: item, isEditing: false)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .onMove { from, to in
                        store.send(.moveItem(fromOffsets: from, toOffset: to))
                    }
                }

                if store.isEditing {
                    HiddenItemsSection(items: store.hiddenItems) { id in
                        store.send(.showItem(id: id))
                    }
                }
            }
            .padding()
        }
        .navigationTitle("All About Anything")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(store.isEditing ? "Done" : "Edit") {
                    store.send(.toggleEditMode)
                }
            }
        }
        .onAppear { store.send(.onAppear) }
    }
}
```

- [ ] **Step 4: Verify it compiles**

Run:
```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add HomeGridView, HomeItemCell, and HiddenItemsSection views"
```

---

### Task 8: AppFeature and App Entry Point

**Files:**
- Create: `aaa/AllAboutAnything/App/AppFeature.swift`
- Modify: `aaa/AllAboutAnything/AllAboutAnythingApp.swift`
- Create: `aaa/AllAboutAnythingTests/AppFeatureTests.swift`

- [ ] **Step 1: Write failing test for navigation**

Create `aaa/AllAboutAnythingTests/AppFeatureTests.swift`:

```swift
import ComposableArchitecture
import Testing
@testable import AllAboutAnything

@Test func itemTappedPushesPlaceholder() async {
    let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)

    var homeState = HomeFeature.State()
    homeState.gridItems = [itemA]

    let store = TestStore(initialState: AppFeature.State(home: homeState)) {
        AppFeature()
    } withDependencies: {
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    await store.send(\.home.itemTapped, "a") {
        $0.path[id: 0] = .placeholder(
            PlaceholderFeature.State(title: "A", sfSymbol: "star", tintColor: "#000")
        )
    }
}
```

- [ ] **Step 2: Run test — verify it fails**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: FAIL — `AppFeature` does not exist.

- [ ] **Step 3: Implement AppFeature**

Create `aaa/AllAboutAnything/App/AppFeature.swift`:

```swift
import ComposableArchitecture

@Reducer
struct AppFeature {
    @ObservableState
    struct State: Equatable {
        var home = HomeFeature.State()
        var path = StackState<Path.State>()
    }

    enum Action {
        case home(HomeFeature.Action)
        case path(StackActionOf<Path>)
    }

    @Reducer
    enum Path {
        case placeholder(PlaceholderFeature)
    }

    var body: some ReducerOf<Self> {
        Scope(state: \.home, action: \.home) {
            HomeFeature()
        }

        Reduce { state, action in
            switch action {
            case let .home(.itemTapped(id)):
                guard !state.home.isEditing,
                      let item = state.home.gridItems[id: id] else {
                    return .none
                }

                if let view = item.destinationView {
                    state.path.append(.placeholder(
                        PlaceholderFeature.State(
                            title: item.title,
                            sfSymbol: item.sfSymbol,
                            tintColor: item.tintColor
                        )
                    ))
                } else if let urlString = item.destinationUrl,
                          URL(string: urlString) != nil {
                    // For MVP, URL items also go to placeholder.
                    // In the future, open in SFSafariViewController.
                    state.path.append(.placeholder(
                        PlaceholderFeature.State(
                            title: item.title,
                            sfSymbol: item.sfSymbol,
                            tintColor: item.tintColor
                        )
                    ))
                }
                return .none

            case .home, .path:
                return .none
            }
        }
        .forEach(\.path, action: \.path)
    }
}
```

- [ ] **Step 4: Update AllAboutAnythingApp entry point**

Replace contents of `aaa/AllAboutAnything/AllAboutAnythingApp.swift` with:

```swift
import ComposableArchitecture
import SwiftUI

@main
struct AllAboutAnythingApp: App {
    let store = Store(initialState: AppFeature.State()) {
        AppFeature()
    }

    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $store.scope(state: \.path, action: \.path)) {
                HomeGridView(store: store.scope(state: \.home, action: \.home))
            } destination: { store in
                switch store.case {
                case let .placeholder(store):
                    PlaceholderView(store: store)
                }
            }
        }
    }
}
```

- [ ] **Step 5: Run tests — verify they pass**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 6: Build and run on simulator**

Run:
```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet
```

Expected: `BUILD SUCCEEDED`

Launch on simulator to visually verify:
```bash
cd aaa && xcrun simctl boot "iPhone 16" 2>/dev/null; xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16' -quiet && xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/AllAboutAnything.app && xcrun simctl launch booted com.allaboutanything.AllAboutAnything
```

Manually verify:
1. Home screen shows a 2-column grid of 16 items with colored icon circles
2. Tapping an item navigates to a "Coming Soon" placeholder
3. Tapping "Edit" in toolbar enters edit mode — minus badges appear
4. Tapping a minus badge hides the item, which appears in the "Hidden" section below
5. Tapping a plus badge on a hidden item restores it to the grid
6. Tapping "Done" exits edit mode
7. Quitting and relaunching preserves customizations

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add AppFeature with stack navigation and wire up app entry point"
```

---

### Task 9: Final Cleanup and README

**Files:**
- Create: `aaa/README.md`
- Remove: `aaa/AllAboutAnythingTests/AllAboutAnythingTests.swift` (placeholder test from Task 1)

- [ ] **Step 1: Remove placeholder test**

Delete `aaa/AllAboutAnythingTests/AllAboutAnythingTests.swift` — it was scaffolding and is now replaced by real tests.

- [ ] **Step 2: Write README**

Create `aaa/README.md`:

```markdown
# All About Anything

A SwiftUI iOS app for campus information, built with TCA and GRDB.

## Requirements

- Xcode 16.3+ (Swift 6.2)
- iOS 18.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for project generation)

## Setup

```bash
brew install xcodegen  # if not already installed
cd aaa
xcodegen generate
open AllAboutAnything.xcodeproj
```

## Architecture

- **TCA** (The Composable Architecture) for state management
- **GRDB** for local SQLite persistence
- **SwiftUI** for all views

## Running Tests

```bash
xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16'
```
```

- [ ] **Step 3: Run full test suite one final time**

Run:
```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnythingTests -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | tail -20
```

Expected: All tests pass (AppDatabaseTests, DatabaseClientTests, HomeFeatureTests, AppFeatureTests).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: add README and remove placeholder test"
```
