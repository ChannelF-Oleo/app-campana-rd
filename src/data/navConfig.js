// src/data/navConfig.js
// src/data/navConfig.js
import { 
  FaHome, FaUserPlus, FaUsers, FaTasks, FaBullseye, FaLayerGroup 
} from 'react-icons/fa';

export const getVisibleNavItems = (user) => {
  if (!user) return [];

  // 1. Ítems Comunes (Todo el mundo los ve)
  const commonItems = [
    {
      id: 'home',
      label: 'Inicio',
      path: '/dashboard',
      icon: FaHome,
      end: true, // IMPORTANTE: Forzamos 'end' aquí para evitar doble resaltado
    },
    {
      id: 'registro',
      label: 'Registro',
      path: '/dashboard/registrar', // Ruta hija
      icon: FaUserPlus,
    }
  ];

  // 2. Ítems de Admin
  if (user.rol === 'admin') {
    return [
      ...commonItems,
      {
        id: 'usuarios',
        label: 'Usuarios',
        path: '/admin/usuarios',
        icon: FaUsers,
      },
      {
        id: 'equipos',
        label: 'Pelotones',
        path: '/admin/equipos',
        icon: FaTasks,
      },
      {
        id: 'comandos',
        label: 'Comandos',
        path: '/admin/comandos',
        icon: FaLayerGroup,
      },
    ];
  }

  // 3. Ítems de Líder / Multiplicador
  const roleItems = [...commonItems];

  if (['multiplicador', 'lider de zona'].includes(user.rol)) {
    roleItems.push({
      id: 'meta',
      label: 'Meta',
      path: null, // Es una acción (botón), no una ruta
      isAction: true,
      icon: FaBullseye,
    });
  }

  return roleItems;
};