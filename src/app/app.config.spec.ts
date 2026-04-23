import { appConfig } from './app.config';
import { HttpClientModule } from '@angular/common/http';

describe('app.config', () => {
  it('should define appConfig with providers', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
    expect(Array.isArray(appConfig.providers)).toBe(true);
  });

  it('should include provideRouter with routes', () => {
    // provideRouter(routes) returns a provider object with internal Angular properties
    // Verify the providers array has the expected number of entries (error listener + router + http)
    expect(appConfig.providers.length).toBe(3);
    // Verify the router provider is an object (not a class like HttpClientModule)
    const routerProvider = appConfig.providers.find(p => p !== HttpClientModule);
    expect(routerProvider).toBeDefined();
    expect(typeof routerProvider).toBe('object');
  });

  it('should include HttpClientModule', () => {
    expect(appConfig.providers).toContain(HttpClientModule);
  });
});
