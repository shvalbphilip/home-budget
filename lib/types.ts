export type ItemStatus = 'בבעלותי' | 'נרכש' | 'חסר' | 'לרכישה' | 'אופציונלי';
export type ItemPriority = 'גבוהה' | 'בינונית' | 'נמוכה';

export const STATUS_OPTIONS: ItemStatus[] = ['בבעלותי', 'נרכש', 'חסר', 'לרכישה', 'אופציונלי'];
export const PRIORITY_OPTIONS: ItemPriority[] = ['גבוהה', 'בינונית', 'נמוכה'];

export interface Category {
  id: string;
  name: string;
  emoji: string;
  plannedBudget: number;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  status: ItemStatus;
  quantity: number;
  estimatedPrice: number;
  actualPrice: number;
  store: string;
  priority: ItemPriority;
  notes: string;
  purchaseDate: string;
  link: string;
  isEssential: boolean;
  createdAt: string;
}

export interface AppState {
  onboardingComplete: boolean;
  totalBudget: number;
  categories: Category[];
  items: Item[];

  completeOnboarding: (budget: number, categories: Category[]) => Promise<void>;
  setTotalBudget: (budget: number) => Promise<void>;

  addCategory: (name: string, emoji: string, budget: number) => Category;
  renameCategory: (id: string, name: string, emoji: string) => void;
  setCategoryBudget: (id: string, budget: number) => void;
  deleteCategory: (id: string) => void;
  resetCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;

  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  moveItem: (itemId: string, toCategoryId: string) => void;

  resetAll: () => Promise<void>;
  importState: (data: ExportedState) => Promise<void>;
}

export interface ExportedState {
  version: string;
  exportedAt: string;
  totalBudget: number;
  categories: Category[];
  items: Item[];
}
