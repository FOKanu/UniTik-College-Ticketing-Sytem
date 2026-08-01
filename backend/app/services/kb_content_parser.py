"""Python port of the v1 TypeScript knowledge-base content parser.
Reference: archive/ai-rag-embedding-ingestion-v1 tag.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

CANONICAL_FILES = {
    "academics.md": ("Academics", "faq-academics-", 30),
    "finance.md": ("Finance", "faq-finance-", 15),
    "it-support.md": ("IT Support", "faq-it-support-", 15),
    "maintenance.md": ("Maintenance", "faq-maintenance-", 15),
}

REQUIRED_SECTIONS = ["Question", "Answer", "Escalation", "Related phrasings", "Keywords"]


@dataclass
class KnowledgeBaseEntry:
    id: str
    department: str
    audience: str
    language: str
    question: str
    answer: str
    escalation: str
    related_phrasings: list[str]
    keywords: list[str]


@dataclass
class KnowledgeBaseDocument:
    file_path: str
    department: str
    audience: str
    language: str
    status: str
    source: str
    entry_count: int
    entries: list[KnowledgeBaseEntry]


def _parse_front_matter(text: str, file_path: str) -> tuple[dict, str]:
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not match:
        raise ValueError(f"{file_path}: missing front-matter block")
    raw_fields, body = match.group(1), match.group(2)
    fields: dict[str, str] = {}
    for line in raw_fields.splitlines():
        if not line.strip():
            continue
        if ":" not in line:
            raise ValueError(f"{file_path}: malformed front-matter line: {line!r}")
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()

    required = ["department", "audience", "language", "status", "source", "entryCount"]
    for key in required:
        if key not in fields:
            raise ValueError(f"{file_path}: front matter missing '{key}'")

    if not fields["entryCount"].isdigit() or int(fields["entryCount"]) <= 0:
        raise ValueError(f"{file_path}: entryCount must be a positive integer")

    return fields, body


def _parse_bullets(text: str, file_path: str, label: str) -> list[str]:
    lines = [line for line in text.strip().splitlines() if line.strip()]
    if not lines:
        raise ValueError(f"{file_path}: {label} must have at least one bullet")
    bullets = []
    for line in lines:
        if not line.strip().startswith("- "):
            raise ValueError(f"{file_path}: malformed bullet in {label}: {line!r}")
        bullets.append(line.strip()[2:].strip())
    return bullets


def parse_knowledge_base_document(text: str, file_path: str) -> KnowledgeBaseDocument:
    fields, body = _parse_front_matter(text, file_path)

    department = fields["department"]
    if department not in {v[0] for v in CANONICAL_FILES.values()}:
        raise ValueError(f"{file_path}: invalid front matter department '{department}'")

    blocks = re.split(r"\n(?=## )", body.strip())
    entries: list[KnowledgeBaseEntry] = []
    seen_ids: set[str] = set()

    for block in blocks:
        block = block.strip()
        if not block or not block.startswith("## "):
            continue

        id_match = re.match(r"^## (\S+)\s*\n(.*)$", block, re.DOTALL)
        if not id_match:
            raise ValueError(f"{file_path}: malformed FAQ heading: {block[:40]!r}")
        entry_id, rest = id_match.group(1), id_match.group(2)

        if entry_id in seen_ids:
            raise ValueError(f"{file_path}: duplicate FAQ ID '{entry_id}'")
        seen_ids.add(entry_id)

        # Strip a trailing "---" horizontal-rule separator between entries,
        # which the corpus uses but the format spec doesn't explicitly mention.
        rest_clean = re.sub(r"\n-{3,}\s*$", "", rest.strip())
        sections = re.split(r"\n(?=### )", rest_clean)
        found: dict[str, str] = {}
        for section in sections:
            section = section.strip()
            if not section:
                continue
            header_match = re.match(r"^### (.+?)\n(.*)$", section, re.DOTALL)
            if not header_match:
                continue
            header, content = header_match.group(1).strip(), header_match.group(2).strip()
            if header not in REQUIRED_SECTIONS:
                raise ValueError(f"{file_path}: unknown FAQ subsection '{header}' in {entry_id}")
            if header in found:
                raise ValueError(f"{file_path}: duplicate '{header}' section in {entry_id}")
            found[header] = content

        for required_section in REQUIRED_SECTIONS:
            if required_section not in found:
                raise ValueError(f"{file_path}: {entry_id} missing '{required_section}' section")

        question = found["Question"].strip()
        answer = found["Answer"].strip()
        escalation = found["Escalation"].strip()
        if not question or not answer or not escalation:
            raise ValueError(f"{file_path}: {entry_id} has invalid (empty) content")

        related_phrasings = _parse_bullets(
            found["Related phrasings"], file_path, f"{entry_id} Related phrasings"
        )
        keywords = _parse_bullets(found["Keywords"], file_path, f"{entry_id} Keywords")

        entries.append(
            KnowledgeBaseEntry(
                id=entry_id,
                department=department,
                audience=fields["audience"],
                language=fields["language"],
                question=question,
                answer=answer,
                escalation=escalation,
                related_phrasings=related_phrasings,
                keywords=keywords,
            )
        )

    expected_count = int(fields["entryCount"])
    if len(entries) != expected_count:
        raise ValueError(
            f"{file_path}: entryCount {expected_count} does not match "
            f"parsed entry count {len(entries)}"
        )

    return KnowledgeBaseDocument(
        file_path=file_path,
        department=department,
        audience=fields["audience"],
        language=fields["language"],
        status=fields["status"],
        source=fields["source"],
        entry_count=expected_count,
        entries=entries,
    )


def load_corpus(directory: Path) -> list[KnowledgeBaseDocument]:
    documents = []
    for filename, (department, _prefix, _count) in CANONICAL_FILES.items():
        path = directory / filename
        if not path.exists():
            raise ValueError(f"missing canonical file: {filename}")
        text = path.read_text(encoding="utf-8")
        document = parse_knowledge_base_document(text, filename)
        if document.department != department:
            raise ValueError(
                f"{filename}: expected department '{department}', got '{document.department}'"
            )
        documents.append(document)
    return documents


def normalize_question(question: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", question.lower()).strip()


def validate_corpus(documents: list[KnowledgeBaseDocument]) -> list[KnowledgeBaseEntry]:
    all_entries: list[KnowledgeBaseEntry] = []
    seen_ids: set[str] = set()
    seen_questions: set[str] = set()

    for document in documents:
        _, prefix, expected_count = CANONICAL_FILES[Path(document.file_path).name]
        if len(document.entries) != expected_count:
            raise ValueError(
                f"{document.file_path}: expected {expected_count} entries, "
                f"found {len(document.entries)}"
            )
        for index, entry in enumerate(document.entries, start=1):
            expected_id = f"{prefix}{index:03d}"
            if entry.id != expected_id:
                raise ValueError(
                    f"{document.file_path}: expected sequential ID "
                    f"'{expected_id}', got '{entry.id}'"
                )
            if entry.id in seen_ids:
                raise ValueError(f"duplicate FAQ ID across corpus: '{entry.id}'")
            seen_ids.add(entry.id)

            normalized = normalize_question(entry.question)
            if normalized in seen_questions:
                raise ValueError(
                    f"duplicate normalized question across corpus: '{entry.question}'"
                )
            seen_questions.add(normalized)

            all_entries.append(entry)

    return all_entries
