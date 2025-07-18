import { useEffect, useState } from 'react';
import styles from './CreateDeepJournal.module.scss';
import { TrashIcon } from 'renderer/icons';
import { Link } from 'react-router-dom';
import { useDeepJournalsContext } from 'renderer/context/DeepJournalsContext';
import { useNavigate } from 'react-router-dom';
import icon from '../../../../assets/icon.png';
import { motion } from 'framer-motion';
const deepJournalsList = ['Users/uj/Personal', 'Users/uj/Startup', 'Users/uj/School'];

export default function CreateDeepJournal() {
  const navigate = useNavigate();
  const { createDeepJournal } = useDeepJournalsContext();
  const [folderExists, setFolderExists] = useState(false);
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [useDefaultLocation, setUseDefaultLocation] = useState(true);

  useEffect(() => {
    // Set default location when component mounts
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('get-default-deep-journals-path').then((defaultPath: string) => {
        setPath(defaultPath);
      });
    }

    if (window.electron?.ipc?.on) {
      window.electron.ipc.on('selected-directory', (path: string) => {
        setPath(path);
        setUseDefaultLocation(false);
      });
    }

    return () => {
      if (window.electron?.ipc?.removeAllListeners) {
        window.electron.ipc.removeAllListeners('selected-directory');
      }
    };
  }, []);

  const getDisplayPath = (fullPath: string) => {
    if (!fullPath) return '';
    if (useDefaultLocation) {
      return '~/Deep Journals';
    }
    // For custom paths, show a shortened version
    const pathParts = fullPath.split('/');
    if (pathParts.length > 3) {
      return `.../${pathParts.slice(-2).join('/')}`;
    }
    return fullPath;
  };

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };

  const handleClick = () => {
    if (window.electron?.ipc?.sendMessage) {
      window.electron.ipc.sendMessage('open-file-dialog');
    }
  };

  const handleSubmit = () => {
    if (!path) return;
    if (!name) return;

    createDeepJournal(name, path);
    navigate('/deep-journal/' + name);
  };

  const renderDeepJournals = () => {
    return deepJournalsList.map((deepJournal) => {
      const name = deepJournal.split(/[/\\]/).pop();
      return (
        <div className={styles.deepJournal} key={deepJournal}>
          <div className={styles.left}>
            <div className={styles.name}>{name}</div>
            <div className={styles.src}>/Users/uj/Documents</div>
          </div>
          <div className={styles.right}>
            <TrashIcon className={styles.icon} />

            <div className={styles.button}>Open</div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={styles.frame}>
      <div className={styles.bg}></div>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.name}>Create a new deep journal</div>
          </div>

          <div className={styles.form}>
          <div className={styles.input}>
            <div className={styles.des}>
              <label>Deep Journal name</label>
              Pick a name for your new deep journal
            </div>
            <input
              type="text"
              placeholder="eg. Personal, School, Work"
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className={styles.input}>
            <div className={styles.des}>
              <label>Location</label>
              A default location has been pre-selected for convenience, or choose your own
            </div>

            <div className={styles.locationContainer}>
              <div className={styles.pathDisplay}>
                {path ? (
                  <span className={styles.pathText}>
                    {useDefaultLocation && '📁 '}
                    {getDisplayPath(path)}
                  </span>
                ) : (
                  <span className={styles.pathPlaceholder}>Choose a location</span>
                )}
              </div>
              <button
                type="button"
                className={styles.changeLocationBtn}
                onClick={handleClick}
              >
                {path ? 'Change' : 'Choose'}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.buttons}>
          <Link to="/" className={styles.back}>
            ← Back
          </Link>
          <div
            className={`${styles.button} ${useDefaultLocation && path && name ? styles.ready : ''}`}
            onClick={handleSubmit}
          >
            Create
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
