import { useEffect, useState } from 'react';
import styles from './Home.module.scss';
import { Link } from 'react-router-dom';
import { useDeepJournalsContext } from '../../context/DeepJournalsContext';
import DeleteDeepJournal from './DeleteDeepJournal';
import Logo from './logo';
import OpenDeepJournalFolder from './OpenDeepJournalFolder';

const quotes = [
  'One moment at a time',
  'Scribe your soul',
  'Reflections reimagined',
  'Look back, leap forward!',
  'Tales of you - for every human is an epic in progress',
  'Your thoughtopia awaits',
  'The quintessence of quiet contemplation',
  'Journal jamboree',
];

export default function Home() {
  const { deepJournals } = useDeepJournalsContext();
  const [folderExists, setFolderExists] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(quote);
  }, []);

  const renderDeepJournals = () => {
    if (deepJournals.length == 0)
      return (
        <div className={styles.noDeepJournals}>
          No existing deep journals.
          <br />
          Start by creating a new deep journal.
        </div>
      );

    return deepJournals.map((deepJournal: any) => {
      return (
        <div
          className={`${deepJournal.theme && deepJournal.theme + 'Theme'} ${styles.deepJournal}`}
          key={deepJournal.path}
        >
          <div className={styles.left}>
            <div className={styles.name}>{deepJournal.name}</div>
            {/* <div className={styles.src}>{deepJournal.path}</div> */}
          </div>
          <div className={styles.right}>
            <DeleteDeepJournal deepJournal={deepJournal} />
            <OpenDeepJournalFolder deepJournal={deepJournal} />
            <Link to={`/deep-journal/${deepJournal.name}`} className={styles.button}>
              Open
            </Link>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={styles.frame}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.holder}>
            <div className={styles.iconHolder}>
              <Logo className={styles.icon} />
            </div>
            <div className={styles.name}>Deep Journal</div>
          </div>
        </div>

        <Link to="/new-deep-journal" className={styles.create}>
          Create a new journal →
        </Link>

        <div className={styles.or}>or open an existing deep journal</div>

        <div className={styles.deepJournals}>{renderDeepJournals()}</div>

        <div className={styles.footer}>
          <a href="https://udara.io/deep-journal" target="_blank">
            <div className={styles.unms}></div>
            {quote}
          </a>

          <div className={styles.nav}>
            <Link to="/license" className={styles.link}>
              License
            </Link>
            <a
              href="https://udara.io/deep-journal"
              target="_blank"
              className={styles.link}
            >
              Tutorial
            </a>
            <a
              href="https://github.com/udarajay/deep-journal"
              target="_blank"
              className={styles.link}
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
