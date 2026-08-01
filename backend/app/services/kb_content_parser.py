"""Strict parser for the canonical knowledge-base Markdown corpus."""

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
REQUIRED_METADATA = ("department", "audience", "language", "status", "source", "entryCount")
REQUIRED_SECTIONS = ("Question", "Answer", "Escalation", "Related phrasings", "Keywords")


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


def _parse_front_matter(text: str, file_path: str) -> tuple[dict[str, str], str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.startswith("---\n"):
        raise ValueError(f"{file_path}: missing opening front-matter delimiter")
    closing_index = normalized.find("\n---\n", 4)
    if closing_index < 0:
        raise ValueError(f"{file_path}: missing closing front-matter delimiter")

    fields: dict[str, str] = {}
    for line in normalized[4:closing_index].splitlines():
        match = re.fullmatch(r"([A-Za-z][A-Za-z0-9]*):\s*(.*?)\s*", line)
        if not match:
            raise ValueError(f"{file_path}: malformed front-matter line {line!r}")
        key, value = match.groups()
        if key in fields:
            raise ValueError(f"{file_path}: duplicate front-matter key '{key}'")
        fields[key] = value

    missing = [key for key in REQUIRED_METADATA if key not in fields]
    if missing:
        raise ValueError(f"{file_path}: front matter missing '{missing[0]}'")
    unknown = [key for key in fields if key not in REQUIRED_METADATA]
    if unknown:
        raise ValueError(f"{file_path}: unknown front-matter field '{unknown[0]}'")
    empty = [key for key in REQUIRED_METADATA if not fields[key].strip()]
    if empty:
        raise ValueError(f"{file_path}: front-matter field '{empty[0]}' must not be empty")
    if not re.fullmatch(r"[1-9]\d*", fields["entryCount"]):
        raise ValueError(f"{file_path}: entryCount must be a positive integer")

    expected_values = {
        "audience": "Student",
        "language": "en",
        "status": "synthetic-draft",
        "source": "team-synthetic-data",
    }
    for key, expected in expected_values.items():
        if fields[key] != expected:
            raise ValueError(f"{file_path}: {key} must be '{expected}'")
    return fields, normalized[closing_index + 5 :]


def _parse_bullets(lines: list[str], file_path: str, entry_id: str, label: str) -> list[str]:
    nonempty = [line for line in lines if line.strip()]
    if not nonempty:
        raise ValueError(f"{file_path}: {entry_id} '{label}' must contain at least one bullet")
    bullets: list[str] = []
    for line in nonempty:
        match = re.fullmatch(r"-\s+(.+?)\s*", line)
        if not match or not match.group(1).strip():
            raise ValueError(f"{file_path}: {entry_id} malformed bullet in '{label}'")
        bullets.append(match.group(1).strip())
    return bullets


def parse_knowledge_base_document(text: str, file_path: str) -> KnowledgeBaseDocument:
    fields, body = _parse_front_matter(text, file_path)
    department = fields["department"]
    if department not in {value[0] for value in CANONICAL_FILES.values()}:
        raise ValueError(f"{file_path}: invalid front matter department '{department}'")

    lines = body.split("\n")
    entries: list[KnowledgeBaseEntry] = []
    seen_ids: set[str] = set()
    index = 0
    while index < len(lines) and not lines[index].startswith("## "):
        line = lines[index].strip()
        if line and not line.startswith("# ") and not line.startswith(">") and line != "---":
            raise ValueError(f"{file_path}: unexpected text before first FAQ: {line!r}")
        index += 1

    while index < len(lines):
        heading = re.fullmatch(r"## (faq-[a-z-]+-\d{3})", lines[index])
        if not heading:
            raise ValueError(f"{file_path}: invalid FAQ heading {lines[index]!r}")
        entry_id = heading.group(1)
        if entry_id in seen_ids:
            raise ValueError(f"{file_path}: duplicate FAQ ID '{entry_id}'")
        seen_ids.add(entry_id)
        index += 1

        sections: dict[str, list[str]] = {}
        while index < len(lines) and not lines[index].startswith("## "):
            line = lines[index]
            if not line.strip() or line.strip() == "---":
                index += 1
                continue
            subsection = re.fullmatch(r"### (.+)", line)
            if not subsection:
                raise ValueError(
                    f"{file_path}: {entry_id} unexpected text outside a subsection: "
                    f"{line.strip()!r}"
                )
            name = subsection.group(1)
            if name not in REQUIRED_SECTIONS:
                raise ValueError(f"{file_path}: unknown FAQ subsection '{name}' in {entry_id}")
            if name in sections:
                raise ValueError(f"{file_path}: duplicate '{name}' section in {entry_id}")
            index += 1
            content: list[str] = []
            while (
                index < len(lines)
                and not lines[index].startswith("### ")
                and not lines[index].startswith("## ")
                and lines[index].strip() != "---"
            ):
                content.append(lines[index])
                index += 1
            sections[name] = content

        for required in REQUIRED_SECTIONS:
            if required not in sections:
                raise ValueError(f"{file_path}: {entry_id} missing '{required}' section")
        question = "\n".join(sections["Question"]).strip()
        answer = "\n".join(sections["Answer"]).strip()
        escalation = "\n".join(sections["Escalation"]).strip()
        if not question or not answer or not escalation:
            raise ValueError(f"{file_path}: {entry_id} has invalid (empty) content")
        entries.append(
            KnowledgeBaseEntry(
                id=entry_id,
                department=department,
                audience=fields["audience"],
                language=fields["language"],
                question=question,
                answer=answer,
                escalation=escalation,
                related_phrasings=_parse_bullets(
                    sections["Related phrasings"], file_path, entry_id, "Related phrasings"
                ),
                keywords=_parse_bullets(sections["Keywords"], file_path, entry_id, "Keywords"),
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
        document = parse_knowledge_base_document(path.read_text(encoding="utf-8"), filename)
        if document.department != department:
            raise ValueError(f"{filename}: expected department '{department}'")
        documents.append(document)
    return documents


def normalize_question(question: str) -> str:
    q = question.strip().lower()
    q = q.replace("\u2018", "'").replace("\u2019", "'")  # curly single quotes -> straight
    q = q.replace("\u201c", '"').replace("\u201d", '"')  # curly double quotes -> straight
    q = re.sub(r"\s+", " ", q)  # collapse whitespace
    q = re.sub(r"[.!?]+$", "", q)  # strip only trailing sentence punctuation
    return q.strip()


def validate_corpus(documents: list[KnowledgeBaseDocument]) -> list[KnowledgeBaseEntry]:
    if len(documents) != len(CANONICAL_FILES):
        raise ValueError(f"corpus: expected exactly {len(CANONICAL_FILES)} documents")
    documents_by_file = {Path(document.file_path).name: document for document in documents}
    if len(documents_by_file) != len(documents):
        raise ValueError("corpus: contains a duplicate canonical filename")
    if set(documents_by_file) != set(CANONICAL_FILES):
        raise ValueError("corpus: contains an unexpected canonical filename")

    all_entries: list[KnowledgeBaseEntry] = []
    seen_ids: set[str] = set()
    seen_questions: set[str] = set()
    for filename, (department, prefix, expected_count) in CANONICAL_FILES.items():
        document = documents_by_file[filename]
        if document.department != department:
            raise ValueError(f"{filename}: expected department '{department}'")
        if len(document.entries) != expected_count or document.entry_count != expected_count:
            raise ValueError(f"{filename}: expected exactly {expected_count} entries")
        for index, entry in enumerate(document.entries, start=1):
            expected_id = f"{prefix}{index:03d}"
            if entry.id in seen_ids:
                raise ValueError(f"duplicate FAQ ID across corpus: '{entry.id}'")
            seen_ids.add(entry.id)
            if entry.id != expected_id:
                raise ValueError(
                    f"{filename}: expected sequential ID '{expected_id}', got '{entry.id}'"
                )
            normalized = normalize_question(entry.question)
            if normalized in seen_questions:
                raise ValueError(f"duplicate normalized question across corpus: '{entry.question}'")
            seen_questions.add(normalized)
            all_entries.append(entry)
    if len(all_entries) != 75:
        raise ValueError(f"corpus: expected exactly 75 entries, found {len(all_entries)}")
    return all_entries
