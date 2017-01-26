const vegetarian = {
  label: 'vegetarian',
  icon: require('./menu-icons/v.png'),
  description: 'Contains no meat, fish, poultry, shellfish or products derived from these sources but may contain dairy or eggs.',
}

const seafoodWatch = {
  label: 'seafood watch',
  icon: require('./menu-icons/sw.png'),
  description: 'Contains seafood that meets the Monterey Bay Aquarium’s Seafood Watch guidelines for commercial buyers.',
}

const vegan = {
  label: 'vegan',
  icon: require('./menu-icons/vg.png'),
  description: 'Contains absolutely no animal or dairy products.',
}

const forYourWellBeing = {
  label: 'for your well-being',
  icon: require('./menu-icons/wb.png'),
  description: 'Contains foods illustrating this month’s Food For Your Well-Being topic.',
}

const farmToFork = {
  label: 'farm to fork',
  icon: require('./menu-icons/ff.png'),
  description: 'Contains seasonal, minimally processed ingredients from a local farm, ranch, or fishing boat.',
}

const inBalance = {
  label: 'in balance',
  icon: require('./menu-icons/ib.png'),
  description: 'Contains a balanced portion of whole grains, fresh fruits and vegetables, and lean protein with a minimum amount of healthy fat.',
}

const madeWithoutGlutenContainingIngredients = {
  label: 'made without gluten-containing ingredients',
  icon: require('./menu-icons/mwgci.png'),
  description: 'Due to our open kitchens that handle gluten, we cannot guarantee that items made without gluten-containing ingredients are “gluten-free,” as defined by the FDA.  We make every effort to avoid gluten cross-contact; however there is always the potential for cross-contact with other gluten-containing food items, particularly in our self-serve facilities. We encourage guests to speak to the chef or manager regarding any questions about ingredients.',
}

const kosher = {
  label: 'kosher',
  icon: require('./menu-icons/k.png'),
  description: 'Contains only ingredients prepared in accordance with Jewish Dietary Law.',
}

const humane = {
  label: 'humane',
  icon: require('./menu-icons/h.png'),
  description: 'Contains humanely raised meat, poultry, or eggs. Must be certified by a credible third-party animal welfare organization.',
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
  '18': humane,
}
