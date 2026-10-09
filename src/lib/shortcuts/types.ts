export interface ShortcutItem {
  id: string;
  keys: string[];
  labelAr: string;
  labelEn: string;
  category: 'navigation' | 'actions' | 'list';
  action: () => void;
  scope?: 'global' | 'list' | 'detail';
}

export interface ShortcutGroup {
  category: 'navigation' | 'actions' | 'list';
  titleAr: string;
  titleEn: string;
  items: ShortcutItem[];
}
