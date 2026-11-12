/**
 * SF Symbol names, as the screens pass them to `Image`, `Label`, `Button` and
 * friends, mapped to the closest Material Symbol.
 *
 * The keys are every symbol the app names, gathered from the screens, the
 * campus definitions and `data/`; a name missing from here is not an error --
 * `materialSymbolFor` trims its trailing parts until it finds a mapped
 * ancestor (`bell.badge` falls back to `bell`), and past that draws
 * `FALLBACK_SYMBOL`. The values are Material Symbols' own snake_case names,
 * which are also the names `@expo/material-symbols` ships its icons under;
 * `sync-symbols.mjs` writes the import table from them. A `.fill` SF Symbol
 * draws Material's filled variant.
 *
 * This file is plain data with no imports, so that script can read it under
 * Node directly.
 */
export const SF_TO_MATERIAL: Readonly<Record<string, string>> = {
	a: 'title',
	'app.badge': 'app_badging',
	'arrow.clockwise': 'refresh',
	'arrow.counterclockwise': 'undo',
	'arrow.down.right.and.arrow.up.left': 'close_fullscreen',
	'arrow.left': 'arrow_back',
	'arrow.right': 'arrow_forward',
	'arrow.triangle.2.circlepath': 'sync',
	'arrow.up.arrow.down': 'swap_vert',
	// A dropdown chip's trailing caret.
	'arrowtriangle.down': 'arrow_drop_down',
	'arrow.up.left.and.arrow.down.right': 'open_in_full',
	// An external link, on Android, is the open-in-new glyph.
	'arrow.up.right': 'open_in_new',
	'arrow.up.right.square': 'open_in_new',
	atom: 'science',
	'bed.double': 'bed',
	bell: 'notifications',
	'bell.slash': 'notifications_off',
	bicycle: 'pedal_bike',
	bolt: 'bolt',
	'bolt.heart': 'ecg_heart',
	book: 'book',
	'book.pages': 'auto_stories',
	brain: 'psychology',
	'brain.head.profile': 'psychology',
	briefcase: 'work',
	bubble: 'chat_bubble',
	'bubble.left.and.bubble.right': 'forum',
	'bubble.left.and.text.bubble.right': 'forum',
	building: 'apartment',
	'building.2': 'apartment',
	'building.columns': 'account_balance',
	bus: 'directions_bus',
	calendar: 'calendar_today',
	'calendar.badge.plus': 'calendar_add_on',
	'calendar.day.timeline.trailing': 'calendar_view_day',
	car: 'directions_car',
	'character.book.closed': 'menu_book',
	checkmark: 'check',
	'checkmark.circle': 'check_circle',
	'checkmark.seal': 'verified',
	'checkmark.shield': 'verified_user',
	'chevron.down': 'keyboard_arrow_down',
	'chevron.left': 'chevron_left',
	'chevron.right': 'chevron_right',
	'chevron.up': 'keyboard_arrow_up',
	circle: 'radio_button_unchecked',
	'circle.fill': 'circle',
	clock: 'schedule',
	'clock.badge.exclamationmark': 'history_toggle_off',
	creditcard: 'credit_card',
	cross: 'emergency',
	'cross.case': 'medical_services',
	'cup.and.saucer': 'local_cafe',
	curlybraces: 'data_object',
	desktopcomputer: 'computer',
	doc: 'description',
	'doc.on.doc': 'content_copy',
	'doc.text': 'description',
	'doc.zipper': 'folder_zip',
	drop: 'water_drop',
	// Android's overflow affordance is the vertical ellipsis.
	ellipsis: 'more_vert',
	'ellipsis.circle': 'more_vert',
	envelope: 'mail',
	'envelope.circle': 'mail',
	'envelope.open': 'drafts',
	exclamationmark: 'priority_high',
	'exclamationmark.bubble': 'feedback',
	'exclamationmark.circle': 'error',
	'exclamationmark.triangle': 'warning',
	eye: 'visibility',
	'eye.slash': 'visibility_off',
	figure: 'person',
	'figure.2.arms.open': 'accessibility_new',
	'figure.hiking': 'hiking',
	'figure.roll': 'accessible',
	'figure.run': 'directions_run',
	'figure.skiing.downhill': 'downhill_skiing',
	'figure.walk': 'directions_walk',
	film: 'movie',
	'flag.2.crossed': 'sports_score',
	flask: 'science',
	'fork.knife': 'restaurant',
	gearshape: 'settings',
	globe: 'public',
	'globe.americas': 'public',
	graduationcap: 'school',
	hammer: 'handyman',
	'hand.raised': 'back_hand',
	'hands.and.sparkles': 'volunteer_activism',
	'hands.sparkles': 'volunteer_activism',
	heart: 'favorite',
	'heart.circle': 'favorite',
	'heart.slash': 'heart_broken',
	house: 'home',
	'info.circle': 'info',
	leaf: 'eco',
	'light.beacon.max': 'emergency_home',
	lightbulb: 'lightbulb',
	'line.3.horizontal.decrease': 'filter_list',
	link: 'link',
	'list.bullet': 'format_list_bulleted',
	'list.bullet.indent': 'format_indent_increase',
	location: 'near_me',
	'location.circle': 'my_location',
	magnifyingglass: 'search',
	map: 'map',
	mappin: 'location_on',
	'mappin.and.ellipse': 'location_on',
	megaphone: 'campaign',
	minus: 'remove',
	'moon.stars': 'bedtime',
	'mountain.2': 'landscape',
	mug: 'coffee',
	'music.note': 'music_note',
	'music.note.list': 'queue_music',
	newspaper: 'newspaper',
	paintbrush: 'brush',
	paintpalette: 'palette',
	paperplane: 'send',
	parkingsign: 'local_parking',
	pause: 'pause',
	pawprint: 'pets',
	pencil: 'edit',
	person: 'person',
	'person.2': 'group',
	'person.3': 'groups',
	'person.3.sequence': 'groups',
	'person.crop.circle': 'account_circle',
	'person.crop.rectangle': 'badge',
	'person.crop.rectangle.stack': 'recent_actors',
	'person.text.rectangle': 'badge',
	phone: 'call',
	photo: 'image',
	play: 'play_arrow',
	'play.rectangle': 'smart_display',
	'play.tv': 'live_tv',
	plus: 'add',
	'plus.circle': 'add_circle',
	printer: 'print',
	questionmark: 'help',
	'questionmark.bubble': 'contact_support',
	'questionmark.circle': 'help',
	'quote.bubble': 'format_quote',
	'quote.opening': 'format_quote',
	radio: 'radio',
	'record.circle': 'radio_button_checked',
	rectangle: 'rectangle',
	'rectangle.portrait.and.arrow.right': 'logout',
	safari: 'explore',
	shield: 'shield',
	'shield.lefthalf.filled': 'shield',
	'slider.horizontal.3': 'tune',
	// Google retired auto_awesome; star_shine is the sparkle it ships now.
	sparkles: 'star_shine',
	speaker: 'volume_down',
	'speaker.wave.3': 'volume_up',
	sportscourt: 'stadium',
	square: 'crop_square',
	// Sharing, on Android, is the three-node share glyph.
	'square.and.arrow.up': 'share',
	'square.and.pencil': 'edit_square',
	'square.grid.2x2': 'grid_view',
	'square.grid.3x2': 'apps',
	'square.grid.3x3': 'apps',
	star: 'star',
	'star.bubble': 'reviews',
	stethoscope: 'stethoscope',
	storefront: 'storefront',
	tag: 'sell',
	'testtube.2': 'science',
	theatermasks: 'theater_comedy',
	tram: 'tram',
	trash: 'delete',
	tray: 'inbox',
	tree: 'park',
	trophy: 'trophy',
	video: 'videocam',
	'water.waves': 'waves',
	waveform: 'graphic_eq',
	'waveform.path.ecg': 'monitor_heart',
	'web.camera': 'videocam',
	wifi: 'wifi',
	'wifi.exclamationmark': 'signal_wifi_bad',
	'wifi.slash': 'wifi_off',
	'wrench.and.screwdriver': 'build',
	xmark: 'close',
	'xmark.circle': 'cancel',
	// The custom symbols in `assets/symbols/`, which `Image` takes by
	// `assetName`: the newspapers' mastheads.
	carletonian: 'newspaper',
	'olaf-messenger': 'newspaper',
	'olaf-messenger-castle': 'castle',
}

