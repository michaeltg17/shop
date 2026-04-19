import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './contact-page.html',
  styleUrls: ['./contact-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  contactForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', [Validators.required, Validators.minLength(5)]),
    message: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  onSubmit() {
    // Here you would typically send the data to a backend service
    alert('Thank you for your message! We will get back to you soon.');
    this.contactForm.reset();
  }

  get name() {
    return this.contactForm.get('name');
  }
  get email() {
    return this.contactForm.get('email');
  }
  get subject() {
    return this.contactForm.get('subject');
  }
  get message() {
    return this.contactForm.get('message');
  }
}
