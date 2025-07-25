import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './VerticalSidebar.module.scss';
import {
  HomeIcon,
  ChatIcon,
  SearchIcon,
  SettingsIcon,
  HelpIcon,
  PersonIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'renderer/icons';
import { useTimelineContext } from 'renderer/context/TimelineContext';

export default function VerticalSidebar() {
  const { isTimelineMinimized, toggleTimelineMinimized, isMaximized, manualToggle } = useTimelineContext();

  // Determine the appropriate icon and title based on current state
  const getTimelineToggleConfig = () => {
    if (manualToggle) {
      // User has manually overridden, show current state
      return {
        icon: isTimelineMinimized ? ChevronRightIcon : ChevronLeftIcon,
        title: isTimelineMinimized ? 'Show Timeline' : 'Hide Timeline'
      };
    } else {
      // Auto mode - show what will happen based on window state
      if (isMaximized) {
        return {
          icon: ChevronLeftIcon,
          title: 'Timeline shown (maximized)'
        };
      } else {
        return {
          icon: ChevronRightIcon,
          title: 'Timeline hidden (windowed)'
        };
      }
    }
  };

  const timelineConfig = getTimelineToggleConfig();

  const sidebarButtons = [
    {
      id: 'timeline-toggle',
      icon: timelineConfig.icon,
      title: timelineConfig.title,
      action: 'timeline-toggle'
    },
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
      id: 'account',
      icon: PersonIcon,
      title: 'Account',
      action: 'trigger',
      selector: '[data-settings-trigger]'
    },
    {
      id: 'help',
      icon: HelpIcon,
      title: 'Help',
      action: 'trigger',
      selector: '[data-help-trigger]'
    }
  ];

  const handleButtonClick = (button) => {
    if (button.action === 'timeline-toggle') {
      toggleTimelineMinimized();
      return;
    }

    if (button.action === 'trigger') {
      // Special handling for account button - trigger settings and set to account section
      if (button.id === 'account') {
        // First trigger the settings dialog
        const settingsElement = document.querySelector('[data-settings-trigger]');
        if (settingsElement) {
          settingsElement.click();

          // Wait for the dialog to open, then set the active section to account
          setTimeout(() => {
            // Dispatch a custom event to set the account section as active
            window.dispatchEvent(new CustomEvent('set-settings-section', {
              detail: { section: 'account' }
            }));
          }, 100);
        }
        return;
      }

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
