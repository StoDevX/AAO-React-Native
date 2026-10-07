import Foundation

/// Shared constants for accessibility identifiers, button labels, and launch
/// arguments used by both the app views and the UI test suite.
///
/// React Native `testID` props map to `accessibilityIdentifier` on iOS.
/// Keeping these strings in one place prevents drift between the app and tests.
struct TestIdentifiers {

	// MARK: - Launch Arguments

	enum LaunchArguments {
		static let uiTesting = "--uitesting"
		static let resetState = "--reset-state"
		/// Records each fetch a feature with fixtures makes, for
		/// `mise run update-mess-fixtures`. Added when the runner is started with
		/// `TEST_RUNNER_AAO_RECORD_FIXTURES=1`.
		static let recordFixtures = "--record-fixtures"
		/// The value half of `-UIPreferredContentSizeCategoryName`, UIKit's
		/// command-line override for the app's Dynamic Type size. This is AX5,
		/// the largest accessibility size, so a test launching with it proves a
		/// layout past the whole ordinary type ramp, not just one step into it.
		///
		/// UIKit's `UIContentSizeCategory` values are abbreviated, not spelled
		/// out -- "XXXL", not "ExtraExtraExtraLarge". The spelled-out form reads
		/// as a plausible constant name but names nothing UIKit recognises, and
		/// RCTAccessibilityManager fails to find a multiplier for it silently
		/// rather than refusing to launch.
		static let accessibilityExtraExtraExtraLarge = "UICTContentSizeCategoryAccessibilityXXXL"

		/// Launch the app at a given Dynamic Type size. UIKit reads
		/// `-UIPreferredContentSizeCategoryName` as a command-line default, the
		/// same mechanism `--uitesting` and `--reset-state` rely on.
		static func contentSizeCategory(_ category: String) -> [String] {
			["-UIPreferredContentSizeCategoryName", category]
		}
	}

	// MARK: - Chaos

	/// Launch arguments and identifiers shared with source/chaos.
	enum Chaos {
		static let flag = "--chaos"
		static let seed = "--chaos-seed"
		/// Which launch of the run this is; the app keys its tape and seeds its
		/// faults by it, because `XCUIApplication.open` relaunches the app.
		static let launch = "--chaos-launch"
		static let replay = "--chaos-replay"
		static let faultRate = "--chaos-fault-rate"
		/// `fuzz` or `session`; see uitests/Chaos/README.md.
		static let profile = "--chaos-profile"
		/// The hidden element whose label is the latest stopping finding.
		static let beacon = "chaos.findings"
		/// The beacon's label while there is nothing to report.
		static let beaconQuiet = "none"
		/// A route that throws on render, for the canary.
		static let crashRoute = "chaos-crash"
		/// What the chaos error boundary draws in place of the tree that threw.
		static let fatalBoundary = "chaos.fatal-boundary"
		/// Elements only an error screen draws.
		static let errorScreenIdentifiers = ["router_error_message", fatalBoundary]
		/// Texts only an error fallback draws, for fallbacks with no identifier.
		static let errorScreenLabels = ["A problem occurred while showing places."]
		/// A route that opens a form sheet with no Back or Close button, for
		/// the canary that proves the monkey can leave one: the Dictionary's
		/// preview, which has nothing to show without a draft.
		static let sheetTrapRoute = "dictionary/entry/preview"
		/// The hidden element labelled `online` or `offline`, as a session's network is.
		static let network = "chaos.network"
		/// The hidden element listing strings the app received, for a session to type.
		static let vocab = "chaos.vocab"
		/// What separates its words.
		static let vocabSeparator: Character = "\u{1F}"
		/// A route drawing one small unlabelled button, for the target oracles' canary.
		static let targetsCanaryRoute = "chaos-canary-targets"
		/// The canary's button.
		static let targetsCanaryButton = "chaos.canary-target"
		/// Targets whose hit area is wider than their frame, through `hitSlop`,
		/// so the small-target oracle passes them over. Each entry says why.
		static let smallTargetAllowList: Set<String> = []
	}

	// MARK: - testID-based identifiers

	enum Home {
		static let screen = "screen-homescreen"
		/// The tiled layout's grid, HOME_GRID_ID in app/index.tsx.
		static let tileGrid = "home-tile-grid"
		/// The list layout's list, HOME_LIST_ID in app/index.tsx.
		static let list = "home-list"
		static let notice = "home-notice"
		static let enableDevMode = "Enable dev mode"
	}

