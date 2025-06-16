const postFormat = {
  title: '',
  content: null,
  createdAt: null,
  updatedAt: null,
  attachments: [],
  color: null,
  area: null,
  tags: [],
  replies: [],
  isReply: false,
  isAI: false,
};

const getDirectoryPath = (filePath) => {
  if (!window.electron?.joinPath) {
    console.warn('Electron not available, using fallback path operations');
    // Fallback path operation
    const pathArr = filePath.split(/[/\\]/);
    pathArr.pop();
    return pathArr.join('/');
  }

  const isAbsolute = filePath.startsWith('/');
  const pathArr = filePath.split(/[/\\]/);
  pathArr.pop();
  let directoryPath = window.electron.joinPath(...pathArr);

  if (isAbsolute && !directoryPath.startsWith('/')) {
    directoryPath = '/' + directoryPath;
  }

  return directoryPath;
};

const getFormattedTimestamp = () => {
  const currentDate = new Date();

  const year = String(currentDate.getFullYear()).slice(-2);
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.md`;

  return fileName;
};

const getFilePathForNewPost = (basePath, timestamp = new Date()) => {
  if (!window.electron?.joinPath) {
    console.warn('Electron not available, using fallback path operations');
    // Fallback path operation
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString();
    const fileName = getFormattedTimestamp();
    return `${basePath}/${year}/${month}/${fileName}`;
  }

  const date = new Date();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString();
  const fileName = getFormattedTimestamp();
  const path = window.electron.joinPath(basePath, year, month, fileName);

  return path;
};

const createDirectory = (directoryPath) => {
  if (!window.electron?.mkdir) {
    console.warn('Electron not available, cannot create directory');
    return Promise.reject('Electron not available');
  }
  return window.electron.mkdir(directoryPath);
};

const getFiles = async (dir) => {
  if (!window.electron?.getFiles) {
    console.warn('Electron not available, cannot get files');
    return [];
  }
  const files = await window.electron.getFiles(dir);
  return files;
};

const saveFile = (path, file) => {
  return new Promise((resolve, reject) => {
    if (!window.electron?.writeFile) {
      console.warn('Electron not available, cannot save file');
      reject('Electron not available');
      return;
    }
    window.electron.writeFile(path, file, (err) => {
      if (err) {
        console.error('Error writing to file.', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    if (!window.electron?.deleteFile) {
      console.warn('Electron not available, cannot delete file');
      reject('Electron not available');
      return;
    }
    window.electron.deleteFile(path, (err) => {
      if (err) {
        console.error('Error deleting file.', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const generateMarkdown = (content, data) => {
  if (!window.electron?.ipc?.invoke) {
    console.warn('Electron IPC not available, cannot generate markdown');
    return Promise.resolve('');
  }
  return window.electron.ipc.invoke('matter-stringify', { content, data });
};

export {
  postFormat,
  createDirectory,
  saveFile,
  deleteFile,
  getFiles,
  getDirectoryPath,
  getFilePathForNewPost,
  generateMarkdown,
};
