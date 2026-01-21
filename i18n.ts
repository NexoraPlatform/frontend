import {getRequestConfig} from 'next-intl/server';
import {promises as fs} from 'fs';
import path from 'path';
import {defaultLocale, locales} from '@/lib/i18n';
import type {Locale} from '@/types/locale';

type Messages = Record<string, any>;

type MessageFile = {
  namespace: string;
  contents: Messages;
};

async function getMessageFiles(baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(baseDir, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(baseDir, entry.name);
      if (entry.isDirectory()) {
        return getMessageFiles(entryPath);
      }
      return entry.name.endsWith('.json') ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function deepMerge(target: Messages, source: Messages): Messages {
  const result: Messages = {...target};
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] ?? {}, value as Messages);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function loadMessages(locale: Locale): Promise<Messages> {
  const baseDir = path.join(process.cwd(), 'messages', locale);
  const files = await getMessageFiles(baseDir);

  const messageFiles = await Promise.all(
    files.map(async (filePath): Promise<MessageFile | null> => {
      const relativePath = path.relative(baseDir, filePath);
      const namespace = relativePath.split(path.sep)[0];
      if (!namespace) {
        return null;
      }
      const contents = JSON.parse(await fs.readFile(filePath, 'utf8')) as Messages;
      return {namespace, contents};
    }),
  );

  return messageFiles.reduce<Messages>((acc, file) => {
    if (!file) {
      return acc;
    }
    acc[file.namespace] = deepMerge(acc[file.namespace] ?? {}, file.contents);
    return acc;
  }, {});
}

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: await loadMessages(resolvedLocale),
  };
});