	enum Navigation {
		/// The menu at the home screen's top-right corner, which holds Support,
		/// About, Contributing and Feedback. Mirrors
		/// HOME_MENU_LABEL in app/index.tsx.
		static let homeMenu = "Home menu"
		static let supportMenuItem = "Support"
		static let aboutMenuItem = "About"
		static let contributingMenuItem = "Contributing"
		static let feedbackMenuItem = "Feedback"
		/// The paintbrush on Home and the Messenger's front page. Mirrors CUSTOMIZE_LABEL in
		/// source/features/customize/labels.ts.
		static let customizeButton = "Customize"
		/// A two-line title in a navigation bar, read as its two lines joined by a comma. Mirrors
		/// NAVIGATION_TITLE_ID in source/components/navigation-title.tsx.
		static let title = "navigation-title"
		/// The label every back button carries. UIKit gives its own back
		/// buttons this label too, so a query using it must be scoped to one
		/// navigation bar -- `app.navigationBars.buttons[backButton]` matches
		/// the bar behind a sheet as readily as the sheet's own.
		static let backButton = "Back"
		/// UIKit's own identifier for a system back button, which it sets
		/// whatever the label. Both a system back button and an app-provided
		/// one read `Back`, so the identifier is what separates them.
		static let systemBackButton = "BackButton"
		/// The label UIKit gives a sheet's grabber, which it exposes as a button
		/// with no identifier. Its element is the sheet's child, which is how a
		/// sheet's own box is found. A form sheet on an iPhone in landscape
		/// fills the screen and has none.
		static let sheetGrabber = "Sheet Grabber"
	}

	/// Labels UIKit gives a `Stack.SearchBar`'s own controls. In the bottom
	/// placement this app uses, the cancel button is the round one beside the
	/// field, and UIKit labels it "close" rather than "Cancel".
	enum Streaming {
		static let list = "stream-list"
		static let webcams = "screen-streaming-webcams"
	}

	// MARK: - Home screen button labels

	enum Buttons {
		static let menus = "Menus"
		static let athletics = "Athletics"
		static let calendar = "Calendar"
		static let carletonCampus = "Carleton Campus"
		static let developer = "Developer"
		static let hours = "Hours"
		static let dictionary = "Dictionary"
		static let courseCatalog = "Course Catalog"
		static let directory = "Directory"
		static let map = "Map"
		static let more = "More"
		static let olafMessenger = "Olaf Messenger"
		static let stOlafNews = "St. Olaf News"
		static let stoPrint = "stoPrint"
		static let streamingMedia = "Streaming Media"
		static let studentOrgs = "Student Orgs"
		static let studentWork = "Student Work"
		static let transit = "Transit"
	}

	// MARK: - Dictionary

	enum Dictionary {
		static let list = "dictionary-list"
		static let definitionSheet = "dictionary-definition-sheet"
		static let suggestAnEdit = "Suggest an Edit"
		/// A copy of the iOS dictionary's own "change" entry, present only under
		/// `--uitesting`, for comparing this sheet against a screenshot of
		/// Apple's.
		static let referenceEntry = "change"
		/// The entry `openFirstWord()` lands on under `--uitesting`, from
		/// `docs/dictionary.json`. It has a single sense.
		static let firstEntry = "AAC"
		static let firstEntryDefinition = "The Academic Advising Center"
		/// A query whose results begin with `firstEntry` and run to several
		/// screens -- 20 entries in `docs/dictionary.json`, AAC through Tomson --
		/// so they can only be seen from the top if the list scrolls there.
		static let firstEntrySearchTerm = "academic"

		/// The edit form's navigation bar, which carries `suggestAnEdit`'s
		/// wording because that action is what opens it. Queries for the form's
		/// back button scope to this bar, since the label alone does not tell
		/// it from the list's back button behind the sheet.
		static let editFormTitle = suggestAnEdit
		static let editForm = "dictionary-edit-form"
		static let previewSheet = "dictionary-preview-sheet"
		/// What the preview shows when it is opened with no draft to compare.
		static let emptyPreview = "Nothing to Preview"
		static let preview = "Preview"
		static let reorder = "Reorder"
		static let addSense = "Add Sense"
		/// The form `sense.tsx` renders, pushed from a sense row.
		static let senseForm = "dictionary-sense-form"
		/// That form's navigation bar, for its back button.
		static let senseFormTitle = "Sense"
		/// The one definition field left in the app, on the sense screen.
		static let senseDefinitionField = "Definition"
		static let addSubsense = "Add Sub-sense"
		/// Each sense's row on the edit form. The row's accessibility *label*
		/// is the definition itself -- which is what a reorder test reads --
		/// so the identifier is the only stable way to address a row by
		/// position.
		static func senseRow(_ position: Int) -> String { "dictionary-sense-row-\(position)" }
		/// The marker `@expo/ui` splices into a sentence under DEBUG when a
		/// modifier is not in its nested-`Text` whitelist. Our patch adds
		/// strikethrough and underline to that list; if a version bump ever drops
		/// the patch, this string appears in the preview instead of the markup.
		static let unsupportedNestedModifier = "not supported for nested Text"
	}

	// MARK: - Map

