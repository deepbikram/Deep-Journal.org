import React, { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import styles from './AISettingTabs.module.scss';
import { useAIContext } from 'renderer/context/AIContext';
import {
  useDeepJournalsContext,
  availableThemes,
} from 'renderer/context/DeepJournalsContext';
import { CardIcon, OllamaIcon, BoxOpenIcon, GeminiIcon } from 'renderer/icons';
import { useIndexContext } from 'renderer/context/IndexContext';

export default function AISettingTabs({ APIkey, setCurrentKey }) {
  const {
    prompt,
    setPrompt,
    updateSettings,
    setBaseUrl,
    getKey,
    setKey,
    deleteKey,
    model,
    setModel,
    embeddingModel,
    setEmbeddingModel,
    ollama,
    baseUrl,
    deepJournalAIProvider,
    setDeepJournalAIProvider,
  } = useAIContext();

  const { currentTheme, setTheme } = useDeepJournalsContext();

  const handleTabChange = (newValue) => {
    setDeepJournalAIProvider(newValue);
  };

  const handleInputChange = (setter) => (e) => setter(e.target.value);

  const renderThemes = () => {
    return Object.entries(availableThemes).map(([theme, colors]) => (
      <button
        key={`theme-${theme}`}
        className={`${styles.theme} ${
          currentTheme === theme ? styles.current : ''
        }`}
        onClick={() => setTheme(theme)}
      >
        <div
          className={styles.color1}
          style={{ background: colors.primary }}
        ></div>
      </button>
    ));
  };

  return (
    <Tabs.Root
      className={styles.tabsRoot}
      defaultValue="gemini"
      value={deepJournalAIProvider}
      onValueChange={handleTabChange}
    >
      <Tabs.List className={styles.tabsList} aria-label="Manage your account">
        <Tabs.Trigger
          className={`${styles.tabsTrigger} ${
            deepJournalAIProvider === 'gemini' ? styles.activeLeft : ''
          } ${deepJournalAIProvider === 'ollama' ? styles.activeCenter : ''} ${deepJournalAIProvider === 'openai' ? styles.activeRight : ''}`}
          value="subscription"
        >
          Subscription
          <CardIcon className={styles.icon} />
        </Tabs.Trigger>
        <Tabs.Trigger
          className={`${styles.tabsTrigger} ${
            deepJournalAIProvider === 'subscription' ? styles.activeLeft : ''
          } ${deepJournalAIProvider === 'gemini' ? styles.activeCenter : ''} ${deepJournalAIProvider === 'openai' ? styles.activeRight : ''}`}
          value="gemini"
        >
          Gemini API
          <GeminiIcon className={styles.icon} />
        </Tabs.Trigger>
        <Tabs.Trigger
          className={`${styles.tabsTrigger} ${
            deepJournalAIProvider === 'subscription' ? styles.activeLeft : ''
          } ${deepJournalAIProvider === 'gemini' ? styles.activeCenter : ''} ${deepJournalAIProvider === 'openai' ? styles.activeRight : ''}`}
          value="ollama"
        >
          Ollama API
          <OllamaIcon className={styles.icon} />
        </Tabs.Trigger>
        <Tabs.Trigger
          className={`${styles.tabsTrigger} ${
            deepJournalAIProvider === 'gemini' ? styles.activeLeft : ''
          } ${deepJournalAIProvider === 'ollama' ? styles.activeCenter : ''}`}
          value="openai"
        >
          OpenAI API
          <BoxOpenIcon className={styles.icon} />
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content className={styles.tabsContent} value="subscription">
        <div className={styles.providers}>
          <div className={styles.pitch}>
            One simple subscription to use best-in-class AI with Deep Journal, and
            support the project.
          </div>
          <div>
            <div className={styles.pro}>
              <div className={styles.left}>
                <div className={styles.price}>$9/month</div>
              </div>
              <div className={styles.right}>
                <div className={styles.subscribe}>Coming soon!</div>
              </div>
            </div>
            <div className={styles.disclaimer}>
              AI subscription is provided separately by{' '}
              <a href="https://deepbikram.com.np" target="_blank">
                Deep Journal.
              </a>
              <br></br>
               Subject to availability and capacity limits. Fair-use policy
              applies.
            </div>
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content className={styles.tabsContent} value="ollama">
        <div className={styles.providers}>
          <div className={styles.pitch}>
            Setup Ollama and set your preferred models here to use your local AI
            in Deep Journal.
          </div>

          <div className={styles.group}>
            <fieldset className={styles.fieldset}>
              <label className={styles.label} htmlFor="ollama-model">
                Model
              </label>
              <input
                id="ollama-model"
                className={styles.input}
                onChange={handleInputChange(setModel)}
                value={model}
                defaultValue="llama3.1:70b"
                placeholder="llama3.1:70b"
              />
            </fieldset>
            <fieldset className={styles.fieldset}>
              <label className={styles.label} htmlFor="ollama-embedding-model">
                Embedding model
              </label>
              <input
                id="ollama-embedding-model"
                className={styles.input}
                onChange={handleInputChange(setEmbeddingModel)}
                value={embeddingModel}
                defaultValue="mxbai-embed-large"
                placeholder="mxbai-embed-large"
                disabled
              />
            </fieldset>
          </div>

          <div className={styles.disclaimer}>
            Ollama is the easiest way to run AI models on your own computer.
            Remember to pull your models in Ollama before using them in Deep Journal.
            Learn more and download Ollama from{' '}
            <a href="https://ollama.com" target="_blank">
              ollama.com
            </a>
            .
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content className={styles.tabsContent} value="gemini">
        <div className={styles.providers}>
          <div className={styles.pitch}>
            Create an API key in your Google AI Studio account and paste it here to start
            using Gemini 1.5 Pro models in Deep Journal.
          </div>

          <div className={styles.group}>
            <fieldset className={styles.fieldset}>
              <label className={styles.label} htmlFor="gemini-model">
                Model
              </label>
              <input
                id="gemini-model"
                className={styles.input}
                onChange={handleInputChange(setModel)}
                value={model}
                placeholder="gemini-1.5-pro"
                              />
            </fieldset>
          </div>
          <fieldset className={styles.fieldset}>
            <label className={styles.label} htmlFor="gemini-api-key">
              Gemini API key
            </label>
            <input
              id="gemini-api-key"
              className={styles.input}
              onChange={handleInputChange(setCurrentKey)}
              value={APIkey}
              placeholder="Paste a Gemini API key to enable AI reflections"
            />
          </fieldset>
          <div className={styles.disclaimer}>
            Get your free Gemini API key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank">
              Google AI Studio
            </a>
            . Remember to manage your spend by setting up quotas and limits.
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content className={styles.tabsContent} value="openai">
        <div className={styles.providers}>
          <div className={styles.pitch}>
            Create an API key in your OpenAI account and paste it here to start
            using GPT AI models in Deep Journal.
          </div>

          <div className={styles.group}>
            <fieldset className={styles.fieldset}>
              <label className={styles.label} htmlFor="openai-base-url">
                Base URL
              </label>
              <input
                id="openai-base-url"
                className={styles.input}
                onChange={handleInputChange(setBaseUrl)}
                value={baseUrl}
                placeholder="https://api.openai.com/v1"
              />
            </fieldset>
            <fieldset className={styles.fieldset}>
              <label className={styles.label} htmlFor="openai-model">
                Model
              </label>
              <input
                id="openai-model"
                className={styles.input}
                onChange={handleInputChange(setModel)}
                value={model}
                placeholder="gpt-4o"
              />
            </fieldset>
          </div>
          <fieldset className={styles.fieldset}>
            <label className={styles.label} htmlFor="openai-api-key">
              OpenAI API key
            </label>
            <input
              id="openai-api-key"
              className={styles.input}
              onChange={handleInputChange(setCurrentKey)}
              value={APIkey}
              placeholder="Paste an OpenAI API key to enable AI reflections"
            />
          </fieldset>
          <div className={styles.disclaimer}>
            Remember to manage your spend by setting up a budget in the API
            service you choose to use.
          </div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}
