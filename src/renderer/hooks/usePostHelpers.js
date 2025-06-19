import {
  generateMarkdown,
  createDirectory,
  saveFile,
  deleteFile,
  getFilePathForNewPost,
  getDirectoryPath,
} from '../utils/fileOperations';

export const getPost = async (postPath) => {
  try {
    if (!postPath) return;
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, cannot get post');
      return;
    }
    const fileContent = await window.electron.ipc.invoke('get-file', postPath);
    const parsed = await window.electron.ipc.invoke(
      'matter-parse',
      fileContent
    );
    const post = { content: parsed.content, data: parsed.data };
    return post;
  } catch (error) {
    // TODO: check and cleanup after these files
  }
};

export const attachToPostCreator =
  (setPost, getCurrentDeepJournalPath) => async (imageData, fileExtension) => {
    const storePath = getCurrentDeepJournalPath();
    if (!storePath) return;

    let newAttachments = [];
    if (imageData) {
      // save image data to a file
      if (!window.electron?.ipc?.invoke) {
        console.warn('Electron IPC not available, cannot save file');
        return;
      }
      const newFilePath = await window.electron.ipc.invoke('save-file', {
        fileData: imageData,
        fileExtension: fileExtension,
        storePath: storePath,
      });

      if (newFilePath) {
        newAttachments.push(newFilePath);
      } else {
        console.error('Failed to save the pasted image.');
      }
    } else {
      if (!window.electron?.ipc?.invoke) {
        console.warn('Electron IPC not available, cannot open file');
        return;
      }
      newAttachments = await window.electron.ipc.invoke('open-file', {
        storePath: storePath,
      });
    }
    // Attachments are stored relative to the base path from the
    // base directory of the deep journal
    const correctedPaths = newAttachments.map((path) => {
      const pathArr = path.split(/[/\\]/).slice(-4);
      if (!window.electron?.joinPath) {
        // Fallback path join
        return pathArr.join('/');
      }
      const newPath = window.electron.joinPath(...pathArr);

      return newPath;
    });

    setPost((post) => {
      const attachments = [...correctedPaths, ...post.data.attachments];
      const newPost = {
        ...post,
        data: { ...post.data, attachments },
      };

      return newPost;
    });
  };

export const detachFromPostCreator =
  (setPost, getCurrentDeepJournalPath) => (attachmentPath) => {
    setPost((post) => {
      let newPost = JSON.parse(JSON.stringify(post));
      const newAtt = newPost.data.attachments.filter(
        (a) => a !== attachmentPath
      );

      newPost.data.attachments = newAtt;

      const basePath = getCurrentDeepJournalPath();
      if (!basePath) return newPost;

      const fullPath = window.electron?.joinPath ?
        window.electron.joinPath(basePath, attachmentPath) :
        `${basePath}/${attachmentPath}`;

      if (window.electron?.deleteFile) {
        window.electron.deleteFile(fullPath, (err) => {
          if (err) {
            console.error('There was an error:', err);
          } else {
            console.log('File was deleted successfully');
          }
        });
      } else {
        console.warn('Electron not available, cannot delete file');
      }

      console.log('Attachment removed', attachmentPath);

      return newPost;
    });
  };

export const tagActionsCreator = (setPost, action) => {
  return (tag) => {
    setPost((post) => {
      if (action === 'add' && !post.data.tags.includes(tag)) {
        return {
          ...post,
          data: {
            ...post.data,
            tags: [...post.data.tags, tag],
          },
        };
      }
      if (action === 'remove' && post.data.tags.includes(tag)) {
        return {
          ...post,
          data: {
            ...post.data,
            tags: post.data.tags.filter((t) => t !== tag),
          },
        };
      }
      return post;
    });
  };
};

export const setHighlightCreator = (post, setPost, savePost) => {
  return (highlight) => {
    setPost((post) => ({
      ...post,
      data: { ...post.data, highlight: highlight },
    }));
    savePost({ highlight: highlight });
  };
};

export const cycleColorCreator = (post, setPost, savePost, highlightColors) => {
  return () => {
    if (!post.data.highlightColor) {
      const newColor = highlightColors[1];
      setPost((post) => ({
        ...post,
        data: { ...post.data, highlightColor: newColor },
      }));
      savePost({ highlightColor: newColor });
      return;
    }
    const currentColor = post.data.highlightColor;
    const currentIndex = highlightColors.findIndex(
      (color) => color === currentColor
    );
    const nextIndex = (currentIndex + 1) % highlightColors.length;
    const nextColor = highlightColors[nextIndex];

    setPost((post) => ({
      ...post,
      data: { ...post.data, highlightColor: nextColor },
    }));
    savePost({ highlightColor: nextColor });
  };
};