	enum Map {
		/// Mirrors directoryFloorId in source/features/map/card/directory-section.tsx.
		static func directoryFloor(_ index: Int) -> String { "directory-floor-\(index)" }
		/// Mirrors DIRECTORY_ENTRY_ID in source/features/map/floor-card.tsx.
		static let directoryEntry = "directory-entry"
		/// A building with a directory file (data/building-directory/toh.yaml),
		/// whose first floor (index 1) lists Financial Aid, an Hours venue.
		static let aBuildingWithADirectory = "Tomson Hall"
		static let aDirectoryFloor = "1st floor"
		static let aDirectoryFloorIndex = 1
		static let aDirectoryVenue = "Financial Aid"
		/// The sheet's search field. The bar's testID is its placeholder, and
		/// UIKit puts the identifier on the text field, so this is a
		/// `searchFields` query.
		static let search = "Search for a place"
		/// The map view itself. MapLibre publishes one element for the whole map --
		/// labelled "Map", valued with the zoom -- and nothing per building, so
		/// this is the only handle a test has on where the map is on screen.
		static let map = "Map"
		/// UIKit's own dismiss button on the search bar, found by label. iOS 26
		/// draws it as a circular glyph beside the field and labels it "Close".
		static let cancel = "Close"
		/// The building card's own dismiss button, a `testID` rather than a
		/// label -- it shares the "Close" label with the search bar's Cancel
		/// (`cancel`, above), and the picker is still mounted while the card's
		/// query runs, so a label-only query could answer for either. Matches
		/// `CARD_CLOSE_BUTTON_ID` in `source/features/map/building-info.tsx`.
		static let cardCloseButton = "card-close-button"
		/// The building card's title block. Matches `CARD_TITLE_ID` in
		/// `source/features/map/building-info.tsx`.
		static let cardTitle = "card-title"
		/// The card's About text. Matches the `testID` in
		/// `source/features/map/card/about-section.tsx`.
		static let cardAbout = "card-about"
		/// A St. Olaf building whose card carries a subtitle
		/// ("Administrative & Academic") under a long name, so title and subtitle
		/// together are the tightest fit the collapsed header has to hold. Its row
		/// reads "Regents Hall of Natural Sciences, RNS"; `selectBuilding(named:)`
		/// matches on the prefix. St. Olaf can rename it.
		static let aSubtitledBuilding = "Regents Hall of Natural Sciences"
		/// A building with points inside it: The Cage, Stav Hall and more.
		static let aBuildingWithPoints = "Buntrock Commons"
		/// A point inside `aBuildingWithPoints`.
		static let aPointInside = "The Cage"
		/// A St. Olaf building whose description runs well past five lines.
		static let aBuildingWithALongAbout = "Holland Hall"
		/// A group in the map sheet's category grid with a list long enough to
		/// scroll. Mirrors a label in data/map-categories.yaml.
		static let parkingCategory = "Parking"
		/// The group that lists every building. Mirrors data/map-categories.yaml.
		static let buildingsCategory = "Buildings"
		/// The group whose tile sits at the grid's bottom-left corner at the
		/// default text size: the last row's first tile. Mirrors the order of
		/// data/map-categories.yaml.
		static let cornerCategory = "Landmarks"
		/// The group header's back button, by identifier: its "Back" label also
		/// matches the navigation bar's own Back on iOS 27. Mirrors
		/// GROUP_BACK_ID in source/features/map/building-picker.tsx.
		static let groupBack = "map-group-back"
		/// A place that is a point inside another building's footprint, and the
		/// only place its name finds: its pin sits over Buntrock Commons, so a
		/// tap that reaches the footprint instead opens the wrong card.
		/// St. Olaf can rename it.
		static let aPointOnlyPlace = "Stav Hall"
		/// A row two screens down `parkingCategory`, behind every Accessible
		/// Parking space. St. Olaf can rename it.
		static let aRowFarDownParking = "Alumni Hall Road"
		/// The About menu in the map's header. It carries the OpenStreetMap
		/// credit, so it has to stay reachable. Mirrors the accessibilityLabel
		/// in app/map/index.tsx.
		static let attribution = "About this map"
		/// The map screen's title, which its header no longer draws.
		static let stolafTitle = "St. Olaf Map"
		/// The edit menu's Copy, which iOS offers only for selectable text.
		static let copy = "Copy"
		/// A St. Olaf-only building near the top of the list, so the expanded
		/// sheet shows it without scrolling -- and absent from Carleton's map
		/// data, so selecting it is what would fail if the map's campus parameter
		/// were ignored.
		static let aBuilding = "Buntrock Commons"
	}

	// MARK: - Student Work

	enum StudentWork {
		/// Matches AREA_ROW_ID_PREFIX in source/features/sis/student-work/area-section.tsx.
		/// Each area row's identifier is this followed by the area's slug.
		static let areaRowPrefix = "student-work-area:"
		/// Postings from modules/ccc-jobs/fixtures/uitest-postings.ts: one with
		/// a field long enough to wrap, one with only short fields.
		static let fixtureJobWithWrappingField = "Undergraduate Research Assistant"
		/// Matches JOB_DESCRIPTION_TITLE in source/features/sis/student-work/lib.ts,
		/// the title of both the row and the screen it opens.
		static let jobDescriptionRow = "Description"
		/// The start of a paragraph in the fixture postings' description.
		static let fixtureJobDescriptionParagraph = "Transferable Skills:"
		/// Matches AREA_GRID_ID in source/features/sis/student-work/area-section.tsx.
		static let areaGrid = "student-work-area-grid"
		/// From PRESETS in source/features/sis/student-work/presets.ts.
		static let allPostingsPreset = "All job postings"
		/// The postings screen's title, whatever it was opened with. Matches
		/// TITLE in app/student-work/postings.tsx.
		static let postingsTitle = "Job Postings"
	}

