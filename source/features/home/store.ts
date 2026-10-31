import {createLayoutStore} from '../../lib/layout-store'

/**
 * How home lays its tiles out: one grid of every tile, or a list of them -- or,
 * as the Phone layout, a keypad for the hotline in place of the tiles.
 */
export type HomeLayout = 'tiled' | 'list' | 'phone'

export const useHomeLayoutStore = createLayoutStore<HomeLayout>('home-layout-preference', 'tiled')
