<!-- ══════════════════════════════════════════════════════════════════ -->
<!--                     NASHID K  —  BLOGHUB BACKEND                   -->
<!-- ══════════════════════════════════════════════════════════════════ -->

# 📝 BlogHub Backend — TypeScript Express REST API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=nodedotjs" alt="Node" />
  &nbsp;
  <img src="https://img.shields.io/badge/Express-4.x-lightgrey?style=flat-square&logo=express" alt="Express" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  &nbsp;
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb" alt="MongoDB" />
</p>

<p align="center">
  <strong>Clean TypeScript-based backend API for BlogHub, handling JWT user access, blog CRUD operations, and MongoDB data schemas.</strong>
</p>

---

## 📌 Project Overview
This repository contains the backend REST API for BlogHub, built entirely using Express, Mongoose schemas, and TypeScript for absolute type safety.

### ✨ Features
*   **Authentication Middleware:** JWT validation protecting custom dashboard routes.
*   **Blog CRUD Endpoints:** Complete controller actions to create, read, update, and delete entries.
*   **Database modeling:** Structured user and article models.

---

## ⚙️ Installation
1. Clone:
   ```bash
   git clone https://github.com/Nashid-k/BlogHub-backend.git
   cd BlogHub-backend
   ```
2. Install dependencies: `npm install`
3. Configure database URLs in `.env`.
4. Boot server: `npm run dev`.