	// MARK: - Menus

	enum Menus {
		static let stOlafCafes = ["Stav Hall", "The Cage", "The Pause"]

		/// Matches FOOD_ROW_PREFIX in modules/food-menu/food-item-row.tsx.
		static let foodRowPrefix = "food-row-"

		/// The cafe whose menu comes from this repository's own
		/// `data/pause-menu.yaml`, so its stations and items are fixed rather
		/// than whatever Bon Appétit is serving today.
		static let pause = "The Pause"

		/// Two stations from that file, and one item from each. The Stations
		/// filter asks for a menu outright, so its shape does not depend on how
		/// many stations a cafe happens to serve.
		static let pizzaStation = "Pizza"
		static let specialtyPizzaStation = "Specialty Pizza"
		static let pizzaItem = "food-row-Single Slice"
		static let specialtyPizzaItem = "food-row-BBQ Chicken"

		/// The day the app's frozen clock sits on, as the header writes it under
		/// the cafe's name -- the weekday alone. `UITEST_FROZEN_DATE` in
		/// modules/timer/index.ts is noon in Chicago, so it also decides the
		/// meal below.
		static let frozenWeekday = "Sat"

		/// The meal that frozen noon lands in, and so the one every menu screen
		/// opens on.
		static let openingMeal = "Lunch"

		/// Another of Stav Hall's meals, for proving the picker switches.
		static let otherMeal = "Dinner"

		/// Reveals the filter row, which a menu opens with collapsed.
		static let filtersButton = "Filters"

		/// The start of the navigation title's label, which is also the meal
		/// picker's button. The title writes its own label rather than letting
		/// SwiftUI compose one, so the bullets the eye reads as separators are
		/// the commas the ear needs -- `Stav Hall, Sat, Lunch, 8:30AM to 12PM`.
		///
		/// A prefix, because the window that finishes it is not the same string
		/// on every machine. A meal's hours are campus clock readings printed
		/// in the device's zone, so Stav's 10:30 lunch is `10:30AM` on a
		/// Chicago simulator, `8:30AM` on a Pacific one and `3:30PM` on a UTC
		/// runner. Matching it exactly would pin the suite to whoever wrote it.
		/// What the window says is `meal-times.test.ts`' business.
		static func header(_ cafe: String, meal: String) -> String {
			"\(cafe), \(frozenWeekday), \(meal)"
		}
	}

	// MARK: - Filters

	/// The toolbar `@frogpond/filter` draws, which Menus, Course Search,
	/// Streaming Media and News all share.
	enum Filter {
		/// Matches FILTER_TRIGGER_PREFIX in modules/filter/lib/trigger-modifiers.ts.
		static let triggerPrefix = "filter-trigger-"

		/// Matches FILTER_OPTION_PREFIX in modules/filter/filter-sheet.tsx.
		static let optionPrefix = "filter-option-"

		/// Matches FILTER_CLEAR_ID in modules/filter/filter-sheet.tsx.
		static let clear = "filter-clear"


		/// A trigger is identified by its filter's key, from the `buildFilters`
		/// of whichever screen drew it.
		static func trigger(_ key: String) -> String {
			triggerPrefix + key
		}

		/// A sheet row is identified by its option's title.
		static func option(_ title: String) -> String {
			optionPrefix + title
		}

		/// Filter keys from modules/food-menu/lib/build-filters.ts.
		enum MenusKeys {
			static let specials = "specials"
			static let stations = "stations"
		}
	}

	// MARK: - Calendar

	enum Calendar {
		/// Days in the fixture calendar: one with events in the week after
		/// `frozenNow`'s, and one with none in the week after that.
		static let aDayWithEvents = "2026-09-07"
		static let anEmptyDay = "2026-09-19"
		static let picker = "Calendar filter"
		/// Categories the picker offers, written as the menu draws them: the
		/// name, then how many events carry it. The counts come from
		/// `modules/ccc-calendar/fixtures/uitest-events.json` read at the app's
		/// frozen clock, so they hold for as long as that fixture does. A count
		/// covers the list's whole window, finished events included: Welcome
		/// Convocation ended that morning and still counts toward Academic Year.
		static let categories = ["Music (10)", "Academic Year (7)"]
		/// The picker menu's one section header. SwiftUI draws a Menu section
		/// title as static text, in the case the caller wrote it.
		static let calendarsSection = "Calendars"
		/// The rows that open each axis's submenu. A row names its selection
		/// after a colon once that axis is filtered, so a test matching one has
		/// to match on the prefix.
		static let categoryMenu = "Category"
		static let organizationMenu = "Organization"
		/// Clears whichever axis is filtered, from the bottom of the picker.
		/// Present only while something is filtered, and it dismisses the menu.
		static let resetFilters = "Reset Filters"
		/// An event on the frozen day that is Academic Year rather than Music,
		/// so the filter test watches it leave the list and come back.
		static let unfilteredDayRow = "Welcome Convocation"
		/// Returns the list to the top. A bar item, so its title is its
		/// identifier.
		static let today = "Today"
		/// Each day-picker cell is identified by `day-cell-<ISO date>`.
		/// Mirrored by `DAY_CELL_PREFIX` in `modules/event-list/day-picker-strip.tsx`.
		static let dayCellPrefix = "day-cell-"

