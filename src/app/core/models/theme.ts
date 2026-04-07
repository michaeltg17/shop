import { capitalize } from '../../shared/utils/stringUtils';

export const themeColors = [
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'orange',
  'chartreuse',
  'spring-green',
  'azure',
  'violet',
  'rose'
];
export type ThemeColor = (typeof themeColors)[number];

export const themeModes = ['light', 'dark'];
export type ThemeMode = (typeof themeModes)[number];

export class Theme {
  readonly name: string;

  constructor(
    public readonly mode: ThemeMode,
    public readonly color: ThemeColor
  ) {
    this.name = `${capitalize(mode)} ${capitalize(color)}`;
  }
}