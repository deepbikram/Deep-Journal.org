import { useEffect, useState } from 'react';
import styles from './DeleteDeepJournal.module.scss';
import { TrashIcon } from 'renderer/icons';
import { Link } from 'react-router-dom';
import { useDeepJournalsContext } from '../../../context/DeepJournalsContext';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export default function DeleteDeepJournal({ deepJournal }) {
  const { deleteDeepJournal } = useDeepJournalsContext();

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button className={styles.deleteButton}>
          <TrashIcon className={styles.icon} />
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.AlertDialogOverlay} />
        <AlertDialog.Content className={styles.AlertDialogContent}>
          <AlertDialog.Title className={styles.AlertDialogTitle}>
            Remove this Deep Journal?
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.AlertDialogDescription}>
            This action removes the <b>{deepJournal.name}</b> Deep Journal from the list, but
            it won't actually delete the Deep Journal's files stored at{' '}
            <b>{deepJournal.path}</b> from your computer.
            <br />
            <br />
            You can delete or backup your Deep Journal folder, or import it back into
            Deep Journal in the future.
          </AlertDialog.Description>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <AlertDialog.Cancel asChild>
              <button className={styles.cancelButton}>Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                className={styles.confirmButton}
                onClick={() => {
                  deleteDeepJournal(deepJournal.name);
                }}
              >
                Yes, remove Journal
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
