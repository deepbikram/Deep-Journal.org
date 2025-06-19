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
    const extension = attachment.split('.').pop()?.toLowerCase();

    // Construct the absolute path for the local protocol
    // The attachment is already a relative path from the deep journal base
    let absolutePath;
    if (window.electron?.joinPath) {
      absolutePath = window.electron.joinPath(deepJournalPath, attachment);
    } else {
      const sep = window.electron?.pathSeparator || '/';
      absolutePath = `${deepJournalPath}${sep}${attachment}`;
    }

    const imgPath = `local://${absolutePath}`;

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
              <img
                src={imgPath}
                draggable="false"
                onError={(e) => {
                  console.error('Image failed to load:', imgPath);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', imgPath);
                }}
              />
            </div>
          </div>
        </motion.div>
      );
    }
  });
};

export default Attachments;
