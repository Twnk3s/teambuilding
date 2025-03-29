# TeamVote - Team Building Destination Voting App

A full-stack web application allowing company employees to browse and vote on potential team-building destinations. Admins can manage the destinations via a dedicated dashboard.

**Features:**

*   Corporate/minimalistic, mobile-responsive design.
*   User Authentication (Email/Password) with JWT.
*   Role-based access control (Admin vs. Employee).
*   **Admin Dashboard:** Add, Edit, Delete destinations (Name, Description, Location, Cost, Image URL).
*   **Employee Interface:** View destination cards, vote once per user, see real-time vote counts (after refresh/vote).
*   Backend API built with Node.js, Express, Mongoose.
*   Frontend built with React (using Create React App).
*   Database hosted on MongoDB Atlas (Free Tier).

## Tech Stack

*   **Frontend:** React, React Router, Axios, CSS
*   **Backend:** Node.js, Express, Mongoose, JWT (jsonwebtoken), bcryptjs
*   **Database:** MongoDB (via MongoDB Atlas)
*   **Development:** Nodemon (backend), React Scripts (frontend)
*   **Deployment (Examples):** Render (backend), Vercel (frontend)

## Project Structure

## Setup Instructions (Local Development)

**Prerequisites:**

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18 or v20) and npm installed.
*   [Git](https://git-scm.com/) installed.
*   [Visual Studio Code](https://code.visualstudio.com/) (Recommended Editor).
*   A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd team-vote-app
    ```

2.  **Set up MongoDB Atlas:**
    *   Log in to MongoDB Atlas.
    *   Create a new **Free Tier (M0)** cluster.
    *   **Database Access:** Create a database user (e.g., `teamVoteUser`) with a strong password and "Read and write to any database" privileges. **Remember this password!**
    *   **Network Access:** Add an IP address entry. For local development, the easiest option is to "Allow Access From Anywhere" (0.0.0.0/0). Add a description like "Local Dev". **Note:** This is insecure for production.
    *   **Get Connection String:** Go to your Cluster > Connect > Connect your application. Select Driver "Node.js". Copy the connection string.

3.  **Configure Backend:**
    *   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    *   Create a `.env` file by copying the example structure (or create it manually):
        ```bash
        # backend/.env
        NODE_ENV=development
        PORT=5001
        MONGO_URI=<your_mongodb_atlas_connection_string> # Paste string from Atlas, REPLACE <password> with your DB user password
        JWT_SECRET=YOUR_REALLY_STRONG_SECRET_KEY_HERE # Use a strong, random string
        DEFAULT_ADMIN_EMAIL=admin@company.com         # Optional: Default admin for seeding
        DEFAULT_ADMIN_PASSWORD=password123            # Optional: Default admin password for seeding (change this!)
        # CLIENT_URL=http://localhost:3000            # Optional for dev CORS, defaults allow '*' usually
        ```
        *   **IMPORTANT:** Replace `<your_mongodb_atlas_connection_string>` and especially the `<password>` placeholder within it. Also, set a strong `JWT_SECRET`. Remember to URL-encode any special characters (like `@`, `:`, `/`) in your password within the `MONGO_URI` (e.g., `@` becomes `%40`).
    *   Install backend dependencies:
        ```bash
        npm install
        ```

4.  **Configure Frontend:**
    *   Navigate to the frontend directory:
        ```bash
        cd ../frontend
        # Or from root: cd frontend
        ```
    *   Create a `.env` file:
        ```bash
        # frontend/.env
        REACT_APP_API_URL=http://localhost:5001/api
        ```
        *(If using Vite, use `VITE_API_URL=http://localhost:5001/api`)*
    *   Install frontend dependencies:
        ```bash
        npm install
        ```

5.  **Run the Application:**
    *   **Terminal 1 (Backend):**
        ```bash
        cd ../backend # Or from root: cd backend
        npm run server # Starts backend using nodemon (auto-restarts on change)
        ```
        *   Look for "Server running..." and "MongoDB Connected..." messages.
    *   **Terminal 2 (Frontend):**
        ```bash
        cd ../frontend # Or from root: cd frontend
        npm start # Starts frontend React development server
        ```
        *   This should automatically open `http://localhost:3000` in your browser.

6.  **(Optional) Seed the Database:**
    *   Stop the backend server (`Ctrl+C` in Terminal 1).
    *   Make sure `MONGO_URI` is correct in `backend/.env`.
    *   Run the seed script from the `backend` directory:
        ```bash
        # In backend directory
        npm run seed
        ```
    *   Restart the backend server (`npm run server`) after seeding is complete.
    *   You can now log in with the default admin/employee credentials.

## Deployment Instructions (Example: Render + Vercel)

**Prerequisites:**

*   Code pushed to a Git repository (GitHub, GitLab, Bitbucket).
*   Accounts on [Render](https://render.com/) and [Vercel](https://vercel.com/) (Free tiers available).
*   MongoDB Atlas cluster configured (ensure Network Access allows `0.0.0.0/0` or specific cloud provider IPs).

**1. Deploy Backend API to Render:**

*   Log in to Render.
*   Click "New +" > "Web Service".
*   Connect your Git repository.
*   Select the repository for `team-vote-app`.
*   **Settings:**
    *   **Name:** e.g., `team-vote-api`
    *   **Region:** Choose appropriate region.
    *   **Branch:** `main` (or your deployment branch).
    *   **Root Directory:** `backend`
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
    *   **Plan:** Free
*   **Advanced Settings > Environment Variables:** Add the following:
    *   `NODE_ENV`: `production`
    *   `MONGO_URI`: Your MongoDB Atlas connection string (with password).
    *   `JWT_SECRET`: A **NEW**, strong, random secret key for production.
    *   `PORT`: `10000` (Render provides port via env var, but Node often needs default)
    *   `CLIENT_URL`: The URL your Vercel frontend will have (e.g., `https://your-app-name.vercel.app` - **Add/Update this after deploying frontend**).
*   Click "Create Web Service". Wait for the build and deployment.
*   Note the deployed API URL (e.g., `https://team-vote-api.onrender.com`).

**2. Deploy Frontend to Vercel:**

*   Log in to Vercel.
*   Click "Add New..." > "Project".
*   Connect your Git repository and select `team-vote-app`.
*   **Configure Project:**
    *   **Framework Preset:** `Create React App` (Vercel should detect).
    *   **Root Directory:** `frontend`
    *   **Build and Output Settings:** Usually auto-detected (`npm run build`, output `build`).
    *   **Environment Variables:** Add:
        *   `REACT_APP_API_URL`: The URL of your deployed Render backend API (e.g., `https://team-vote-api.onrender.com/api`). **Include the `/api` path.**
*   Click "Deploy". Wait for the build and deployment.
*   Note the deployed frontend URL (e.g., `https://your-app-name.vercel.app`).

**3. Final Backend Configuration (CORS):**

*   Go back to your Render backend service settings.
*   Ensure the `CLIENT_URL` environment variable is set to your exact Vercel frontend URL (from Step 2).
*   Render may redeploy automatically; if not, trigger a manual deploy. This allows the backend to accept requests from your frontend domain.

**4. Testing:**

*   Visit your Vercel frontend URL. Test login, voting, admin actions, etc. Check browser developer console and Render logs for errors if needed.