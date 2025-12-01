// Global Leaf Dollar storage
const LEAF_DOLLARS_KEY = 'leafDollars';
const DEFAULT_LEAF_DOLLARS = 1250;
const TEMP_DEV_LEAF_DOLLARS = 10000; // TEMPORARY: For development/testing only

export const getLeafDollars = (): number => {
  const stored = localStorage.getItem(LEAF_DOLLARS_KEY);
  const amount = stored ? parseInt(stored) : DEFAULT_LEAF_DOLLARS;

  // TEMPORARY: Override with 10,000 for testing
  // TODO: Remove this before production
  if (amount < TEMP_DEV_LEAF_DOLLARS) {
    setLeafDollars(TEMP_DEV_LEAF_DOLLARS);
    return TEMP_DEV_LEAF_DOLLARS;
  }

  return amount;
};

export const setLeafDollars = (amount: number): void => {
  localStorage.setItem(LEAF_DOLLARS_KEY, amount.toString());
};

export const addLeafDollars = (amount: number): number => {
  const current = getLeafDollars();
  const newAmount = current + amount;
  setLeafDollars(newAmount);
  return newAmount;
};

export const subtractLeafDollars = (amount: number): number => {
  const current = getLeafDollars();
  const newAmount = Math.max(0, current - amount);
  setLeafDollars(newAmount);
  return newAmount;
};
