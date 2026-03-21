from __future__ import annotations

import os
import re
import json
import hashlib
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional


# -----------------------------
# Config
# -----------------------------
SOFT_MAX_CHARS = 2200          # preferred upper bound for prose/table chunks
HARD_MAX_CODE_CHARS = 9000     # only split code above this size, and only on blank lines
MIN_USEFUL_CHARS = 25

ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\ufeff]")
NBSP_RE = re.compile(r"\u00a0")
MUI_LINKED_HEADER_RE = re.compile(r"^(#{1,6})\s+\[([^\]]+)\]\([^\)]+\)\s*$", re.MULTILINE)
RN_LINKED_HEADER_RE = re.compile(r"^(#{1,6})\s+(.+?)\[.*?\]\([^\)]*Direct link to[^\)]*\)\s*$", re.MULTILINE)
GENERIC_LINKED_HEADER_RE = re.compile(r"^(#{1,6})\s+(.+?)\[[^\]]*\]\([^\)]*\)\s*$", re.MULTILINE)
HEADER_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")

NOISE_LINES = {
    "CopyCopied(or Ctrl + C)",
    "Copy(or Ctrl + C)",
    "Edit in Chat",
    "JSTS",
    "Hide code",
}
NOISE_PATTERNS = [
    re.compile(r"^CopyCopied\(or .*?\)$"),
    re.compile(r"^Copy\(or .*?\)$"),
    re.compile(r"^Edit in Chat$"),
    re.compile(r"^JSTS$"),
    re.compile(r"^Hide code$"),
    re.compile(r"^View:table$"),
    re.compile(r"^!\[\]\([^\)]+\)$"),  # screenshot-only lines with empty alt text
]


@dataclass
class Header:
    level: int
    title: str
    slug: str


@dataclass
class Section:
    path: List[Header]
    content: str