		/// Day view's empty-state copy, shown below the strip when the selected
		/// day has no events. Mirrors the literal in `modules/event-list/day-view.tsx`.
		/// An empty day names itself, so only the opening is fixed.
		static let emptyDayNotice = "Nothing on "

		/// Each event row is identified by `event-row-<title>`.
		/// Mirrored by `EVENT_ROW_PREFIX` in `modules/event-list/event-list-row.tsx`.
		static let eventRowPrefix = "event-row-"

		/// The instant the app freezes its clock to under `isUITesting`, so a
		/// test reasons about "today" the way the app does rather than off the
		/// live wall clock. Mirrors `UITEST_FROZEN_DATE` in
		/// `modules/timer/index.ts` (a Saturday).
		///
		/// Parsed from the same string the app parses rather than rebuilt from
		/// its parts: the constant carries a fixed offset, so rebuilding it as a
		/// wall time in campus's zone would agree only while that date sits in
		/// daylight time.
		static let frozenNow = ISO8601DateFormatter().date(from: "2026-09-05T12:00:00-05:00")!

		/// The identifier of the cell for a given day, formatted in the device's
		/// own zone. The calendar reads its clock and its events from the device,
		/// so a test naming days any other way is asserting against a zone the
		/// app does not use.
		static func dayCell(_ date: Date) -> String {
			let formatter = DateFormatter()
			formatter.calendar = Foundation.Calendar(identifier: .gregorian)
			formatter.locale = Locale(identifier: "en_US_POSIX")
			formatter.timeZone = TimeZone.current
			formatter.dateFormat = "yyyy-MM-dd"
			return dayCellPrefix + formatter.string(from: date)
		}

    static func dayCell(_ s: String) -> String {
      return dayCellPrefix + s
    }
	}

	// MARK: - News

	enum News {
		/// The edit menu's Copy, which iOS offers once text is selected.
		static let copy = "Copy"
		/// A print section's shelf's "All ›", by the label VoiceOver reads.
		static func allStories(in section: String) -> String { "All \(section)" }
		/// St. Olaf News's navigation bar title, in app/st-olaf-news.tsx.
		static let stOlafTitle = "St. Olaf News"
		/// The views the front page's menu offers, and the start of the menu button's label, which
		/// names the view shown; in source/features/mess/front-page-screen.tsx.
		static let latest = "Latest"
		static let viewMenuPrefix = "More, "

		/// The newest issue's tile and every other issue's, in source/features/mess/issue-grid.tsx.
		static let topTile = "mess-top-tile"
		static let issueTile = "mess-issue-tile"

		/// A section the view menu offers, as source/features/mess/lib/posts.ts names it.
		static let newsSection = "News"


		/// The lead story, and every card on a shelf, in source/features/mess/issue-page.tsx.
		static let leadStory = "mess-lead-story"
		static let storyCard = "mess-story-card"

		/// Each row of the More grid, the stories from no print section, in
		/// source/features/mess/issue-page.tsx.
		static let moreGridRow = "mess-more-grid-row"

		/// A section's column chips, each labelled with its column, in source/features/mess/section-page.tsx.
		static let columnChip = "mess-column-chip"

		/// Every row of a section's or column's stories starts with this, in
		/// source/features/mess/story-list.tsx.
		static let storyRowPrefix = "mess-row-"

		/// The reader's headline, in source/features/mess/story-header.tsx.
		static let storyHeadline = "mess-story-headline"

		/// Each stretch of a story's body between its figures, one text view holding its
		/// paragraphs, quotes and lists, in source/features/mess/story-blocks.tsx.
		static let storyBody = "mess-story-body"

		/// The Mess section whose columns the Variety templates draw, and the columns
		/// the tests open, as the section chips and column chips in source/features/mess/
		/// name them. They are the paper's own category names, from olafmessenger.com.
		static let varietySection = "Variety"
		static let horoscopesColumn = "Horoscopes"
		static let comicColumn = "Comic"
		static let recipesColumn = "Recipes"
		static let photoColumn = "Photo"

		/// A sign's name, as a Horoscopes glyph button is labelled and a sign row's
		/// label begins, in source/features/mess/lib/horoscopes.ts.
		static let gemini = "Gemini"
		static let leo = "Leo"
		/// The last sign row, before a sign is picked and after Pisces is.
		static let pisces = "Pisces"
		static let aquarius = "Aquarius"
		/// All twelve, as the glyph buttons are labelled.
		static let signs = [
			"Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
			"Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
		]

