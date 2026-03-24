export type LocationCountry = {
  isoCode: string;
  name: string;
  flag: string;
};

export type LocationState = {
  isoCode: string;
  name: string;
  countryCode: string;
};

export type LocationCity = {
  name: string;
  countryCode: string;
  stateCode: string;
};
