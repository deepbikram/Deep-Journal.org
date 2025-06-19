import { useEffect, useState } from 'react';
import styles from './OpenDeepJournalFolder.module.scss';
import { FolderIcon, TrashIcon } from 'renderer/icons';
import { Link } from 'react-router-dom';
import { useDeepJournalsContext } from '../../../context/DeepJournalsContext';

export default function OpenDeepJournalFolder({ deepJournal }) {
  const { deleteDeepJournal } = useDeepJournalsContext();
  const handleClick = () => {
    if (window.electron?.openFolder) {
      window.electron.openFolder(deepJournal.path);
    } else {
      console.warn('Electron not available, cannot open folder');
    }
  };

  return (
    <button className={styles.button} onClick={handleClick}>
      <FolderIcon className={styles.icon} />
    </button>
  );
}