		/// The framed comic or artwork that opens the zoom viewer, in
		/// source/features/mess/image-view.tsx.
		static let storyImage = "mess-story-image"


		/// An article with a captioned lead photo, three short paragraphs, then captioned figures
		/// in its body: "Finding peace on campus", from the recorded Mess fixtures. Recording them
		/// again can drop it from the feed, which these tests read it from.
		static let illustratedStoryRoute = "/messenger/story?id=36948"

		/// An article whose first paragraph holds a link: "The true cost of convenience: AI in
		/// the classroom", from the same recorded issue as the illustrated story.
		static let linkedStoryRoute = "/messenger/story?id=36959"
		/// That link's words.
		static let linkedStoryLink = "According to the college library website"
		/// What the system's menu for a held link offers, and its menu for selected text does not.
		static let copyLink = "Copy Link"

		/// The zoom viewer's close button, in source/features/mess/image-viewer.tsx.
		static let imageViewerClose = "mess-image-viewer-close"
		static let imageViewerCloseLabel = "Close"

		/// The picture inside the zoom viewer, in source/features/mess/image-viewer.tsx.
		static let imageViewerImage = "mess-image-viewer-image"

		/// Every thumbnail in a comic's series row, in source/features/mess/series-row.tsx.
		static let seriesStory = "mess-series-story"


		/// Every ingredient row on a recipe page, in source/features/mess/recipe-view.tsx.
		static let recipeIngredient = "mess-recipe-ingredient"
	}

	// MARK: - Streaming Media

	enum StreamingMedia {
		/// The station picker's KRLX segment, at the top of the sheet.
		static let krlxSegment = "KRLX"
		/// Play and Stop, in source/features/streaming/radio/player-view and the
		/// mini-player; each names its station.
		static let playKsto = "Play KSTO 93.1 FM"
		static let pauseKsto = "Pause KSTO 93.1 FM"
		static let playKrlx = "Play 88.1 KRLX-FM"
		/// The player's bottom row, as VoiceOver names it.
		static let krlxActions = [
			"Call 88.1 KRLX-FM",
			"Today's schedule",
		]
		/// The bottom row's buttons that leave the app, which VoiceOver reads as
		/// links.
		static let krlxLinks = [
			"Chat with 88.1 KRLX-FM",
		]
		/// The full player's stand-in for a scrubber, which shows only at full size.
		static let airStatus = "radio-air-status"
		/// The Now Playing bar with no station loaded, on Home and in Streaming
		/// Media's tab bar.
		static let idleBar = "Not Playing"
		/// Customize's Radio Player switch.
		static let showRadioPlayer = "show-radio-player"
		/// KRLX has one logo, so nothing labelled with this may be a button.
		static let krlxLogoPrefix = "88.1 KRLX-FM logo"
		/// The logo KSTO shows first, before any tap moves it on.
		static let kstoFirstLogo = "KSTO 93.1 FM logo, cow badge"
	}

	// MARK: - Quick Actions

	enum QuickActions {
		/// The picker's accessibility identifier, set in app/customize/quick-actions.tsx.
		static let screen = "screen-quick-actions"
		static let reset = "Reset to Defaults"
		/// DEFAULT_QUICK_ACTIONS in source/features/quick-actions/destinations.ts.
		static let defaults = ["Stav Menu", "Cage Menu", "Olaf Messenger", "Transit"]
		static let cageMenu = "Cage Menu"
		/// The tab Cage Menu opens, as Menus labels it.
		static let cageTab = "The Cage"
		/// One of `defaults`, and an action outside them.
		static let aDefault = "Transit"
		static let anExtra = "Calendar"
	}

	// MARK: - In-app browser

	enum Browser {
		/// The in-app browser's own close button, which only the browser
		/// sheet draws.
		static let done = "Done"
	}

	// MARK: - SpringBoard

	enum SpringBoard {
		static let bundleIdentifier = "com.apple.springboard"
		/// The button on the alert iOS shows once the app's icon changes.
		static let iconChangedOK = "OK"
	}

	// MARK: - Customize

	enum Customize {
		/// The gallery's default icon, and an alternate, as the gallery titles them.
		static let defaultIcon = "Big Ole"
		static let anAlternateIcon = "Old Main"
		/// The sheet's host, set in app/customize/index.tsx.
		static let screen = "screen-customize"
		static let quickActionsRow = "Quick Actions"
		/// The Layout picker's identifier, set in app/customize/index.tsx.
		static let homeLayout = "home-layout"
		/// The Layout menu's names for Home's two layouts.
		static let tiledLayout = "Tiled"
		static let listLayout = "List"
		/// The App Icon row's identifier; its label also carries the current icon's name.
		static let appIconRow = "app-icon-row"
		/// The gallery's host, set in app/customize/app-icon.tsx.
		static let appIconScreen = "screen-app-icon"
		/// SheetCloseButton's label, in source/components/sheet-close-button.tsx.
		static let close = "Close"
	}

	// MARK: - Messenger Customize

