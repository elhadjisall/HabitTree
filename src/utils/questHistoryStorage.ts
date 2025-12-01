// Quest History Storage - Stores completed/deleted quest statistics

export interface QuestHistoryEntry {
  id: string; // Original habit ID
  label: string;
  emoji: string;
  color: string;
  trackingType: 'tick_cross' | 'variable_amount' | 'quit';
  highestStreak: number;
  daysCompleted: number;
  daysMissed: number;
  totalDays: number;
  completedAt: string; // ISO date when quest was completed/deleted
  target_amount?: number;
  unit?: string;
}

const QUEST_HISTORY_KEY = 'questHistory';

// Get all quest history entries
export const getQuestHistory = (): QuestHistoryEntry[] => {
  const stored = localStorage.getItem(QUEST_HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set quest history
export const setQuestHistory = (history: QuestHistoryEntry[]): void => {
  localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event('questHistoryChanged'));
};

// Add a quest to history
export const addQuestToHistory = (entry: QuestHistoryEntry): void => {
  const history = getQuestHistory();
  history.push(entry);
  setQuestHistory(history);
};

// Get quest history entry by ID
export const getQuestHistoryById = (id: string): QuestHistoryEntry | undefined => {
  const history = getQuestHistory();
  return history.find(entry => entry.id === id);
};

// Delete a quest history entry
export const deleteQuestHistoryEntry = (id: string): void => {
  const history = getQuestHistory();
  setQuestHistory(history.filter(entry => entry.id !== id));
};
