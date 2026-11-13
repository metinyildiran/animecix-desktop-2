import { LibraryApp } from './components/LibraryApp';
import { DownloadsApp } from './components/DownloadsApp';
import { AppNavigation } from './components/AppNavigation';

export function App() {
  const downloads = location.pathname === '/downloads';
  return <><AppNavigation downloads={downloads} />{downloads ? <DownloadsApp /> : <LibraryApp />}</>;
}
