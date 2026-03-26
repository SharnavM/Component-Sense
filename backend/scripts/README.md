# Backend Scripts

This folder contains the data pipeline used to build and test the RAG system for **Material UI** and **React Native Paper**.

It covers the full flow:

1. scrape docs
2. convert docs to Markdown
3. build semantic chunks for embeddings
4. upload vectors to Pinecone
5. run a smoke test against the live index

---

## Folder Structure

Typical folder structure after generating outputs:

```text
backend/
├── .env
├── scripts/
│   ├── 1_scrape_mui.py
│   ├── 2_scrape_rn_paper.py
│   ├── 3_chunk_and_embed.py
│   ├── 4_upload_to_vectordb.py
│   └── 5_smoke_test.py
├── docs_raw/
│   ├── mui/
│   └── rn-paper/
├── semantic_chunks.json
└── .ingest_checkpoint.json
```

---

## Environment Variables

These scripts expect environment variables in:

```text
backend/.env
```

Suggested variables:

```env
GEMINI_API_KEY=your_google_key
PINECONE_API_KEY=your_pinecone_key

PINECONE_INDEX_NAME=ui-component-sense
PINECONE_NAMESPACE=mui-rnpaper
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

GEMINI_EMBED_MODEL=gemini-embedding-001
GEMINI_GEN_MODEL=gemini-3.1-flash-lite-preview
GEMINI_EMBED_DIMENSION=768

EMBED_BATCH_SIZE=4
GEMINI_EMBED_RPM=2
SLEEP_AFTER_UPSERT=1
```

---

## 1) `1_scrape_mui.py`

Visits each MUI component guide page with Playwright **->** expands interactive demo source blocks **->** removes demo UI wrappers and keeps clean code blocks **->** converts the main content to Markdown **->** detects linked API reference pages from the guide page **->** fetches those API pages and saves them as separate Markdown files.

### Output structure

```text
backend/docs_raw/mui/
└── accordion/
    ├── guide_and_demos.md
    ├── accordion_api_reference.md
    ├── accordion-actions_api_reference.md
    ├── accordion-details_api_reference.md
    └── accordion-summary_api_reference.md
```

### Notes

- runs through the hardcoded `ALL_COMPONENTS` list automatically
- May produce duplicate API reference files, which needs to be removed manually. 

### Run

```bash
python scripts/1_scrape_mui.py
```

---

## 2) `2_scrape_rn_paper.py`

Visits each React Native Paper component URL using Playwright **->** extracts the rendered markdown doc container **->** removes images from the page content **->** converts the cleaned content to Markdown **->** saves one .md file per component or subcomponent.

### Output structure

```text
backend/docs_raw/rn-paper/
└── Card/
    ├── Card.md
    ├── CardActions.md
    ├── CardContent.md
    ├── CardCover.md
    └── CardTitle.md
```

### Notes

- uses the hardcoded `ALL_COMPONENTS` URL map

### Run

```bash
python scripts/2_scrape_rn_paper.py
```

---

## 3) `3_semantic_chunk_docs.py`

Reads Markdown files from a base docs directory **->** cleans MUI and RN Paper heading artifacts **->** removes scraper/UI noise **->** splits content by markdown hierarchy **->** groups content into semantic block types (prose, lists, code blocks, tables) **->** preserves code fences and table headers **->** enriches each chunk with metadata and embedding_text **->** writes the full chunk set to JSON.

### Default output

```text
backend/scripts/semantic_chunks.json
```

### CLI args

```bash
python scripts/3_semantic_chunk_docs.py --base-dir docs_raw --output semantic_chunks.json
```

| Arg          | Default                | Description                                |
| ------------ | ---------------------- | ------------------------------------------ |
| `--base-dir` | `docs_raw`             | Directory containing scraped Markdown docs |
| `--output`   | `semantic_chunks.json` | Output JSON file for semantic chunks       |

### Output schema

Each chunk includes:

