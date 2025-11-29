// Completed Quests Tracking - Tracks which quests have shown completion popup

const COMPLETED_QUESTS_KEY = 'completedQuestsShown';

// Get list of quest IDs that have already shown completion popup
export const getCompletedQuestsShown = (): string[] => {
  const stored = localStorage.getItem(COMPLETED_QUESTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Mark a quest as having shown its completion popup
export const markQuestCompletionShown = (questId: string): void => {
  const shown = getCompletedQuestsShown();
  if (!shown.includes(questId)) {
    shown.push(questId);
    localStorage.setItem(COMPLETED_QUESTS_KEY, JSON.stringify(shown));
  }
};

// Check if a quest has already shown its completion popup
export const hasShownCompletionPopup = (questId: string): boolean => {
  return getCompletedQuestsShown().includes(questId);
};
