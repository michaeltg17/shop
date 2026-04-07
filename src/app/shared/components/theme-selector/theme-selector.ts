import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../../core/services/theme.service';
import { themeColors, themeModes } from '../../../core/models/theme';

@Component({
  selector: 'app-theme-selector',
  imports: [MatSelectModule, CommonModule, MatIconModule, MatRadioModule, MatMenuModule, MatButtonModule],
  templateUrl: './theme-selector.html',
  styleUrl: './theme-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeSelector implements OnInit {
  themeService = inject(ThemeService);
  themeColors = themeColors;
  themeModes = themeModes;

  ngOnInit() {
    this.themeService.loadTheme();
  }
}