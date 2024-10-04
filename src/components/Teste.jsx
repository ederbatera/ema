import { Alert } from '@material-tailwind/react'

const Teste = () => {
    return (
        <>
            <div className="flex w-full flex-col gap-2 mt-3">
                <Alert color='blue' variant='gradient'> Texto de Alerta</Alert>
                <Alert color='red' variant='gradient'> Texto de Alerta</Alert>
                <Alert color='green' variant='gradient'> Texto de Alerta</Alert>
                <Alert color='amber' variant='gradient'> Texto de Alerta</Alert>
                <Alert color='' variant='gradient'> Texto de Alerta</Alert>
            </div>
        </>
    )
}

export default Teste



