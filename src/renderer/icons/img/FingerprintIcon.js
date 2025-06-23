import React from 'react';

export const FingerprintIcon = ({ className, ...props }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-1 0-1.5 0-2C6 8.5 8.5 6 12 6s6 2.5 6 4c0 .5 0 1 0 2 0 3 .5 6 1 7.5" />
    <path d="M8 16c0-2 0-4 0-4 0-1 1-2 2-2h4c1 0 2 1 2 2 0 0 0 2 0 4" />
    <path d="M10 20c0-1 0-2 0-3 0-.5.5-1 1-1h2c.5 0 1 .5 1 1 0 1 0 2 0 3" />
  </svg>
);
