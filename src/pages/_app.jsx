import { LanguageProvider } from '@/components/LanguageProvider';

export default function App({ children }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}