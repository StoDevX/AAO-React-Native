// @flow
import mapValues from 'lodash/mapValues'
import type {
  MenuItemContainerType,
  MasterCorIconMapType,
  MenuItemType,
} from '../views/menus/types'

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
