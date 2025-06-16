import { useEffect, useState } from 'react';
import styles from './OpenPileFolder.module.scss';
import { FolderIcon, TrashIcon } from 'renderer/icons';
import { Link } from 'react-router-dom';
import { usePilesContext } from '../../../context/PilesContext';

export default function OpenPileFolder({ pile }) {
  const { deletePile } = usePilesContext();
  const handleClick = () => {
    if (window.electron?.openFolder) {
      window.electron.openFolder(pile.path);
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
