import type {HotlineMenu, HotlineOption} from './directory'

/** A key on the phone's keypad. */
export type Key = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | '*' | '#'

/** Where the caller is in the tree, and how many times the menu has waited on them. */
export type CallState = {stack: Array<{menu: HotlineMenu; page: number}>; idlePrompts: number}

/** What to say, and whether the call then waits for a key or hangs up. */
export type Step = {state: CallState; say: string; next: 'listen' | 'hang-up'}

/** The number that reaches the hotline. */
export const HOTLINE_NUMBER = '411'

/** How long the menu waits for a key before repeating, then giving up. */
export const IDLE_MS = 15_000

/** The most options a page holds when the menu runs to more than one. */
const PAGE_SIZE = 8

/** The key that turns to a menu's next page. */
const MORE_KEY = 9

/** `menu`'s options split into pages: all of them on one when they fit the keys. */
function pagesOf(menu: HotlineMenu): HotlineOption[][] {
	if (menu.options.length <= MORE_KEY) {
		return [menu.options]
	}
	let pages: HotlineOption[][] = []
	for (let start = 0; start < menu.options.length; start += PAGE_SIZE) {
		pages.push(menu.options.slice(start, start + PAGE_SIZE))
	}
	return pages
}

const hasMorePages = (menu: HotlineMenu, page: number) => page < pagesOf(menu).length - 1

/** What the voice offers on `page` of `menu`: "For Stav Hall, press 1. …" */
export function menuPrompt(menu: HotlineMenu, page: number): string {
	let offers = (pagesOf(menu)[page] ?? []).map(
		(option, i) => `For ${option.label}, press ${i + 1}.`,
	)
	if (hasMorePages(menu, page)) {
		offers.push(`For more options, press ${MORE_KEY}.`)
	}
	return offers.join(' ')
}

function current(state: CallState): {menu: HotlineMenu; page: number} {
	let top = state.stack.at(-1)
	if (!top) {
		throw new Error('A call is always somewhere in the tree')
	}
	return top
}

/** Says `prefix` (if any), then the menu the caller is on, and waits for a key. */
function offer(stack: CallState['stack'], prefix = ''): Step {
	let state = {stack, idlePrompts: 0}
	let {menu, page} = current(state)
	let prompt = menuPrompt(menu, page)
	return {state, say: prefix ? `${prefix} ${prompt}` : prompt, next: 'listen'}
}

/** The call picking up: the greeting, then the main menu. */
export function answer(root: HotlineMenu, appName: string): Step {
	return offer([{menu: root, page: 0}], `Thank you for calling the ${appName} Hotline.`)
}

/** The caller pressing `key` on the menu they are on. */
export function press(state: CallState, key: Key): Step {
	let {menu, page} = current(state)
	let below = state.stack.slice(0, -1)

	if (key === '0') {
		return offer(state.stack)
	}
	if (key === '*') {
		return offer(below.length > 0 ? below : state.stack)
	}
	if (key === String(MORE_KEY) && hasMorePages(menu, page)) {
		return offer([...below, {menu, page: page + 1}])
	}

	let option = pagesOf(menu)[page]?.[Number(key) - 1]
	if (key === '#' || !option) {
		return offer(state.stack, 'Sorry, that is not a valid option.')
	}
	if ('answer' in option.target) {
		return offer(state.stack, option.target.answer)
	}
	return offer([...state.stack, {menu: option.target, page: 0}])
}

/** The menu finishing with no key pressed for `IDLE_MS`: once it repeats, then it gives up. */
export function idle(state: CallState): Step {
	if (state.idlePrompts === 0) {
		let step = offer(state.stack)
		return {...step, state: {...step.state, idlePrompts: 1}}
	}
	return {state, say: "We didn't receive a selection. Goodbye.", next: 'hang-up'}
}

/** A call that says `say`, then hangs up, with no tree behind it. */
function recording(say: string): Step {
	return {state: {stack: [], idlePrompts: 0}, say, next: 'hang-up'}
}

/** A call to any number but the hotline's. */
export function notInService(): Step {
	return recording('The number you have dialed is not in service.')
}

/** A hotline call whose campus's hours could not be had at all. */
export function cannotComplete(): Step {
	return recording("We're unable to complete your call at this time. Please try again later.")
}
