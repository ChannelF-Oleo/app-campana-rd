// Google Analytics utilities
export const GA_TRACKING_ID = 'G-EB27HNVEQY';

// Función para enviar eventos personalizados
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Función para rastrear páginas
export const trackPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Eventos específicos de la campaña
export const trackCampaignEvents = {
  // Registro de usuarios
  userRegistration: (method) => {
    trackEvent('sign_up', 'engagement', 'user_registration', method);
  },
  
  // Login
  userLogin: (method) => {
    trackEvent('login', 'engagement', 'user_login', method);
  },
  
  // Visualización de propuestas
  viewProposals: () => {
    trackEvent('view_item', 'content', 'proposals_page');
  },
  
  // Registro de simpatizantes
  registerSimpatizante: () => {
    trackEvent('generate_lead', 'conversion', 'simpatizante_registration');
  },
  
  // Compartir enlace de referido
  shareReferralLink: (method) => {
    trackEvent('share', 'engagement', 'referral_link', method);
  },
  
  // Navegación del dashboard
  dashboardNavigation: (section) => {
    trackEvent('select_content', 'navigation', 'dashboard_section', section);
  },
  
  // Establecer metas
  setGoal: (goalType) => {
    trackEvent('set_goal', 'engagement', 'goal_setting', goalType);
  },
  
  // Descarga de documentos
  downloadDocument: (documentName) => {
    trackEvent('file_download', 'engagement', 'document_download', documentName);
  }
};

// Hook para usar en componentes React
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackCampaignEvents
  };
};