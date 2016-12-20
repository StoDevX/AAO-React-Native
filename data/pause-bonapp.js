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
    'price': '',
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
    items: ['43', '44', '45'],
    label: 'Fountain & Bottled',
    note: [
      'Root Beer Float: small or large',
      'Fountain: refills are extra',
    ].join('\n'),
  },
  {
    items: ['01', '02', '03', '04'],
    label: 'Pizza',
    note: 'Includes two toppings',
  },
  {
    items: ['05', '06', '07', '08', '09'],
    label: 'Pizza - Specialties',
  },
  {
    items: ['28', '29', '30', '31'],
    label: 'Pita',
    note: 'Pizza built on pita bread, includes two toppings',
  },
  {
    items: ['26', '27'],
    label: 'Quesadilla',
    note: [
      'Ultimate: tomatoes, onions, green peppers, jalapeños',
      'Salsa / Sour Cream are extra',
    ].join('\n'),
  },
  {
    items: ['32', '33', '34', '35', '36', '37', '38', '39'],
    label: 'Savory',
  },
  {
    items: ['40', '41', '42'],
    note: [
      'Ice Cream: Vanilla, Chocolate, or Twist Soft-Serve in a cup or a cone',
      'Shakes: Vanilla, Chocolate, Strawberry, Butter pecan, Butterscotch, Mocha, Mint, Cheesecake',
    ].join('\n'),
    label: 'Sweet',
  },
  {
    items: ['23', '24', '25'],
    label: 'Shakes -- Mixins',
  },
  {
    items: ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'],
    label: 'Toppings',
    note: [
      'Extra toppings: $',
      'Extra chicken: $$',
    ].join('\n'),
  },
].map(upgradeStations)

export const items: MenuItemContainerType = mapValues({
  '01': {
    label: 'Slice',
    special: true,
    station: 'Pizza',
  },
  '02': {
    label: 'Small Pizza (12 in)',
    special: true,
    station: 'Pizza',
  },
  '03': {
    label: 'Large Pizza (16 in)',
    special: true,
    station: 'Pizza',
  },
  '04': {
    description: 'Marinara, Ranch, BBQ, Honey Mustard',
    label: 'Side of Sauce',
    station: 'Pizza',
  },
  '05': {
    label: 'BBQ Chicken',
    special: true,
    station: 'Pizza - Specialties',
  },
  '06': {
    label: 'Buffalo Chicken',
    special: true,
    station: 'Pizza - Specialties',
  },
  '07': {
    label: 'Chicken Bacon Ranch',
    special: true,
    station: 'Pizza - Specialties',
  },
  '08': {
    description: 'tomatoes',
    label: 'Chicken Pesto',
    special: true,
    station: 'Pizza - Specialties',
  },
  '09': {
    description: 'pepperoni, sausage, onions, green peppers, black olives',
    label: 'Ole Pizza',
    special: true,
    station: 'Pizza - Specialties',
  },
  '10': {
    label: 'Bacon',
    station: 'Toppings',
  },
  '11': {
    label: 'Canadian Bacon',
    station: 'Toppings',
  },
  '12': {
    label: 'Chicken',
    station: 'Toppings',
  },
  '13': {
    label: 'Pepperoni',
    station: 'Toppings',
  },
  '14': {
    label: 'Sausage',
    station: 'Toppings',
  },
  '15': {
    label: 'Black Olives',
    station: 'Toppings',
  },
  '16': {
    label: 'Green Peppers',
    station: 'Toppings',
  },
  '17': {
    label: 'Jalapeños',
    station: 'Toppings',
  },
  '18': {
    label: 'Mushrooms',
    station: 'Toppings',
  },
  '19': {
    label: 'Onions',
    station: 'Toppings',
  },
  '20': {
    label: 'Pineapple',
    station: 'Toppings',
  },
  '21': {
    label: 'Spinach',
    station: 'Toppings',
  },
  '22': {
    label: 'Tomatoes',
    station: 'Toppings',
  },
  '23': {
    label: 'M&Ms',
    station: 'Shake Mixins',
  },
  '24': {
    label: 'Oreo',
    station: 'Shake Mixins',
  },
  '25': {
    label: 'Reese’s peanut butter cups',
    station: 'Shake Mixins',
  },
  '26': {
    label: 'Cheese Quesadilla (Half / Whole)',
    special: true,
    station: 'Quesadilla',
  },
  '27': {
    label: 'Ultimate Quesadilla (Half / Whole)',
    special: true,
    station: 'Quesadilla',
  },
  '28': {
    label: 'Pita Pizza',
    special: true,
    station: 'Pita',
  },
  '29': {
    label: 'Specialty Pita Pizza',
    special: true,
    station: 'Pita',
  },
  '30': {
    description: 'Pita bread with choice of Hummus and Vegetable Toppings, cooked',
    label: 'Garden Pita',
    special: true,
    station: 'Pita',
  },
  '31': {
    description: 'Choice of Garlic, Red Pepper, or Feisty Feta Hummus',
    label: 'Toasted Pita and Hummus',
    special: true,
    station: 'Pita',
  },
  '32': {
    label: 'Pizza Bagel',
    special: true,
    station: 'Savory',
  },
  '33': {
    label: 'Pizza Bagel - Specialty',
    special: true,
    station: 'Savory',
  },
  '34': {
    label: 'Garlic Cheesy Bread',
    special: true,
    station: 'Savory',
  },
  '35': {
    description: 'Chips and cheese cup',
    label: 'Nachos',
    special: true,
    station: 'Savory',
  },
  '36': {
    label: 'Chips & Salsa',
    special: true,
    station: 'Savory',
  },
  '37': {
    label: 'Bosco Sticks',
    special: true,
    station: 'Savory',
  },
  '38': {
    label: 'Soft Pretzel',
    special: true,
    station: 'Savory',
  },
  '39': {
    description: 'Choice of dipping sauce: BBQ, Honey Mustard, Marinara, Ranch, Blue Cheese, Hot Sauce',
    label: 'Chicken Strips',
    special: true,
    station: 'Savory',
  },
  '40': {
    label: 'Shakes',
    special: true,
    station: 'Sweet',
  },
  '41': {
    label: 'Ice Cream',
    special: true,
    station: 'Sweet',
  },
  '42': {
    label: 'Pause Cookie',
    special: true,
    station: 'Sweet',
  },
  '43': {
    label: 'Fountain Drinks',
    special: true,
    station: 'Fountain & Bottled',
  },
  '44': {
    label: 'Bottled Beverages',
    special: true,
    station: 'Fountain & Bottled',
  },
  '45': {
    label: 'Root Beer Float',
    special: true,
    station: 'Fountain & Bottled',
  },
}, upgradeMenuItem)

export const corIcons: MasterCorIconMapType = {}
