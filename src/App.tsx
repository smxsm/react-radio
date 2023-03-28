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
import AddCustomStation from './components/AddCustomStation';
import CustomStations from './components/CustomStations';

function App() {
  return (
    <>
      <UserProvider>
        <PlayerProvider>
          <NowPlayingProvider>
            <MediaSessionAPI />
            <div className={styles.container}>
              <div className={styles['grid-container']}>
                <BrowserRouter>
                  <div className={styles['side-menu']}>
                    <SearchForm />
                    <StationsMenu />
                    <UserMenu />
                  </div>
                  <div className={styles['main-container']}>
                    <Player />
                    <main>
                      <Routes>
                        <Route path="/auth/signin" element={<SignIn />} />
                        <Route path="/auth/signup" element={<SignUp />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/stations/custom" element={<CustomStations />} />
                        <Route path="/stations/custom/add" element={<AddCustomStation />} />
                        <Route path="/stations/all" element={<StationsCardList />} />
                        <Route path="/stations/countries" element={<CountriesList />} />
                        <Route path="/stations/music/genres" element={<GenresList />} />
                        <Route path="/stations/music/:category?/:value?" element={<StationsCardList />} />
                        <Route path="/stations/:category?/:value?" element={<StationsCardList />} />
                      </Routes>
                    </main>
                  </div>
                  {/* <aside className={styles['nowplaying-container']}>Playing </aside> */}
                </BrowserRouter>
              </div>
            </div>
          </NowPlayingProvider>
        </PlayerProvider>
      </UserProvider>
    </>
  );
}

export default App;
