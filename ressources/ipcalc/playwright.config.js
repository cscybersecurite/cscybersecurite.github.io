import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/IPcalc/',
    locale: 'fr-FR',
    // Les tests fonctionnels ne doivent pas être interrompus par une activation PWA.
    // Le scénario hors connexion réactive explicitement le service worker.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: systemChromium ? { executablePath: systemChromium } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-portrait', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-landscape-dark', use: { ...devices['Pixel 7 landscape'], colorScheme: 'dark' } },
  ],
  webServer: {
    command: 'npm run build && node scripts/serve.mjs dist',
    env: { BASE_PATH: '/IPcalc/', HOST: '127.0.0.1' },
    url: 'http://127.0.0.1:4173/IPcalc/',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
