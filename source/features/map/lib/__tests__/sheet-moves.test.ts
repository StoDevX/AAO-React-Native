import {nextSheetDetent, type SheetState} from '../sheet-moves'

const at = (
	current: SheetState['current'],
	previous: SheetState['previous'] = null,
): SheetState => ({
	current,
	previous,
})

describe('nextSheetDetent', () => {
	describe('focusing the search bar', () => {
		it.each(['collapsed', 'medium', 'large'] as const)(
			'raises the sheet to large from %s and remembers where it was',
			(from) => {
				expect(nextSheetDetent({type: 'search-focused'}, at(from))).toEqual({
					current: 'large',
					previous: from,
				})
			},
		)
	})

	describe('cancelling the search', () => {
		it('returns the sheet to the remembered stop', () => {
			expect(nextSheetDetent({type: 'search-cancelled'}, at('large', 'collapsed'))).toEqual({
				current: 'collapsed',
				previous: null,
			})
		})

		it('leaves the sheet alone when nothing is remembered', () => {
			expect(nextSheetDetent({type: 'search-cancelled'}, at('large'))).toEqual(at('large'))
		})

		it('does not move a sheet the user has since dragged elsewhere', () => {
			expect(nextSheetDetent({type: 'search-cancelled'}, at('medium', 'collapsed'))).toEqual(
				at('medium'),
			)
		})
	})

	describe('losing focus without cancelling', () => {
		it('returns the sheet when the field was left empty', () => {
			expect(
				nextSheetDetent({type: 'search-blurred', hasText: false}, at('large', 'collapsed')),
			).toEqual(at('collapsed'))
		})

		it('leaves a typed query on screen, and can still be cancelled later', () => {
			expect(
				nextSheetDetent({type: 'search-blurred', hasText: true}, at('large', 'collapsed')),
			).toEqual(at('large', 'collapsed'))
		})

		it('does not move a sheet the user has since dragged elsewhere', () => {
			expect(
				nextSheetDetent({type: 'search-blurred', hasText: false}, at('medium', 'collapsed')),
			).toEqual(at('medium', 'collapsed'))
		})
	})

	describe('tapping a row', () => {
		it('drops a large sheet to medium so the map shows', () => {
			expect(nextSheetDetent({type: 'row-tapped'}, at('large'))).toEqual(at('medium'))
		})

		it('leaves a medium sheet where it is', () => {
			expect(nextSheetDetent({type: 'row-tapped'}, at('medium'))).toEqual(at('medium'))
		})

		it('forgets a pending return, since the search is over', () => {
			expect(nextSheetDetent({type: 'row-tapped'}, at('large', 'collapsed'))).toEqual(at('medium'))
		})
	})

	describe('tapping a footprint on the map', () => {
		it('raises a collapsed sheet to medium so the card fits', () => {
			expect(nextSheetDetent({type: 'footprint-tapped'}, at('collapsed'))).toEqual(at('medium'))
		})

		it.each(['medium', 'large'] as const)('leaves a %s sheet alone', (from) => {
			expect(nextSheetDetent({type: 'footprint-tapped'}, at(from))).toEqual(at(from))
		})
	})

	describe('dragging', () => {
		it('records the stop and keeps a pending return', () => {
			expect(nextSheetDetent({type: 'dragged', to: 'medium'}, at('large', 'collapsed'))).toEqual({
				current: 'medium',
				previous: 'collapsed',
			})
		})
	})
})