	enum MessCustomize {
		/// The sheet's host, set in app/messenger/customize/index.tsx.
		static let screen = "screen-mess-customize"
		/// The Paper Stains picker, in source/features/mess/issue-stains-row.tsx.
		static let issueStains = "issue-stains"
		/// The Dark page for Photo stories switch, in app/messenger/customize/index.tsx.
		static let keepPhotoStoriesDark = "keep-photo-stories-dark"
	}

	// MARK: - Contributing

	enum Contributing {
		/// The Contributing screen's host, set in app/contributing/index.tsx.
		static let screen = "screen-contributing"
	}

	// MARK: - About

	enum About {
		/// The story's page dots, labelled in source/features/about/card-carousel.tsx.
		static let pageDots = "Page"
		/// The About screen's host, set in app/about/index.tsx.
		static let screen = "screen-about"
		static let version = "App Version"
		/// A section header in app/about/index.tsx.
		static let storyHeading = "Our story"
		/// The headings of the first two timeline cards, from source/features/about/timeline.ts.
		static let firstEra = "🏡 October 2017 — Today"
		static let secondEra = "🧱 July 2016 — September 2017"
		/// The credits cards' headings, from app/about/index.tsx.
		static let contributors = "Contributors"
		static let acknowledgements = "Acknowledgements"
		static let privacy = "Privacy"
		static let legal = "Legal"
	}

	// MARK: - Support

	enum Support {
		/// The Support screen's host, set in app/support/index.tsx.
		static let screen = "screen-support"
		/// The title of the Report a Problem form, in app/report-problem.tsx.
		static let reportProblemTitle = "Report a Problem"
		/// The form's close button, labelled in app/report-problem.tsx.
		static let closeProblemForm = "Close Screen"
	}

	// MARK: - Developer

	enum Developer {
		/// The Developer screen's host, set in app/developer/index.tsx.
		static let screen = "screen-developer"
		static let components = "Components"
	}

	// MARK: - Directory

	enum Directory {
		/// The heading below the contact tiles on the Directory screen.
		static let importantContacts = "Departments"
		/// Matches CONTACT_GRID_ID in app/directory/index.tsx.
		static let contactGrid = "directory-contact-grid"
		/// A contact from data/contact-info/, so its tile is in the grid
		/// whatever the server is serving.
		static let aContact = "PubSafe"
		/// That contact's own action, shown on its detail screen.
		static let aContactAction = "Call Public Safety"

		/// A second contact from data/contact-info/, so its tile is in the grid
		/// whatever the server is serving. It has to sit in the grid's first
		/// row, the only one the contact sheet leaves uncovered.
		static let aSecondContact = "HOPE Center"
		/// That contact's own action. Nothing else in the app shows this
		/// string, so finding it can only mean HOPE Center's detail is on
		/// screen.
		static let aSecondContactAction = "Call 24-Hour Hotline"

		/// Search results in list mode: `directory-row-<index>`. Mirrors
		/// DIRECTORY_ROW_PREFIX in app/directory/index.tsx.
		static let rowPrefix = "directory-row-"

	}

	// MARK: - Layout menu

	enum Layout {
		/// The ⋯ menu's label, from source/components/layout-menu.tsx.
		static let menu = "Layout"
		static let grid = "Grid"
		static let list = "List"
	}

	// MARK: - Student Orgs

	enum StudentOrgs {
		/// Matches RESULTS_LIST_ID in source/features/student-orgs/org-results-list.tsx.
		static let resultsList = "student-orgs-results-list"
		/// The landing's title, in app/student-orgs/index.tsx.
		static let title = "Student Orgs"
		/// A search whose results, from source/features/student-orgs/fixtures/uitest-orgs.json,
		/// run several screens long, and the letter that refines it.
		static let firstQuery = "a"
		static let refinement = "n"
		/// The first org the refined search lists, from the same fixture.
		static let firstRefinedResult = "Academic Success Center"
	}

	// MARK: - Hours

