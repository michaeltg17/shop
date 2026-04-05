import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function bootstrap() {
  await bootstrapApplication(App, appConfig);
}

bootstrap().catch(err => console.error(err));
