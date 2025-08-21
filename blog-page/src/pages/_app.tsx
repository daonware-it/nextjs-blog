import { SessionProvider } from "next-auth/react";
import '../styles/global.css';
import '../styles/highlight.css';
import '../styles/animations.css';
import { AuthStateProvider } from "../components/AuthStateProvider";

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthStateProvider>
        <Component {...pageProps} />
      </AuthStateProvider>
    </SessionProvider>
  );
}
