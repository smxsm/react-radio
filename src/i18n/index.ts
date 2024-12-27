import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // General
      'general.clear': 'Clear',
      // Navigation
      'nav.home': 'Home',
      'nav.stations': 'Stations',
      'nav.custom': 'Custom',
      'nav.browse': 'Browse',
      'nav.music': 'Music',
      'nav.news': 'News',
      'nav.sports': 'Sports',
      'nav.countries': 'Countries',
      'nav.search': 'Search ...',
      'nav.sort': 'Sort',
      'nav.sort.date': 'Date added',
      'nav.sort.name': 'Name',
      'nav.sort.popular': 'Popular',
      'nav.sort.trending': 'Trending',
      'nav.order': 'Order',
      'nav.order.asc': 'Ascending',
      'nav.order.desc': 'Descending',
      'nav.limit': 'Limit',
      'nav.distance': 'Distance',
      'nav.distance.all': 'All',
      'nav.previous': 'Previous',
      'nav.next': 'Next',
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
      // User forms
      'user.form.signinheader': 'Sign in to your account',
      'user.form.signinaction': 'or <1>create a new account</1>',
      'user.form.rememberme': 'Remember me',
      'user.form.forgotpwd': '<0>Forgot your password?</0>',
      'user.form.email': 'E-Mail',
      'user.form.password': 'Password',
      'user.form.account.create': 'Create a new account',
      'user.form.loginaction': 'or <1>sign in here</1>',
      'user.form.account.email': 'E-Mail',
      'user.form.account.firstname': 'First name',
      'user.form.account.lastname': 'Last name',
      'user.form.account.password': 'Password',
      'user.form.account.password2': 'Confirm password',
      'user.form.account.createaction': 'Create account',
      'user.form.forgotpwdheader': 'Forgot Password',
      'user.forgotpwdaction': 'Request password',
      // home
      'home.h1': 'Hear the world',
      'home.intro': 'Choose from over 30000 radio stations or <1>register an account</1> to create your own library.',
      'home.login': 'Already have an account? <1>Click here to sign in.</1>',
      'home.browse': 'Browse stations',
      'home.mystations': 'My Stations',
      'home.music': 'Music',
      'home.news': 'News',
      'home.sports': 'Sports',
      'home.countries': 'Countries',
      'home.recent': 'Recently played',
      'home.trending': 'Trending',
      'home.new': 'New and updated',
      // Tracks
      'tracks.songhistory': 'Song history',
      // Errors
      'errors.404.message': 'This page could not be found.',
      'errors.404.home': 'Click here to go to the homepage',
    }
  },
  de: {
    translation: {
      // General
      'general.clear': 'Löschen',
      // Navigation
      'nav.home': 'Start',
      'nav.stations': 'Sender',
      'nav.custom': 'Benutzerdefiniert',
      'nav.browse': 'Durchsuchen',
      'nav.music': 'Musik',
      'nav.news': 'Nachrichten',
      'nav.sports': 'Sport',
      'nav.countries': 'Länder',
      'nav.search': 'Suche ...',
      'nav.sort': 'Sortierung',
      'nav.sort.date': 'Datum hinzugefügt',
      'nav.sort.name': 'Name',
      'nav.sort.popular': 'Beliebtheit',
      'nav.sort.trending': 'Trending',
      'nav.order': 'Reihenfolge',
      'nav.order.asc': 'Aufsteigend',
      'nav.order.desc': 'Absteigend',
      'nav.limit': 'Limit',
      'nav.distance': 'Distanz',
      'nav.distance.all': 'Alle',
      'nav.previous': 'Zurück',
      'nav.next': 'Weiter',
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
      // User forms
      'user.form.signinheader': 'Melde Dich in deinem Konto an',
      'user.form.signinaction': 'oder <1>lege ein neues Konto an</1>',
      'user.form.rememberme': 'Login merken',
      'user.form.forgotpwd': '<0>Passwort vergessen?</0>',
      'user.form.email': 'E-Mail',
      'user.form.password': 'Passwort',
      'user.form.account.create': 'Neues Konto anlegen',
      'user.form.loginaction': 'oder <1>logge Dich hier ein</1>',
      'user.form.account.email': 'E-Mail',
      'user.form.account.firstname': 'Vorname',
      'user.form.account.lastname': 'Nachname',
      'user.form.account.password': 'Passwort',
      'user.form.account.password2': 'Password bestätigen',
      'user.form.account.createaction': 'Konto anlegen',
      'user.form.forgotpwdheader': 'Passwort vergessen',
      'user.forgotpwdaction': 'Passwort anfordern',
      // home
      'home.h1': 'Die Welt im Ohr',
      'home.intro': "Wähle aus über 30000 Radio-Stationen oder <1>registriere einen Account</1>, um deine eigene Bibliothek zu erstellen.",
      'home.login': 'Du hast schon ein Konto? <1>Einfach hier einloggen.</1>',
      'home.browse': 'Stationen entdecken',
      'home.mystations': 'Meine Sender',
      'home.music': 'Musik',
      'home.news': 'Nachrichten',
      'home.sports': 'Sport',
      'home.countries': 'Länder',
      'home.recent': 'Zuletzt gespielt',
      'home.trending': 'Trending',
      'home.new': 'Neu und aktualisiert',
      // Tracks
      'tracks.songhistory': 'Zuletzt gehört',
      // Errors
      'errors.404.message': 'Hoppla, hier gibt es nichts zu sehen ...',
      'errors.404.home': 'Zurück nach Hause',
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
