//tree-shake friendly
export const DialogMode = {
  Add: 'add',
  Edit: 'edit',
  View: 'view'
} as const;
export type DialogMode = (typeof DialogMode)[keyof typeof DialogMode];
