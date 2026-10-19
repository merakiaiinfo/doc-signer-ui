# Doc Signer Enterprise Platform

Doc Signer is a robust, SOC 2-compliant document signing application that handles end-to-end digital approval lifecycles. It utilizes cryptographic hashing, true-page PDF conversion engines, and multi-stage workflow signing (Author, Reviewer, Approver). 

## High Level Architecture
* **Frontend:** Built with React, Vite, and modern styling libraries (Lucide Icons, Recharts) focusing on a premium 'Glassmorphic' professional executive aesthetic. 
* **Backend:** Express API running natively Node.js. 
* **Storage Provider:** Multi-modal configuration backing options ranging from SQLite BLOB extraction, standard Local storage via Node `fs`, up to generic configured S3 buckets. 
* **PDF Raster Worker:** Converts `.doc/.docx` variants at scale on Node containers directly via headless `LibreOffice`. 
* **Security:** AES-256-GCM symmetric disk encryption at rest and SHA-512 cryptographic file derivation post-review processing. 
* **Database:** Managed via structured, volume-mapped `PostgreSQL` containers and integrated `redis` instances.

---

## 🚀 Quick Start / Deployment (Docker)

The fastest and most stable way to spin up the entire Doc Signer infrastructure is through Docker Compose. This ensures LibreOffice dependencies, databases, and microservices are aligned.

1. Clone the project locally.
2. In the root directory, drop existing volumes if this is an upgrade, or perform a clean start:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```
3. The platform will be fully online at `http://localhost:8080/`. The background database logic (`init.sql` & `seed.sql`) will have already generated testing users, workflows, and documents.

---

## 🛠️ Local Execution (Development Server without Docker)

If you intend to work on hot-reloading features (without Docker), you must spin up both directories explicitly.

### 1. Requirements
* Node.js v18+
* PostgreSQL optionally running locally (Configure your `.env` appropriately or use port forwards from a container). 
* Redis server optionally configured.
* **Important:** In order to test the End Approval signature stamping, you **must** have `LibreOffice` installed locally on your host OS and exposed globally (the `soffice` command must resolve). 

### 2. Run the Backend API (Ignore if you are connected to remote backend service)
```bash
cd doc-signer-service
npm install
# Set required Env variables, for example: 
# PORT=3000
# ENCRYPTION_KEY=...
# STORAGE_PROVIDER=LOCAL
npm run dev
```

### 3. Run the Frontend UI
```bash
cd doc-signer-ui
npm install
# Note: Ensure the API_BASE_URL inside your ui/src/services files maps to your port 3000 endpoint. 
npm run dev
```
Local development: Vite serves the UI, usually at http://localhost:5173. Its proxy in vite.config.js forwards requests beginning with /api to http://localhost:3000, where the backend runs.
Open `http://localhost:5173` (or the respective Vite local port) to interact. 

---

## ⚙️ How it Works: Pluggable Architecture

1. **Intake / Draft Phase:** The Author clicks `New Document Intake`. The platform automatically captures the specific document properties and physically signs the draft using a digital signature capture. 
2. **Review State:** Assigned managers annotate, analyze, or return the document for correction. The database versioning increments on every return loop.
3. **Approval State:** When the Executive completes formatting validations, they pass through a biometric "Face-ID simulation," rendering a final signature.
4. **Processing & Encryption Worker:** The backend asynchronously:
    * Re-locates the document via the set Storage Provider hook (`LOCAL / DATABASE / S3`).
    * Rasterizes the Word document payload directly into a raw PDF file. 
    * Parses the base64 SVG-captured Author, Reviewer, and Approver signatures visually rendering them across the true bottom margins of the final document. 
    * Secures a SHA-512 hash matrix of the final sealed artifact prior to compressing to disk securely under AES-256-GCM. 
5. **Retrieval**: Approved stakeholders can at any point download the securely locked version of the PDF completely intact via the `GET /api/documents/:id/download` route structure.
