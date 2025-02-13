import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './i18n';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import { PlayerProvider } from './context/PlayerContext';
import { NowPlayingProvider } from './context/NowPlayingContext';
import { DocumentTitleProvider } from './context/DocumentTitleContext';

import StationsCardList from './components/StationsCardList';
import Player from './components/Player';
import CountriesList from './components/CountriesList';
import GenresList from './components/GenresList';
import Home from './components/Home';
import { MediaSessionAPI } from './components/MediaSessionAPI';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import UpsertCustomStation from './components/UpsertCustomStation';
import CustomStations from './components/CustomStations';
import UserTracks from './components/UserTracks';
import TrackHistory from './components/TrackHistory';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { useState } from 'react';

import styles from './App.module.css';
import ForgotPwd from './components/ForgotPwd';
import ChangePwd from './components/ChangePwd';
import RequestDelete from './components/RequestDelete';
import DeleteData from './components/DeleteData';

function App() {
  const [mobilePlayerActive, setMobilePlayerActive] = useState(false);
  const switchPlayer = (visible?: boolean) => {
    if (visible === undefined) {
      return setMobilePlayerActive((mobilePlayerActive) => !mobilePlayerActive);
    }

    setMobilePlayerActive(visible);
  };
  return (
    <LanguageProvider>
      <BrowserRouter>
        <UserProvider>
          <PlayerProvider>
            <NowPlayingProvider>
              <DocumentTitleProvider>
                <MediaSessionAPI />
                <Navigation switchPlayer={switchPlayer} showNowPlaying={!mobilePlayerActive} />
                <div className={styles.container}>
                  <main className={styles.content}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/stations/all" element={<StationsCardList />} />
                      <Route path="/stations/countries" element={<CountriesList />} />
                      <Route path="/stations/music/genres" element={<GenresList />} />
                      <Route path="/stations/music/:category?/:value?" element={<StationsCardList />} />
                      <Route path="/stations/:category?/:value?" element={<StationsCardList />} />
                      <Route path="/auth/request-delete" element={<RequestDelete />} />
                      <Route path="/delete-data/:token" element={<DeleteData />} />
                      <Route element={<ProtectedRoute hasUser={true} redirectTo={'/auth/signin'} />}>
                        <Route path="/stations/custom" element={<CustomStations />} />
                        <Route path="/user/tracks" element={<UserTracks />} />
                        <Route path="/stations/custom/add" element={<UpsertCustomStation />} />
                        <Route path="/stations/custom/edit/:id" element={<UpsertCustomStation />} />
                      </Route>
                      <Route element={<ProtectedRoute hasUser={false} redirectTo={'/'} />}>
                        <Route path="/auth/signin" element={<SignIn />} />
                        <Route path="/auth/signup" element={<SignUp />} />
                        <Route path="/auth/forgot-password" element={<ForgotPwd />} />
                        <Route path="/change-password/:token" element={<ChangePwd />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <aside className={`${styles.sidePanel} ${mobilePlayerActive ? styles.playerActive : ''}`.trim()}>
                    <Player />
                    <TrackHistory className={styles.trackHistory} />
                  </aside>
                </div>
              </DocumentTitleProvider>
            </NowPlayingProvider>
          </PlayerProvider>
        </UserProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
