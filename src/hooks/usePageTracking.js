import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

// Hook para rastrear automáticamente las páginas visitadas
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Rastrear la página actual cuando cambie la ruta
    trackPageView(location.pathname + location.search);
  }, [location]);
};

export default usePageTracking;