"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Globe, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { sortByName } from "@/lib/location-utils";
import type {
  LocationCity,
  LocationCountry,
  LocationState,
} from "@/types/locations";
import {
  createEmptyBillingDetailsValues,
  type BillingDetailsFormValues,
} from "@/types/user-forms";

type BillingDetailsFormProps = {
  className?: string;
  showTitle?: boolean;
  useLocationApi?: boolean;
  fieldClassName?: string;
};

type LocationResponse<T> = {
  data: T;
};

const buildCityCacheKey = (countryIso: string, stateIso: string) =>
  `${countryIso}:${stateIso}`;

async function fetchLocationPayload<T>(params: URLSearchParams): Promise<T> {
  const response = await fetch(`/api/locations?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
    cache: "force-cache",
  });

  const payload = (await response.json().catch(() => null)) as
    | LocationResponse<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Nu am putut încărca locațiile."
    );
  }

  return (payload as LocationResponse<T>).data;
}

export function BillingDetailsForm({
  className,
  showTitle = true,
  useLocationApi = false,
  fieldClassName,
}: BillingDetailsFormProps) {
  const t = useTranslations();
  const {
    control,
    watch,
    setValue,
    clearErrors,
  } = useFormContext<BillingDetailsFormValues>();
  const legalName = watch("legal_name");
  const commercialName = watch("commercial_name");
  const countryCodeValue = watch("country_code") ?? "";
  const registeredStateValue = watch("registered_state") ?? "";
  const isVatRegistered = Boolean(watch("is_vat_registered"));
  const [isCompany, setIsCompany] = useState(Boolean(legalName || commercialName));
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState("");
  const [selectedStateIso, setSelectedStateIso] = useState("");
  const [countryOptionsByIso, setCountryOptionsByIso] = useState<Record<string, LocationCountry>>({});
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countryLoadError, setCountryLoadError] = useState("");
  const [statesByCountry, setStatesByCountry] = useState<Record<string, LocationState[]>>({});
  const [stateLoadError, setStateLoadError] = useState("");
  const [citiesByRegion, setCitiesByRegion] = useState<Record<string, LocationCity[]>>({});
  const [cityLoadError, setCityLoadError] = useState("");
  const [statesLoadingCountry, setStatesLoadingCountry] = useState("");
  const [citiesLoadingKey, setCitiesLoadingKey] = useState("");
  const countriesRequestRef = useRef<Promise<LocationCountry[]> | null>(null);
  const statesRequestRef = useRef<Map<string, Promise<LocationState[]>>>(new Map());
  const citiesRequestRef = useRef<Map<string, Promise<LocationCity[]>>>(new Map());

  useEffect(() => {
    if (legalName || commercialName) {
      setIsCompany(true);
    }
  }, [commercialName, legalName]);

  const mergeCountries = useCallback((incomingCountries: LocationCountry[]) => {
    if (incomingCountries.length === 0) return;

    setCountryOptionsByIso((prev) => {
      const next = { ...prev };
      let changed = false;

      incomingCountries.forEach((country) => {
        const existing = next[country.isoCode];
        if (existing?.name === country.name && existing?.flag === country.flag) {
          return;
        }

        next[country.isoCode] = country;
        changed = true;
      });

      return changed ? next : prev;
    });
  }, []);

  const countries = useMemo(
    () => Object.values(countryOptionsByIso).sort(sortByName),
    [countryOptionsByIso]
  );

  const selectedCountry = selectedCountryIso
    ? countryOptionsByIso[selectedCountryIso] ?? null
    : null;
  const states = selectedCountryIso ? statesByCountry[selectedCountryIso] ?? [] : [];
  const cityCacheKey =
    selectedCountryIso && selectedStateIso
      ? buildCityCacheKey(selectedCountryIso, selectedStateIso)
      : "";
  const cities = cityCacheKey ? citiesByRegion[cityCacheKey] ?? [] : [];
  const hasStatesCache = selectedCountryIso
    ? Object.prototype.hasOwnProperty.call(statesByCountry, selectedCountryIso)
    : false;
  const hasCitiesCache = cityCacheKey
    ? Object.prototype.hasOwnProperty.call(citiesByRegion, cityCacheKey)
    : false;

  const ensureCountriesLoaded = useCallback(async () => {
    if (countriesLoaded) {
      return countries;
    }

    if (countriesRequestRef.current) {
      return countriesRequestRef.current;
    }

    setCountriesLoading(true);
    setCountryLoadError("");

    const request = fetchLocationPayload<LocationCountry[]>(
      new URLSearchParams({ scope: "countries" })
    )
      .then((loadedCountries) => {
        mergeCountries(loadedCountries);
        setCountriesLoaded(true);
        return loadedCountries;
      })
      .catch((error: any) => {
        setCountryLoadError(error?.message ?? t("common.billing.country_empty"));
        throw error;
      })
      .finally(() => {
        countriesRequestRef.current = null;
        setCountriesLoading(false);
      });

    countriesRequestRef.current = request;
    return request;
  }, [countries, countriesLoaded, mergeCountries, t]);

  const ensureStatesLoaded = useCallback(async (countryIso: string) => {
    const normalizedCountryIso = countryIso.trim().toUpperCase();
    if (!normalizedCountryIso) return [];

    const existingStates = statesByCountry[normalizedCountryIso];
    if (existingStates) {
      return existingStates;
    }

    const pendingRequest = statesRequestRef.current.get(normalizedCountryIso);
    if (pendingRequest) {
      return pendingRequest;
    }

    setStatesLoadingCountry(normalizedCountryIso);
    if (selectedCountryIso === normalizedCountryIso) {
      setStateLoadError("");
    }

    const request = fetchLocationPayload<LocationState[]>(
      new URLSearchParams({
        scope: "states",
        country: normalizedCountryIso,
      })
    )
      .then((loadedStates) => {
        const normalizedStates = [...loadedStates].sort(sortByName);
        setStatesByCountry((prev) => {
          if (prev[normalizedCountryIso]) return prev;
          return {
            ...prev,
            [normalizedCountryIso]: normalizedStates,
          };
        });
        return normalizedStates;
      })
      .catch((error: any) => {
        if (selectedCountryIso === normalizedCountryIso) {
          setStateLoadError(error?.message ?? t("common.billing.billing_state_empty"));
        }
        throw error;
      })
      .finally(() => {
        statesRequestRef.current.delete(normalizedCountryIso);
        setStatesLoadingCountry((current) =>
          current === normalizedCountryIso ? "" : current
        );
      });

    statesRequestRef.current.set(normalizedCountryIso, request);
    return request;
  }, [selectedCountryIso, statesByCountry, t]);

  useEffect(() => {
    if (!countryCodeValue) {
      setSelectedCountryIso("");
      return;
    }

    setSelectedCountryIso(countryCodeValue);
    if (useLocationApi) {
      void ensureCountriesLoaded().catch(() => {});
      void ensureStatesLoaded(countryCodeValue).catch(() => {});
    }
  }, [countryCodeValue, ensureCountriesLoaded, ensureStatesLoaded, useLocationApi]);

  const ensureCitiesLoaded = useCallback(async (countryIso: string, stateIso: string) => {
    const normalizedCountryIso = countryIso.trim().toUpperCase();
    const normalizedStateIso = stateIso.trim().toUpperCase();

    if (!normalizedCountryIso || !normalizedStateIso) return [];

    const nextCacheKey = buildCityCacheKey(normalizedCountryIso, normalizedStateIso);
    const existingCities = citiesByRegion[nextCacheKey];
    if (existingCities) {
      return existingCities;
    }

    const pendingRequest = citiesRequestRef.current.get(nextCacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    setCitiesLoadingKey(nextCacheKey);
    if (cityCacheKey === nextCacheKey) {
      setCityLoadError("");
    }

    const request = fetchLocationPayload<LocationCity[]>(
      new URLSearchParams({
        scope: "cities",
        country: normalizedCountryIso,
        state: normalizedStateIso,
      })
    )
      .then((loadedCities) => {
        const normalizedCities = [...loadedCities].sort(sortByName);
        setCitiesByRegion((prev) => {
          if (prev[nextCacheKey]) return prev;
          return {
            ...prev,
            [nextCacheKey]: normalizedCities,
          };
        });
        return normalizedCities;
      })
      .catch((error: any) => {
        if (cityCacheKey === nextCacheKey) {
          setCityLoadError(error?.message ?? t("common.billing.billing_city_empty"));
        }
        throw error;
      })
      .finally(() => {
        citiesRequestRef.current.delete(nextCacheKey);
        setCitiesLoadingKey((current) =>
          current === nextCacheKey ? "" : current
        );
      });

    citiesRequestRef.current.set(nextCacheKey, request);
    return request;
  }, [citiesByRegion, cityCacheKey, t]);

  useEffect(() => {
    if (!useLocationApi || !openCountry) return;
    void ensureCountriesLoaded().catch(() => {});
  }, [ensureCountriesLoaded, openCountry, useLocationApi]);

  useEffect(() => {
    if (!useLocationApi || !openState || !selectedCountryIso) return;
    void ensureStatesLoaded(selectedCountryIso).catch(() => {});
  }, [ensureStatesLoaded, openState, selectedCountryIso, useLocationApi]);

  useEffect(() => {
    if (!useLocationApi || !openCity || !selectedCountryIso || !selectedStateIso) return;
    void ensureCitiesLoaded(selectedCountryIso, selectedStateIso).catch(() => {});
  }, [ensureCitiesLoaded, openCity, selectedCountryIso, selectedStateIso, useLocationApi]);

  useEffect(() => {
    if (!useLocationApi || !selectedCountryIso) return;

    const availableStates = statesByCountry[selectedCountryIso];
    if (!availableStates || availableStates.length === 0) {
      setSelectedStateIso("");
      return;
    }

    const hasMatchingState = availableStates.some(
      (state) => state.isoCode === registeredStateValue
    );
    if (hasMatchingState) {
      setSelectedStateIso(registeredStateValue);
      return;
    }

    setSelectedStateIso("");
  }, [registeredStateValue, selectedCountryIso, statesByCountry, useLocationApi]);

  useEffect(() => {
    if (isVatRegistered) return;
    setValue("vat_number", "", { shouldDirty: true, shouldValidate: true });
  }, [isVatRegistered, setValue]);

  const resetLocationSelection = useCallback(() => {
    setSelectedCountryIso("");
    setSelectedStateIso("");
    setOpenCountry(false);
    setOpenState(false);
    setOpenCity(false);
    setCountryLoadError("");
    setStateLoadError("");
    setCityLoadError("");
  }, []);

  const handleToggleCompany = (checked: boolean) => {
    setIsCompany(checked);
    if (!checked) {
      const emptyValues = createEmptyBillingDetailsValues();
      Object.entries(emptyValues).forEach(([key, value]) => {
        setValue(key as keyof BillingDetailsFormValues, value as never);
      });
      clearErrors();
      resetLocationSelection();
    }
  };

  const handleCountrySelect = async (countryIso: string) => {
    setSelectedCountryIso(countryIso);
    setSelectedStateIso("");
    setValue("country_code", countryIso, { shouldDirty: true, shouldValidate: true });
    setValue("registered_state", "", { shouldDirty: true, shouldValidate: true });
    setValue("registered_city", "", { shouldDirty: true, shouldValidate: true });
    clearErrors(["country_code", "registered_state", "registered_city"]);
    setOpenCountry(false);
    setOpenState(false);
    setOpenCity(false);
    await ensureStatesLoaded(countryIso).catch(() => []);
  };

  const handleStateSelect = async (stateIso: string, onChange: (value: string) => void) => {
    setSelectedStateIso(stateIso);
    onChange(stateIso);
    setValue("registered_city", "", { shouldDirty: true, shouldValidate: true });
    clearErrors(["registered_state", "registered_city"]);
    setOpenState(false);
    setOpenCity(false);
    await ensureCitiesLoaded(selectedCountryIso, stateIso).catch(() => []);
  };

  const showStateSelector =
    useLocationApi &&
    Boolean(selectedCountryIso) &&
    (states.length > 0 ||
      statesLoadingCountry === selectedCountryIso ||
      !hasStatesCache);

  const showCitySelector =
    useLocationApi &&
    Boolean(selectedCountryIso) &&
    Boolean(selectedStateIso) &&
    (cities.length > 0 ||
      citiesLoadingKey === cityCacheKey ||
      !hasCitiesCache);

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div>
          <h3 className="text-lg font-semibold">
            {t("common.billing.section_title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("common.billing.section_description")}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="billing-is-company"
          checked={isCompany}
          onCheckedChange={(checked) =>
            handleToggleCompany(Boolean(checked))
          }
        />
        <Label
          htmlFor="billing-is-company"
          className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {t("common.billing.company_toggle_label")}
        </Label>
      </div>

      {isCompany && (
        <div className="grid gap-4 md:grid-cols-2">
          {useLocationApi ? (
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="billing-country">{t("common.billing.country_label")}</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 pointer-events-none">
                  {selectedCountry?.flag ? (
                    <span className="text-lg leading-none">{selectedCountry.flag}</span>
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </div>
                <Popover open={openCountry} onOpenChange={setOpenCountry} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      id="billing-country"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-label={t("common.billing.country_label")}
                      aria-expanded={openCountry}
                      className={cn(
                        "w-full justify-between pl-10 text-left font-normal hover:bg-background",
                        fieldClassName
                      )}
                    >
                      {selectedCountry ? (
                        <span>{selectedCountry.name}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("common.billing.country_placeholder")}
                        </span>
                      )}
                      {countriesLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("common.billing.country_search_placeholder")} />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        {countriesLoading && countries.length === 0 ? (
                          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("common.billing.countries_loading")}
                          </div>
                        ) : null}
                        {!countriesLoading && countryLoadError && countries.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-red-500">
                            {countryLoadError}
                          </div>
                        ) : null}
                        {countries.length > 0 ? (
                          <>
                            <CommandEmpty>{t("common.billing.country_empty")}</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.isoCode}
                                  value={country.name}
                                  keywords={[country.name, country.isoCode]}
                                  onSelect={() => {
                                    void handleCountrySelect(country.isoCode);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCountryIso === country.isoCode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="mr-2 text-lg leading-none">{country.flag}</span>
                                  {country.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        ) : null}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : null}

          <FormField
            control={control}
            name="legal_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("common.billing.company_name_label")}
                  {(legalName || commercialName) ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.company_name_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="commercial_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.commercial_name_label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.commercial_name_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registration_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.trade_registry_number_label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.trade_registry_number_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="tax_identification_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("common.billing.tax_id_label")}
                  {(legalName || commercialName) ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.tax_id_placeholder")}
                  />
                </FormControl>
                <FormDescription>
                  {t("common.billing.tax_id_required_hint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
            <Checkbox
              id="billing-is-vat-registered"
              checked={isVatRegistered}
              onCheckedChange={(checked) =>
                setValue("is_vat_registered", Boolean(checked), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Label htmlFor="billing-is-vat-registered" className="text-sm leading-relaxed">
              {t("common.billing.vat_registered_label")}
            </Label>
          </div>

          {isVatRegistered ? (
            <FormField
              control={control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.billing.vat_number_label")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={fieldClassName}
                      placeholder={t("common.billing.vat_number_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={control}
            name="registered_address_line_1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("common.billing.billing_address_label")}
                  {(legalName || commercialName) ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.billing_address_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registered_address_line_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.billing_address_line_2_label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.billing_address_line_2_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registered_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.billing_state_label")}</FormLabel>
                <FormControl>
                  {showStateSelector ? (
                    <Popover open={openState} onOpenChange={setOpenState}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-label={t("common.billing.billing_state_label")}
                          aria-expanded={openState}
                          disabled={!selectedCountryIso}
                          className={cn(
                            "w-full justify-between font-normal hover:bg-background",
                            fieldClassName
                          )}
                        >
                          {statesLoadingCountry === selectedCountryIso ? (
                            <span className="text-muted-foreground">
                              {t("common.billing.billing_state_placeholder")}
                            </span>
                          ) : field.value ? (
                            states.find((state) => state.isoCode === field.value)?.name || field.value
                          ) : (
                            <span className="text-muted-foreground">
                              {t("common.billing.billing_state_placeholder")}
                            </span>
                          )}
                          {statesLoadingCountry === selectedCountryIso ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("common.billing.billing_state_search_placeholder")} />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            {statesLoadingCountry === selectedCountryIso && states.length === 0 ? (
                              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.billing.billing_states_loading")}
                              </div>
                            ) : null}
                            {states.length === 0 && stateLoadError ? (
                              <div className="px-3 py-2 text-sm text-red-500">
                                {stateLoadError}
                              </div>
                            ) : null}
                            {states.length > 0 ? (
                              <>
                                <CommandEmpty>{t("common.billing.billing_state_empty")}</CommandEmpty>
                                <CommandGroup>
                                  {states.map((state) => (
                                    <CommandItem
                                      key={state.isoCode}
                                      value={state.isoCode}
                                      keywords={[state.name]}
                                      onSelect={() => {
                                        void handleStateSelect(state.isoCode, field.onChange);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === state.isoCode ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {state.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            ) : null}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      {...field}
                      className={fieldClassName}
                      placeholder={t("common.billing.billing_state_placeholder")}
                      disabled={useLocationApi && !selectedCountryIso}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        setSelectedStateIso("");
                      }}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registered_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.billing_city_label")}</FormLabel>
                <FormControl>
                  {showCitySelector ? (
                    <Popover open={openCity} onOpenChange={setOpenCity} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-label={t("common.billing.billing_city_label")}
                          aria-expanded={openCity}
                          disabled={!selectedStateIso}
                          className={cn(
                            "w-full justify-between font-normal hover:bg-background",
                            fieldClassName
                          )}
                        >
                          {citiesLoadingKey === cityCacheKey ? (
                            <span className="text-muted-foreground">
                              {t("common.billing.billing_city_placeholder")}
                            </span>
                          ) : field.value ? (
                            field.value
                          ) : (
                            <span className="text-muted-foreground">
                              {t("common.billing.billing_city_placeholder")}
                            </span>
                          )}
                          {citiesLoadingKey === cityCacheKey ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("common.billing.billing_city_search_placeholder")} />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            {citiesLoadingKey === cityCacheKey && cities.length === 0 ? (
                              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.billing.billing_cities_loading")}
                              </div>
                            ) : null}
                            {cities.length === 0 && cityLoadError ? (
                              <div className="px-3 py-2 text-sm text-red-500">
                                {cityLoadError}
                              </div>
                            ) : null}
                            {cities.length > 0 ? (
                              <>
                                <CommandEmpty>{t("common.billing.billing_city_empty")}</CommandEmpty>
                                <CommandGroup>
                                  {cities.map((city) => (
                                    <CommandItem
                                      key={city.name}
                                      value={city.name}
                                      onSelect={() => {
                                        field.onChange(city.name);
                                        clearErrors("registered_city");
                                        setOpenCity(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === city.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {city.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            ) : null}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      {...field}
                      className={fieldClassName}
                      placeholder={t("common.billing.billing_city_placeholder")}
                      disabled={useLocationApi && !selectedStateIso && !registeredStateValue}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registered_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("common.billing.billing_postal_code_label")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.billing_postal_code_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="authorized_signatory_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.billing.authorized_signatory_title_label")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldClassName}
                    placeholder={t("common.billing.authorized_signatory_title_placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
