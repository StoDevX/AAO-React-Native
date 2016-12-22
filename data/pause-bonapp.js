// @flow
import type {MasterCorIconMapType, MenuItemType} from '../views/menus/types'

function upgradeMenuItem(item, index): MenuItemType {
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

export const items: MenuItemType[] = [
  {
    label: 'Slice',
    special: true,
    station: 'Pizza',
  },
  {
    label: 'Small Pizza (12 in)',
    special: true,
    station: 'Pizza',
  },
  {
    label: 'Large Pizza (16 in)',
    special: true,
    station: 'Pizza',
  },
  {
    description: 'Marinara, Ranch, BBQ, Honey Mustard',
    label: 'Side of Sauce',
    station: 'Pizza',
  },
  {
    label: 'BBQ Chicken',
    special: true,
    station: 'Pizza - Specialties',
  },
  {
    label: 'Buffalo Chicken',
    special: true,
    station: 'Pizza - Specialties',
  },
  {
    label: 'Chicken Bacon Ranch',
    special: true,
    station: 'Pizza - Specialties',
  },
  {
    description: 'tomatoes',
    label: 'Chicken Pesto',
    special: true,
    station: 'Pizza - Specialties',
  },
  {
    description: 'pepperoni, sausage, onions, green peppers, black olives',
    label: 'Ole Pizza',
    special: true,
    station: 'Pizza - Specialties',
  },
  {
    label: 'Bacon',
    station: 'Toppings',
  },
  {
    label: 'Canadian Bacon',
    station: 'Toppings',
  },
  {
    label: 'Chicken',
    station: 'Toppings',
  },
  {
    label: 'Pepperoni',
    station: 'Toppings',
  },
  {
    label: 'Sausage',
    station: 'Toppings',
  },
  {
    label: 'Black Olives',
    station: 'Toppings',
  },
  {
    label: 'Green Peppers',
    station: 'Toppings',
  },
  {
    label: 'Jalapeños',
    station: 'Toppings',
  },
  {
    label: 'Mushrooms',
    station: 'Toppings',
  },
  {
    label: 'Onions',
    station: 'Toppings',
  },
  {
    label: 'Pineapple',
    station: 'Toppings',
  },
  {
    label: 'Spinach',
    station: 'Toppings',
  },
  {
    label: 'Tomatoes',
    station: 'Toppings',
  },
  {
    label: 'M&Ms',
    station: 'Shake Mixins',
  },
  {
    label: 'Oreo',
    station: 'Shake Mixins',
  },
  {
    label: 'Reese’s peanut butter cups',
    station: 'Shake Mixins',
  },
  {
    label: 'Cheese Quesadilla (Half / Whole)',
    special: true,
    station: 'Quesadilla',
  },
  {
    label: 'Ultimate Quesadilla (Half / Whole)',
    special: true,
    station: 'Quesadilla',
  },
  {
    label: 'Pita Pizza',
    special: true,
    station: 'Pita',
  },
  {
    label: 'Specialty Pita Pizza',
    special: true,
    station: 'Pita',
  },
  {
    description: 'Pita bread with choice of Hummus and Vegetable Toppings, cooked',
    label: 'Garden Pita',
    special: true,
    station: 'Pita',
  },
  {
    description: 'Choice of Garlic, Red Pepper, or Feisty Feta Hummus',
    label: 'Toasted Pita and Hummus',
    special: true,
    station: 'Pita',
  },
  {
    label: 'Pizza Bagel',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Pizza Bagel - Specialty',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Garlic Cheesy Bread',
    special: true,
    station: 'Savory',
  },
  {
    description: 'Chips and cheese cup',
    label: 'Nachos',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Chips & Salsa',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Bosco Sticks',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Soft Pretzel',
    special: true,
    station: 'Savory',
  },
  {
    description: 'Choice of dipping sauce: BBQ, Honey Mustard, Marinara, Ranch, Blue Cheese, Hot Sauce',
    label: 'Chicken Strips',
    special: true,
    station: 'Savory',
  },
  {
    label: 'Shakes',
    special: true,
    station: 'Sweet',
  },
  {
    label: 'Ice Cream',
    special: true,
    station: 'Sweet',
  },
  {
    label: 'Pause Cookie',
    special: true,
    station: 'Sweet',
  },
  {
    label: 'Fountain Drinks',
    special: true,
    station: 'Fountain & Bottled',
  },
  {
    label: 'Bottled Beverages',
    special: true,
    station: 'Fountain & Bottled',
  },
  {
    label: 'Root Beer Float',
    special: true,
    station: 'Fountain & Bottled',
  },
].map(upgradeMenuItem)

export const corIcons: MasterCorIconMapType = {}
