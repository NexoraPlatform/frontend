import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = process.cwd();
const manifestPath = path.join(workspaceRoot, 'app', 'manifest.json');
const serviceWorkerPath = path.join(workspaceRoot, 'public', 'sw.js');

describe('PWA asset configuration', () => {
  it('keeps only valid screenshots in the manifest', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      screenshots?: Array<{ src: string; type: string }>;
    };

    expect(manifest.screenshots).toEqual([
      {
        src: '/og-image.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'Trustora Desktop',
      },
    ]);
    expect(existsSync(path.join(workspaceRoot, 'public', 'og-image.jpg'))).toBe(true);
  });

  it('uses existing png assets for notification icon and badge defaults', () => {
    const serviceWorkerSource = readFileSync(serviceWorkerPath, 'utf8');

    expect(serviceWorkerSource).toContain("icon: data.icon || '/icons/trustora2-icon-192x192.png'");
    expect(serviceWorkerSource).toContain("badge: data.badge || '/icons/trustora2-icon-72x72.png'");
    expect(
      existsSync(path.join(workspaceRoot, 'public', 'icons', 'trustora2-icon-192x192.png'))
    ).toBe(true);
    expect(
      existsSync(path.join(workspaceRoot, 'public', 'icons', 'trustora2-icon-72x72.png'))
    ).toBe(true);
  });
});
