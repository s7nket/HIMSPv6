# HIMSP: Police Hardware Inventory Management System

![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

> **Hardware Inventory Management System in Police Department**

## 📖 Overview

Hardware inventory management in police departments is a vital yet challenging task due to the wide variety of equipment, including uniforms, communication devices, protective gear, and weapons. Currently, many departments rely on manual record-keeping, which is inefficient, time-consuming, and vulnerable to human error.

**HIMSP** is a secure, role-based web platform designed to digitize and optimize this process. It allows centralized storage and retrieval of equipment data, accessible to both administrators and officers. This approach ensures accurate tracking, reduces manual workload, enhances accountability, and supports quick reassignment of resources during emergencies.

---

## 🌟 Key Features

### 👮 Officer Module
* **Digital Requisitions:** Request equipment (weapons, radios, tactical gear) digitally.
* **My Inventory:** View currently issued items and return deadlines.
* **History Logs:** Access personal history of issued and returned items.
* **One-Item-Per-Pool Policy:** Enforced logic to prevent officers from hoarding multiple items of the same type.
* **Status Tracking:** Real-time updates on request approvals and rejections.

### 🛡️ Admin / Quartermaster Module
* **Central Dashboard:** Visual analytics of stock levels, pending requests, and active loans.
* **Inventory Control:** Add, update, or retire equipment pools.
* **Request Management:** Approve or reject officer requests with specific remarks.
* **User Management:** Detailed officer profiles, ranks, and designations.
* **Maintenance & Loss Tracking:** Dedicated workflows for items reported as lost (FIR tracking) or under maintenance.
* **System Sync Tools:** Utilities to fix history mismatches and clean up orphaned data.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React.js (v18)
* **Styling:** Tailwind CSS, Framer Motion
* **State & Validation:** React Hook Form, Zod
* **Visualization:** Recharts (Data charts), Lucide React (Icons)
* **HTTP Client:** Axios

### Backend (Server)
* **Runtime:** Node.js & Express.js
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Authentication:** JWT (JSON Web Tokens) & BcryptJS
* **Security:** Helmet (Headers), CORS protection
* **Validation:** Express-validator

---

## ⚙️ Architecture

The application follows the **MVC (Model-View-Controller)** architecture:
* **Frontend:** React Single Page Application (SPA) running on port `3000`.
* **Backend:** Express REST API running on port `5000` (auto-fallback to 5001+ if busy).
* **Database:** MongoDB Cloud (Atlas) for secure data persistence.

---

## 🚀 Installation & Setup

### Prerequisites
* **Node.js** (v14 or higher)
* **MongoDB Atlas** Account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/police-inventory-system.git](https://github.com/your-username/police-inventory-system.git)
cd police-inventory-system
````

### 2\. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` folder with the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# Replace with your own MongoDB Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=HIMSP

# Security
JWT_SECRET=your_super_secure_secret_key
JWT_EXPIRES_IN=24h

# Client Config
CLIENT_URL=http://localhost:3000
```

Start the backend server:

```bash
npm run dev
# Server should run on http://localhost:5000
```

### 3\. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
# Application will launch at http://localhost:3000
```

-----

## 📡 API Reference

The backend exposes the following base routes:

| Module | Route | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, Register, Token Refresh |
| **Admin** | `/api/admin` | Dashboard stats, User mgmt, Approvals, Sync utilities |
| **Officer** | `/api/officer` | Dashboard, Request creation, History view |
| **Equipment** | `/api/equipment` | Pool CRUD, Stock mgmt, Maintenance logs |
| **Health** | `/api/health` | System health check and uptime |

-----

## 🧪 Future Enhancements

  * **RFID Integration:** Automated tracking of equipment movement.
  * **Barcode Scanning:** Quick issue/return via handheld scanners.
  * **Notifications:** Email/SMS alerts for overdue items.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the **MIT License**.

**Author:** s7n

```
```
