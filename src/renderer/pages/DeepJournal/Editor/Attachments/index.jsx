import styles from './Attachments.module.scss';
import { useCallback, useState, useEffect } from 'react';
import { DiscIcon, PhotoIcon, TrashIcon, TagIcon } from 'renderer/icons';
import { motion } from 'framer-motion';
import { useDeepJournalsContext } from 'renderer/context/DeepJournalsContext';

const Attachments = ({
  post,
  onRemoveAttachment = () => {},
  editable = false,
}) => {
  const { getCurrentDeepJournalPath } = useDeepJournalsContext();

  if (!post) return;

  const deepJournalPath = getCurrentDeepJournalPath();
  if (!deepJournalPath) return null;

  return post.data.attachments.map((attachment) => {
    const image_exts = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
    const extension = attachment.split('.').pop();
    const sep = window.electron?.pathSeparator || '/';
    // Construct the correct path for the local protocol
    const imgPath = `local://${deepJournalPath}${sep}${attachment}`;

    if (image_exts.includes(extension)) {
      return (
        <motion.div
          key={attachment}
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 0, scale: 0.9 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.image}>
            {editable && (
              <div
                className={styles.remove}
                onClick={() => onRemoveAttachment(attachment)}
              >
                <TrashIcon className={styles.icon} />
              </div>
            )}
            <div className={styles.holder}>
              <img src={imgPath} draggable="false" />
            </div>
          </div>
        </motion.div>
      );
    }
  });
};

export default Attachments;
