'use client'

import {
  ThemeProvider as NextThemesProvider,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
