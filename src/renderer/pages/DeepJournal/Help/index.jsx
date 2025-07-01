import styles from './Help.module.scss';
import {
  HelpIcon,
  CrossIcon,
  SettingsIcon,
  ChatIcon,
  SearchIcon,
  PersonIcon,
  HomeIcon,
  InfoIcon,
  BookmarkIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  EditIcon,
  RefreshIcon
} from 'renderer/icons';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export default function Help() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const helpSections = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      icon: HomeIcon,
    },
    {
      id: 'writing',
      label: 'Writing & AI',
      icon: EditIcon,
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: ChatIcon,
    },
    {
      id: 'search',
      label: 'Search & Discovery',
      icon: SearchIcon,
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: BookmarkIcon,
    },
    {
      id: 'settings',
      label: 'Settings & Setup',
      icon: SettingsIcon,
    },
    {
      id: 'troubleshooting',
      label: 'Troubleshooting',
      icon: RefreshIcon,
    },
    {
      id: 'about',
      label: 'About',
      icon: InfoIcon,
    },
  ];

  const renderTabNavigation = () => {
    return (
      <div className={styles.tabNavigation}>
        {helpSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className={`${styles.tabItem} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{section.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Getting Started</h3>
              <p className={styles.sectionDescription}>
                Welcome to Deep Journal! Here's everything you need to know to get started.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>What is Deep Journal?</h4>
                <p>
                  Deep Journal is an AI-powered journaling application that helps you reflect on your thoughts,
                  discover patterns, and gain insights from your writing. It combines traditional journaling
                  with artificial intelligence to create a more meaningful and interactive experience.
                </p>
              </div>

              <div className={styles.helpCard}>
                <h4>Creating Your First Entry</h4>
                <ol>
                  <li>Click anywhere in the main text area to start writing</li>
                  <li>Type your thoughts, experiences, or reflections</li>
                  <li>Your entry is automatically saved as you type</li>
                  <li>Use the toolbar for formatting, adding tags, or attaching files</li>
                </ol>
              </div>

              <div className={styles.helpCard}>
                <h4>Key Features Overview</h4>
                <ul>
                  <li><strong>AI Chat:</strong> Have conversations with your journal entries</li>
                  <li><strong>Smart Search:</strong> Find entries using natural language</li>
                  <li><strong>Auto-save:</strong> Never lose your thoughts</li>
                  <li><strong>Privacy First:</strong> Your data stays on your device</li>
                  <li><strong>Themes:</strong> Customize your writing environment</li>
                </ul>
              </div>

              <div className={styles.quickLinks}>
                <h4>Quick Actions</h4>
                <div className={styles.linkGrid}>
                  <button
                    className={styles.quickLink}
                    onClick={() => setActiveSection('writing')}
                  >
                    <EditIcon className={styles.linkIcon} />
                    <span>Learn about writing</span>
                    <ChevronRightIcon className={styles.chevron} />
                  </button>
                  <button
                    className={styles.quickLink}
                    onClick={() => setActiveSection('chat')}
                  >
                    <ChatIcon className={styles.linkIcon} />
                    <span>Try AI chat</span>
                    <ChevronRightIcon className={styles.chevron} />
                  </button>
                  <button
                    className={styles.quickLink}
                    onClick={() => setActiveSection('settings')}
                  >
                    <SettingsIcon className={styles.linkIcon} />
                    <span>Configure AI</span>
                    <ChevronRightIcon className={styles.chevron} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'writing':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Writing & AI</h3>
              <p className={styles.sectionDescription}>
                Learn how to make the most of your writing experience with AI assistance.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>Writing Your Entries</h4>
                <ul>
                  <li>Start typing anywhere in the main editor</li>
                  <li>Use **bold** and *italic* markdown formatting</li>
                  <li>Add links by pasting URLs</li>
                  <li>Attach images by dragging and dropping</li>
                  <li>Entries are automatically saved every few seconds</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>AI Reflections</h4>
                <p>
                  When you finish writing an entry, Deep Journal can provide AI-generated reflections
                  and insights based on your content. These appear as separate AI entries that respond
                  to your thoughts.
                </p>
                <div className={styles.note}>
                  <strong>Note:</strong> You need to configure an AI provider in Settings to use this feature.
                </div>
              </div>

              <div className={styles.helpCard}>
                <h4>Tags and Organization</h4>
                <ul>
                  <li>Add tags to categorize your entries</li>
                  <li>Use #hashtags naturally in your writing</li>
                  <li>Tags help with organization and search</li>
                  <li>Color-code important entries with highlights</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Keyboard Shortcuts</h4>
                <ul>
                  <li><kbd>Cmd/Ctrl + Enter</kbd> - Save current entry</li>
                  <li><kbd>Cmd/Ctrl + K</kbd> - Quick search</li>
                  <li><kbd>Cmd/Ctrl + /</kbd> - Open command palette</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>AI Chat</h3>
              <p className={styles.sectionDescription}>
                Have meaningful conversations with your journal entries using AI.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>Starting a Chat</h4>
                <ol>
                  <li>Click the Chat icon in the sidebar</li>
                  <li>Type your question or prompt</li>
                  <li>The AI will respond based on your journal entries</li>
                  <li>Continue the conversation naturally</li>
                </ol>
              </div>

              <div className={styles.helpCard}>
                <h4>What You Can Ask</h4>
                <ul>
                  <li>"What patterns do you see in my writing?"</li>
                  <li>"Summarize my thoughts from last week"</li>
                  <li>"What advice would you give me based on my entries?"</li>
                  <li>"Help me understand my feelings about [topic]"</li>
                  <li>"What have I learned recently?"</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>How It Works</h4>
                <p>
                  The AI chat feature analyzes your journal entries to provide context-aware responses.
                  It can identify patterns, provide insights, and help you reflect on your thoughts and experiences.
                </p>
                <div className={styles.note}>
                  <strong>Privacy:</strong> Your conversations stay on your device and are not sent to external servers.
                </div>
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Search & Discovery</h3>
              <p className={styles.sectionDescription}>
                Find and rediscover your thoughts with powerful search capabilities.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>Basic Search</h4>
                <ul>
                  <li>Click the Search icon or press <kbd>Cmd/Ctrl + K</kbd></li>
                  <li>Type keywords, phrases, or questions</li>
                  <li>Results are ranked by relevance</li>
                  <li>Click any result to open that entry</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Smart Search Features</h4>
                <ul>
                  <li><strong>Semantic Search:</strong> Find entries by meaning, not just keywords</li>
                  <li><strong>Date Filters:</strong> Search within specific time periods</li>
                  <li><strong>Tag Filtering:</strong> Filter by specific tags or categories</li>
                  <li><strong>AI Insights:</strong> Get AI-generated summaries of search results</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Search Tips</h4>
                <ul>
                  <li>Use natural language: "entries about work stress"</li>
                  <li>Search for emotions: "when I felt happy"</li>
                  <li>Find patterns: "my morning routines"</li>
                  <li>Use quotes for exact phrases: "specific phrase"</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'organization':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Organization</h3>
              <p className={styles.sectionDescription}>
                Keep your journal organized with tags, highlights, and smart categorization.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>Using Tags</h4>
                <ul>
                  <li>Add tags to categorize entries by topic, mood, or activity</li>
                  <li>Use natural hashtags like #work, #family, #goals</li>
                  <li>Tags appear automatically as you type them</li>
                  <li>Filter entries by clicking on tags in the sidebar</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Highlights and Colors</h4>
                <ul>
                  <li>Highlight important entries with colors</li>
                  <li>Use different colors for different types of content</li>
                  <li>Quickly spot important entries in your timeline</li>
                  <li>Filter by highlight color in search</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Timeline View</h4>
                <p>
                  Your entries are automatically organized in chronological order.
                  Use the timeline to browse your journal by date and see your
                  writing patterns over time.
                </p>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Settings & Setup</h3>
              <p className={styles.sectionDescription}>
                Configure Deep Journal to work best for you.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>AI Configuration</h4>
                <p>To enable AI features, you need to configure an AI provider:</p>
                <ol>
                  <li>Open Settings → AI Assistant</li>
                  <li>Choose your preferred AI provider (OpenAI, Gemini, or Ollama)</li>
                  <li>Add your API key or configure local models</li>
                  <li>Customize the AI personality and behavior</li>
                </ol>
              </div>

              <div className={styles.helpCard}>
                <h4>Privacy & Security</h4>
                <ul>
                  <li>Enable PIN or password protection for your journal</li>
                  <li>Configure biometric authentication if available</li>
                  <li>Set session timeout preferences</li>
                  <li>Control data analytics and usage reporting</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Appearance & Themes</h4>
                <ul>
                  <li>Choose from multiple color themes</li>
                  <li>Adjust interface animations</li>
                  <li>Customize the writing environment</li>
                  <li>Configure notification preferences</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Data & Backup</h4>
                <ul>
                  <li>Your data is stored locally on your device</li>
                  <li>Enable automatic updates for new features</li>
                  <li>Export your data for backup purposes</li>
                  <li>Regenerate search index if needed</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Troubleshooting</h3>
              <p className={styles.sectionDescription}>
                Solutions to common issues and problems.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>AI Not Working</h4>
                <ul>
                  <li>Check that you've configured an AI provider in Settings</li>
                  <li>Verify your API key is correct and has sufficient credits</li>
                  <li>Try switching to a different AI provider</li>
                  <li>Check your internet connection for cloud-based AI</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Search Not Finding Results</h4>
                <ul>
                  <li>Try using different keywords or phrases</li>
                  <li>Check that you have entries containing the search terms</li>
                  <li>Regenerate the search index in Settings → Data & Storage</li>
                  <li>Make sure your entries have been saved properly</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Performance Issues</h4>
                <ul>
                  <li>Restart the application</li>
                  <li>Check available storage space on your device</li>
                  <li>Close other applications to free up memory</li>
                  <li>Update to the latest version of Deep Journal</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Installation Problems</h4>
                <p>If you're having trouble installing Deep Journal:</p>
                <ul>
                  <li><strong>macOS:</strong> Right-click the app and select "Open" to bypass security warnings</li>
                  <li><strong>Windows:</strong> Click "More info" then "Run anyway" in SmartScreen warnings</li>
                  <li>Check that you downloaded the correct version for your operating system</li>
                  <li>Temporarily disable antivirus software during installation</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Getting More Help</h4>
                <p>If you're still experiencing issues:</p>
                <ul>
                  <li>Check the GitHub repository for known issues</li>
                  <li>Search existing discussions and bug reports</li>
                  <li>Create a new issue with detailed information</li>
                  <li>Include your operating system and app version</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>About Deep Journal</h3>
              <p className={styles.sectionDescription}>
                Learn more about Deep Journal and its development.
              </p>
            </div>

            <div className={styles.helpContent}>
              <div className={styles.helpCard}>
                <h4>About the Project</h4>
                <p>
                  Deep Journal is an open-source, privacy-focused journaling application that combines
                  traditional writing with artificial intelligence to help you gain deeper insights
                  from your thoughts and experiences.
                </p>
              </div>

              <div className={styles.helpCard}>
                <h4>Key Principles</h4>
                <ul>
                  <li><strong>Privacy First:</strong> Your data stays on your device</li>
                  <li><strong>Open Source:</strong> Transparent development and community-driven</li>
                  <li><strong>AI-Enhanced:</strong> Thoughtful integration of artificial intelligence</li>
                  <li><strong>User-Focused:</strong> Designed for meaningful journaling experiences</li>
                </ul>
              </div>

              <div className={styles.helpCard}>
                <h4>Links & Resources</h4>
                <div className={styles.linkList}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron?.openExternal('https://github.com/deepbikram/Deep-Journal.org');
                    }}
                    className={styles.externalLink}
                  >
                    <span>GitHub Repository</span>
                    <ExternalLinkIcon className={styles.externalIcon} />
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron?.openExternal('https://github.com/deepbikram/Deep-Journal.org/releases');
                    }}
                    className={styles.externalLink}
                  >
                    <span>Latest Releases</span>
                    <ExternalLinkIcon className={styles.externalIcon} />
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron?.openExternal('https://github.com/deepbikram/Deep-Journal.org/issues');
                    }}
                    className={styles.externalLink}
                  >
                    <span>Report Issues</span>
                    <ExternalLinkIcon className={styles.externalIcon} />
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron?.openExternal('https://github.com/deepbikram/Deep-Journal.org/discussions');
                    }}
                    className={styles.externalLink}
                  >
                    <span>Community Discussions</span>
                    <ExternalLinkIcon className={styles.externalIcon} />
                  </a>
                </div>
              </div>

              <div className={styles.helpCard}>
                <h4>Version Information</h4>
                <p>
                  Deep Journal is actively developed and updated. Check the GitHub releases page
                  for the latest version and changelog.
                </p>
              </div>

              <div className={styles.helpCard}>
                <h4>Contributing</h4>
                <p>
                  Deep Journal is open source and welcomes contributions from the community.
                  Whether you're reporting bugs, suggesting features, or contributing code,
                  your help is appreciated.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Help</h3>
              <p className={styles.sectionDescription}>
                Select a section from the navigation to get started.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <div className={styles.iconHolder} data-help-trigger>
          <HelpIcon className={styles.helpIcon} />
        </div>
      </Dialog.Trigger>
      <Dialog.Portal container={document.getElementById('dialog')}>
        <Dialog.Overlay className={styles.DialogOverlay} />
        <Dialog.Content className={styles.DialogContent}>
          <Dialog.Close asChild>
            <button className={styles.closeButton} aria-label="Close">
              <CrossIcon />
            </button>
          </Dialog.Close>

          <div className={styles.helpHeader}>
            <Dialog.Title className={styles.helpTitle}>Help & Documentation</Dialog.Title>
            <Dialog.Description className={styles.helpSubtitle}>
              Learn how to make the most of Deep Journal
            </Dialog.Description>
          </div>

          <div className={styles.helpContainer}>
            <div className={styles.navigationSidebar}>
              {renderTabNavigation()}
            </div>

            <div className={styles.contentArea}>
              {renderContent()}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <span className={styles.footerText}>
                Need more help? Visit our GitHub repository for additional resources.
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
