export type RenameScope = 'project' | 'timeline';

export interface RenameContext {
  getScope: RenameScope;
  setScope(value: RenameScope): void;
}

export const renameContextKey = 'rename';