```json
{
  "id": "...",
  "text": "...",
  "embedding_text": "...",
  "metadata": {
    "library": "mui",
    "component": "accordion",
    "section_title": "Controlled Accordion"
  }
}
```

The above schema is shortened sample.

---

## 4) `4_upload_to_vectordb.py`

Loads environment variables from `backend/.env` **->** reads chunk JSON **->** creates the Pinecone index if needed **->** embeds chunks with Gemini in batches **->** applies rate limiting between embed requests **->** uploads vectors to Pinecone **->** saves ingestion progress in a checkpoint file **->** stops cleanly if Gemini quota is exhausted.

### CLI args

```bash
python scripts/4_upload_to_vectordb.py --namespace mui-rnpaper
```

| Arg                      | Default                      | Description                        |
| ------------------------ | ---------------------------- | ---------------------------------- |
| `--input`                | `semantic_chunks.json`       | Path to chunk JSON                 |
| `--index-name`           | env / `ui-component-sense`   | Pinecone index name                |
| `--namespace`            | env / `default`              | Pinecone namespace                 |
| `--embed-model`          | env / `gemini-embedding-001` | Gemini embedding model             |
| `--dimension`            | env / `768`                  | Embedding dimension                |
| `--cloud`                | env / `aws`                  | Pinecone cloud                     |
| `--region`               | env / `us-east-1`            | Pinecone region                    |
| `--embed-batch-size`     | env / `8`                    | Number of chunks per embed request |
| `--embed-rpm`            | env / `4`                    | Target embed requests per minute   |
| `--sleep-after-upsert`   | env / `0.5`                  | Extra sleep after Pinecone upsert  |
| `--checkpoint`           | `.ingest_checkpoint.json`    | Resume state file                  |
| `--start-from`           | `None`                       | Override checkpoint offset         |
| `--metadata-limit-bytes` | `39000`                      | Max metadata payload budget        |

### Example

```bash
python scripts/4_upload_to_vectordb.py \
  --input backend/semantic_chunks_v2.json \
  --index-name ui-component-sense \
  --namespace mui-rnpaper \
  --embed-batch-size 4 \
  --embed-rpm 5
```

### Resume behavior

If ingestion stops due to quota or interruption, re-running the script will resume from the saved checkpoint (`.ingest_checkpoint.json`) unless `--start-from` is explicitly passed.

---

## 5) `5_smoke_test.py`

Loads env from `backend/.env` **->** embeds a user query with Gemini **->** queries Pinecone for top matches **->** builds a short retrieved context block **->** sends that context to Gemini for a final answer **->** prints both top matches and answer to the terminal.

### CLI args

```bash
python scripts/5_smoke_test.py "How do I control the expanded state of MUI Accordion?"
```

| Arg             | Default                                                 | Description                         |
| --------------- | ------------------------------------------------------- | ----------------------------------- |
| `query`         | `How do I control the expanded state of MUI Accordion?` | User query                          |
| `--index-name`  | env / `ui-component-sense`                              | Pinecone index name                 |
| `--namespace`   | env / `mui-rnpaper`                                     | Pinecone namespace                  |
| `--embed-model` | env / `gemini-embedding-001`                            | Gemini embedding model              |
| `--gen-model`   | env / `gemini-3.1-flash-lite-preview`                   | Gemini generation model             |
| `--top-k`       | `6`                                                     | Number of Pinecone matches to fetch |
| `--dimension`   | env / `768`                                             | Embedding dimension                 |

### Example

```bash
python scripts/5_smoke_test.py \
  "How to create card with avatar?" \
  --index-name ui-component-sense \
  --namespace mui-rnpaper \
  --top-k 6
```

### Typical output

```text
Top matches:
1. score=0.7728 | mui/accordion | Controlled Accordion
2. score=0.7678 | mui/accordion | Expanded by default
...

--- ANSWER ---

To control the expanded state of an MUI Accordion...
```

---

## Dependencies

Recommended install:

```bash
pip install -U requests beautifulsoup4 markdownify playwright google-genai pinecone python-dotenv
playwright install chromium
```
