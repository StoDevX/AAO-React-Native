import {createLayoutStore} from '../../lib/layout-store'

/** How home lays its tiles out: one grid of every tile, or a list of them. */
export type HomeLayout = 'tiled' | 'list'

export const useHomeLayoutStore = createLayoutStore<HomeLayout>('home-layout-preference', 'tiled')
