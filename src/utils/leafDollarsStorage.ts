// Global Leaf Dollar storage
const LEAF_DOLLARS_KEY = 'leafDollars';
const DEFAULT_LEAF_DOLLARS = 50; // New users start with 50 leaf dollars

export const getLeafDollars = (): number => {
  const stored = localStorage.getItem(LEAF_DOLLARS_KEY);
  if (stored !== null) {
    return parseInt(stored);
  }
  // First time - set default and return
  setLeafDollars(DEFAULT_LEAF_DOLLARS);
  return DEFAULT_LEAF_DOLLARS;
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
