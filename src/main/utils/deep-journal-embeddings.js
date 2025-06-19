const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { walk } = require('../util');
const matter = require('gray-matter');
const settings = require('electron-settings');
const {getKey} = require('../utils/store');

// Todo: Cache the norms alongside embeddings at some point
// to avoid recomputing them for every query
function cosineSimilarity(embedding, queryEmbedding) {
  if (embedding?.length !== queryEmbedding?.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embedding.length; i++) {
    dotProduct += embedding[i] * queryEmbedding[i];
    normA += embedding[i] ** 2;
    normB += queryEmbedding[i] ** 2;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    throw new Error('One of the vectors is zero, cannot compute similarity');
  }

  return dotProduct / (normA * normB);
}

class DeepJournalEmbeddings {
  constructor() {
    this.deepJournalPath = null;
    this.fileName = `embeddings.json`;
    this.apiKey = null;
    this.embeddings = new Map();


  }

  async initialize(deepJournalPath, index) {
    try {
      this.deepJournalPath = deepJournalPath;
      await this.initializeAPIKey();

      if (!this.apiKey) {
        console.log(
          'API key not found. Please set it first to use AI features.'
        );
        return;
      }
      const embeddingsFilePath = path.join(deepJournalPath, this.fileName);
      if (fs.existsSync(embeddingsFilePath)) {
        const data = fs.readFileSync(embeddingsFilePath, 'utf8');
        this.embeddings = new Map(JSON.parse(data));
      } else {
        // Embeddings need to be generated based on the index
        await this.walkAndGenerateEmbeddings(deepJournalPath, index);
        this.saveEmbeddings();
      }
    } catch (error) {
      console.error('Failed to load embeddings:', error);
    }
    return {};
  }

  async initializeAPIKey() {
    const apiKey = await getKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set it first.');
    }
    this.apiKey = apiKey;
  }

  async walkAndGenerateEmbeddings(deepJournalPath, index) {
    console.log('🧮 Generating embeddings for index:', index.size);
    this.embeddings = new Map();
    for (let [entryPath, metadata] of index) {
      this.addDocument(entryPath, metadata);
    }
  }

  saveEmbeddings() {
    try {
      const embeddingsFilePath = path.join(this.deepJournalPath, this.fileName);
      const entries = this.embeddings.entries();
      if (!entries) return;
      let strMap = JSON.stringify(Array.from(entries));
      fs.writeFileSync(embeddingsFilePath, strMap, 'utf8');
    } catch (error) {
      console.error('Failed to save embeddings:', error);
    }
  }

  async addDocument(entryPath, metadata) {
    try {
      // we only index parent documents
      // the replies are concatenated to the contents
      if (metadata.isReply) return;

      let fullPath = path.join(this.deepJournalPath, entryPath);
      let fileContent = fs.readFileSync(fullPath, 'utf8');
      let { content } = matter(fileContent);
      content =
        'Entry on ' + metadata.createdAt + '\n\n' + content + '\n\nReplies:\n';

      // concat the contents of replies
      for (let replyPath of metadata.replies) {
        let replyFullPath = path.join(this.deepJournalPath, replyPath);
        let replyFileContent = fs.readFileSync(replyFullPath, 'utf8');
        let { content: replyContent } = matter(replyFileContent);
        content += '\n' + replyContent;
      }

      try {
        const embedding = await this.generateEmbedding(content);
        this.embeddings.set(entryPath, embedding);
        console.log('🧮 Embeddings created for thread: ', entryPath);
      } catch (embeddingError) {
        console.warn(
          `Failed to generate embedding for thread: ${entryPath}`,
          embeddingError
        );
        // Skip this document and continue with the next one
        return;
      }

      this.saveEmbeddings();
    } catch (error) {
      console.error('Failed to process thread for vector index.', error);
    }
  }

  // todo: based on which ai is configured this should either
  // use ollama, openai, or gemini
  async generateEmbedding(document) {
    const deepJournalAIProvider = await settings.get('deepJournalAIProvider');
    const embeddingModel = await settings.get('embeddingModel');
    const isOllama = deepJournalAIProvider === 'ollama';
    const isGemini = deepJournalAIProvider === 'gemini';

    if (isOllama) {
      const url = 'http://127.0.0.1:11434/api/embed';
      const data = {
        model: 'mxbai-embed-large',
        input: document,
      };
      try {
        const response = await axios.post(url, data);
        const embeddings = response.data.embeddings;
        return response.data.embeddings[0];
      } catch (error) {
        console.error('Error generating embedding with Ollama:', error);
        return null;
      }
    } else if (isGemini) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
      const headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      };
      const data = {
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: document }],
        },
      };

      try {
        const response = await axios.post(url, data, { headers });
        return response.data.embedding.values;
      } catch (error) {
        console.error('Error generating embedding with Gemini:', error);
        return null;
      }
    } else {
      const url = 'https://api.openai.com/v1/embeddings';
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };
      const data = {
        model: 'text-embedding-3-small',
        input: document,
      };

      try {
        const response = await axios.post(url, data, { headers });
        return response.data.data[0].embedding;
      } catch (error) {
        console.error('Error generating embedding with OpenAI:', error);
        return null;
      }
    }
  }

  async regenerateEmbeddings(index) {
    console.log('🧮 Regenerating embeddings for index:', index.size);
    this.embeddings.clear();
    for (let [entryPath, metadata] of index) {
      await this.addDocument(entryPath, metadata);
    }
    this.saveEmbeddings();
    console.log('✅ Embeddings regeneration complete');
  }

  async search(query, topN = 50) {
    const queryEmbedding = await this.generateEmbedding(query);

    if (!queryEmbedding) {
      console.error('Failed to generate query embedding.');
      return [];
    }

    let scores = [];
    this.embeddings.forEach((embedding, entryPath) => {
      let score = cosineSimilarity(embedding, queryEmbedding);
      scores.push({ entryPath, score });
    });

    scores.sort((a, b) => b.score - a.score);
    const topNEntries = scores.slice(0, topN).map((s) => s.entryPath);
    return topNEntries;
  }
}

module.exports = new DeepJournalEmbeddings();
