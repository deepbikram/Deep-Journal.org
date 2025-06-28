import { useParams, Link } from 'react-router-dom';
import styles from './DeepJournalLayout.module.scss';
import Sidebar from './Sidebar/Timeline/index';
import { useIndexContext } from 'renderer/context/IndexContext';
import { useEffect, useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import Settings from './Settings';
import HighlightsDialog from './Highlights';
import { useDeepJournalsContext } from 'renderer/context/DeepJournalsContext';
import Toasts from './Toasts';
import Search from './Search';
import { useTimelineContext } from 'renderer/context/TimelineContext';
import { AnimatePresence, motion } from 'framer-motion';
import InstallUpdate from './InstallUpdate';
import Chat from './Chat';
import UpdateButton from 'renderer/components/UpdateButton';

export default function DeepJournalLayout({ children }) {
  const { deepJournalName } = useParams();
  const { index, refreshIndex } = useIndexContext();
  const { visibleIndex, closestDate } = useTimelineContext();
  const { currentTheme } = useDeepJournalsContext();

  const [now, setNow] = useState(DateTime.now().toFormat('cccc, LLL dd, yyyy'));

  useEffect(() => {
    try {
      if (visibleIndex < 5) {
        setNow(DateTime.now().toFormat('cccc, LLL dd, yyyy'));
      } else {
        setNow(DateTime.fromISO(closestDate).toFormat('cccc, LLL dd, yyyy'));
      }
    } catch (error) {
      console.log('Failed to render header date');
    }
  }, [visibleIndex, closestDate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const themeStyles = useMemo(() => {
    return currentTheme ? currentTheme + 'Theme' : '';
  }, [currentTheme]);

  const osStyles = useMemo(
    () => (window.electron?.isMac ? styles.mac : styles.win),
    []
  );

  return (
    <div className={`${styles.frame} ${themeStyles} ${osStyles}`}>
      <div className={styles.bg}></div>
      <div className={styles.main}>
        <div className={styles.sidebar}>
          <div className={styles.top}>
            <div className={styles.part}>
              <div className={styles.count}>
                <span>{index.size}</span> entries
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
        <div className={styles.content}>
          <div className={styles.nav}>
            <div className={styles.left}>
              {deepJournalName} <span style={{ padding: '6px' }}>·</span>
              <motion.span
                key={now}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {now}
              </motion.span>
            </div>
            <div className={styles.right}>
              <Toasts />
              <InstallUpdate />
              {/* Header buttons removed - functionality now available in vertical sidebar */}
            </div>
          </div>
          {children}
        </div>
      </div>

      {/* Modal components (without header triggers) - controlled by vertical sidebar */}
      <Chat />
      <Search />
      <Settings />

      <div id="reflections"></div>
      <div id="dialog"></div>
    </div>
  );
}
