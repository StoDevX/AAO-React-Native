// @flow
import React from 'react'

import MenuView from './menu'
import type {MenuSectionType} from './types'
import cageMenuItems from '../../data/cage-menu.json'

export default function CageMenuView({menu=cageMenuItems}: {menu: MenuSectionType[]}) {
  return (
    <MenuView menu={menu} />
  )
}