	enum Hours {
		/// The screen's title, in app/hours/index.tsx.
		static let title = "Hours"
		/// What the list says when a search matches nothing, in
		/// source/features/building-hours/list/building-list.tsx.
		static func noResults(for query: String) -> String { "No results found for \"\(query)\"." }
		/// The start of the detail sheet's footnote, below its schedule.
		static let footnote = "Building hours subject to change"
		/// The report screen's keyboard's Done key.
		static let keyboardDone = "done"
		/// The unsaved-changes guard's alert and its two choices, in
		/// app/hours/detail/report.tsx.
		static let discardChangesAlert = "Discard changes?"
		static let keepEditing = "Edit"
		static let discard = "Discard"
		/// The start of `anExcludedBuilding`'s editable hours row.
		static let weekdaysRow = "Weekdays"
		/// The schedule editor's title.
		static let scheduleEditorTitle = "Edit Schedule"
		/// A building that must fall out of the list when a search is typed, so
		/// the test proves narrowing rather than an empty list. Under test the
		/// app reads St. Olaf's hours from this repository's bundled copy, so
		/// this is whatever `data/building-hours/` says today. Also the name
		/// shown as the detail sheet's own title once tapped. Its schedule is a
		/// single short section that already fits the sheet's smaller detent --
		/// see `aBuildingWithLongSchedule` for the one that overflows it.
		static let anExcludedBuilding = "The Cage"
		/// A building with three schedule sections -- enough combined content to
		/// overflow the sheet's smaller detent, unlike `anExcludedBuilding`'s
		/// single short section.
		static let aBuildingWithLongSchedule = "Stav Hall"
		/// A query no building matches, so the screen must say no results were
		/// found rather than claim the data is missing -- the two states read
		/// differently, or a broken search looks like a server outage.
		static let unmatchedQuery = "zzznomatch"
		/// Mirrors BUILDING_ROW_PREFIX in
		/// source/features/building-hours/list/building-list-row.tsx.
		static let rowPrefix = "building-row-"
		/// The swipe action's two labels. Mirrors ADD_TO_FAVORITES and
		/// REMOVE_FROM_FAVORITES in
		/// source/features/building-hours/list/building-list-row.tsx.
		static let addToFavorites = "Add to Favorites"
		/// The section the list grows at its top once anything is favourited.
		/// Every test launches with `--reset-state`, so it starts absent.
		static let favoritesSection = "Favorites"
		/// The status row of a venue's hours ("Open until 10 PM"), on the
		/// detail sheet and the map card alike. Mirrors HOURS_STATUS_ID in
		/// source/features/building-hours/hours-section.tsx.
		static let status = "hours-status"
		/// The detail sheet's Report a Problem button.
		static let reportAction = "Report a Problem"
		/// The report screen's own prompt -- distinct from
		/// `reportAction`, which labels the button that opens it, so a test
		/// can tell the screen actually came up rather than the button merely
		/// existing.
		static let reportScreenPrompt = "Thanks for spotting a problem!"
		/// The report screen's navigation bar, which carries `reportAction`'s
		/// wording because that action is what opens it. Queries for the
		/// screen's back button scope to this bar, since the label alone does
		/// not tell the two bars apart.
		static let reportScreenTitle = reportAction
		/// The report screen's own submit control, in the navigation bar.
		static let submitReportAction = "Submit Report"
	}

	// MARK: - Course Catalog

	enum CourseCatalog {
		static let recent = "Recent"
		/// The one course a UI-test run's catalogue holds. Mirrors
		/// `UITEST_COURSE_NAME` in
		/// `source/lib/course-search/__fixtures__/courses.ts`.
		static let aCourse = "Hybrid Test Course"
	}

	// MARK: - Transit

	enum Transit {
		/// The screen's title, in app/_layout.tsx.
		static let title = "Transit"
		/// The line every UI test drives, and a stop it always calls at. The
		/// stop is the college itself, so it is not going to be renamed out
		/// from under this test.
		static let aLine = "Express Bus"
		static let aStop = "St. Olaf College"
		/// A stop several places past `aStop` on Express Bus's route (see
		/// `docs/bus-times.json`), used to prove a strip swipe actually moved the
		/// strip rather than doing nothing. Unlike `aStop`, which the route
		/// visits twice (the loop starts and ends there), this one appears only
		/// once, so its presence unambiguously means the strip scrolled forward
		/// rather than showing a second, later occurrence of the start. It is the
		/// sixth of eight stops: past the four and a half cells the strip shows
		/// when it opens on the first stop, and still in view once two swipes
		/// have carried the strip to its end -- which the fifth, Cub/Target, is
		/// not. No other line calls here.
		static let aStopFartherAlongTheRoute = "Wells Fargo"
		/// The horizontal strip of stops inside a line's widget, which a swipe
		/// test aims at rather than at a stop cell: the strip opens partway
		/// along the route, so which cells are on screen depends on where the
		/// bus is.
		/// Mirrored by `STOP_STRIP` in `source/features/transit/bus/widget.tsx`.
		static let stopStrip = "stop-strip"

		/// The navigation bar's day menu, labelled by the day it is showing.
		/// `Today` when the screens are following the clock.
		static let dayMenuDefaultLabel = "Today"
		/// The day the day-picker test picks. Sunday, because Express Bus keeps
		/// one timetable Monday to Saturday (`docs/bus-times.json`), so Sunday
		/// is the one pick that draws nothing where the frozen Saturday clock
		/// draws rows.
		static let aDay = "Sunday"
		/// A stop Express Bus calls at once per round, so its row lists times
		/// wherever the line runs. Unlike `aStop`, which the route visits twice
		/// and ends the round on, with no departure to list.
		static let aStopOnEveryRunningDay = "Food Co-op"
		/// The empty state that replaces the timetable on a day the line does not
		/// run. A prefix: a holiday appends its name. Matches `BusLine` in
		/// `source/features/transit/bus/line.tsx`.
		static let lineNotRunning = "This line is not running today"
		/// What a row shows in place of a departure the route skips; matches
		/// `formatDeparture` in `source/features/transit/bus/components/times.tsx`.
		static let skippedDeparture = "None"
	}

}
