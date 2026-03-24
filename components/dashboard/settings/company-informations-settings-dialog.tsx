import React, {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {BankInput} from "@/components/ui/bankinput";
import {Check, ChevronsUpDown, Globe, Loader2, User} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CreditCard, Hash, Landmark, Mail, MapPin, Shield } from "lucide-react";
import {useTranslations} from "next-intl";
import {useAuth} from "@/contexts/auth-context";
import { postcodeValidator, postcodeValidatorExistsForCountry } from 'postcode-validator';
import apiClient from "@/lib/api";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import { resolveStateIsoFromOptions, sortByName, toFlagEmoji } from "@/lib/location-utils";
import type { LocationCity, LocationCountry, LocationState } from "@/types/locations";

interface CompanyInformationsSettingsProps {
    openCompanyInformationsDialog: boolean;
    setOpenCompanyInformationsDialog: Dispatch<SetStateAction<boolean>>;
}

type CompanySearchResult = {
    id: number;
    name: string;
    tax_id?: string | null;
    trade_registry_number?: string | null;
    company_country?: string | null;
    company_city?: string | null;
    company_zip?: string | null;
    company_address?: string | null;
};

type CurrencyOption = {
    code: string;
    name: string;
    country_code?: string | null;
};

type LocationResponse<T> = {
    data: T;
};

const FIELD_ID_ALIASES: Record<string, string> = {
    identification_value: "id_number",
    postcode: "company_zip",
    address: "company_address",
    state: "company_county",
    city: "company_city",
    bank_name: "company_bank_name",
    bic_swift: "company_bank_bic",
};

const buildCityCacheKey = (countryIso: string, stateIso: string) => `${countryIso}:${stateIso}`;

