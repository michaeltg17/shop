import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ThemeSelector } from './shared/components/theme-selector/theme-selector';
import { TitleService } from './core/services/title.service';
import { RouterModule } from '@angular/router';
import { CartIcon } from './shared/components/cart-icon/cart-icon';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatButtonModule, ThemeSelector, RouterModule, CartIcon],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  titleService = inject(TitleService);
}