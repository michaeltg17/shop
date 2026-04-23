import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactPage } from './contact-page';

describe('ContactPage', () => {
  let component: ContactPage;
  let fixture: ComponentFixture<ContactPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize contactForm with invalid state', () => {
    expect(component.contactForm.invalid).toBe(true);
  });

  it('should have required validators for name', () => {
    component.contactForm.get('name')?.setValue('a');
    expect(component.contactForm.get('name')?.errors).toBeTruthy();
    component.contactForm.get('name')?.setValue('John');
    expect(component.contactForm.get('name')?.valid).toBe(true);
  });

  it('should have required and email validators for email', () => {
    component.contactForm.get('email')?.setValue('not-an-email');
    expect(component.contactForm.get('email')?.errors).toBeTruthy();
    component.contactForm.get('email')?.setValue('test@example.com');
    expect(component.contactForm.get('email')?.valid).toBe(true);
  });

  it('should have required and minLength validators for subject', () => {
    component.contactForm.get('subject')?.setValue('abcde');
    expect(component.contactForm.get('subject')?.valid).toBe(true);
  });

  it('should have required and minLength validators for message', () => {
    component.contactForm.get('message')?.setValue('abcdefghij');
    expect(component.contactForm.get('message')?.valid).toBe(true);
  });

  it('should provide accessors for form controls', () => {
    expect(component.name).toBe(component.contactForm.get('name'));
    expect(component.email).toBe(component.contactForm.get('email'));
    expect(component.subject).toBe(component.contactForm.get('subject'));
    expect(component.message).toBe(component.contactForm.get('message'));
  });

  it('should reset form on submit', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation((_message?: string) => {
      void _message;
    });
    component.contactForm.get('name')?.setValue('John');
    component.contactForm.get('email')?.setValue('john@example.com');
    component.contactForm.get('subject')?.setValue('Hello');
    component.contactForm.get('message')?.setValue('Test message here');
    component.onSubmit();
    expect(alertSpy).toHaveBeenCalled();
    expect(component.contactForm.pristine).toBe(true);
  });
});
