import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.stations': 'Stations',
      'nav.custom': 'Custom',
      'nav.browse': 'Browse',
      'nav.music': 'Music',
      'nav.news': 'News',
      'nav.sports': 'Sports',
      'nav.countries': 'Countries',
      // Stations Menu
      'stations.all': 'All Stations',
      'stations.favorites': 'Favorites',
      'stations.search': 'Search',
      'stations.countries': 'Countries',
      'stations.genres': 'Genres',
      // User Menu
      'user.signin': 'Sign In',
      'user.signup': 'Sign Up',
      'user.signout': 'Sign Out',
      'user.language': 'Language',
      'user.mystations': 'My Stations',
      // home
      'home.h1': 'Hear the world',
      'home.intro': 'Choose from over 30000 radio stations or <1>register an account</1> to create your own library.',
      'home.login': 'Already have an account? <1>Click here to sign in.</1>',
      'home.browse': 'Browse stations',
    }
  },
  de: {
    translation: {
      // Navigation
      'nav.home': 'Start',
      'nav.stations': 'Sender',
      'nav.custom': 'Benutzerdefiniert',
      'nav.browse': 'Durchsuchen',
      'nav.music': 'Musik',
      'nav.news': 'Nachrichten',
      'nav.sports': 'Sport',
      'nav.countries': 'Länder',
      // Stations Menu
      'stations.all': 'Alle Sender',
      'stations.favorites': 'Favoriten',
      'stations.search': 'Suche',
      'stations.countries': 'Länder',
      'stations.genres': 'Genres',
      // User Menu
      'user.signin': 'Anmelden',
      'user.signup': 'Registrieren',
      'user.signout': 'Abmelden',
      'user.language': 'Sprache',
      'user.mystations': 'Meine Sender',
      // home
      'home.h1': 'Die Welt im Ohr',
      'home.intro': "Wähle aus über 30000 Radio-Stationen oder <1>registriere einen Account</1>, um deine eigene Bibliothek zu erstellen.",
      'home.login': 'Du hast schon ein Konto? <1>Einfach hier einloggen.</1>',
      'home.browse': 'Stationen entdecken',
    }
  }
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de', // default language
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    fallbackLng: 'en'
  });

export default i18n;
