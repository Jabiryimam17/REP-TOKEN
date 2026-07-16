# GCP Listener Deployment Guide

This guide explains how to set up and run the blockchain event listeners on your GCP EC2 micro-instance.

## Prerequisites

-   GCP EC2 micro-instance (Linux)
-   Node.js installed on the instance (v18+ recommended)
-   Access to your Aiven PostgreSQL database
-   Ethereum RPC URL (e.g., Alchemy, Infura, or your own node)

## Setup Instructions

1.  **Clone the repository or transfer the backend code:**
    You only need the `backend` directory on your GCP instance.
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory (or set them in your environment):
    ```env
    # Aiven PostgreSQL Database Configuration
    DB_HOST=your-aiven-db-host.aivencloud.com
    DB_PORT=your-db-port
    DB_USERNAME=your-db-username
    DB_PASSWORD=your-db-password
    DB_NAME=your-db-name

    # Ethereum Configuration
    SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

    # Other required variables (if any)
    ```

4.  **Run the Listeners:**
    You can run the listeners using the dedicated entry point:
    ```bash
    node listener-entry.js
    ```

## Running as a Persistent Process

To ensure the listeners keep running after you close the SSH session, it's recommended to use a process manager like `pm2`.

1.  **Install PM2:**
    ```bash
    sudo npm install -g pm2
    ```

2.  **Start the listener with PM2:**
    ```bash
    pm2 start listener-entry.js --name blockchain-listener
    ```

3.  **Ensure PM2 starts on boot:**
    ```bash
    pm2 startup
    pm2 save
    ```

## Monitoring

-   View logs: `pm2 logs blockchain-listener`
-   Check status: `pm2 status`

## Architecture Note

-   **Backend (Vercel):** Handles API requests, serves the frontend, and interacts with the database for read/write operations triggered by users.
-   **Listeners (GCP):** Continuously monitor the blockchain for events and sync them to the Aiven PostgreSQL database.
-   **Database (Aiven):** Shared between Vercel and GCP, acting as the single source of truth.
