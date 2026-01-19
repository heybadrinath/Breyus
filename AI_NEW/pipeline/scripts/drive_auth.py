"""
Google Drive OAuth Helper

One-time script to obtain OAuth2 refresh token for Google Drive access.

Usage:
    1. Create OAuth 2.0 credentials in Google Cloud Console:
       - Go to https://console.cloud.google.com/apis/credentials
       - Create OAuth 2.0 Client ID (Desktop application)
       - Download client_secret.json or copy Client ID and Secret

    2. Set environment variables:
       export GDRIVE_CLIENT_ID="your-client-id"
       export GDRIVE_CLIENT_SECRET="your-client-secret"

    3. Run this script:
       python -m pipeline.scripts.drive_auth

    4. Follow the browser prompt to authorize
    5. Copy the displayed refresh token to your .env file

Note: This only needs to be run once. The refresh token doesn't expire
unless you revoke it or change the credentials.
"""

from __future__ import annotations

import http.server
import os
import sys
import threading
import urllib.parse
import webbrowser
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

# OAuth endpoints
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"

# Scopes needed for Drive access
SCOPES = [
    "https://www.googleapis.com/auth/drive.file",  # Access files created by the app
]

# Local server for OAuth callback
REDIRECT_PORT = 8090
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}"


class OAuthCallbackHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler to capture OAuth callback."""

    auth_code: Optional[str] = None
    error: Optional[str] = None

    def do_GET(self):
        """Handle GET request from OAuth redirect."""
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            OAuthCallbackHandler.auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"""
                <html>
                <head><title>Authorization Successful</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: green;">Authorization Successful!</h1>
                    <p>You can close this window and return to the terminal.</p>
                </body>
                </html>
            """)
        elif "error" in params:
            OAuthCallbackHandler.error = params.get("error_description", params["error"])[0]
            self.send_response(400)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(f"""
                <html>
                <head><title>Authorization Failed</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: red;">Authorization Failed</h1>
                    <p>Error: {OAuthCallbackHandler.error}</p>
                    <p>Please close this window and try again.</p>
                </body>
                </html>
            """.encode())
        else:
            self.send_response(400)
            self.end_headers()

    def log_message(self, format, *args):
        """Suppress server logs."""
        pass


def get_authorization_url(client_id: str) -> str:
    """Build the OAuth authorization URL."""
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",  # Required for refresh token
        "prompt": "consent",  # Force consent to get refresh token
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(
    code: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """Exchange authorization code for tokens."""
    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI,
        },
    )

    if response.status_code != 200:
        error_data = response.json() if response.content else {}
        error_msg = error_data.get("error_description", response.text)
        raise Exception(f"Failed to exchange code: {error_msg}")

    return response.json()


def run_auth_flow():
    """Run the OAuth authorization flow."""
    print("=" * 60)
    print("Google Drive OAuth Setup")
    print("=" * 60)
    print()

    # Check for credentials
    client_id = os.getenv("GDRIVE_CLIENT_ID")
    client_secret = os.getenv("GDRIVE_CLIENT_SECRET")

    if not client_id:
        print("Error: GDRIVE_CLIENT_ID environment variable not set.")
        print()
        print("To get OAuth credentials:")
        print("1. Go to https://console.cloud.google.com/apis/credentials")
        print("2. Create OAuth 2.0 Client ID (type: Desktop application)")
        print("3. Set GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET environment variables")
        print()
        sys.exit(1)

    if not client_secret:
        print("Error: GDRIVE_CLIENT_SECRET environment variable not set.")
        sys.exit(1)

    # Start local server for callback
    print(f"Starting local server on port {REDIRECT_PORT}...")
    server = http.server.HTTPServer(("localhost", REDIRECT_PORT), OAuthCallbackHandler)
    server_thread = threading.Thread(target=server.handle_request)
    server_thread.start()

    # Open browser for authorization
    auth_url = get_authorization_url(client_id)
    print()
    print("Opening browser for Google authorization...")
    print()
    print("If the browser doesn't open automatically, visit this URL:")
    print(auth_url)
    print()

    webbrowser.open(auth_url)

    # Wait for callback
    print("Waiting for authorization...")
    server_thread.join(timeout=120)  # 2 minute timeout

    if OAuthCallbackHandler.error:
        print(f"\nError: {OAuthCallbackHandler.error}")
        sys.exit(1)

    if not OAuthCallbackHandler.auth_code:
        print("\nError: No authorization code received (timeout?)")
        sys.exit(1)

    print("Authorization code received!")
    print()

    # Exchange code for tokens
    print("Exchanging code for tokens...")
    tokens = exchange_code_for_tokens(
        OAuthCallbackHandler.auth_code,
        client_id,
        client_secret,
    )

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        print("\nWarning: No refresh token in response.")
        print("This may happen if you've already authorized this app.")
        print("Try revoking access at https://myaccount.google.com/permissions")
        print("and running this script again.")
        sys.exit(1)

    # Display results
    print()
    print("=" * 60)
    print("SUCCESS! Add the following to your .env file:")
    print("=" * 60)
    print()
    print(f"GDRIVE_CLIENT_ID={client_id}")
    print(f"GDRIVE_CLIENT_SECRET={client_secret}")
    print(f"GDRIVE_REFRESH_TOKEN={refresh_token}")
    print()
    print("=" * 60)
    print()
    print("IMPORTANT: Keep your refresh token secure!")
    print("Anyone with this token can access your Drive files.")
    print()

    # Also provide the folder ID reminder
    print("-" * 60)
    print("Next step: Get your Drive folder ID")
    print("-" * 60)
    print()
    print("1. Open Google Drive in your browser")
    print("2. Create or navigate to the folder for normalized files")
    print("3. Copy the folder ID from the URL:")
    print("   https://drive.google.com/drive/folders/<FOLDER_ID>")
    print()
    print("4. Add to your .env file:")
    print("   GDRIVE_FOLDER_ID=<your-folder-id>")
    print()


def main():
    """Entry point."""
    try:
        run_auth_flow()
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
