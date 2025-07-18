import { useEffect, useState } from 'react';
import styles from './Home.module.scss';
import { Link } from 'react-router-dom';
import { useDeepJournalsContext } from '../../context/DeepJournalsContext';
import DeleteDeepJournal from './DeleteDeepJournal';
import Logo from './logo';
import OpenDeepJournalFolder from './OpenDeepJournalFolder';

const quotes = [
  'The page listens, even when the world won’t.',
  'This is where your unspoken self can breathe.',
  'Words you never said still deserve to be heard.',
  'Your depth was never too much for the page.',
  'The page keeps secrets the world forgets to hold.',
   'Here, even your silence has a voice.',
   'No thought is too small to be seen here.',
  'Every unshared word finds its home on the page.',
  'The page is where your unheard stories come alive.',
  'This page was made for the version of you that hides.',
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
          <a href="https://deepbikram.com.np/Deep-Journal.org" target="_blank">
            <div className={styles.unms}></div>
            {quote}
          </a>

          <div className={styles.nav}>
            <Link to="/license" className={styles.link}>
              License
            </Link>
            <a
              href="https://deepbikram.com.np/Deep-Journal.org"
              target="_blank"
              className={styles.link}
            >
              Tutorial
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