@dataclass
class Block:
    kind: str     # prose | list | code | table
    text: str


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[`'\"]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "section"


def clean_markdown(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = NBSP_RE.sub(" ", text)
    text = ZERO_WIDTH_RE.sub("", text)

    # Clean MUI-style linked headers: ## [Usage](#usage) -> ## Usage
    text = MUI_LINKED_HEADER_RE.sub(r"\1 \2", text)

    # Clean RN Paper headings: ## Usage[​](#usage "Direct link to Usage") -> ## Usage
    text = RN_LINKED_HEADER_RE.sub(lambda m: f"{m.group(1)} {m.group(2).strip()}", text)

    # Safety pass for any remaining heading-ending self-links
    def _generic_header_cleanup(match: re.Match) -> str:
        hashes, title = match.group(1), match.group(2).strip()
        if title:
            return f"{hashes} {title}"
        return match.group(0)

    text = GENERIC_LINKED_HEADER_RE.sub(_generic_header_cleanup, text)

    cleaned_lines: List[str] = []
    for raw_line in text.split("\n"):
        line = raw_line.rstrip()
        stripped = line.strip()

        # MUI docs sometimes start with a standalone '+' line.
        if stripped == "+":
            continue

        if any(p.match(stripped) for p in NOISE_PATTERNS):
            continue

        cleaned_lines.append(line)

    text = "\n".join(cleaned_lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
    return text


def infer_metadata(base_dir: str, file_path: str) -> Dict[str, str]:
    rel = os.path.relpath(file_path, base_dir)
    parts = rel.split(os.sep)
    library = parts[0]

    if library == "mui":
        component = parts[1]
        stem = os.path.splitext(parts[2])[0]
        doc_type = "guide" if "guide" in stem else "api_reference"
        sub_component = stem.replace("_api_reference", "")
    elif library == "rn-paper":
        component = parts[1]
        stem = os.path.splitext(parts[2])[0]
        doc_type = "api_reference"
        sub_component = stem
    else:
        component = parts[1] if len(parts) > 2 else os.path.splitext(parts[-1])[0]
        stem = os.path.splitext(parts[-1])[0]
        doc_type = "unknown"
        sub_component = stem

    return {
        "source_path": rel.replace(os.sep, "/"),
        "library": library,
        "component": component,
        "sub_component": sub_component,
        "doc_type": doc_type,
        "file_name": os.path.basename(file_path),
    }


def parse_sections(text: str) -> List[Section]:
    lines = text.splitlines()
    sections: List[Section] = []
    stack: List[Header] = []
    buffer: List[str] = []

    def flush_buffer() -> None:
        content = "\n".join(buffer).strip()
        if content:
            sections.append(Section(path=stack.copy(), content=content))

    for line in lines:
        m = HEADER_RE.match(line)
        if m:
            flush_buffer()
            buffer = []
            level = len(m.group(1))
            title = m.group(2).strip()
            header = Header(level=level, title=title, slug=slugify(title))
            while stack and stack[-1].level >= level:
                stack.pop()
            stack.append(header)
        else:
            buffer.append(line)

    flush_buffer()
    return sections


def parse_blocks(section_text: str) -> List[Block]:
    lines = section_text.splitlines()
    i = 0
    blocks: List[Block] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # fenced code block
        if stripped.startswith("```"):
            chunk = [line]
            i += 1
            while i < len(lines):
                chunk.append(lines[i])
                if lines[i].strip().startswith("```"):
                    i += 1
                    break
                i += 1
            blocks.append(Block(kind="code", text="\n".join(chunk).strip()))
            continue

        # markdown table
        if line.lstrip().startswith("|"):
            chunk = [line]
            i += 1
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                chunk.append(lines[i])
                i += 1
            blocks.append(Block(kind="table", text="\n".join(chunk).strip()))
            continue

        # bullet / numbered list
        if re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", line):
            chunk = [line]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if not nxt.strip():
                    # keep blank lines only if followed by another list line
                    if i + 1 < len(lines) and re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", lines[i + 1]):
                        chunk.append("")
                        i += 1
                        continue
                    break
                if re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", nxt) or nxt.startswith("  ") or nxt.startswith("\t"):
                    chunk.append(nxt)
                    i += 1
                else:
                    break
            blocks.append(Block(kind="list", text="\n".join(chunk).strip()))
            continue

        # prose paragraph(s) until the next structural block
        chunk = [line]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            nxt_stripped = nxt.strip()
            if not nxt_stripped:
                if i + 1 < len(lines):
                    peek = lines[i + 1].strip()
                    if (
                        peek.startswith("```")
                        or lines[i + 1].lstrip().startswith("|")
                        or re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", lines[i + 1])
                    ):
                        break
                chunk.append("")
                i += 1
                continue
            if nxt_stripped.startswith("```") or nxt.lstrip().startswith("|") or re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", nxt):
                break
            chunk.append(nxt)
            i += 1
        blocks.append(Block(kind="prose", text="\n".join(chunk).strip()))

    return [b for b in blocks if b.text.strip()]


def group_blocks(blocks: List[Block]) -> List[Block]:
    grouped: List[Block] = []
    prose_buffer: List[str] = []
    prose_kind = "prose"

    def flush_prose() -> None:
        nonlocal prose_buffer, prose_kind
        if prose_buffer:
            grouped.append(Block(kind=prose_kind, text="\n\n".join(prose_buffer).strip()))
            prose_buffer = []
            prose_kind = "prose"

    for block in blocks:
        if block.kind in {"prose", "list"}:
            if not prose_buffer:
                prose_kind = "list" if block.kind == "list" else "prose"
            elif prose_kind != block.kind:
                prose_kind = "prose"
            prose_buffer.append(block.text)
        else:
            flush_prose()
            grouped.append(block)

    flush_prose()
    return grouped


def split_large_prose(text: str, limit: int = SOFT_MAX_CHARS) -> List[str]:
    text = text.strip()
    if len(text) <= limit:
        return [text]

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    parts: List[str] = []
    current: List[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if para_len > limit:
            # Sentence fallback.
            sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z`<\[])", para)
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                add_len = len(sent) + (2 if current else 0)
                if current and current_len + add_len > limit:
                    parts.append("\n\n".join(current).strip())
                    current = [sent]
                    current_len = len(sent)
                else:
                    current.append(sent)
                    current_len += add_len
            continue

        add_len = para_len + (2 if current else 0)
        if current and current_len + add_len > limit:
            parts.append("\n\n".join(current).strip())
            current = [para]
            current_len = para_len
        else:
            current.append(para)
            current_len += add_len

    if current:
        parts.append("\n\n".join(current).strip())

    return [p for p in parts if len(p.strip()) >= MIN_USEFUL_CHARS]


def split_large_table(text: str, limit: int = SOFT_MAX_CHARS) -> List[str]:
    text = text.strip()
    if len(text) <= limit:
        return [text]

    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
    if len(lines) <= 2:
        return [text]

    if len(lines) >= 2 and set(lines[1].replace("|", "").replace(" ", "")) <= {"-", ":"}:
        header = lines[:2]
        rows = lines[2:]
    else:
        header = lines[:1]
        rows = lines[1:]

    chunks: List[str] = []
    current = header.copy()
    current_len = len("\n".join(current))

    for row in rows:
        add_len = len(row) + 1
        if len(current) > len(header) and current_len + add_len > limit:
            chunks.append("\n".join(current))
            current = header.copy() + [row]
            current_len = len("\n".join(current))
        else:
            current.append(row)
            current_len += add_len

    if len(current) > len(header):
        chunks.append("\n".join(current))

    return chunks if chunks else [text]


def split_large_code(text: str, limit: int = HARD_MAX_CODE_CHARS) -> List[str]:
    text = text.strip()
    if len(text) <= limit:
        return [text]

    lines = text.splitlines()
    if not lines or not lines[0].strip().startswith("```"):
        return [text]

    opening = lines[0]
    closing = "```"
    body = lines[1:]
    if body and body[-1].strip().startswith("```"):
        closing = body[-1]
        body = body[:-1]

    chunks: List[str] = []
    current: List[str] = []
    current_len = len(opening) + len(closing) + 2

    def flush() -> None:
        nonlocal current, current_len
        if current:
            chunks.append("\n".join([opening, *current, closing]).strip())
            current = []
            current_len = len(opening) + len(closing) + 2

    for line in body:
        add_len = len(line) + 1
        # Only split on blank line boundaries so code structure stays readable.
        if current and current_len + add_len > limit and line.strip() == "":
            flush()
            continue
        current.append(line)
        current_len += add_len

    flush()
    return chunks if chunks else [text]


def section_to_chunks(section: Section, base_metadata: Dict[str, str]) -> List[Dict]:
    blocks = group_blocks(parse_blocks(section.content))
    chunks: List[Dict] = []
    pending_short_prose_for_table: Optional[str] = None

    for block_index, block in enumerate(blocks):
        if block.kind == "prose" and len(block.text) < 400:
            # Small explanatory prose often belongs with the following table.
            next_kind = blocks[block_index + 1].kind if block_index + 1 < len(blocks) else None
            if next_kind == "table":
                pending_short_prose_for_table = block.text
                continue

        texts: List[str]
        if block.kind == "table":
            table_text = block.text
            if pending_short_prose_for_table:
                table_text = pending_short_prose_for_table + "\n\n" + table_text
                pending_short_prose_for_table = None
            texts = split_large_table(table_text)
        elif block.kind == "code":
            texts = split_large_code(block.text)
        else:
            pending_short_prose_for_table = None
            texts = split_large_prose(block.text)

        for part_index, part in enumerate(texts):
            cleaned = part.strip()
            if len(cleaned) < MIN_USEFUL_CHARS:
                continue

            path_titles = [h.title for h in section.path]
            section_title = path_titles[-1] if path_titles else base_metadata["sub_component"]
            h1_title = path_titles[0] if path_titles else base_metadata["sub_component"]
            sub_path = " > ".join(path_titles[1:]) if len(path_titles) > 1 else h1_title

            metadata = {
                **base_metadata,
                "title": h1_title,
                "section_title": section_title,
                "section_path": " > ".join(path_titles),
                "section_slug_path": " > ".join(h.slug for h in section.path),
                "chunk_kind": block.kind,
                "chunk_part": part_index + 1,
            }

            embedding_text = (
                f"Library: {base_metadata['library']}\n"
                f"Component: {base_metadata['component']}\n"
                f"Sub-component: {base_metadata['sub_component']}\n"
                f"Document type: {base_metadata['doc_type']}\n"
                f"Section: {sub_path}\n"
                f"Chunk type: {block.kind}\n\n"
                f"{cleaned}"
            ).strip()

            chunks.append({
                "id": hashlib.sha1(
                    f"{base_metadata['source_path']}|{metadata['section_path']}|{block.kind}|{part_index}|{cleaned}".encode("utf-8")
                ).hexdigest()[:16],
                "text": cleaned,
                "embedding_text": embedding_text,
                "metadata": metadata,
            })

    return chunks


def process_docs(base_dir: str) -> List[Dict]:
    all_chunks: List[Dict] = []

    for root, _, files in os.walk(base_dir):
        for filename in sorted(files):
            if not filename.endswith(".md"):
                continue

            file_path = os.path.join(root, filename)
            base_metadata = infer_metadata(base_dir, file_path)

            with open(file_path, "r", encoding="utf-8") as f:
                raw_text = f.read()

            cleaned = clean_markdown(raw_text)
            sections = parse_sections(cleaned)

            file_chunks: List[Dict] = []
            for section in sections:
                file_chunks.extend(section_to_chunks(section, base_metadata))

            # Give every chunk stable ordering metadata.
            for idx, chunk in enumerate(file_chunks, start=1):
                chunk["metadata"]["chunk_index_in_file"] = idx
                chunk["metadata"]["chunk_count_in_file"] = len(file_chunks)

            all_chunks.extend(file_chunks)

    return all_chunks


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Semantic markdown chunker for MUI and RN Paper docs.")
    parser.add_argument("--base-dir", default="docs_raw", help="Directory containing library markdown docs")
    parser.add_argument("--output", default="semantic_chunks.json", help="Path to write JSON output")
    args = parser.parse_args()

    chunks = process_docs(args.base_dir)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(chunks)} chunks -> {args.output}")
