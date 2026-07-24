// src/data/navConfig.js
// src/data/navConfig.js
import {
  FaHome, FaUserPlus, FaUsers, FaTasks, FaBullseye, FaLayerGroup, FaUser
} from 'react-icons/fa';
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from '../constants';

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
    },
    {
      id: 'perfil',
      label: 'Perfil',
      path: '/dashboard/perfil',
      icon: FaUser,
    }
  ];

  // 2. Ítems de Admin
  if (user.rol === ROL_ADMIN) {
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

  if ([ROL_MULTIPLICADOR, ROL_LIDER].includes(user.rol)) {
    roleItems.push({
      id: 'metas',
      label: 'Metas',
      path: '/dashboard/metas', // Página propia (historial, logros, crear meta)
      icon: FaBullseye,
    });
  }

  return roleItems;
};