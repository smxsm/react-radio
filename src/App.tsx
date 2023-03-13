import React, { useState } from 'react';
import RadioCardList from './components/RadioCardList';
import styles from './App.module.css';
import Player from './components/Player';
import { PlayerControlContext, PlayerNowPlayingContext, PlayerStatusContext } from './PlayerContext';
import StationsMenu from './components/StationsMenu';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CountriesList from './components/CountriesList';
import GenresList from './components/GenresList';
import { useNowPlayingInfo } from './hooks/useNowPlayingInfo';
import Home from './components/Home';

function App() {
  const [playerControls, setPlayerControls] = useState({ src: '', action: 'stop', station: {} });
  const [playerStatus, setPlayerStatus] = useState({ src: '', status: 'stopped', station: {} });
  const nowPlaying = useNowPlayingInfo(playerStatus);

  return (
    <>
      <PlayerControlContext.Provider value={[playerControls, setPlayerControls]}>
        <PlayerStatusContext.Provider value={[playerStatus, setPlayerStatus]}>
          <PlayerNowPlayingContext.Provider value={nowPlaying}>
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
          </PlayerNowPlayingContext.Provider>
        </PlayerStatusContext.Provider>
      </PlayerControlContext.Provider>
    </>
  );
}

export default App;
