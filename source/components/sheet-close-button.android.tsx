/**
 * Android's sheet routes are full screens with a back arrow in their top app
 * bar (see `DETAIL_SHEET` in `app/_layout.tsx`), so they need no Close button
 * of their own; a second way out beside the arrow is an iOS convention.
 */
export function SheetCloseButton(): null {
	return null
}
