const fs = require('fs');
const path = require('path');

class DeepJournalLinks {
  constructor() {
    this.fileName = 'links.json';
    this.deepJournalPath = null;
    this.links = new Map();
  }

  resetIndex() {
    this.links.clear();
  }

  load(deepJournalPath) {
    if (!deepJournalPath) return;

    // skip loading
    if (deepJournalPath === this.deepJournalPath) {
      return;
    }

    // a different deep journal is being loaded
    if (deepJournalPath !== this.deepJournalPath) {
      this.resetIndex();
    }

    this.deepJournalPath = deepJournalPath;
    const linksFilePath = path.join(this.deepJournalPath, this.fileName);

    if (fs.existsSync(linksFilePath)) {
      const data = fs.readFileSync(linksFilePath);
      const loadedIndex = new Map(JSON.parse(data));
      this.links = loadedIndex;

      return loadedIndex;
    } else {
      this.save();
      return this.links;
    }
  }

  get(deepJournalPath, url) {
    if (deepJournalPath !== this.deepJournalPath) {
      this.load(deepJournalPath);
    }
    return this.links.get(url);
  }

  set(deepJournalPath, url, data) {
    if (deepJournalPath !== this.deepJournalPath) {
      this.load(deepJournalPath);
    }

    this.links.set(url, data);
    this.save();

    return this.links;
  }

  save() {
    if (!this.deepJournalPath) return;
    if (!fs.existsSync(this.deepJournalPath)) {
      fs.mkdirSync(this.deepJournalPath, { recursive: true });
    }

    const filePath = path.join(this.deepJournalPath, this.fileName);
    const entries = this.links.entries();

    if (!entries) return;

    let strMap = JSON.stringify(Array.from(entries));
    fs.writeFileSync(filePath, strMap);
  }
}

module.exports = new DeepJournalLinks();
