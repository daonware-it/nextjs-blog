import React from 'react';
import styles from '../admin.module.css';

interface DashboardStats {
  isLoading: boolean;
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
}

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className={styles.adminSection}>
      <h2 className={styles.adminSectionTitle}>Übersicht</h2>
      {stats.isLoading ? (
        <div className={styles.loadingState}>
          <p>Statistiken werden geladen...</p>
        </div>
      ) : (
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard}>
            <h3>Benutzer</h3>
            <div className={styles.dashboardNumber}>{stats.userCount}</div>
            <div className={styles.dashboardTrend}>{stats.userGrowth} im letzten Monat</div>
          </div>
          <div className={styles.dashboardCard}>
            <h3>Blog-Beiträge</h3>
            <div className={styles.dashboardNumber}>{stats.blogPostCount}</div>
            <div className={styles.dashboardTrend}>+{stats.newBlogPosts} neue Beiträge</div>
          </div>
          <div className={styles.dashboardCard}>
            <h3>Kommentare</h3>
            <div className={styles.dashboardNumber}>{stats.commentCount}</div>
            <div className={styles.dashboardTrend}>{stats.unmoderatedComments} unmoderiert</div>
          </div>
          <div className={styles.dashboardCard}>
            <h3>Besucher</h3>
            <div className={styles.dashboardNumber}>{stats.visitorCount}</div>
            <div className={styles.dashboardTrend}>{stats.visitorGrowth} gegenüber Vormonat</div>
          </div>
          <div className={styles.dashboardCard}>
            <h3>Block-Entwürfe</h3>
            <div className={styles.dashboardNumber}>{stats.blockDraftCount || 0}</div>
            <div className={styles.dashboardTrend}>davon {stats.unmoderatedBlockDrafts || 0} nicht veröffentlicht</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
