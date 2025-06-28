import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './VerticalSidebar.module.scss';
import {
  HomeIcon,
  ChatIcon,
  SearchIcon,
  SettingsIcon,
  HelpIcon,
  PersonIcon
} from 'renderer/icons';

export default function VerticalSidebar() {
  const sidebarButtons = [
    {
      id: 'home',
      icon: HomeIcon,
      title: 'Home',
      action: 'link',
      path: '/'
    },
    {
      id: 'chat',
      icon: ChatIcon,
      title: 'Chat',
      action: 'trigger',
      selector: '[data-chat-trigger]'
    },
    {
      id: 'search',
      icon: SearchIcon,
      title: 'Search',
      action: 'trigger',
      selector: '[data-search-trigger]'
    },
    {
      id: 'settings',
      icon: SettingsIcon,
      title: 'Settings',
      action: 'trigger',
      selector: '[data-settings-trigger]'
    },
    {
      id: 'profile',
      icon: PersonIcon,
      title: 'Profile',
      action: 'disabled'
    },
    {
      id: 'help',
      icon: HelpIcon,
      title: 'Help',
      action: 'disabled'
    }
  ];

  const handleButtonClick = (button) => {
    if (button.action === 'trigger') {
      // Try multiple strategies to find and trigger the existing header button
      const selectors = [
        button.selector, // Primary selector with data attribute
        `[data-radix-collection-item][role="button"]`, // Radix UI pattern
        '.iconHolder', // Generic icon holder class
        `button:has(svg)`, // Button containing SVG
      ];

      let triggered = false;

      // Strategy 1: Direct selector matching
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Check if this element contains the right icon
          const iconElement = element.querySelector(`.${button.id}Icon, [class*="${button.id}"]`);
          if (iconElement || element.getAttribute('data-' + button.id + '-trigger') !== null) {
            element.click();
            triggered = true;
            break;
          }
        }
        if (triggered) break;
      }

      // Strategy 2: Text-based fallback
      if (!triggered) {
        const allButtons = document.querySelectorAll('button, [role="button"], .iconHolder');
        for (const btn of allButtons) {
          const title = btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
          if (title.toLowerCase().includes(button.title.toLowerCase())) {
            btn.click();
            triggered = true;
            break;
          }
        }
      }

      // Strategy 3: Icon class fallback
      if (!triggered) {
        const iconSelectors = [
          `.${button.icon.name.replace('Icon', '').toLowerCase()}Icon`,
          `[class*="${button.title.toLowerCase()}"]`,
          `svg[class*="${button.title.toLowerCase()}"]`
        ];

        for (const iconSelector of iconSelectors) {
          const iconElement = document.querySelector(iconSelector);
          if (iconElement) {
            // Find the closest clickable parent
            let clickableParent = iconElement.closest('button, [role="button"], .iconHolder');
            if (clickableParent) {
              clickableParent.click();
              triggered = true;
              break;
            }
          }
        }
      }

      if (!triggered) {
        console.warn(`Could not find target button for ${button.title}`);
      }
    }
  };

  const renderButton = (button) => {
    const Icon = button.icon;

    if (button.action === 'link') {
      return (
        <Link
          key={button.id}
          to={button.path}
          className={styles.buttonItem}
          title={button.title}
        >
          <div className={styles.iconWrapper}>
            <Icon className={styles.icon} />
          </div>
        </Link>
      );
    }

    return (
      <button
        key={button.id}
        className={`${styles.buttonItem} ${button.action === 'disabled' ? styles.disabled : ''}`}
        onClick={() => handleButtonClick(button)}
        title={button.title}
        disabled={button.action === 'disabled'}
        type="button"
        aria-label={button.title}
      >
        <div className={styles.iconWrapper}>
          <Icon className={styles.icon} />
        </div>
      </button>
    );
  };

  return (
    <div className={styles.verticalSidebar}>
      <div className={styles.buttonContainer}>
        {sidebarButtons.map(renderButton)}
      </div>
    </div>
  );
}
