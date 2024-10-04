import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// export const useTheme = () => {
  
//   const context = useContext(ThemeProviderContext)

//   if (context === undefined)
//     throw new Error("useTheme must be used within a ThemeProvider")

//   return context
// }



export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  const { theme } = context

  // Estado para armazenar o tema efetivo (real)
  const [effectiveTheme, setEffectiveTheme] = useState<Theme>(theme)

  useEffect(() => {
    if (theme === "system") {
      // Define o tema baseado no esquema de cores do sistema
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      
      setEffectiveTheme(systemTheme)

      // Adiciona listener para mudanças nas preferências do sistema
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? "dark" : "light")
      }

      mediaQuery.addEventListener("change", handleChange)

      // Remove listener ao desmontar o componente
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      setEffectiveTheme(theme)
    }
  }, [theme])

  return {
    ...context,
    effectiveTheme, // retorna o tema efetivo (ativo de fato)
  }
}

