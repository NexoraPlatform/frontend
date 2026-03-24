"use client"

import * as React from "react"
import { HeadManagerContext } from "next/dist/shared/lib/head-manager-context.shared-runtime"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, nonce, ...props }: ThemeProviderProps) {
  const headManager = React.useContext(HeadManagerContext)

  return (
    <NextThemesProvider {...props} nonce={nonce ?? headManager?.nonce}>
      {children}
    </NextThemesProvider>
  )
}
