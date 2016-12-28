// @flow
import React from 'react'

import MenuView from './menu'
import type {MenuSectionType} from './menuSection'
import pauseMenuItems from '../../data/pause-menu.json'

export default function PauseMenuView({menu=pauseMenuItems}: {menu: MenuSectionType[]}) {
  return (
    <MenuView menu={menu} />
  )
}