/** What a symbol nothing in the table matches draws: Material's generic shapes glyph. */
export const FALLBACK_SYMBOL = 'category'

/**
 * The Material Symbols Android draws filled, when the SF Symbol asks for its
 * `.fill` form. Material Symbols are outlined by default, and Android fills
 * one only where filling means something: an on state (a favourite, a
 * rating, a ticked item), a media control, and a dot. iOS fills symbols for
 * weight -- a tile's graduation cap, a map category's tree -- which Android
 * draws outlined, as its own apps do.
 */
export const FILLED_SYMBOLS: ReadonlySet<string> = new Set([
	'check_circle',
	'circle',
	'favorite',
	'pause',
	'play_arrow',
	'star',
])

/** One Material Symbol: its name, and whether to draw its filled variant. */
export type MaterialSymbol = {name: string; filled: boolean}

/**
 * The Material Symbol closest to an SF Symbol name. The whole name is looked
 * up first, so a `.fill` symbol with a counterpart of its own (`circle.fill`,
 * a dot, against `circle`, a ring) finds it; then the name without `.fill`,
 * then with its last dot-separated part dropped, until a match or nothing is
 * left, when it falls back to `FALLBACK_SYMBOL`. A `.fill` name draws filled
 * only if its symbol is one of `FILLED_SYMBOLS`.
 */
export function materialSymbolFor(sfName: string | undefined | null): MaterialSymbol {
	if (!sfName) {
		return {name: FALLBACK_SYMBOL, filled: false}
	}
	let parts = sfName.split('.')
	let wantsFill = parts.includes('fill')
	let exact = SF_TO_MATERIAL[sfName]
	if (exact) {
		return {name: exact, filled: wantsFill && FILLED_SYMBOLS.has(exact)}
	}
	let base = parts.filter((part) => part !== 'fill')
	while (base.length > 0) {
		let candidate = SF_TO_MATERIAL[base.join('.')]
		if (candidate) {
			return {name: candidate, filled: wantsFill && FILLED_SYMBOLS.has(candidate)}
		}
		base = base.slice(0, -1)
	}
	return {name: FALLBACK_SYMBOL, filled: false}
}
