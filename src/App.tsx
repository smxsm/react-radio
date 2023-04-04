import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { UserProvider } from './context/UserContext';
import { PlayerProvider } from './context/PlayerContext';
import { NowPlayingProvider } from './context/NowPlayingContext';
import { DocumentTitleProvider } from './context/DocumentTitleContext';

import StationsCardList from './components/StationsCardList';
import Player from './components/Player';
import StationsMenu from './components/StationsMenu';
import CountriesList from './components/CountriesList';
import GenresList from './components/GenresList';
import Home from './components/Home';
import { MediaSessionAPI } from './components/MediaSessionAPI';
import UserMenu from './components/UserMenu';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import SearchForm from './components/SearchForm';
import UpsertCustomStation from './components/UpsertCustomStation';
import CustomStations from './components/CustomStations';
import TrackHistory from './components/TrackHistory';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { useState } from 'react';

import styles from './App.module.css';

function App() {
  const [mobilePlayerActive, setMobilePlayerActive] = useState(false);
  return (
    <>
      <UserProvider>
        <PlayerProvider>
          <NowPlayingProvider>
            <MediaSessionAPI />
            <BrowserRouter>
              <Navigation showPlayer={() => setMobilePlayerActive((mobilePlayerActive) => !mobilePlayerActive)} />
              <div className={styles.container}>
                <main className={styles.content}>
                  <DocumentTitleProvider>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/stations/all" element={<StationsCardList />} />
                      <Route path="/stations/countries" element={<CountriesList />} />
                      <Route path="/stations/music/genres" element={<GenresList />} />
                      <Route path="/stations/music/:category?/:value?" element={<StationsCardList />} />
                      <Route path="/stations/:category?/:value?" element={<StationsCardList />} />
                      <Route element={<ProtectedRoute hasUser={true} redirectTo={'/auth/signin'} />}>
                        <Route path="/stations/custom" element={<CustomStations />} />
                        <Route path="/stations/custom/add" element={<UpsertCustomStation />} />
                        <Route path="/stations/custom/edit/:id" element={<UpsertCustomStation />} />
                      </Route>
                      <Route element={<ProtectedRoute hasUser={false} redirectTo={'/'} />}>
                        <Route path="/auth/signin" element={<SignIn />} />
                        <Route path="/auth/signup" element={<SignUp />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DocumentTitleProvider>
                </main>
                <aside className={`${styles.sidePanel} ${mobilePlayerActive ? styles.playerActive : ''}`.trim()}>
                  <Player />
                  <TrackHistory className={styles.trackHistory} />
                </aside>
              </div>
            </BrowserRouter>
          </NowPlayingProvider>
        </PlayerProvider>
      </UserProvider>
    </>
  );
}

export default App;
