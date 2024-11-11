import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { useEffect } from "react"

export function ModeToggle() {


    const { setTheme } = useTheme()

    const handleClick = (e) => {
        e.target.blur(); // Remove o foco após o clique
    }

    useEffect(() => {
        const storage = localStorage.getItem("vite-ui-theme")
        !storage && setTheme("system")         
    },[])

    return (
        <DropdownMenu >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className=""
                    // onClick={handleClick}
                    onFocus={handleClick}
                    >
                    <Sun className=" h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="rounded-xl font-medium
                        bg-gray-300 text-gray-800
                        dark:bg-black dark:text-blue-gray-200 dark:border-blue-gray-400"
            >
                <DropdownMenuItem
                    className="hover:font-extrabold"
                    onClick={() => setTheme("light")}
                >
                    Claro
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="hover:font-extrabold"
                    onClick={() => setTheme("dark")}
                >
                    Escuro
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="hover:font-extrabold"
                    onClick={() => setTheme("system")}
                >
                    Sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
