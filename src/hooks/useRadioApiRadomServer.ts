import { useState, useEffect } from 'react';

type RadioBrowserApiServers = {
  ip: string;
  name: string;
};

const radioApiServers = ['at1.api.radio-browser.info', 'de1.api.radio-browser.info', 'nl1.api.radio-browser.info'];

export default function useRadioApiRandomServer() {
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    Promise.any(
      radioApiServers.map((server) => fetch(`https://${server}/json/servers`, { signal: AbortSignal.timeout(3000) }))
    )
      .then<RadioBrowserApiServers[]>((res) => res.json())
      .then((servers) => {
        const randomHost = servers[Math.floor(Math.random() * servers.length)].name;
        setApiUrl(`https://${randomHost}/json`);
      })
      .catch(() => setApiUrl('https://de1.api.radio-browser.info/json'));
  }, []);

  return apiUrl;
}
