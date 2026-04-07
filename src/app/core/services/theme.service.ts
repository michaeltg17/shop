import { Injectable } from '@angular/core';
import { Theme, ThemeColor, themeColors, ThemeMode, themeModes } from '../models/theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme';
  currentTheme = new Theme('light', 'blue');

  setThemeColor(color: ThemeColor) {
    this.currentTheme = { ...this.currentTheme, color };
    this.applyTheme();
    this.persistTheme();
  }

  setThemeMode(mode: ThemeMode) {
    this.currentTheme = { ...this.currentTheme, mode: mode };
    this.applyTheme();
    this.persistTheme();
  }

  loadTheme() {
    const json = localStorage.getItem(this.storageKey);
    if (!json) {
      this.applyTheme();
      return;
    }

    try {
      this.currentTheme = JSON.parse(json);
      this.applyTheme();
      // eslint-disable-next-line no-empty
    } catch {}
  }

  private applyTheme() {
    const html = document.documentElement;
    html.classList.remove(...themeModes, ...themeColors);
    html.classList.add(this.currentTheme.mode, this.currentTheme.color);
  }

  private persistTheme() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.currentTheme));
  }
}