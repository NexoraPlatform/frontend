'use client';
import React from 'react';
import { useCan } from '@/hooks/useCan';

type RuleProps = { roles?: string[]; allPerms?: string[]; anyPerms?: string[]; children: React.ReactNode };
type SuperProps = { superuser: true; children: React.ReactNode };
type Props = RuleProps | SuperProps;

function isSuperProps(p: Props): p is SuperProps {
    return (p as any).superuser === true;
}

export function Can(props: Props) {
    const { hasRole, hasAllPerms, hasAnyPerm, isSuper } = useCan();

    if (isSuperProps(props)) {
        return isSuper ? <>{props.children}</> : null;
    }

    const { roles, allPerms, anyPerms, children } = props; // TS is happy here
    const okRole = roles?.length ? hasRole(...roles) : true;
    const okAll = allPerms?.length ? hasAllPerms(...allPerms) : true;
    const okAny = anyPerms?.length ? hasAnyPerm(...anyPerms) : true;

    return okRole && okAll && okAny ? <>{children}</> : null;
}
