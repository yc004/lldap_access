# LLDAP Management System

A comprehensive user management system for [LLDAP](https://github.com/lldap/lldap), featuring a self-service portal for users and an administration console.

## Features

*   **Self-Service Portal**:
    *   User Login (LDAP authentication).
    *   Profile Management (Update display name, email).
    *   Password Change (Securely via LDAP).
    *   Two-Factor Authentication (TOTP/Google Authenticator).
    *   Activity Logs.
*   **Admin Console**:
    *   User Management (Create, Read, Update, Delete).
    *   Batch User Import via CSV.
    *   Advanced Search.
*   **Secure Setup**:
    *   Web-based initial configuration wizard.
    *   Encrypted storage of sensitive credentials (LDAP bind password, JWT secrets).
    *   No hardcoded secrets in environment files.

## Prerequisites

*   **Docker** & **Docker Compose**
*   An existing running instance of **LLDAP**.

## Deployment

### 1. Docker Compose (Recommended)

1.  Clone this repository.
2.  Ensure your LLDAP server is running and accessible.
3.  Run the application using Docker Compose:

    ```bash
    docker-compose up -d --build
    ```

4.  Access the application in your browser at: `http://localhost:8080` (or your server's IP).

### 2. Initial Configuration

Upon first launch, you will be redirected to the **Setup Page**. You need to provide:

*   **LDAP Settings**:
    *   **URL**: `ldap://<your-lldap-ip>:3890` (Do not use `localhost` if running in Docker, use the host IP or network alias).
    *   **Bind DN**: e.g., `cn=admin,ou=people,dc=example,dc=com`
    *   **Password**: Your LLDAP admin password.
    *   **Base DN**: e.g., `dc=example,dc=com`
*   **LLDAP Management Settings**:
    *   **Base URL**: `http://<your-lldap-ip>:17170`
    *   **Admin Username**: `admin`
    *   **Admin Password**: Your LLDAP admin password.

Once configured, the system will encrypt and store these settings locally in `server/data`.

## Development

### Project Structure

*   `client/`: React frontend (Vite + TailwindCSS + DaisyUI).
*   `server/`: Node.js/Express backend (TypeScript).

### Local Setup

1.  Install dependencies:
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

2.  Start development servers:
    ```bash
    npm start
    ```
    This runs both client (port 5173) and server (port 3000) concurrently.

## Security Note

*   Configuration data is stored in `server/data/db.json` and `server/data/master.key`.
*   **IMPORTANT**: Ensure the `server/data` directory is **backed up** but **NEVER committed** to version control if it contains production keys. The provided `.gitignore` already excludes this directory.

## License

MIT
