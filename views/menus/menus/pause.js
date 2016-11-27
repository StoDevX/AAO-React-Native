// @flow
import React from 'react'

import MenuView from '../parts/menu'
import type {MenuSectionType} from '../simple-types'
import pauseMenuItems from '../../../data/pause-menu.json'

export default function PauseMenuView({menu=pauseMenuItems}: {menu: MenuSectionType[]}) {
  return (
    <MenuView menu={menu} />
  )
}
