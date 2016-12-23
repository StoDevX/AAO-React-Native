import type {MenuItemType, StationMenuType} from '../views/menus/types'

export function upgradeMenuItem(item, index): MenuItemType {
  return {
    'connector': '',
    'cor_icon': {},
    'description': '',
    'options': [],
    'ordered_cor_icon': {},
    'monotony': {},
    'nutrition': {
      'kcal': '',
      'well_being': '',
      'well_being_image': '',
    },
    'nutrition_link': '',
    'price': '',
    'rating': '',
    'special': false,
    'sub_station': '',
    'sub_station_id': '',
    'sub_station_order': '',
    'tier3': false,
    'zero_entree': '0',
    ...item,
    id: String(index),
  }
}

export function upgradeStation(station, index): StationMenuType {
  return {
    'soup': false,
    'price': '',
    'note': '',
    'order_id': String(index),
    ...station,
    id: String(index),
  }
}
