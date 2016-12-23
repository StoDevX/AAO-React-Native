const vegetarian = {
  label: 'vegetarian',
  icon: require('./images/menu-icons/v.png'),
  description: 'Vegetarian: Contains no meat, fish, poultry, shellfish or products derived from these sources but may contain dairy or eggs',
}

const seafoodWatch = {
  label: 'seafood watch',
  icon: require('./images/menu-icons/sw.png'),
  description: 'Seafood Watch: Contains seafood that meets the Monterey Bay Aquarium’s Seafood Watch guidelines for commercial buyers.',
}

const vegan = {
  label: 'vegan',
  icon: require('./images/menu-icons/vg.png'),
  description: 'Vegan: Contains absolutely no animal or dairy products.',
}

const forYourWellBeing = {
  label: 'for your well-being',
  icon: require('./images/menu-icons/wb.png'),
  description: 'For Your Well-Being: Contains foods illustrating this month’s Food For Your Well-Being topic ',
}

const farmToFork = {
  label: 'farm to fork',
  icon: require('./images/menu-icons/ff.png'),
  description: 'Farm to Fork: Contains seasonal, minimally processed ingredients from a local farm, ranch, or fishing boat.',
}

const inBalance = {
  label: 'in balance',
  icon: require('./images/menu-icons/ib.png'),
}

const madeWithoutGlutenContainingIngredients = {
  label: 'made without gluten-containing ingredients',
  icon: require('./images/menu-icons/mwgci.png'),
  description: 'Made without Gluten-Containing Ingredients: Due to our open kitchens that handle gluten, we cannot guarantee that items made without gluten-containing ingredients are “gluten-free,” as defined by the FDA.  We make every effort to avoid gluten cross-contact; however there is always the potential for cross-contact with other gluten-containing food items, particularly in our self-serve facilities. We encourage guests to speak to the chef or manager regarding any questions about ingredients.',
}

const kosher = {
  label: 'kosher',
  icon: require('./images/menu-icons/k.png'),
}

export default {
  '1': vegetarian,
  '3': seafoodWatch,
  '4': vegan,
  '5': forYourWellBeing,
  '6': farmToFork,
  '7': inBalance,
  '9': madeWithoutGlutenContainingIngredients,
  '11': kosher,
}
