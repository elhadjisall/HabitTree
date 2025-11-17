// Global Leaf Dollar storage
const LEAF_DOLLARS_KEY = 'leafDollars';
const DEFAULT_LEAF_DOLLARS = 1250;

export const getLeafDollars = (): number => {
  const stored = localStorage.getItem(LEAF_DOLLARS_KEY);
  return stored ? parseInt(stored) : DEFAULT_LEAF_DOLLARS;
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
