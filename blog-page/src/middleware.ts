import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Middleware wird bei jeder Anfrage ausgeführt
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Öffentliche Routen überspringen (Login, Registrierung, etc.)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/' ||
    pathname.startsWith('/datenschutz') ||
    pathname.startsWith('/impressum') ||
    pathname.startsWith('/agb')
  ) {
    return NextResponse.next();
  }

  try {
    // Token aus der Anfrage extrahieren
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Wenn kein Token vorhanden, zur Login-Seite weiterleiten
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    // Benutzer-ID aus dem Token extrahieren
    // const userId = token.id; // entfernt, da ungenutzt

    // Da wir in der Middleware keinen direkten Datenbankzugriff haben (Edge-Runtime),
    // müssen wir eine separate API-Route für den Benutzerstatus verwenden
    // SSRF-Schutz: Nur interne API-URL mit eigener Origin verwenden
    const apiUrl = `${request.nextUrl.origin}/api/auth/check-status`;
    const response = await fetch(apiUrl, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'BANNED') {
        // Benutzer ist gesperrt, zur Login-Seite weiterleiten mit entsprechender Nachricht
        const url = new URL('/login', request.url);
        url.searchParams.set('error', 'banned');
        return NextResponse.redirect(url);
      }
    }

    // Anfrage durchlassen, wenn Benutzer nicht gesperrt ist
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware-Fehler:', error);
    // Bei Fehlern einfach weitermachen
    return NextResponse.next();
  }
}

// Konfiguration, auf welchen Pfaden die Middleware ausgeführt werden soll
export const config = {
  matcher: [
    // Alle geschützten Routen
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/create-blog/:path*',
    // Alle API-Routen außer /api/auth und /api/published-blocks
    '/api/((?!auth|published-blocks).*)/:path*',
  ],
};
