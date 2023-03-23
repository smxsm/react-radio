import { useState, useEffect } from 'react';

type RadioBrowserApiServers = {
  ip: string;
  name: string;
};

export default function useRadioApiRandomServer() {
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    fetch(`https://nl1.api.radio-browser.info/json/servers`, { signal: AbortSignal.timeout(3000) })
      .then<RadioBrowserApiServers[]>((res) => res.json())
      .then((servers) => {
        const randomHost = servers[Math.floor(Math.random() * servers.length)].name;
        setApiUrl(`https://${randomHost}/json`);
      })
      .catch(() => setApiUrl('https://nl1.api.radio-browser.info/json'));
  }, []);

  return apiUrl;
}
