import StationsCardList from './components/StationsCardList';
import styles from './App.module.css';
import Player from './components/Player';
import StationsMenu from './components/StationsMenu';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CountriesList from './components/CountriesList';
import GenresList from './components/GenresList';
import Home from './components/Home';
import { PlayerProvider } from './context/PlayerContext';
import { NowPlayingProvider } from './context/NowPlayingContext';
import { MediaSessionAPI } from './components/MediaSessionAPI';
import UserMenu from './components/UserMenu';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import { UserProvider } from './context/UserContext';
import SearchForm from './components/SearchForm';
import UpsertCustomStation from './components/UpsertCustomStation';
import CustomStations from './components/CustomStations';
import TrackHistory from './components/TrackHistory';

function App() {
  return (
    <>
      <UserProvider>
        <PlayerProvider>
          <NowPlayingProvider>
            <MediaSessionAPI />
            <BrowserRouter>
              <nav className={styles.navigation}>
                <StationsMenu />
                <SearchForm className={styles.search} />
                <UserMenu />
              </nav>
              <div className={styles.container}>
                <main className={styles.content}>
                  <Routes>
                    <Route path="/auth/signin" element={<SignIn />} />
                    <Route path="/auth/signup" element={<SignUp />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/stations/custom" element={<CustomStations />} />
                    <Route path="/stations/custom/add" element={<UpsertCustomStation />} />
                    <Route path="/stations/custom/edit/:id" element={<UpsertCustomStation />} />
                    <Route path="/stations/all" element={<StationsCardList />} />
                    <Route path="/stations/countries" element={<CountriesList />} />
                    <Route path="/stations/music/genres" element={<GenresList />} />
                    <Route path="/stations/music/:category?/:value?" element={<StationsCardList />} />
                    <Route path="/stations/:category?/:value?" element={<StationsCardList />} />
                  </Routes>
                </main>
                <aside className={styles.sidePanel}>
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
