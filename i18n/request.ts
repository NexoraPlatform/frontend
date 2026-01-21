import {promises as fs} from 'fs';
import path from 'path';
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from '@/lib/navigation';
import {defaultLocale} from '@/lib/i18n';

type Messages = Record<string, any>;

const flatNamespaces = new Set(['common', 'navigation', 'errors']);

function mergeDeep(target: Messages, source: Messages) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] ??= {};
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadMessages(locale: string) {
  const basePath = path.join(process.cwd(), 'messages', locale);
  const files = await collectJsonFiles(basePath);
  const messages: Messages = {};

  for (const filePath of files) {
    const relativePath = path.relative(basePath, filePath);
    const segments = relativePath.split(path.sep);
    const topNamespace = segments[0];
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as Messages;

    if (flatNamespaces.has(topNamespace)) {
      messages[topNamespace] ??= {};
      mergeDeep(messages[topNamespace], data);
      continue;
    }

    const pathSegments = segments.slice(1).map((segment) => segment.replace(/\.json$/, ''));
    let current = (messages[topNamespace] ??= {});

    for (const segment of pathSegments.slice(0, -1)) {
      current = current[segment] ??= {};
    }

    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment) {
      current[lastSegment] ??= {};
      mergeDeep(current[lastSegment], data);
    }
  }

  return messages;
}

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale = locale ?? defaultLocale;

  if (!locales.includes(resolvedLocale as (typeof locales)[number])) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: await loadMessages(resolvedLocale),
  };
});
