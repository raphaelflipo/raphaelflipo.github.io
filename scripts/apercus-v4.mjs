import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const routes = {
  accueil: '/', anglais: '/en/', cv: '/cv/', 'cv-anglais': '/cv/en/',
  studio: '/studio-3d/', composants: '/mercedes-w16/composants/',
  comparateur: '/mercedes-comparateur/', jarvis: '/jarvis/',
};
const browser = await chromium.launch();
await mkdir('apercus-v4', { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'light' });
    for (const [name, path] of Object.entries(routes)) {
      for (const [version, port] of [['avant', 8793], ['apres', 8794]]) {
        const response = await page.goto('http://127.0.0.1:' + port + path);
        assert.equal(response.status(), 200);
        if (version === 'apres') {
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), path + ' ' + width);
          if (name === 'accueil' || name === 'anglais') {
            assert(await page.locator('.rf-launch img').evaluate(async image => {
              await image.decode();
              return image.naturalWidth > 0;
            }));
          }
        }
        await page.screenshot({ path: `apercus-v4/${name}-${width}-${version}.png`, animations: 'disabled' });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
