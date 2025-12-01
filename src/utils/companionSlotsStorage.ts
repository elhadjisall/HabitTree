// Companion Slots Storage - Manages which characters are displayed in companion slots

const COMPANION_SLOTS_KEY = 'companionSlots';
const MAX_COMPANION_SLOTS = 8;

// Get user's companion slots (array of character emojis, max 8)
export const getCompanionSlots = (): string[] => {
  const stored = localStorage.getItem(COMPANION_SLOTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set companion slots
export const setCompanionSlots = (slots: string[]): void => {
  // Ensure max 8 slots
  const limitedSlots = slots.slice(0, MAX_COMPANION_SLOTS);
  localStorage.setItem(COMPANION_SLOTS_KEY, JSON.stringify(limitedSlots));
  window.dispatchEvent(new Event('companionSlotsChanged'));
};

// Update a specific slot
export const updateCompanionSlot = (index: number, emoji: string): void => {
  if (index < 0 || index >= MAX_COMPANION_SLOTS) {
    return;
  }

  const slots = getCompanionSlots();

  // Extend array if needed
  while (slots.length <= index) {
    slots.push('');
  }

  slots[index] = emoji;
  setCompanionSlots(slots);
};

// Remove character from a slot
export const clearCompanionSlot = (index: number): void => {
  if (index < 0 || index >= MAX_COMPANION_SLOTS) {
    return;
  }

  const slots = getCompanionSlots();
  if (index < slots.length) {
    slots[index] = '';
    setCompanionSlots(slots);
  }
};

// Get max number of companion slots
export const getMaxCompanionSlots = (): number => {
  return MAX_COMPANION_SLOTS;
};
