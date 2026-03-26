# Component Sense

<div align="center">

**AI-powered, documentation-grounded answers for Material UI and React Native Paper**

</div>

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75FF.svg?logo=googlegemini&style=for-the-badge)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-0F172A.svg?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

---

## List of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Component Sense** is a RAG (Retrieval-Augmented Generation) application that provides documentation-grounded answers for **MUI** and **React Native Paper**.

It uses: `gemini-embedding-001` for vector embeddings and `gemini-3.1-flash-lite-preview` for answer generation

The goal is simple: ask a UI-library question in plain English and get a focused, grounded answer based on the library documentation instead of a generic AI response.

---

## Features

### 🤖 AI-Powered Documentation Assistant

Uses Gemini and Pinecone in a RAG pipeline to generate contextual, documentation-grounded answers for **Material UI** and **React Native Paper**.

### 🧩 Advanced Semantic Chunking

Uses **semantic chunking** instead of naive token chunking so documentation sections, API tables, and code examples stay logically intact and retrieval quality stays high.

### 🛡️ Rate Limiting

Includes a custom sliding-window rate limiter in the FastAPI backend with both:

- **per-IP limits**
- **global request limits**

This helps reduce abuse and avoid blowing through API keys.

### 💬 Saved Chats

Supports multiple local chat threads using `localStorage`, making it easy to switch between different conversations.

### ✨ Fluid UI Micro-Animations

Uses **Framer Motion** for smooth transitions, subtle interactions, and a polished chat experience.

---

## Tech Stack

### Backend

- Python
- FastAPI
- Pinecone

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion

### AI

- Google Gemini

---

## Prerequisites

### 1. Environment Variables

#### Backend

Create `/backend/.env`

```env
GEMINI_API_KEY=your_google_key
PINECONE_API_KEY=your_pinecone_key

PINECONE_INDEX_NAME=ui-component-sense
PINECONE_NAMESPACE=mui-rnpaper
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

GEMINI_EMBED_MODEL=gemini-embedding-001
GEMINI_EMBED_DIMENSION=768
EMBED_BATCH_SIZE=4
GEMINI_EMBED_RPM=2
SLEEP_AFTER_UPSERT=1

GEMINI_GENERATION_MODEL=gemini-3.1-flash-lite-preview
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048

RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_PER_IP=10
RATE_LIMIT_GLOBAL=60

FRONTEND_URL=http://localhost:5173
```

Get your Gemini API Key from [Google AI Studio](https://aistudio.google.com/api-keys) and Pinecone API key by creating an account on [Pinecone](https://app.pinecone.io/).

#### Frontend

Create `/frontend/.env`

```env
VITE_API_BASE_URL=your_backend_url
VITE_GITHUB_REPO_URL=
VITE_LINKEDIN_URL=
VITE_PORTFOLIO_URL=
```

### 2. Backend Scripts

For more information on ingestion and setup scripts, read its [README.md](/backend/scripts/README.md).

- Install script requirements from `/backend/scripts/requirements.txt`
- Run scripts **1 to 4** in order
- Use script **5** for testing

### 3. Backend Setup

- Install dependencies from `/backend/requirements.txt`

### 4. Frontend Setup

- Install frontend packages:

```bash
npm install
```

or

```bash
yarn
```

---

## Running the Project

### 1. Start the Backend

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

### 2. Start the Frontend

```bash
npm run dev
```

or

```bash
yarn dev
```

---

## API Overview

### `POST /api/chat`

Main endpoint that accepts a query and returns an LLM-generated answer.

#### Input

```json
{
  "query": "string",
  "library": "mui | rn-paper"
}
```

#### Output

```json
{
  "answer": "string"
}
```

#### Possible Responses

- `400` — invalid library value
- `429` — rate limit exceeded
- `500` — unexpected server error

---

### `GET /api/health`

Checks whether the backend is awake and ready to serve.

#### Output

```json
{
  "status": "awake and ready"
}
```

---

## Contributing

The frontend may still have a few rough edges because the UI evolved into a more complex interaction flow than originally planned.

Known issues:

- [ ] After reloading the page with a saved chat selected, the app may remain on the landing state instead of transitioning back into chat view

Issues and pull requests are welcome.

---

## License

This project is licensed under the **MIT License**.
