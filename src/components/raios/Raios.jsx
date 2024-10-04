import { useEffect, useState } from 'react';
import './style.css';

const Raios = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
    // Atualiza o tamanho da tela quando ela for redimensionada
    useEffect(() => {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return (
      <div className="lightning-container">
        {/* Renderizar várias linhas para criar o efeito de raio */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className={`lightning-line zigzag-${index}`} />
        ))}
      </div>
    );
  };

export default Raios;
