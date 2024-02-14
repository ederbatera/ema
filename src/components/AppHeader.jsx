
import * as React from 'react';
import useAppContext from '../hook/useAppContext'

export default function AppHeader() {

  const { name, number } = useAppContext()

  return (
    <div>
      {name} e numero: {number}
    </div>
  )

}