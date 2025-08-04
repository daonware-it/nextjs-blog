import React, { useState, useEffect } from 'react';
import AdminCommentList from './AdminCommentList';
import AdminBlogList from './AdminBlogList';
import { useSession, signIn } from 'next-auth/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './admin.module.css';
import { getTicketStats } from './ticket-stats';
import Head from 'next/head';


import {
  Dashboard,
  Benutzerverwaltung,
  Kategorien,
  Tickets,
  Debug,
  Verlauf
} from './modules';


interface DashboardStats {
  userCount: number;
  userGrowth: string;
  blogPostCount: number;
  newBlogPosts: number;
  commentCount: number;
  unmoderatedComments: number;
  visitorCount: number;
  visitorGrowth: string;
  blockDraftCount?: number;
  unmoderatedBlockDrafts?: number;
  isLoading: boolean;
}

const AdminInterface: React.FC = () => {
  const { data: session, status } = useSession();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    isLoading: true,
    userCount: 0,
    userGrowth: '+0%',
    blogPostCount: 0,
    newBlogPosts: 0,
    commentCount: 0,
    unmoderatedComments: 0,
    visitorCount: 0,
    visitorGrowth: '+0%'
  });
  const [ticketStats, setTicketStats] = useState({
    isLoading: true,
    openTickets: 0
  });


  const ensureSession = async () => {
    if (!session) {
      await signIn();
      return false;
    }
    return true;
  };


  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        
        const response = await fetch('/api/admin/dashboard-stats');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Fehler beim Laden der Dashboard-Statistiken:', errorData);
          return;
        }
        
        const dashboardStats = await response.json();
        setStats({
          isLoading: false,
          ...dashboardStats
        });
      } catch (error: any) {
        console.error('Fehler beim Laden der Dashboard-Statistiken:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          userCount: prev.userCount,
          userGrowth: prev.userGrowth,
          blogPostCount: prev.blogPostCount,
          newBlogPosts: prev.newBlogPosts,
          commentCount: prev.commentCount,
          unmoderatedComments: prev.unmoderatedComments,
          visitorCount: prev.visitorCount,
          visitorGrowth: prev.visitorGrowth
        }));
      }
    };

    if (selectedMenu === 'dashboard' && session) {
      const loadStats = async () => {
        await loadDashboardStats();
      };
      loadStats();
    }
  }, [selectedMenu, session]);

  
  useEffect(() => {
    const loadTicketStats = async () => {
      try {
        const ticketStatsData = await getTicketStats(session);
        if ('error' in ticketStatsData) {
          console.error('Fehler beim Laden der Ticket-Statistiken:', ticketStatsData.error);
          return;
        }
        setTicketStats({
          isLoading: false,
          openTickets: ticketStatsData.openTickets || 0
        });
      } catch (error: any) {
        console.error('Fehler beim Laden der Ticket-Statistiken:', error);
        setTicketStats(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    if (selectedMenu === 'tickets' && session) {
      const loadStats = async () => {
        await loadTicketStats();
      };
      loadStats();
    }
  }, [selectedMenu, session]);

  if (status === 'loading') {
    return (
      <div className={styles.adminRoot}>
        <Head>
          <title>Admin-Bereich - Wird geladen</title>
        </Head>
        <Navbar />
        <div className={styles.loadingState} style={{ margin: '100px auto', textAlign: 'center' }}>
          <p>Lade Admin-Bereich...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session || (session.user && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return (
      <div className={styles.adminRoot}>
        <Head>
          <title>Admin-Bereich - Zugriff verweigert</title>
        </Head>
        <Navbar />
        <div className={styles.unauthorizedState} style={{ margin: '100px auto', textAlign: 'center', maxWidth: '600px' }}>
          <h2>Nicht autorisiert</h2>
          <p>Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen. Bitte melden Sie sich mit einem Administrator- oder Moderator-Konto an.</p>
          <button 
            className={styles.adminButton}
            onClick={() => signIn()}
          >
            Anmelden
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.adminRoot}>
      <Head>
        <title>
          {`Admin-Bereich - ${
            selectedMenu === 'dashboard' ? 'Dashboard' :
            selectedMenu === 'user' ? 'Benutzerverwaltung' :
            selectedMenu === 'content' ? 'Inhalte verwalten' :
            selectedMenu === 'blog' ? 'Blog-Beiträge' :
            selectedMenu === 'comments' ? 'Kommentare moderieren' :
            selectedMenu === 'categories' ? 'Kategorien verwalten' :
            selectedMenu === 'warnings' ? 'Verwarnungen' :
            selectedMenu === 'tickets' ? 'Ticketsystem' :
            selectedMenu === 'history' ? 'Verlauf' :
            selectedMenu === 'reports' ? 'Reports' :
            selectedMenu === 'system' ? 'Systemeinstellungen' :
            selectedMenu === 'analytics' ? 'Statistiken & Berichte' :
            selectedMenu === 'debug' ? 'Debug & Diagnose' :
            'Unbekannter Bereich'
          }`}
        </title>
      </Head>
      <Navbar />
      <div className={styles.adminLayout}>
        <div className={styles.adminSidebar}>
          <nav className={styles.adminNav}>
            <ul>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'dashboard' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('dashboard')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'user' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('user')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Benutzer
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'categories' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('categories')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Kategorien
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'tickets' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('tickets')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  Tickets
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'debug' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('debug')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Debug
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'content' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('content')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Inhalte
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'blog' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('blog')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  Blog-Beiträge
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'comments' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('comments')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  Kommentare
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'history' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('history')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Verlauf
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'reports' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('reports')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  Reports
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'warnings' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('warnings')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Verwarnungen
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'system' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('system')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  System
                </button>
              </li>
              <li>
                <button 
                  className={`${styles.adminNavItem} ${selectedMenu === 'analytics' ? styles.active : ''}`} 
                  onClick={() => setSelectedMenu('analytics')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  Statistiken
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className={styles.adminContent}>
          <div className={styles.adminContainer}>
            <h1 className={styles.adminHeading}>
              {selectedMenu === 'dashboard' && 'Dashboard'}
              {selectedMenu === 'user' && 'Benutzerverwaltung'}
              {selectedMenu === 'content' && 'Inhalte verwalten'}
              {selectedMenu === 'blog' && 'Blog-Beiträge'}
              {selectedMenu === 'comments' && 'Kommentare moderieren'}
              {selectedMenu === 'categories' && 'Kategorien verwalten'}
              {selectedMenu === 'warnings' && 'Verwarnungen'}
              {selectedMenu === 'tickets' && 'Ticketsystem'}
              {selectedMenu === 'history' && 'Verlauf'}
              {selectedMenu === 'reports' && 'Reports'}
              {selectedMenu === 'system' && 'Systemeinstellungen'}
              {selectedMenu === 'analytics' && 'Statistiken & Berichte'}
              {selectedMenu === 'debug' && 'Debug & Diagnose'}
            </h1>
            
            {/* Dashboard Ansicht */}
            {selectedMenu === 'dashboard' && <Dashboard stats={stats} />}
            
            {/* Benutzerverwaltung */}
            {selectedMenu === 'user' && <Benutzerverwaltung ensureSession={ensureSession} />}
            
            {/* Kategorien */}
            {selectedMenu === 'categories' && <Kategorien ensureSession={ensureSession} />}
            
            {/* Tickets */}
            {selectedMenu === 'tickets' && <Tickets ticketStats={ticketStats} />}
            
            {/* Debug */}
            {selectedMenu === 'debug' && <Debug ensureSession={ensureSession} />}
            
            {/* Hier können weitere Module hinzugefügt werden */}
            {selectedMenu === 'content' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Inhalte verwalten</h2>
                <p>Hier können Sie Seiteninhalte, Medien und andere Inhalte verwalten.</p>
              </div>
            )}
            
            {selectedMenu === 'blog' && (
              <div className={styles.adminSection}>
                <AdminBlogList />
              </div>
            )}
            
            {selectedMenu === 'comments' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Kommentare moderieren</h2>
                <p>Hier können Sie alle Kommentare einsehen, prüfen oder löschen.</p>
                <AdminCommentList />
              </div>
            )}
            
            {selectedMenu === 'system' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Systemeinstellungen</h2>
                <p>Hier können Sie grundlegende Einstellungen der Webseite anpassen.</p>
              </div>
            )}
            
            {selectedMenu === 'analytics' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Statistiken & Berichte</h2>
                <p>Hier finden Sie detaillierte Statistiken und Nutzungsberichte.</p>
              </div>
            )}
            
            {selectedMenu === 'warnings' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Verwarnungen</h2>
                <p>Hier können Sie Verwarnungen für Benutzer verwalten und überwachen.</p>
              </div>
            )}
            
            {selectedMenu === 'history' && (
              <Verlauf />
            )}
            
            {selectedMenu === 'reports' && (
              <div className={styles.adminSection}>
                <h2 className={styles.adminSectionTitle}>Reports</h2>
                <p>Hier können Sie verschiedene Berichte generieren und analysieren.</p>
                <div className={styles.reportTypeList}>
                  <button className={styles.adminButton}>Benutzeraktivität</button>
                  <button className={styles.adminButton}>Blogbeitragsstatistiken</button>
                  <button className={styles.adminButton}>Kommentaranalyse</button>
                  <button className={styles.adminButton}>Monatlicher Überblick</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminInterface;
