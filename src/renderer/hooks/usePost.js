import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDeepJournalsContext } from 'renderer/context/DeepJournalsContext';
import * as fileOperations from '../utils/fileOperations';
import { useIndexContext } from 'renderer/context/IndexContext';
import {
  getPost,
  cycleColorCreator,
  tagActionsCreator,
  attachToPostCreator,
  detachFromPostCreator,
  setHighlightCreator,
} from './usePostHelpers';

const highlightColors = [
  'var(--border)',
  'var(--base-yellow)',
  'var(--base-green)',
];

const defaultPost = {
  content: '',
  data: {
    title: '',
    createdAt: null,
    updatedAt: null,
    highlight: null,
    highlightColor: null,
    tags: [],
    replies: [],
    attachments: [],
    isReply: false,
    isAI: false,
  },
};

function usePost(
  postPath = null, // relative path
  {
    isReply = false,
    isAI = false,
    parentPostPath = null, // relative path
    reloadParentPost = () => {},
  } = {}
) {
  const { currentDeepJournal, getCurrentDeepJournalPath } = useDeepJournalsContext();
  const { addIndex, removeIndex, refreshIndex, updateIndex, prependIndex } =
    useIndexContext();
  const [updates, setUpdates] = useState(0);
  const [path, setPath] = useState(); // absolute path
  const [post, setPost] = useState({ ...defaultPost });

  useEffect(() => {
    if (!postPath) return;
    const basePath = getCurrentDeepJournalPath();
    if (!basePath) return;
    const fullPath = window.electron?.joinPath ?
      window.electron.joinPath(basePath, postPath) :
      `${basePath}/${postPath}`;
    setPath(fullPath);
  }, [postPath, currentDeepJournal]);

  useEffect(() => {
    if (!path) return;
    refreshPost();
  }, [path]);

  const refreshPost = useCallback(async () => {
    if (!path) return;
    const freshPost = await getPost(path);
    setPost(freshPost);
  }, [path]);

  const savePost = useCallback(
    async (dataOverrides) => {
      console.time('post-time');

      const saveToPath = path
        ? path
        :        fileOperations.getFilePathForNewPost(currentDeepJournal.path);
      const directoryPath = fileOperations.getDirectoryPath(saveToPath);
      const now = new Date().toISOString();
      const content = post.content;
      const data = {
        ...post.data,
        isAI: post.data.isAI === true ? post.data.isAI : isAI,
        isReply: post.data.createdAt ? post.data.isReply : isReply,
        createdAt: post.data.createdAt ?? now,
        updatedAt: now,
        ...dataOverrides,
      };

      try {
        const fileContents = await fileOperations.generateMarkdown(
          content,
          data
        );

        await fileOperations.createDirectory(directoryPath);
        await fileOperations.saveFile(saveToPath, fileContents);

        if (isReply) {
          await addReplyToParent(parentPostPath, saveToPath);
        }

        const pathSeparator = window.electron?.pathSeparator || '/';
        const postRelativePath = saveToPath.replace(
          getCurrentDeepJournalPath() + pathSeparator,
          ''
        );
        prependIndex(postRelativePath, data); // Add the file to the index
        addIndex(postRelativePath, parentPostPath); // Add the file to the index
        if (window.electron?.ipc?.invoke) {
          window.electron.ipc.invoke('tags-sync', saveToPath); // Sync tags
        }
        console.timeEnd('post-time');
      } catch (error) {
        console.error(`Error writing file: ${saveToPath}`);
        console.error(error);
      }
    },
    [path, post, reloadParentPost]
  );

  const addReplyToParent = async (parentPostPath, replyPostPath) => {
    const relativeReplyPath = window.electron?.joinPath ?
      window.electron.joinPath(...replyPostPath.split(/[/\\]/).slice(-3)) :
      replyPostPath.split(/[/\\]/).slice(-3).join('/');
    const fullParentPostPath = getCurrentDeepJournalPath(parentPostPath);
    if (!fullParentPostPath) return;
    const parentPost = await getPost(fullParentPostPath);
    const content = parentPost.content;
    const data = {
      ...parentPost.data,
      replies: [...parentPost.data.replies, relativeReplyPath],
    };
    const fileContents = await fileOperations.generateMarkdown(content, data);
    await fileOperations.saveFile(fullParentPostPath, fileContents);
    updateIndex(parentPostPath, data);
    reloadParentPost(parentPostPath);
  };

  const deletePost = useCallback(async () => {
    if (!postPath) return null;
    const fullPostPath = getCurrentDeepJournalPath(postPath);
    if (!fullPostPath) return null;

    // if reply, remove from parent
    if (post.data.isReply && parentPostPath) {
      const fullParentPostPath = getCurrentDeepJournalPath(parentPostPath);
      if (!fullParentPostPath) return null;
      const parentPost = await getPost(fullParentPostPath);
      const content = parentPost.content;
      const newReplies = parentPost.data.replies.filter((p) => {
        return p !== postPath;
      });
      const data = {
        ...parentPost.data,
        replies: newReplies,
      };
      const fileContents = await fileOperations.generateMarkdown(content, data);
      await fileOperations.saveFile(fullParentPostPath, fileContents);
      await reloadParentPost();
    }

    // delete file and remove from index
    await fileOperations.deleteFile(fullPostPath);
    removeIndex(postPath);
  }, [postPath, reloadParentPost, parentPostPath, post]);

  const postActions = useMemo(
    () => ({
      setContent: (content) => setPost((post) => ({ ...post, content })),
      updateData: (data) =>
        setPost((post) => ({ ...post, data: { ...post.data, ...data } })),
      cycleColor: cycleColorCreator(post, setPost, savePost, highlightColors),
      setHighlight: setHighlightCreator(post, setPost, savePost),
      addTag: tagActionsCreator(setPost, 'add'),
      removeTag: tagActionsCreator(setPost, 'remove'),
      attachToPost: attachToPostCreator(setPost, getCurrentDeepJournalPath),
      detachFromPost: detachFromPostCreator(setPost, getCurrentDeepJournalPath),
      resetPost: () => setPost(defaultPost),
    }),
    [post]
  );

  return {
    defaultPost,
    post,
    savePost,
    refreshPost,
    deletePost,
    ...postActions,
  };
}

export default usePost;
