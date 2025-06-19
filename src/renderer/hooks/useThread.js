import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDeepJournalsContext } from 'renderer/context/DeepJournalsContext';
import * as fileOperations from '../utils/fileOperations';
import { getPost } from './usePostHelpers';

function useThread() {
  const { getCurrentDeepJournalPath } = useDeepJournalsContext();

  const getThread = useCallback(
    async (parentPostPath) => {
      if (!parentPostPath) return;
      let _thread = [];
      const fullPath = getCurrentDeepJournalPath(parentPostPath);
      if (!fullPath) return;
      const freshPost = await getPost(fullPath);
      const replies = freshPost?.data?.replies || [];
      _thread.push(freshPost);

      for (const replyPath of replies) {
        const path = getCurrentDeepJournalPath(replyPath);
        if (!path) continue;
        const reply = await getPost(path);
        _thread.push(reply);
      }

      return _thread;
    },
    [getCurrentDeepJournalPath]
  );

  return {
    getThread,
  };
}

export default useThread;
