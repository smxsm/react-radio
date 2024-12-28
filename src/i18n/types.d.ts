import { Resource } from 'i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        // Navigation
        'nav.home': string;
        'nav.stations': string;
        'nav.custom': string;
        'nav.browse': string;
        'nav.music': string;
        'nav.news': string;
        'nav.sports': string;
        'nav.countries': string;
        // Stations Menu
        'stations.all': string;
        'stations.favorites': string;
        'stations.search': string;
        'stations.countries': string;
        'stations.genres': string;
        // User Menu
        'user.signin': string;
        'user.signup': string;
        'user.signout': string;
        'user.language': string;
        'user.mystations': string;
      };
    };
  }
}

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    resources: Resource;
  }
}
