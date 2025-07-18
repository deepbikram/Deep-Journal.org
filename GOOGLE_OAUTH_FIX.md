# Google OAuth Configuration Fix

## Issue
Google OAuth Error 400: redirect_uri_mismatch

The redirect URI configured in Google Cloud Console doesn't match what Supabase expects.

## Root Cause
Your Google OAuth application in Google Cloud Console is not configured with the correct redirect URIs for Supabase.

## Solution

### 1. Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID (the one you're using for Deep Journal)

### 2. Update Authorized Redirect URIs
Add these URIs to your OAuth client's "Authorized redirect URIs":

**Required URI:**
```
https://pldjgkcisnddmzndyqbb.supabase.co/auth/v1/callback
```

**Optional Development URIs (if testing locally):**
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### 3. Save Changes
- Click "Save" in Google Cloud Console
- Changes may take a few minutes to propagate

### 4. Test the Fix
1. Restart your Deep Journal application
2. Try Google sign-in again
3. The OAuth flow should now work correctly

## Technical Details

Your Supabase project URL is: `https://pldjgkcisnddmzndyqbb.supabase.co`
The OAuth callback path is always: `/auth/v1/callback`

So the complete redirect URI that Google needs to allow is:
`https://pldjgkcisnddmzndyqbb.supabase.co/auth/v1/callback`

## Alternative Solutions

If you don't have access to the Google Cloud Console:

1. **Create a new Google OAuth application** with the correct redirect URI
2. **Update your Supabase project** with the new Google OAuth credentials
3. **Contact the original developer** to update the Google Cloud Console settings

## Verification

After making the changes, you should:
1. See the Google OAuth consent screen instead of the error
2. Be able to complete the authentication flow
3. Get redirected back to your application successfully
