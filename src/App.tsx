import RadioCardList from './components/RadioCardList';
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

function App() {
  return (
    <>
      <PlayerProvider>
        <NowPlayingProvider>
          <MediaSessionAPI />
          <div className={styles.container}>
            <div className={styles['grid-container']}>
              <BrowserRouter>
                <div className={styles['side-menu']}>
                  <StationsMenu />
                </div>
                <div className={styles['main-container']}>
                  <Player />
                  <main>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/stations" element={<RadioCardList />} />
                      <Route path="/stations/countries" element={<CountriesList />} />
                      <Route path="/stations/genres" element={<GenresList />} />
                      <Route path="/stations/:category?/:value?" element={<RadioCardList />} />
                    </Routes>
                  </main>
                </div>
                {/* <aside className={styles['nowplaying-container']}>Playing </aside> */}
              </BrowserRouter>
            </div>
          </div>
        </NowPlayingProvider>
      </PlayerProvider>
    </>
  );
}

export default App;
