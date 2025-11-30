<a name="readme-top"></a>

<br />
<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/5523/5523062.png" alt="Armory Logo" width="100" height="100">

  <h1 align="center">HIMSP</h1>
  <p align="center">
    <b>Hardware Inventory Management System in Police Department</b>
    <br />
    A secure, MERN-stack solution for digitalizing police armory operations.
    <br />
    <br />
    <a href="https://himsp.onrender.com/"><strong>View Live Demo »</strong></a>
    <br />
    <br />
    <a href="https://github.com/s7nket/police-inventory-system/issues">Report Bug</a>
    ·
    <a href="https://github.com/s7nket/police-inventory-system/pulls">Request Feature</a>
  </p>
</div>

<div align="center">

![Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

</div>

---

<details>
  <summary><b>📚 Table of Contents</b></summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#api-reference">API Reference</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
  </ol>
</details>

---

## 🚔 About The Project

**The Problem:**
Managing police inventory—weapons, protective gear, and communication devices—is critical. Many departments still rely on manual logs or spreadsheets, leading to human error, slow retrieval times, and accountability gaps.

**The Solution:**
**HIMSP** is a comprehensive, role-based web platform designed to modernize this workflow. By centralizing data and digitizing requisitions, we ensure that every piece of equipment is tracked from the moment it is purchased to the moment it is retired.

---

## 🛠️ Built With

This project relies on a robust **MERN** architecture.

### Core Stack
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ExpressJS](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

### Frontend Utilities
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer](https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue)
![Recharts](https://img.shields.io/badge/Recharts-Data_Viz-ff69b4?style=for-the-badge)

### Backend Security
![JWT](https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Helmet](https://img.shields.io/badge/Helmet-Security-green?style=for-the-badge)

---

## 🌟 Key Features

### 👮 Officer Portal
* **📦 Digital Requisitions:** Request equipment instantly with priority levels.
* **📅 My History:** A complete timeline of every item ever issued or returned.
* **🚫 Policy Enforcement:** Smart logic prevents hoarding (e.g., cannot request a 2nd Glock if one is already issued).
* **🔔 Real-time Status:** Live tracking of request approvals, rejections, or maintenance notes.

### 🛡️ Admin / Quartermaster Hub
* **📊 Analytics Dashboard:** Visual charts showing stock levels, usage trends, and overdue items.
* **🏭 Inventory Control:** Create, edit, or retire equipment pools (e.g., "Glock 17 Pool").
* **📝 Approval Workflow:** Review officer requests with the ability to add remarks or reject with cause.
* **🔍 Forensic Tracking:** Dedicated modules for tracking items involved in **FIRs (Lost)** or **Maintenance**.
* **🧹 System Hygiene:** Automated tools to clean up history logs for deleted inventory.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* **Node.js** (v16+)
* **MongoDB Atlas** URI (or local instance)

### Installation

1.  **Clone the Repo**
    ```sh
    git clone [https://github.com/your-username/police-inventory-system.git](https://github.com/your-username/police-inventory-system.git)
    cd police-inventory-system
    ```

2.  **Backend Setup**
    ```sh
    cd backend
    npm install
    ```
    *Create a `.env` file in `/backend`:*
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    CLIENT_URL=http://localhost:3000
    ```
    *Start Server:*
    ```sh
    npm run dev
    ```

3.  **Frontend Setup**
    ```sh
    cd frontend
    npm install
    npm start
    ```

---

## 📂 Directory Structure

A quick look at the top-level files and directories.

```text
police-inventory-system/
├── backend/
│   ├── config/         # DB connection logic
│   ├── controllers/    # Route logic
│   ├── middleware/     # Auth & Role checks
│   ├── models/         # Mongoose Schemas (User, Pool, Request)
│   ├── routes/         # API Endpoints (admin, officer, equipment)
│   └── server.js       # Entry point
│
└── frontend/
    ├── public/
    └── src/
        ├── components/ # Reusable UI components
        ├── context/    # AuthContext & State
        ├── pages/      # Dashboard, Inventory, Login pages
        └── utils/      # API wrappers (axios)
````

-----

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/login` | POST | Authenticates user & returns JWT |
| `/api/admin/dashboard` | GET | Fetches global stats & recent activity |
| `/api/admin/fix-ghost-loans` | POST | **Utility:** Auto-fixes desynchronized history |
| `/api/officer/requests` | POST | Submits a new equipment request |
| `/api/equipment/pools` | GET | Lists all available equipment pools |

-----

## 🔮 Roadmap

  - [ ] **RFID Integration:** Auto-check-in/out using hardware scanners.
  - [ ] **Barcode Generation:** Generate printable QR codes for each item.
  - [ ] **Notifications:** SMS/Email alerts for overdue returns.
  - [ ] **Mobile App:** React Native mobile version for field officers.

-----

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

-----

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

```
```
