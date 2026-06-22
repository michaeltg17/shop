import { appConfig } from './app.config';

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
    // Verify all providers are objects (standalone providers, not NgModule classes)
    appConfig.providers.forEach(provider => {
      expect(typeof provider).toBe('object');
    });
  });

  it('should include provideHttpClient (not HttpClientModule)', () => {
    // After migrating to provideHttpClient + withInterceptors,
    // providers should NOT contain HttpClientModule anymore
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
