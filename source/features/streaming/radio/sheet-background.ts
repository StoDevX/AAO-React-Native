import * as c from '@frogpond/colors'

/**
 * The background of a radio sheet whose body is drawn on the grouped
 * background, so no lighter band shows behind what sits above and below it.
 * `presentationBackground` is typed for a string, but its colour goes through
 * the same conversion as `tint`'s, which takes a PlatformColor.
 */
export const SHEET_BACKGROUND = c.systemGroupedBackground as unknown as string
