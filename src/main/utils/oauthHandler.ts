import { BrowserWindow, app, protocol } from 'electron';
import { createServer, Server } from 'http';
import { URL } from 'url';
import path from 'path';

let oauthServer: Server | null = null;
const OAUTH_PORT = 3001;

export function setupOAuthHandler(mainWindow: BrowserWindow) {
  // Register deep link protocol for OAuth redirects
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('deepjournal', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('deepjournal');
  }

  // Handle OAuth redirects from external browser
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleOAuthCallback(mainWindow, url);
  });

  // Handle OAuth redirects on Windows/Linux via second instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Check if the second instance was launched with an OAuth callback URL
    const url = commandLine.find((arg) => arg.startsWith('deepjournal://'));
    if (url) {
      handleOAuthCallback(mainWindow, url);
    }
  });

  // Setup local HTTP server for OAuth callbacks as fallback
  setupOAuthServer(mainWindow);
}

function setupOAuthServer(mainWindow: BrowserWindow) {
  if (oauthServer) {
    return; // Server already running
  }

  oauthServer = createServer((req, res) => {
    const url = new URL(req.url || '', `http://localhost:${OAUTH_PORT}`);

    if (url.pathname === '/auth/callback') {
      // OAuth callback received - we need to handle fragments in the browser
      // Send an HTML page that will extract tokens from URL fragments and send them to Electron
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              border-radius: 10px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
            }
            .success { color: #4ade80; font-size: 3rem; margin-bottom: 1rem; }
            .processing { color: #fbbf24; font-size: 3rem; margin-bottom: 1rem; }
            h1 { margin: 0 0 1rem 0; }
            p { margin: 0.5rem 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="processing">⚡</div>
            <h1>Processing Authentication...</h1>
            <p>Please wait while we complete your login.</p>
            <div id="status"></div>
          </div>
          <script>
            // Extract tokens from URL fragments and send to local server
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            const searchParams = new URLSearchParams(window.location.search);

            const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
            const tokenType = hashParams.get('token_type') || searchParams.get('token_type');
            const expiresIn = hashParams.get('expires_in') || searchParams.get('expires_in');
            const error = hashParams.get('error') || searchParams.get('error');
            const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

            console.log('OAuth callback received:', {
              accessToken: accessToken ? 'present' : 'missing',
              refreshToken: refreshToken ? 'present' : 'missing',
              error,
              errorDescription
            });

            if (error) {
              document.querySelector('.processing').innerHTML = '❌';
              document.querySelector('h1').innerHTML = 'Authentication Failed';
              document.querySelector('p').innerHTML = errorDescription || error;
              document.getElementById('status').innerHTML = '<p style="color: #ef4444;">Please try again or contact support.</p>';
            } else if (accessToken) {
              // Send tokens to Electron app via POST request to local server
              fetch('/auth/tokens', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  token_type: tokenType,
                  expires_in: expiresIn
                })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  document.querySelector('.processing').innerHTML = '✓';
                  document.querySelector('.processing').className = 'success';
                  document.querySelector('h1').innerHTML = 'Authentication Successful!';
                  document.querySelector('p').innerHTML = 'You can now close this browser tab and return to Deep Journal.';
                  document.getElementById('status').innerHTML = '<p style="color: #4ade80;">Login completed successfully!</p>';

                  // Auto-close after 2 seconds
                  setTimeout(() => {
                    window.close();
                  }, 2000);
                } else {
                  throw new Error(data.error || 'Failed to process authentication');
                }
              })
              .catch(error => {
                console.error('Error sending tokens:', error);
                document.querySelector('.processing').innerHTML = '❌';
                document.querySelector('h1').innerHTML = 'Authentication Failed';
                document.querySelector('p').innerHTML = 'Failed to process authentication tokens.';
                document.getElementById('status').innerHTML = '<p style="color: #ef4444;">Please try again.</p>';
              });
            } else {
              document.querySelector('.processing').innerHTML = '❌';
              document.querySelector('h1').innerHTML = 'Authentication Failed';
              document.querySelector('p').innerHTML = 'No authentication tokens received.';
              document.getElementById('status').innerHTML = '<p style="color: #ef4444;">Please try the login process again.</p>';
            }
          </script>
        </body>
        </html>
      `);
    } else if (url.pathname === '/auth/tokens' && req.method === 'POST') {
      // Handle token submission from the callback page
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const tokens = JSON.parse(body);
          console.log('Received OAuth tokens from browser - NEW AUTH ATTEMPT:', new Date().toISOString());
          console.log('Token details:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            tokenType: tokens.token_type,
            expiresIn: tokens.expires_in
          });

          // Send tokens to the main window
          if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('Sending tokens to renderer via IPC oauth-tokens channel');
            mainWindow.webContents.send('oauth-tokens', tokens);

            // Bring the main window to focus
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.focus();
            mainWindow.show();
            console.log('Main window focused and shown');
          } else {
            console.error('Main window is not available or destroyed');
          }

          // Send success response
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('Error processing OAuth tokens:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid token data' }));
        }
      });
    } else if (req.method === 'OPTIONS') {
      // Handle CORS preflight
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
    } else {
      // Handle other requests
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  oauthServer.listen(OAUTH_PORT, 'localhost', () => {
    console.log(`OAuth callback server running on http://localhost:${OAUTH_PORT}`);
  });

  oauthServer.on('error', (err) => {
    console.error('OAuth server error:', err);
  });
}

function handleOAuthCallback(mainWindow: BrowserWindow, url: string) {
  console.log('OAuth callback received:', url);

  if (mainWindow && !mainWindow.isDestroyed()) {
    // Send the OAuth callback URL to the renderer process
    mainWindow.webContents.send('oauth-callback', url);

    // Bring the main window to focus
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
  }
}

export function stopOAuthServer() {
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
}

// Clean up on app quit
app.on('before-quit', () => {
  stopOAuthServer();
});
