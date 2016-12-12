// @flow
import mapValues from 'lodash/mapValues'
import type {
  StationMenuType,
  MenuItemContainerType,
  MasterCorIconMapType,
  MenuItemType,
} from '../views/menus/types'

function upgradeStations(station, index): StationMenuType {
  return {
    'soup': false,
    'price': '',
    'note': '',
    'order_id': String(index),
    ...station,
    id: String(index),
  }
}

function upgradeMenuItem(item, key): MenuItemType {
  return {
    'connector': '',
    'cor_icon': {},
    'description': '',
    'options': [],
    'ordered_cor_icon': {},
    'nutrition': {
      'kcal': '',
      'well_being': '',
      'well_being_image': '',
    },
    'nutrition_link': '',
    'rating': '',
    'special': false,
    'sub_station': '',
    'sub_station_id': '',
    'sub_station_order': '',
    'tier3': false,
    'zero_entree': '0',
    ...item,
    id: key,
  }
}


export const stations: StationMenuType[] = [
  {
    items: ['1', '2', '3', '4', '5', '6'],
    label: 'Pizza',
    note: 'Includes two toppings.',
    price: '(12" Small $6.00 / 16" Large $9.00)',
  },
  {
    items: ['7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
    label: 'Toppings',
    price: '($0.75/$1.00)',
  },
  {
    items: ['20', '21', '22', '23', '24'],
    label: 'Specialty Pizzas',
    price: '(12" Small $8.00 / 16" Large $11.00)',
  },
  {
    items: ['25', '26', '27', '28', '29', '30'],
    label: 'Shake Flavors',
    note: 'Add-ons: M&Ms, Oreos, Reece\'s ($0.50)',
    price: 'Regular ($1.50/$3.00), Specialty ($1.75/$3.50)',
  },
  {
    items: [],
    label: 'Dessert',
  },
  {
    items: [],
    label: 'Drinks',
  },
  {
    items: [],
    label: 'Quesadillas',
    note: [
      'Ultimate: tomatoes, onions, green peppers, jalapeños',
      'Salsa and/or Sour Cream ($0.25)',
      '(half/whole prices)',
    ].join('\n'),
  },
  {
    items: [],
    label: 'Dinner',
    note: [
      'Extra Sauce for Chicken Strips($0.25): BBQ, Honey Mustard, Marinara, Ranch, Blue Cheese, Hot Sauce',
      'Pita Pizza Specialties: Garden Hummus, Tomatoes, Onions, Peppers, Jalapeños',
    ].join('\n'),
  },
].map(upgradeStations)

export const items: MenuItemContainerType = mapValues({
  '1': {
    label: 'Slice',
    price: '$1.25',
    special: true,
    station: 'Pizza',
  },
  '2': {
    label: 'Small (12 in)',
    price: '$6.00',
    special: true,
    station: 'Pizza',
  },
  '3': {
    label: 'Large (16 in)',
    price: '$9.00',
    special: true,
    station: 'Pizza',
  },
  '4': {
    label: 'Extra Toppings (small/large)',
    price: '($0.75/$1.00)',
    station: 'Pizza',
  },
  '5': {
    label: 'Extra Chicken',
    price: '$1.00',
    station: 'Pizza',
  },
  '6': {
    description: 'Marinara, Ranch, BBQ, Honey Mustard',
    label: 'Side of Sauce',
    price: '$0.25',
    station: 'Pizza',
  },
  '7': {
    label: 'Pepperoni',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '8': {
    label: 'Sausage',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '9': {
    label: 'Bacon',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '10': {
    label: 'Canadian Bacon',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '11': {
    label: 'Mushrooms',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '12': {
    label: 'Black Olives',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '13': {
    label: 'Green Pepper',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '14': {
    label: 'Onions',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '15': {
    label: 'Tomatoes',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '16': {
    label: 'Tomatoes',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '17': {
    label: 'Pineapple',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '18': {
    label: 'Spinach',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '19': {
    label: 'Jalapeños',
    price: '($0.75/$1.00)',
    station: 'Toppings',
  },
  '20': {
    label: 'Chicken Bacon Ranch',
    price: '($8.00/$11.00)',
    special: true,
    station: 'Specialty Pizza',
  },
  '21': {
    label: 'BBQ Chicken',
    price: '($8.00/$11.00)',
    special: true,
    station: 'Specialty Pizza',
  },
  '22': {
    label: 'Buffalo Chicken',
    price: '($8.00/$11.00)',
    special: true,
    station: 'Specialty Pizza',
  },
  '23': {
    description: 'tomatoes',
    label: 'Chicken Pesto',
    price: '($8.00/$11.00)',
    special: true,
    station: 'Specialty Pizza',
  },
  '24': {
    description: 'pepperoni, sausage, onions, green peppers, black olives',
    label: 'Ole Pizza',
    price: '($8.00/$11.00)',
    special: true,
    station: 'Specialty Pizza',
  },
  '25': {
    label: 'Vanilla',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
  '26': {
    label: 'Butterscotch',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
  '27': {
    label: 'Butter Pecan',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
  '28': {
    label: 'Mocha',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
  '29': {
    label: 'Cheesecake',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
  '30': {
    label: 'Dreamsicle',
    price: '($1.50/$3.00)',
    special: true,
    station: 'Shake',
  },
}, upgradeMenuItem)

export const corIcons: MasterCorIconMapType = {}
