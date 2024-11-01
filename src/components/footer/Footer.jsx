import { Typography } from "@material-tailwind/react";

const currentYear = new Date().getFullYear();

const Footer = () => {
    return (
        <footer className="flex w-full flex-col flex-wrap items-center justify-center gap-y-0 border-t py-6 text-center mt-auto
                        bg-blue-gray-100 border-gray-500
                        dark:bg-black dark:bg-opacity-90 dark:border-blue-gray-500
                          ">
            <Typography 
                // color="blue-gray" 
                className="font-normal
                        text-gray-800
                        dark:text-blue-gray-400
                        ">
                    &copy; 2019-{currentYear} EMA - Estação Metereológica Agudos/SP
            </Typography>
            <Typography as="a" href="https://www.facebook.com/emaagudos" 
                className="opacity-80 transition-opacity hover:opacity-100 text-blue-700 flex gap-x-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
              <span>facebook.com/emaagudos</span>
            </Typography>
        </footer>
    )
}

export default Footer