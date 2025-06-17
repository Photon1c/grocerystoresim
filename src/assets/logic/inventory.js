export const GROCERY_ITEMS = [
  'Milk', 'Eggs', 'Bread', 'Apples', 'Bananas', 'Chicken', 'Cheese', 'Cereal',
  'Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Yogurt', 'Juice', 'Coffee',
  'Rice', 'Pasta', 'Butter', 'Spinach', 'Cookies', 'Soup', 'Fish', 'Beef', 'Lettuce', 'Soda'
];

// Assign each item to an aisle (1-5) for even distribution
export const ITEM_AISLE_MAP = {};
const aisleCount = 5;
GROCERY_ITEMS.forEach((item, i) => {
  ITEM_AISLE_MAP[item] = (i % aisleCount) + 1;
});

export function getItemAisle(item) {
  return ITEM_AISLE_MAP[item] || 1;
}

export function getRandomItems(count) {
  const shuffled = GROCERY_ITEMS.slice().sort(() => Math.random() - 0.5);
  // Return array of { name, aisle }
  return shuffled.slice(0, count).map(item => ({ name: item, aisle: ITEM_AISLE_MAP[item] }));
} 