import type { LocationState } from '@/types/locations';

export const sortByName = <T extends { name: string }>(left: T, right: T) =>
  left.name.localeCompare(right.name);

export const resolveStateIsoFromOptions = (
  states: LocationState[],
  stateValue?: string | null
) => {
  const raw = String(stateValue ?? '').trim();
  if (!raw) return '';

  const byIso = states.find((item) => item.isoCode === raw);
  if (byIso) return byIso.isoCode;

  const byName = states.find((item) => item.name.toLowerCase() === raw.toLowerCase());
  return byName?.isoCode ?? raw;
};

export const toFlagEmoji = (countryCode?: string | null) => {
  const normalized = String(countryCode ?? '')
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return '';
  }

  return String.fromCodePoint(
    ...normalized.split('').map((character) => 127397 + character.charCodeAt(0))
  );
};
