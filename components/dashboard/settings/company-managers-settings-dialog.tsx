import React, {Dispatch, SetStateAction, useEffect, useMemo, useState} from "react";
import {useAuth} from "@/contexts/auth-context";
import {Loader2, Plus, User2, UsersRound, X} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {useTranslations} from "next-intl";
import apiClient from "@/lib/api";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

interface CompanyManagersSettingsProps {
    openCompanyManagersDialog: boolean;
    setOpenCompanyManagersDialog: Dispatch<SetStateAction<boolean>>;
}

type CompanySearchUser = {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
    email?: string | null;
};

type EditorEntry = {
    key: string;
    id?: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    avatar?: string | null;
};

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function CompanyManagersSettingsDialog({
                                                          openCompanyManagersDialog,
                                                          setOpenCompanyManagersDialog
}: CompanyManagersSettingsProps) {
    const { user } = useAuth();
    const t = useTranslations();
    const [editors, setEditors] = useState<EditorEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CompanySearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [members, setMembers] = useState<CompanySearchUser[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState("");
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const debouncedSearch = useDebouncedValue(searchQuery, 350);

    useEffect(() => {
        if (!user) return;
        if (!user.company) return;
        const getCompanyManagers = async () => {
            const response = await apiClient.getCompanyManagers(user?.company?.id);

            if (!response) return;
            if (Array.isArray(response.editors)) {
                const mappedEditors = response.editors.map((editor: CompanySearchUser) => ({
                    key: `user:${editor.id}`,
                    id: editor.id,
                    firstName: editor.firstName ?? editor.first_name ?? null,
                    lastName: editor.lastName ?? editor.last_name ?? null,
                    email: editor.email ?? null,
                    avatar: editor.avatar ?? null,
                }));
                setEditors(mappedEditors);
                return;
            }

            if (!Array.isArray(response.editor_emails)) return;
            const mappedEmails = response.editor_emails
                .filter((email: string) => typeof email === "string")
                .map((email: string) => ({
                    key: `email:${email.trim().toLowerCase()}`,
                    email,
                }));
            setEditors(mappedEmails);
        }

        getCompanyManagers();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        if (!user.company) return;

        let active = true;
        const getMembers = async () => {
            setMembersLoading(true);
            setMembersError("");
            try {
                const response = await apiClient.getCompanyMembers(user?.company?.id);
                if (!active) return;
                const list = Array.isArray(response?.members)
                    ? response.members
                    : Array.isArray(response)
                        ? response
                        : [];
                setMembers(list);
            } catch (error: any) {
                if (!active) return;
                setMembers([]);
                setMembersError(t('dashboard.errors.generic', { message: error?.message ?? 'Unknown error' }));
            } finally {
                if (active) {
                    setMembersLoading(false);
                }
            }
        };

        void getMembers();

        return () => {
            active = false;
        };
    }, [user, t]);

    useEffect(() => {
        const query = debouncedSearch.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            setSearchError("");
            return;
        }

        let active = true;
        const searchUsers = async () => {
            setSearchLoading(true);
            setSearchError("");
            try {
                const response = await apiClient.searchUserForCompany(query);
                if (!active) return;
                const results = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : Array.isArray(response?.users)
                            ? response.users
                            : [];
                setSearchResults(results);
            } catch (error: any) {
                if (!active) return;
                setSearchResults([]);
                setSearchError(t('dashboard.errors.generic', { message: error?.message ?? 'Unknown error' }));
            } finally {
                if (active) {
                    setSearchLoading(false);
                }
            }
        };

        void searchUsers();

        return () => {
            active = false;
        };
    }, [debouncedSearch, t]);

    const normalizedEditors = useMemo(() => {
        return editors.map((editor) => {
            const name = `${editor.firstName ?? ""} ${editor.lastName ?? ""}`.trim();
            const primary = name || editor.email || `User ${editor.id ?? ""}`.trim();
            const secondary = name && editor.email ? editor.email : "";
            return {
                ...editor,
                primary,
                secondary,
            };
        });
    }, [editors]);

    const filteredMembers = useMemo(() => {
        const query = memberSearchQuery.trim().toLowerCase();
        if (!query) return members;
        return members.filter((member) => {
            const name = `${member.firstName ?? member.first_name ?? ""} ${member.lastName ?? member.last_name ?? ""}`.trim().toLowerCase();
            const email = member.email?.toLowerCase() ?? "";
            return name.includes(query) || email.includes(query);
        });
    }, [memberSearchQuery, members]);

    const isAlreadyEditor = (userItem: CompanySearchUser) => {
        const normalizedEmail = userItem.email?.trim().toLowerCase() ?? "";
        return editors.some((editor) => {
            const editorEmail = editor.email?.trim().toLowerCase() ?? "";
            if (normalizedEmail && editorEmail && normalizedEmail === editorEmail) return true;
            if (editor.id && userItem.id && editor.id === userItem.id) return true;
            return false;
        });
    };

    const buildEditorFromUser = (userItem: CompanySearchUser): EditorEntry => {
        const normalizedEmail = userItem.email?.trim().toLowerCase() ?? "";
        const key = normalizedEmail ? `email:${normalizedEmail}` : `user:${userItem.id}`;
        return {
            key,
            id: userItem.id,
            firstName: userItem.firstName ?? userItem.first_name ?? null,
            lastName: userItem.lastName ?? userItem.last_name ?? null,
            email: userItem.email ?? null,
            avatar: userItem.avatar ?? null,
        };
    };

    const handleRemoveEditor = (editorKey: string) => {
        setEditors((prev) => prev.filter((editor) => editor.key !== editorKey));
    };

    const handleAddEditor = (userItem: CompanySearchUser) => {
        if (isAlreadyEditor(userItem)) return;
        setEditors((prev) => [...prev, buildEditorFromUser(userItem)]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleTransferOwnership = async (member: CompanySearchUser) => {
        if (!user?.company?.id) return;
        if (!member.email) return;
        const name = `${member.firstName ?? member.first_name ?? ""} ${member.lastName ?? member.last_name ?? ""}`.trim();
        const confirmMessage = t('dashboard.settings.profile.company_managers_transfer_confirm', {
            name: name || member.email,
        });
        const confirmed = typeof window !== "undefined" ? window.confirm(confirmMessage) : false;
        if (!confirmed) return;
        try {
            await apiClient.updateCompanyEditorsOrOwnership(user.company.id, null, member.email);
            if (typeof window !== "undefined") {
                window.location.reload();
            }
        } catch (error: any) {
            setMembersError(t('dashboard.errors.generic', { message: error?.message ?? 'Unknown error' }));
        }
    };

    if (!user) return null;

    return (
        <Dialog open={openCompanyManagersDialog} onOpenChange={setOpenCompanyManagersDialog}>
            <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <UsersRound className="w-6 h-6 text-[#1BC47D]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {t('dashboard.settings.profile.company_managers')}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                {t('dashboard.settings.profile.company_managers_subtitle')}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold">
                                {t('dashboard.settings.profile.company_managers_list_label')}
                            </Label>
                            {normalizedEditors.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    {t('dashboard.settings.profile.company_managers_empty')}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {normalizedEditors.map((editor) => (
                                        <div
                                            key={editor.key}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={editor.avatar ?? undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {(editor.primary || "U")
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {editor.primary}
                                                    </div>
                                                    {editor.secondary ? (
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {editor.secondary}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleRemoveEditor(editor.key)}
                                                aria-label={t('dashboard.settings.profile.company_managers_remove')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="pt-4 space-y-3">
                                <Label htmlFor="company-members-search" className="text-sm font-bold">
                                    {t('dashboard.settings.profile.company_managers_members_label')}
                                </Label>
                                <div className="relative">
                                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="company-members-search"
                                        type="text"
                                        className="pl-10"
                                        placeholder={t('dashboard.settings.profile.company_managers_members_placeholder')}
                                        value={memberSearchQuery}
                                        onChange={(event) => setMemberSearchQuery(event.target.value)}
                                    />
                                </div>
                                {membersLoading && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>{t('dashboard.loading.projects')}</span>
                                    </div>
                                )}
                                {membersError ? (
                                    <div className="text-xs text-red-500">{membersError}</div>
                                ) : null}
                                {!membersLoading && !membersError && filteredMembers.length === 0 ? (
                                    <div className="text-xs text-slate-500">
                                        {t('dashboard.settings.profile.company_managers_members_empty')}
                                    </div>
                                ) : null}
                                <div className="space-y-2">
                                    {filteredMembers.map((member) => {
                                        const name = `${member.firstName ?? member.first_name ?? ""} ${member.lastName ?? member.last_name ?? ""}`.trim();
                                        const primary = name || member.email || `User ${member.id}`;
                                        const canTransfer = Boolean(member.email);
                                        const isCurrentOwner = member.id === Number(user.id);
                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatar ?? undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {(primary || "U").slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">
                                                            {primary}
                                                        </div>
                                                        {name && member.email ? (
                                                            <div className="text-xs text-slate-500 truncate">
                                                                {member.email}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {!isCurrentOwner ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleTransferOwnership(member)}
                                                        disabled={!canTransfer}
                                                    >
                                                        {t('dashboard.settings.profile.company_managers_transfer_button')}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="company-manager-search" className="text-sm font-bold">
                                {t('dashboard.settings.profile.company_managers_add_label')}
                            </Label>
                            <div className="relative">
                                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="company-manager-search"
                                    type="text"
                                    className="pl-10"
                                    placeholder={t('dashboard.settings.profile.company_managers_search_placeholder')}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                {searchLoading && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>{t('dashboard.loading.projects')}</span>
                                    </div>
                                )}
                                {searchError ? (
                                    <div className="text-xs text-red-500">{searchError}</div>
                                ) : null}
                                {!searchLoading && !searchError && debouncedSearch.trim().length >= 2 && searchResults.length === 0 ? (
                                    <div className="text-xs text-slate-500">
                                        {t('dashboard.settings.profile.company_managers_no_results')}
                                    </div>
                                ) : null}
                                {searchResults.map((result) => {
                                    const name = `${result.firstName ?? result.first_name ?? ""} ${result.lastName ?? result.last_name ?? ""}`.trim();
                                    const primary = name || result.email || `User ${result.id}`;
                                    const alreadyAdded = isAlreadyEditor(result);
                                    return (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={result.avatar ?? undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {(primary || "U").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {primary}
                                                    </div>
                                                    {name && result.email ? (
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {result.email}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Button
                                                variant={alreadyAdded ? "secondary" : "default"}
                                                size="sm"
                                                onClick={() => handleAddEditor(result)}
                                                disabled={alreadyAdded}
                                            >
                                                {alreadyAdded
                                                    ? t('dashboard.settings.profile.company_managers_added')
                                                    : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            {t('dashboard.settings.profile.company_managers_add_button')}
                                                        </>
                                                    )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
