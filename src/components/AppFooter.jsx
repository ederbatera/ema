
import useAppContext from '../hook/useAppContext'

export default function AppFooter() {
  const { setName } = useAppContext()
  return (
    <button onClick={() => setName('Carlinhos da Massa')}>Mude o nome</button>
  )
}