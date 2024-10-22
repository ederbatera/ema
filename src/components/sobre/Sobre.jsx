import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,

} from "@/components/ui/dialog"
import { ListItem, Typography } from "@material-tailwind/react";



const Sobre = () => {

    const handleClick = (e) => {
        e.target.blur(); // Remove o foco após o clique
    };

    return (

        <Dialog>
            <DialogTrigger asChild>
                <ListItem
                    className="flex items-center gap-2 py-2 pr-4
                    text-blue-gray-900 
                    dark:text-blue-gray-100 dark:hover:bg-blue-gray-700"
                    onFocus={handleClick}
                >
                    <Typography
                        variant="small"
                        className="font-medium visited:outline-none"
                    >
                        Sobre nós
                    </Typography>

                </ListItem>
            </DialogTrigger>
            <DialogContent className="w-full justify-center h-5/6 lg:max-w-screen-lg border-0 my-10
                                      bg-gray-400 text-gray-800
                                      dark:bg-gray-900 dark:text-blue-gray-200">
                <DialogHeader>
                    <DialogTitle>
                        Sobre o projeto
                    </DialogTitle>
                    <DialogDescription>
                        Estação Meteorológica de Agudos/SP - EMA.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-y-3 max-h-svh overflow-auto">
                    <div className="sm:text-sm text-xs px-3">
                        A EMA - Estação Metereologica de Agudos é um projeto em desenvolvimento, de iniciativa privada de pessoas com interesse pela Metereologia e Climatologia.
                        Somos autodidatas em eletrônica, programação de microcontroladores, interfaceamento de hardware com a Internet, Linux, linguagem C, MYSQL, JAVASCRIPT e NODE.JS.
                        Não temos nenhuma vinculação com quaisquer empresas, entidades ou orgãos públicos, todos os custos da implantação e manutenção são com recursos próprios.
                    </div>
                    <div className="mt-10">
                        <div className="font-bold text-pretty sm:text-xl text-start">
                            Mantenedores
                        </div>
                        {/* <div className="text-start">Mantenedores do Projeto:</div> */}
                        <div className="px-3">
                            <div className="flex gap-x-1 font-bold text-pretty sm:text-xl mt-3">
                                <span className="text-blue-500">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <a href="mailto:martins.agudos@gmail.com">
                                    José Antonio Martins
                                </a>
                            </div>
                            <div className="flex">
                                <span className="text-green-600">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <div className="sm:text-sm text-xs">
                                    Hardware,instrumentação,eletrotécnica.
                                </div>
                            </div>

                            <div className="flex">
                                <span className="text-green-600">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <div className="sm:text-sm text-xs">
                                    Idealização,projeto e pesquisa.
                                </div>
                            </div>


                            <div className="flex gap-x-1 font-bold text-pretty sm:text-xl mt-3">
                                <span className="text-blue-500">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <a href="mailto:eder@ederbatera.com.br">
                                    Eder Machado
                                </a>
                            </div>
                            <div className="flex">
                                <span className="text-green-600">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <div className="sm:text-sm text-xs">
                                    Integração,servidores,página web.
                                </div>
                            </div>
                            <div className="flex">
                                <span className="text-green-600">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                </span>
                                <div className="sm:text-sm text-xs">
                                    Idealização,projeto e pesquisa.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="py-6">
                        <div className="font-bold text-pretty sm:text-xl text-start mb-4">Isenção de Responsabilidades</div>
                        <div className="sm:text-sm text-xs px-3">
                            Não garantimos as informações disponíveis, elas são apenas para observação educacional e pesquisa.
                            Os dados não devem ser utilizadas como referência para quaisquer outros fins, tais como apoio a navegação aérea, agricultura, Defesa Civil etc.
                            Em nenhum caso a EMA pode ser responsabilizada por danos especiais, indiretos ou decorrentes, ou nenhum dano vinculado ao que provenha do uso destes produtos.
                            Os produtos apresentados nesta página não podem ser usados para propósitos comerciais, copiados integral ou parcialmente para a reprodução em meios de divulgação, sem a expressa autorização.
                            Os usuários deverão sempre mencionar a fonte das informações e dados como "EMA - Estação Meteorológica Agudos".
                            À exemplo de outras estações de medição, a EMA exibe informações do local onde está instalada, não sendo possível estimar a abrangência geográfica das condições do tempo nela exibida.
                            <div>Sugestões e críticas? Entre em contato:</div>
                            <div className="mt-1 font-bold">E-mail: ema@agudos.net</div>
                            <div className="flex mt-10 text-blue-900">
                                <a href="https://github.com/ederbatera/ema" target="_blank" rel="noopener noreferrer">
                                    <div className="flex gap-1">
                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                        <div>Repositório do Projeto no GitHub</div>
                                    </div>
                                </a>
                            </div>

                        </div>
                    </div>

                </div>

                {/* <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              Teste
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              Teste 2
            </div>
          </div> */}
                {/* <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button className="ms-auto border-0 p-2 rounded-xl
                         bg-gray-600
                         dark:bg-blue-gray-300 text-gray-200"
                            type="button"
                        // variant="ghost"
                        >
                            Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter> */}
            </DialogContent>
        </Dialog>
    )


}

export default Sobre