async function fetchLocationPayload<T>(params: URLSearchParams): Promise<T> {
    const response = await fetch(`/api/locations?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
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

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// Mapare Cod Țară (ISO) -> Tip Identificare
// Mapare Cod Țară (ISO) -> Tip Identificare (Tax ID / Registration Number)
export const COUNTRY_ID_TYPES: Record<string, string> = {
    // --- Europa ---
    RO: "CUI",          // România (Cod Unic de Înregistrare)
    GB: "CRN",          // Marea Britanie (Company Registration Number)
    DE: "USt-IdNr",     // Germania (Umsatzsteuer-Identifikationsnummer)
    FR: "SIRET",        // Franța (Système d'Identification du Répertoire des Établissements)
    IT: "P.IVA",        // Italia (Partita IVA)
    ES: "NIF",          // Spania (Número de Identificación Fiscal)
    NL: "RSIN",         // Olanda (Rechtspersonen en Samenwerkingsverbanden Informatienummer)
    PL: "NIP",          // Polonia (Numer Identyfikacji Podatkowej)
    BG: "UIC",          // Bulgaria (Unified Identity Code)
    HU: "Adószám",      // Ungaria
    AT: "UID",          // Austria (Umsatzsteuer-Identifikationsnummer)
    BE: "BCE / KBO",    // Belgia (Banque-Carrefour des Entreprises)
    DK: "CVR",          // Danemarca (Det Centrale Virksomhedsregister)
    SE: "Org.nr",       // Suedia (Organisationsnummer)
    NO: "Org.nr",       // Norvegia (Organisasjonsnummer)
    FI: "Y-tunnus",     // Finlanda (Yritys- ja yhteisötunnus)
    PT: "NIPC",         // Portugalia (Número de Identificação de Pessoa Colectiva)
    GR: "AFM",          // Grecia (Arithmos Forologikou Mitroou)
    IE: "CRO / VAT",    // Irlanda
    CZ: "IČO",          // Cehia (Identifikační číslo osoby)
    SK: "IČO",          // Slovacia
    SI: "MŠ",           // Slovenia (Matična številka)
    HR: "OIB",          // Croația (Osobni identifikacijski broj)
    EE: "Registrikood", // Estonia
    LV: "Reģ. Nr.",     // Letonia
    LT: "Įm. k.",       // Lituania (Įmonės kodas)
    CY: "TIC",          // Cipru (Tax Identification Code)
    MT: "VAT / C",      // Malta
    LU: "RCS",          // Luxemburg
    CH: "UID / CHE",    // Elveția (Unternehmens-Identifikationsnummer)
    IS: "Kennitala",    // Islanda
    RS: "PIB",          // Serbia
    TR: "VKN",          // Turcia (Vergi Kimlik Numarası)
    UA: "EDRPOU",       // Ucraina

    // --- America de Nord & Sud ---
    US: "EIN",          // Statele Unite (Employer Identification Number)
    CA: "BN",           // Canada (Business Number)
    MX: "RFC",          // Mexic (Registro Federal de Contribuyentes)
    BR: "CNPJ",         // Brazilia (Cadastro Nacional da Pessoa Jurídica)
    AR: "CUIT",         // Argentina (Clave Única de Identificación Tributaria)
    CL: "RUT",          // Chile (Rol Único Tributario)
    CO: "NIT",          // Columbia (Número de Identificación Tributaria)
    PE: "RUC",          // Peru (Registro Único de Contribuyentes)

    // --- Asia & Pacific ---
    CN: "USCI",         // China (Unified Social Credit Identifier)
    JP: "CN",           // Japonia (Corporate Number)
    IN: "GSTIN / PAN",  // India
    KR: "BRN",          // Coreea de Sud (Business Registration Number)
    SG: "UEN",          // Singapore (Unique Entity Number)
    AU: "ABN",          // Australia (Australian Business Number)
    NZ: "NZBN",         // Noua Zeelandă
    HK: "BRN",          // Hong Kong
    TW: "BAN",          // Taiwan (Business Administration Number)
    ID: "NPWP",         // Indonezia
    MY: "SSM",          // Malaezia
    TH: "TIN",          // Thailanda
    VN: "MST",          // Vietnam
    AE: "TRN",          // Emiratele Arabe Unite (Tax Registration Number)
    SA: "VAT / CR",     // Arabia Saudită
    IL: "H.P.",         // Israel (Company Number)

    // --- Africa ---
    ZA: "CIPC",         // Africa de Sud
    EG: "TRN",          // Egipt
    NG: "RC",           // Nigeria
    MA: "ICE",          // Maroc
};

export default function CompanyInformationsSettingsDialog({ openCompanyInformationsDialog, setOpenCompanyInformationsDialog }: CompanyInformationsSettingsProps) {
    const t = useTranslations();

    const [formDataCompany, setFormDataCompany] = useState<any>({
        name: "",
        represented_by: "",
        email: "",
        company_address: "",
        company_city: "",
        company_county: "",
        company_zip: "",
        company_country: "",
        company_bank_iban: "",
        company_bank_name: "",
        company_bank_bic: "",
        id_type: "",
        id_number: "",
        bank_currency: "",
    });

    const { user, userLoading, refreshUser } = useAuth();

    // State-uri pentru gestionarea dropdown-urilor (ISO Codes)
    const [selectedCountryIso, setSelectedCountryIso] = useState("");
    const [selectedStateIso, setSelectedStateIso] = useState("");
    const [postalCodeError, setPostalCodeError] = useState("");
    const companySearchRef = useRef<HTMLDivElement | null>(null);
    const [companySearchOpen, setCompanySearchOpen] = useState(false);
    const [companySearchTouched, setCompanySearchTouched] = useState(false);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanySearchResult[]>([]);
    const [companySearchError, setCompanySearchError] = useState("");

    // State-uri pentru Popover-uri
    const [openCountry, setOpenCountry] = useState(false);
    const [openState, setOpenState] = useState(false);
    const [openCity, setOpenCity] = useState(false);
    const [openIdType, setOpenIdType] = useState(false); // <--- State NOU pentru Tip Act
    const [openCurrency, setOpenCurrency] = useState(false);
    const [currencySearch, setCurrencySearch] = useState("");
    const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
    const [currencyLoading, setCurrencyLoading] = useState(false);
    const [currencyError, setCurrencyError] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption | null>(null);
    const currencyRequestId = useRef(0);
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
    const countryRequestRef = useRef<Map<string, Promise<LocationCountry | null>>>(new Map());
    const statesRequestRef = useRef<Map<string, Promise<LocationState[]>>>(new Map());
    const citiesRequestRef = useRef<Map<string, Promise<LocationCity[]>>>(new Map());
    const countryChangeRequestId = useRef(0);
    const stateChangeRequestId = useRef(0);

    const mergeCountries = useCallback((incomingCountries: LocationCountry[]) => {
        if (incomingCountries.length === 0) return;

        setCountryOptionsByIso((prev) => {
            const next = { ...prev };
            let changed = false;

            incomingCountries.forEach((country) => {
                const existing = next[country.isoCode];
                if (
                    existing?.name === country.name &&
                    existing?.flag === country.flag
                ) {
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

    const selectedCountry = selectedCountryIso ? countryOptionsByIso[selectedCountryIso] ?? null : null;
    const selectedCountryName = selectedCountry?.name ?? "";
    const selectedCountryFlag = selectedCountry?.flag ?? "";
    const states = selectedCountryIso ? statesByCountry[selectedCountryIso] ?? [] : [];
    const cityCacheKey = selectedCountryIso && selectedStateIso
        ? buildCityCacheKey(selectedCountryIso, selectedStateIso)
        : "";
    const cities = cityCacheKey ? citiesByRegion[cityCacheKey] ?? [] : [];
    const showStatePicker = Boolean(selectedCountryIso) && (
        Object.prototype.hasOwnProperty.call(statesByCountry, selectedCountryIso)
            ? states.length > 0
            : true
    );
    const showCityPicker = Boolean(selectedStateIso) && Boolean(cityCacheKey) && (
        Object.prototype.hasOwnProperty.call(citiesByRegion, cityCacheKey)
            ? cities.length > 0
            : true
    );

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
                setCountryLoadError(error?.message ?? "Nu am putut încărca lista de țări.");
                throw error;
            })
            .finally(() => {
                countriesRequestRef.current = null;
                setCountriesLoading(false);
            });

        countriesRequestRef.current = request;
        return request;
    }, [countries, countriesLoaded, mergeCountries]);

    const ensureCountryLoaded = useCallback(async (countryIso: string) => {
        const normalizedCountryIso = countryIso.trim().toUpperCase();
        if (!normalizedCountryIso) return null;

        const existingCountry = countryOptionsByIso[normalizedCountryIso];
        if (existingCountry) {
            return existingCountry;
        }

        if (countriesLoaded) {
            return null;
        }

        const pendingRequest = countryRequestRef.current.get(normalizedCountryIso);
        if (pendingRequest) {
            return pendingRequest;
        }

        const request = fetchLocationPayload<LocationCountry>(
            new URLSearchParams({
                scope: "country",
                country: normalizedCountryIso,
            })
        )
            .then((country) => {
                mergeCountries([country]);
                return country;
            })
            .catch((error: any) => {
                setCountryLoadError(error?.message ?? "Nu am putut încărca țara selectată.");
                return null;
            })
            .finally(() => {
                countryRequestRef.current.delete(normalizedCountryIso);
            });

        countryRequestRef.current.set(normalizedCountryIso, request);
        return request;
    }, [countriesLoaded, countryOptionsByIso, mergeCountries]);

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
                    setStateLoadError(error?.message ?? "Nu am putut încărca județele.");
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
    }, [selectedCountryIso, statesByCountry]);

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
                    setCityLoadError(error?.message ?? "Nu am putut încărca orașele.");
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
    }, [citiesByRegion, cityCacheKey]);

    // Generăm lista de opțiuni pentru Tip Act (Tip + Nume Țară pentru claritate)
    const idTypeOptions = useMemo(() => {
        return Object.entries(COUNTRY_ID_TYPES).map(([iso, type]) => {
            const country = countryOptionsByIso[iso];
            return {
                iso,
                type,
                countryName: country?.name || iso,
                label: `${type} (${country?.name || iso})`
            };
        }).sort((a, b) => a.countryName.localeCompare(b.countryName));
    }, [countryOptionsByIso]);

    const debouncedCompanyQuery = useDebouncedValue(formDataCompany.name, 300);
    const debouncedCurrencyQuery = useDebouncedValue(currencySearch, 300);

    useEffect(() => {
        if (userLoading) return;
        if (!user) return;

        if (user) {
            const company = user.company ?? null;
            const companyCountryIso = company?.company_country ?? '';
            const initialCountyValue = company?.company_county ?? '';

            setFormDataCompany({
                company_id: company?.id,
                name: company?.name ?? '',
                represented_by: `${user.firstName} ${user.lastName}`,
                email: user.email,
                company_address: company?.company_address ?? '',
                company_city: company?.company_city ?? '',
                company_county: initialCountyValue,
                company_zip: company?.company_zip ?? '',
                company_country: companyCountryIso,
                company_bank_iban: company?.company_bank_iban ?? '',
                company_bank_name: company?.company_bank_name ?? '',
                company_bank_bic: company?.company_bank_bic ?? '',
                id_type: company?.id_type ?? '',
                id_number: company?.id_number ?? '',
                bank_currency: company?.bank_currency ?? '',
            });

            if (company?.bank_currency) {
                const currencyCode = company.bank_currency as string;
                    setSelectedCurrency({
                        code: currencyCode,
                        name: currencyCode,
                        country_code: null,
                    });
            } else {
                setSelectedCurrency(null);
            }
            setSelectedCountryIso(companyCountryIso);
            setSelectedStateIso(initialCountyValue);

            if (!companyCountryIso) {
                return;
            }

            let cancelled = false;

            const hydrateLocations = async () => {
                await ensureCountryLoaded(companyCountryIso);

                const availableStates = await ensureStatesLoaded(companyCountryIso).catch(() => []);
                if (cancelled) return;

                const normalizedCounty = resolveStateIsoFromOptions(
                    availableStates,
                    initialCountyValue
                );

                setSelectedStateIso(normalizedCounty);
                setFormDataCompany((prev: any) => ({
                    ...prev,
                    company_county: normalizedCounty,
                }));

                if (normalizedCounty) {
                    void ensureCitiesLoaded(companyCountryIso, normalizedCounty).catch(() => []);
                }
            };

            void hydrateLocations();

            return () => {
                cancelled = true;
            };
        }
    }, [ensureCitiesLoaded, ensureCountryLoaded, ensureStatesLoaded, user, userLoading]);

    useEffect(() => {
        if (!openCountry) return;
        void ensureCountriesLoaded().catch(() => {});
    }, [ensureCountriesLoaded, openCountry]);

    useEffect(() => {
        if (!openState || !selectedCountryIso) return;
        void ensureStatesLoaded(selectedCountryIso).catch(() => {});
    }, [ensureStatesLoaded, openState, selectedCountryIso]);

    useEffect(() => {
        if (!openCity || !selectedCountryIso || !selectedStateIso) return;
        void ensureCitiesLoaded(selectedCountryIso, selectedStateIso).catch(() => {});
    }, [ensureCitiesLoaded, openCity, selectedCountryIso, selectedStateIso]);

    useEffect(() => {
        if (!companySearchTouched) return;
        const query = debouncedCompanyQuery.trim();

        if (query.length < 2) {
            setCompanySearchResults([]);
            setCompanySearchLoading(false);
            setCompanySearchError("");
            return;
        }

        const controller = new AbortController();

        const searchCompanies = async () => {
            setCompanySearchLoading(true);
            setCompanySearchError("");
            try {
                const qs = new URLSearchParams();
                qs.set("q", query);
                qs.set("limit", "10");

                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://Trustorabe.dacars.ro/api";
                const response = await fetch(`${baseUrl}/companies/search?${qs.toString()}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const payload = await response.json();
                const results = Array.isArray(payload?.data) ? payload.data : [];
                setCompanySearchResults(results);
            } catch (error: any) {
                if (error?.name === "AbortError") return;
                setCompanySearchResults([]);
                setCompanySearchError("Eroare la căutare. Încearcă din nou.");
            } finally {
                setCompanySearchLoading(false);
            }
        };

        void searchCompanies();

        return () => {
            controller.abort();
        };
    }, [debouncedCompanyQuery, companySearchTouched]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!companySearchRef.current) return;
            if (!companySearchRef.current.contains(e.target as Node)) {
                setCompanySearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handler, { passive: true });
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!openCurrency) return;
        const query = debouncedCurrencyQuery.trim();
        const requestId = ++currencyRequestId.current;
        setCurrencyLoading(true);
        setCurrencyError("");

        const normalizeCurrencies = (payload: any): CurrencyOption[] => {
            if (Array.isArray(payload)) return payload as CurrencyOption[];
            if (Array.isArray(payload?.data)) return payload.data as CurrencyOption[];
            if (Array.isArray(payload?.currencies)) return payload.currencies as CurrencyOption[];
            return [];
        };

        apiClient
            .getCurrencies(query.length ? query : null)
            .then((response: any) => {
                if (currencyRequestId.current !== requestId) return;
                const currencies = normalizeCurrencies(response);
                setCurrencyOptions(currencies);

                if (formDataCompany.bank_currency && !selectedCurrency) {
                    const found = currencies.find((item) =>
                        item.code?.toUpperCase() === formDataCompany.bank_currency.toUpperCase()
                    );
                    if (found) {
                        setSelectedCurrency(found);
                    }
                }
            })
            .catch((error: any) => {
                if (currencyRequestId.current !== requestId) return;
                setCurrencyOptions([]);
                setCurrencyError(error?.message ?? "Nu am putut încărca monedele.");
            })
            .finally(() => {
                if (currencyRequestId.current === requestId) {
                    setCurrencyLoading(false);
                }
            });
    }, [openCurrency, debouncedCurrencyQuery, formDataCompany.bank_currency, selectedCurrency]);

    useEffect(() => {
        if (!formDataCompany.bank_currency) {
            setSelectedCurrency(null);
            return;
        }
        const normalizedCode = formDataCompany.bank_currency.toUpperCase();
        if (selectedCurrency?.code?.toUpperCase() === normalizedCode) return;
        const found = currencyOptions.find((item) => item.code?.toUpperCase() === normalizedCode);
        if (found) {
            setSelectedCurrency(found);
            return;
        }
        setSelectedCurrency({ code: normalizedCode, name: normalizedCode, country_code: null });
    }, [currencyOptions, formDataCompany.bank_currency, selectedCurrency]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const targetField = FIELD_ID_ALIASES[id] || id;
        setFormDataCompany((prev: any) => ({ ...prev, [targetField]: value }));
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormDataCompany((prev: any) => ({ ...prev, name: value }));
        if (!companySearchTouched) {
            setCompanySearchTouched(true);
        }
        setCompanySearchOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formDataCompany,
                bank_currency: formDataCompany.bank_currency || selectedCurrency?.code || "",
            };
            const updateInfo = await apiClient.updateUserCompanyDetails(payload);
            await refreshUser();
            if (updateInfo?.success) {
                toast.success(t('dashboard.settings.profile.success'));
            }
        } catch (error: any) {
            toast.error(t('dashboard.errors.generic', { message: error?.message ?? 'Unknown error' }));
        }
    };

    const validateZip = (code: string, countryIso: string) => {
        if (!code || !countryIso) return true;
        if (postcodeValidatorExistsForCountry(countryIso)) {
            return postcodeValidator(code, countryIso);
        }
        return code.length >= 3;
    };

    const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value;
        setFormDataCompany((prev: any) => ({ ...prev, company_zip: code }));
        if (code && !validateZip(code, selectedCountryIso)) {
            setPostalCodeError(t('dashboard.settings.profile.errors.invalid_zip'));
        } else {
            setPostalCodeError("");
        }
    };

    const applyCompanySearchResult = async (company: CompanySearchResult) => {
        const nextCountryIso = company.company_country || formDataCompany.company_country;
        const nextPostcode = company.company_zip || formDataCompany.company_zip;
        let nextCountyIso = formDataCompany.company_county;

        if (company.company_country) {
            setSelectedCountryIso(company.company_country);
            await ensureCountryLoaded(company.company_country);

            const availableStates = await ensureStatesLoaded(company.company_country).catch(() => []);
            const hasCurrentState = availableStates.some((state) => state.isoCode === formDataCompany.company_county);
            nextCountyIso = hasCurrentState ? formDataCompany.company_county : "";
            setSelectedStateIso(nextCountyIso);

            if (nextCountyIso) {
                void ensureCitiesLoaded(company.company_country, nextCountyIso).catch(() => {});
            }
        }

        setFormDataCompany((prev: any) => ({
            ...prev,
            name: company.name || prev.name,
            id_number: company.tax_id || company.trade_registry_number || prev.id_number,
            company_address: company.company_address || prev.company_address,
            company_city: company.company_city || prev.company_city,
            company_county: company.company_country ? nextCountyIso : prev.company_county,
            company_zip: company.company_zip || prev.company_zip,
            company_country: company.company_country || prev.company_country,
            id_type: company.company_country
                ? (COUNTRY_ID_TYPES[company.company_country] || prev.id_type)
                : prev.id_type,
        }));

        if (nextPostcode && nextCountryIso && !validateZip(nextPostcode, nextCountryIso)) {
            setPostalCodeError(t('dashboard.settings.profile.errors.invalid_zip'));
        } else {
            setPostalCodeError("");
        }
    };

    const handleCountryChange = async (isoCode: string) => {
        const requestId = ++countryChangeRequestId.current;
        // Sugerăm automat tipul de act
        const suggestedIdType = COUNTRY_ID_TYPES[isoCode] || "";

        setSelectedCountryIso(isoCode);
        setSelectedStateIso("");
        setOpenState(false);
        setOpenCity(false);

        setFormDataCompany((prev: any) => ({
            ...prev,
            company_country: isoCode,
            company_county: "",
            company_city: "",
            company_zip: prev.company_zip,
            id_type: suggestedIdType // Auto-select
        }));

        if (formDataCompany.company_zip && !validateZip(formDataCompany.company_zip, isoCode)) {
            setPostalCodeError(t('dashboard.settings.profile.errors.invalid_zip'));
        } else {
            setPostalCodeError("");
        }

        await ensureCountryLoaded(isoCode);

        const availableStates = await ensureStatesLoaded(isoCode).catch(() => []);
        if (countryChangeRequestId.current !== requestId) {
            return;
        }

        let firstStateIso = "";
        let firstCityName = "";

        if (availableStates.length > 0) {
            firstStateIso = availableStates[0].isoCode;
            const availableCities = await ensureCitiesLoaded(isoCode, firstStateIso).catch(() => []);
            if (countryChangeRequestId.current !== requestId) {
                return;
            }
            if (availableCities.length > 0) {
                firstCityName = availableCities[0].name;
            }
        }

        setSelectedStateIso(firstStateIso);
        setFormDataCompany((prev: any) => ({
            ...prev,
            company_country: isoCode,
            company_county: firstStateIso,
            company_city: firstCityName,
            company_zip: prev.company_zip,
            id_type: suggestedIdType,
        }));
    };

    const handleStateChange = async (isoCode: string) => {
        const requestId = ++stateChangeRequestId.current;
        const availableCities = await ensureCitiesLoaded(selectedCountryIso, isoCode).catch(() => []);
        if (stateChangeRequestId.current !== requestId) {
            return;
        }

        const firstCityName = availableCities[0]?.name ?? "";

        setSelectedStateIso(isoCode);
        setFormDataCompany((prev: any) => ({
            ...prev,
            company_county: isoCode,
            company_city: firstCityName
        }));
    };

    const handleCityChange = (cityName: string) => {
        setFormDataCompany((prev: any) => ({
            ...prev,
            company_city: cityName
        }));
    };

    return (
        <Dialog open={openCompanyInformationsDialog} onOpenChange={setOpenCompanyInformationsDialog}>
            <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[#1BC47D]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {t('dashboard.settings.profile.company_informations')}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                {t('dashboard.settings.profile.company_informations_subtitle')}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Section 1: Company Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="company">{t('dashboard.settings.profile.legal_name')}</Label>
                            <div className="relative" ref={companySearchRef}>
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="company"
                                    value={formDataCompany.name}
                                    onChange={handleCompanyChange}
                                    onFocus={() => {
                                        if (!companySearchTouched) {
                                            setCompanySearchTouched(true);
                                        }
                                        setCompanySearchOpen(true);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setCompanySearchOpen(false);
                                        }
                                    }}
                                    placeholder={t('dashboard.settings.profile.placeholders.company')}
                                    className="pl-10"
                                />

                                {companySearchOpen && companySearchTouched && (formDataCompany.name.trim().length > 0 || companySearchLoading) && (
                                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                                        <div className="max-h-64 overflow-auto bg-white dark:bg-[#0B1220]">
                                            {formDataCompany.name.trim().length < 2 && (
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    Scrie cel puțin 2 caractere pentru căutare.
                                                </div>
                                            )}

                                            {formDataCompany.name.trim().length >= 2 && companySearchLoading && (
                                                <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Caut...
                                                </div>
                                            )}

                                            {formDataCompany.name.trim().length >= 2 && !companySearchLoading && companySearchError && (
                                                <div className="p-3 text-sm text-red-500">
                                                    {companySearchError}
                                                </div>
                                            )}

                                            {formDataCompany.name.trim().length >= 2 && !companySearchLoading && !companySearchError && companySearchResults.length === 0 && (
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    Nu am găsit nicio companie. Poți completa manual.
                                                </div>
                                            )}

                                            {formDataCompany.name.trim().length >= 2 && !companySearchLoading && !companySearchError && companySearchResults.length > 0 && (
                                                <div className="py-1">
                                                    {companySearchResults.map((company) => {
                                                        const meta = [
                                                            company.tax_id || company.trade_registry_number,
                                                            company.company_city,
                                                            company.company_country,
                                                        ].filter(Boolean).join(" • ");

                                                        return (
                                                            <button
                                                                key={company.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    void applyCompanySearchResult(company);
                                                                    setCompanySearchOpen(false);
                                                                    setCompanySearchResults([]);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">{company.name}</span>
                                                                    {meta && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                                {meta}
                                                                            </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="represented_by">{t('dashboard.settings.profile.represented_by')}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="represented_by"
                                    value={formDataCompany.represented_by}
                                    onChange={handleChange}
                                    placeholder={t('dashboard.settings.profile.placeholders.represented_by')}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('dashboard.settings.profile.contact_email')}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formDataCompany.email}
                                    onChange={handleChange}
                                    placeholder={t('dashboard.settings.profile.placeholders.email')}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* MODIFICAT: Grid pentru ID Type și Value */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Identification Type Dropdown (SEARCHABLE) */}

                            {/* 4. Identification Type Dropdown (SEARCHABLE) */}
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="identification_type">{t('dashboard.settings.profile.id_type')}</Label>
                                <div className="relative">
                                    <Popover open={openIdType} onOpenChange={setOpenIdType} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openIdType}
                                                disabled={true}
                                                className="w-full justify-between pl-3 pr-3 font-normal border-slate-200 dark:border-slate-800 hover:bg-background hover:text-[#0F172A] dark:hover:text-white text-left"
                                            >
                    <span className="truncate">
                        {formDataCompany.id_type
                            ? formDataCompany.id_type
                            : <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.id_type')}</span>}
                    </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search type or country..." />
                                                {/* 👇 FIX AICI: Adăugat max-h și overflow */}
                                                <CommandList className="max-h-[250px] overflow-y-auto">
                                                    <CommandEmpty>No type found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {idTypeOptions.map((item) => (
                                                            <CommandItem
                                                                key={`${item.iso}-${item.type}`}
                                                                value={item.label}
                                                                onSelect={() => {
                                                                    setFormDataCompany((prev: any) => ({
                                                                        ...prev,
                                                                        id_type: item.type
                                                                    }));
                                                                    setOpenIdType(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formDataCompany.id_type === item.type && selectedCountryIso === item.iso
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {item.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="identification_value">{t('dashboard.settings.profile.id_code')}</Label>
                                <Input
                                    id="identification_value"
                                    value={formDataCompany.id_number}
                                    onChange={handleChange}
                                    placeholder={t('dashboard.settings.profile.placeholders.id_code')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Address (inclusiv Country, State, City searchables) */}
                    {/* ... Restul codului pentru adresă și bancă rămâne neschimbat ... */}
                    <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            {t('dashboard.settings.profile.hq_address')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. Country Select - SEARCHABLE */}
                            <div className="space-y-2">
                                <Label htmlFor="country">{t('dashboard.settings.profile.country')}</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400 text-lg flex items-center justify-center w-5 h-5">
                                        {selectedCountryFlag ? selectedCountryFlag : <Globe className="w-4 h-4" />}
                                    </div>

                                    <Popover open={openCountry} onOpenChange={setOpenCountry} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCountry}
                                                className="w-full justify-between pl-10 font-normal border-slate-200 dark:border-slate-800 hover:bg-background hover:text-[#0F172A] dark:hover:text-white text-left"
                                            >
                                                {selectedCountryName
                                                    ? <span className="pl-5">{selectedCountryName}</span>
                                                    : selectedCountryIso
                                                        ? <span className="pl-5">{selectedCountryIso}</span>
                                                        : <span className="pl-5 text-muted-foreground ">{t('dashboard.settings.profile.placeholders.country')}</span>}
                                                {countriesLoading ? (
                                                    <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                                                ) : (
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[350px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search country..." />
                                                {/* 👇 FIX AICI: Adăugat max-h și overflow */}
                                                <CommandList className="max-h-[300px] overflow-y-auto">
                                                    {countriesLoading && countries.length === 0 && (
                                                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Se încarcă țările...
                                                        </div>
                                                    )}
                                                    {!countriesLoading && countryLoadError && countries.length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-red-500">
                                                            {countryLoadError}
                                                        </div>
                                                    )}
                                                    {countries.length > 0 && (
                                                        <>
                                                            <CommandEmpty>No country found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {countries.map((country) => (
                                                                    <CommandItem
                                                                        key={country.isoCode}
                                                                        value={country.name}
                                                                        keywords={[country.name, country.isoCode]}
                                                                        onSelect={() => {
                                                                            void handleCountryChange(country.isoCode);
                                                                            setOpenCountry(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedCountryIso === country.isoCode ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <span className="pl-10 mr-2 text-lg">{country.flag}</span>
                                                                        {country.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* 2. State Select - SEARCHABLE */}
                            <div className="space-y-2">
                                <Label htmlFor="state">{t('dashboard.settings.profile.state')}</Label>
                                <div className="relative">
                                    {showStatePicker ? (
                                        <Popover open={openState} onOpenChange={setOpenState}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openState}
                                                    disabled={!selectedCountryIso}
                                                    className="w-full justify-between font-normal border-slate-200 dark:border-slate-800 hover:bg-background hover:text-[#0F172A] dark:hover:text-white"
                                                >
                                                    {statesLoadingCountry === selectedCountryIso
                                                        ? <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.state')}</span>
                                                        : formDataCompany.company_county
                                                        ? states.find((s) => s.isoCode === formDataCompany.company_county)?.name || formDataCompany.company_county
                                                        : <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.state')}</span>}

                                                    {statesLoadingCountry === selectedCountryIso ? (
                                                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                                                    ) : (
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[350px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search state..." />
                                                    {/* 👇 FIX AICI: Adăugat max-h și overflow */}
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        {statesLoadingCountry === selectedCountryIso && states.length === 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Se încarcă județele...
                                                            </div>
                                                        )}
                                                        {states.length === 0 && stateLoadError && (
                                                            <div className="px-3 py-2 text-sm text-red-500">
                                                                {stateLoadError}
                                                            </div>
                                                        )}
                                                        {states.length > 0 && (
                                                            <>
                                                                <CommandEmpty>No state found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {states.map((state) => (
                                                                        <CommandItem
                                                                            key={state.isoCode}
                                                                            value={state.isoCode}
                                                                            keywords={[state.name]}
                                                                            onSelect={() => {
                                                                                void handleStateChange(state.isoCode);
                                                                                setOpenState(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formDataCompany.company_county === state.isoCode ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {state.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <Input
                                            id="state"
                                            value={formDataCompany.company_county}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.state')}
                                            disabled={!selectedCountryIso}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 3. City Select - SEARCHABLE */}
                            <div className="space-y-2">
                                <Label htmlFor="city">{t('dashboard.settings.profile.city')}</Label>
                                <div className="relative">
                                    {showCityPicker ? (
                                        <Popover open={openCity} onOpenChange={setOpenCity} modal={true}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCity}
                                                    disabled={!selectedStateIso}
                                                    className="w-full justify-between font-normal border-slate-200 dark:border-slate-800 hover:bg-background hover:text-[#0F172A] dark:hover:text-white"
                                                >
                                                    {citiesLoadingKey === cityCacheKey
                                                        ? <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.city')}</span>
                                                        : formDataCompany.company_city
                                                        ? formDataCompany.company_city
                                                        : <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.city')}</span>}
                                                    {citiesLoadingKey === cityCacheKey ? (
                                                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                                                    ) : (
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[350px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search city..." />
                                                    {/* 👇 FIX AICI: Adăugat max-h și overflow */}
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        {citiesLoadingKey === cityCacheKey && cities.length === 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Se încarcă orașele...
                                                            </div>
                                                        )}
                                                        {cities.length === 0 && cityLoadError && (
                                                            <div className="px-3 py-2 text-sm text-red-500">
                                                                {cityLoadError}
                                                            </div>
                                                        )}
                                                        {cities.length > 0 && (
                                                            <>
                                                                <CommandEmpty>No city found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {cities.map((city) => (
                                                                        <CommandItem
                                                                            key={city.name}
                                                                            value={city.name}
                                                                            onSelect={() => {
                                                                                handleCityChange(city.name);
                                                                                setOpenCity(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formDataCompany.company_city === city.name ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {city.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <Input
                                            id="city"
                                            value={formDataCompany.company_city}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.city')}
                                            disabled={!selectedStateIso && !formDataCompany.company_county}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postcode">{t('dashboard.settings.profile.zip')}</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="postcode"
                                        value={formDataCompany.company_zip}
                                        onChange={handlePostcodeChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.zip')}
                                        className="pl-10"
                                    />
                                </div>
                                {postalCodeError && (
                                    <p className="text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
                                        {postalCodeError}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">{t('dashboard.settings.profile.street')}</Label>
                                <Input
                                    id="address"
                                    value={formDataCompany.company_address}
                                    onChange={handleChange}
                                    placeholder={t('dashboard.settings.profile.placeholders.address')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Bank Info */}
                    <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <Landmark className="w-5 h-5 text-emerald-500" />
                            {t('dashboard.settings.profile.bank_info')}
                        </h3>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="currency">{t('dashboard.settings.profile.currency')}</Label>
                                <Popover open={openCurrency} onOpenChange={setOpenCurrency} modal={true}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="currency"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCurrency}
                                            className="w-full justify-between font-normal border-slate-200 dark:border-slate-800 hover:bg-background hover:text-[#0F172A] dark:hover:text-white text-left"
                                        >
                                            {selectedCurrency ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg leading-none">
                                                        {toFlagEmoji(selectedCurrency.country_code) || "🌐"}
                                                    </span>
                                                    <span className="truncate">{selectedCurrency.name}</span>
                                                    <span className="text-xs text-muted-foreground">{selectedCurrency.code}</span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {t('dashboard.settings.profile.placeholders.currency')}
                                                </span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search currency..."
                                                value={currencySearch}
                                                onValueChange={setCurrencySearch}
                                            />
                                            <CommandList className="max-h-[300px] overflow-y-auto">
                                                {currencyLoading && (
                                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Se încarcă...
                                                    </div>
                                                )}
                                                {!currencyLoading && currencyError && (
                                                    <CommandEmpty>{currencyError}</CommandEmpty>
                                                )}
                                                {!currencyLoading && !currencyError && currencyOptions.length === 0 && (
                                                    <CommandEmpty>Nu am găsit nicio monedă.</CommandEmpty>
                                                )}
                                                {!currencyLoading && !currencyError && currencyOptions.length > 0 && (
                                                    <CommandGroup>
                                                        {currencyOptions.map((currency) => (
                                                            <CommandItem
                                                                key={`${currency.code}-${currency.country_code ?? 'xx'}`}
                                                                value={`${currency.code} ${currency.name}`}
                                                                onSelect={() => {
                                                                    setSelectedCurrency(currency);
                                                                    setFormDataCompany((prev: any) => ({
                                                                        ...prev,
                                                                        bank_currency: currency.code
                                                                    }));
                                                                    setOpenCurrency(false);
                                                                }}
                                                            >
                                                                <span className="mr-2 text-lg leading-none">
                                                                    {toFlagEmoji(currency.country_code) || "🌐"}
                                                                </span>
                                                                <span className="flex-1 truncate">{currency.name}</span>
                                                                <span className="text-xs text-muted-foreground ml-2">{currency.code}</span>
                                                                <Check
                                                                    className={cn(
                                                                        "ml-2 h-4 w-4",
                                                                        formDataCompany.bank_currency?.toUpperCase() === currency.code?.toUpperCase()
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <BankInput
                                    id="iban"
                                    value={formDataCompany.company_bank_iban}
                                    onChange={(val) => {
                                        setFormDataCompany((prev: any) => ({ ...prev, company_bank_iban: val }));

                                    }}
                                    label={t('dashboard.settings.profile.iban')}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">{t('dashboard.settings.profile.bank_name')}</Label>
                                    <div className="relative">
                                        <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="bank_name"
                                            value={formDataCompany.company_bank_name}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.bank_name')}
                                            className="pl-10 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bic_swift">{t('dashboard.settings.profile.bic_swift')}</Label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="bic_swift"
                                            value={formDataCompany.company_bank_bic}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.bic')}
                                            className="pl-10 uppercase font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0B1220]">
                    <DialogFooter className="flex-row justify-between gap-3">
                        <Button variant="outline" className="w-full" onClick={() => setOpenCompanyInformationsDialog(false)}>
                            {t('dashboard.settings.profile.close')}
                        </Button>
                        <Button variant="default" className="w-full bg-[#1BC47D] hover:bg-[#159c63]" onClick={handleSubmit}>
                            {t('dashboard.settings.profile.save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
