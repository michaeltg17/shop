import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-cell.html',
  styleUrls: ['./user-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCell {
  @Input() value: string | boolean | number | null = null;
}
