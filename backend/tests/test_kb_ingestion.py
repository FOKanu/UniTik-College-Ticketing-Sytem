from types import SimpleNamespace

import pytest

from app.services import kb as kb_service
from app.services.kb_content_parser import TOTAL_CANONICAL_ENTRIES
from scripts import ingest_kb


class FakeSession:
    def __init__(self, events, commit_error=None):
        self.events = events
        self.commit_error = commit_error

    async def __aenter__(self):
        self.events.append("db-open")
        return self

    async def __aexit__(self, *_args):
        self.events.append("db-close")

    async def commit(self):
        self.events.append("commit")
        if self.commit_error:
            raise self.commit_error

    async def rollback(self):
        self.events.append("rollback")

    async def flush(self):
        self.events.append("flush")


def entry(entry_id="faq-test-001"):
    return SimpleNamespace(
        id=entry_id,
        department="Academics",
        audience="Student",
        language="en",
        question="Question",
        answer="Answer",
        escalation="Escalate",
        related_phrasings=["Related"],
        keywords=["keyword"],
    )


def configure(monkeypatch, events, entries, *, embedding_error=None, commit_error=None):
    monkeypatch.setattr(ingest_kb, "load_corpus", lambda _path: [object()])
    monkeypatch.setattr(ingest_kb, "validate_corpus", lambda _documents: entries)

    async def embedder(_text):
        events.append("embed")
        if embedding_error:
            raise embedding_error
        return [0.0] * 768

    def session_factory():
        return FakeSession(events, commit_error)

    async def upsert(_db, **kwargs):
        events.append(("upsert", kwargs["id"], kwargs.get("update_embedding", True)))

    async def enqueue(_db, faq_id, **_kwargs):
        events.append(("enqueue", faq_id))
        return SimpleNamespace(id="job", faqEntryId=faq_id, status="pending")

    monkeypatch.setattr(ingest_kb.kb_service, "upsert_faq_entry", upsert)
    monkeypatch.setattr(ingest_kb.jobs_service, "enqueue_embedding", enqueue)
    return embedder, session_factory


@pytest.mark.asyncio
async def test_sync_embeddings_finish_before_one_db_session_and_commit(monkeypatch):
    events = []
    entries = [entry("faq-test-001"), entry("faq-test-002")]
    embedder, session_factory = configure(monkeypatch, events, entries)
    assert (
        await ingest_kb.ingest(
            embedder=embedder, session_factory=session_factory, sync=True
        )
        == 2
    )
    assert events == [
        "embed",
        "embed",
        "db-open",
        ("upsert", "faq-test-001", True),
        ("upsert", "faq-test-002", True),
        "commit",
        "db-close",
    ]


@pytest.mark.asyncio
async def test_async_ingest_enqueues_without_embedding(monkeypatch):
    events = []
    entries = [entry("faq-test-001"), entry("faq-test-002")]
    embedder, session_factory = configure(monkeypatch, events, entries)
    assert await ingest_kb.ingest(embedder=embedder, session_factory=session_factory) == 2
    assert "embed" not in events
    assert events == [
        "db-open",
        ("upsert", "faq-test-001", False),
        ("enqueue", "faq-test-001"),
        ("upsert", "faq-test-002", False),
        ("enqueue", "faq-test-002"),
        "commit",
        "db-close",
    ]


@pytest.mark.asyncio
async def test_provider_failure_prevents_database_access(monkeypatch):
    events = []
    embedder, session_factory = configure(
        monkeypatch, events, [entry()], embedding_error=RuntimeError("provider secret")
    )
    with pytest.raises(RuntimeError):
        await ingest_kb.ingest(
            embedder=embedder, session_factory=session_factory, sync=True
        )
    assert events == ["embed"]


@pytest.mark.asyncio
async def test_database_failure_rolls_back(monkeypatch):
    events = []
    embedder, session_factory = configure(
        monkeypatch, events, [entry()], commit_error=RuntimeError("database failure")
    )
    with pytest.raises(RuntimeError):
        await ingest_kb.ingest(embedder=embedder, session_factory=session_factory)
    assert events[-3:] == ["commit", "rollback", "db-close"]


def test_cli_success(monkeypatch, capsys):
    def succeed(coroutine):
        coroutine.close()
        return TOTAL_CANONICAL_ENTRIES

    monkeypatch.setattr(ingest_kb.asyncio, "run", succeed)
    assert ingest_kb.main([]) == 0
    assert f"{TOTAL_CANONICAL_ENTRIES} FAQ entries upserted" in capsys.readouterr().out


def test_cli_sync_success(monkeypatch, capsys):
    def succeed(coroutine):
        coroutine.close()
        return TOTAL_CANONICAL_ENTRIES

    monkeypatch.setattr(ingest_kb.asyncio, "run", succeed)
    assert ingest_kb.main(["--sync"]) == 0
    assert "sync embed" in capsys.readouterr().out


def test_cli_failure_is_sanitized(monkeypatch, capsys):
    secret = "https://user:password@provider.invalid/embed?token=secret"

    def fail(coroutine):
        coroutine.close()
        raise RuntimeError(secret)

    monkeypatch.setattr(ingest_kb.asyncio, "run", fail)
    assert ingest_kb.main([]) == 1
    output = capsys.readouterr()
    assert output.out == ""
    assert output.err == "Knowledge-base ingestion failed.\n"
    assert secret not in output.err


def test_canonical_path_is_absolute_and_cwd_independent(monkeypatch, tmp_path):
    expected = ingest_kb.CONTENT_DIR
    monkeypatch.chdir(tmp_path)
    assert ingest_kb.CONTENT_DIR == expected
    assert expected.is_absolute()


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class UpsertSession:
    def __init__(self, existing=None):
        self.existing = existing
        self.added = []

    async def execute(self, _query):
        return FakeResult(self.existing)

    def add(self, value):
        self.added.append(value)


@pytest.mark.asyncio
async def test_upsert_inserts_then_updates_by_id_without_committing_or_deleting():
    create_session = UpsertSession()
    created = await kb_service.upsert_faq_entry(
        create_session,
        id="faq-academics-001",
        question="First",
        answer="Answer",
        language="en",
        category="Academics",
        context_blob="{}",
        embedding=[0.0] * 768,
    )
    assert create_session.added == [created]

    update_session = UpsertSession(created)
    updated = await kb_service.upsert_faq_entry(
        update_session,
        id="faq-academics-001",
        question="Updated",
        answer="Answer",
        language="en",
        category="Academics",
        context_blob="{}",
        embedding=[1.0] * 768,
    )
    assert updated is created
    assert updated.question == "Updated"
    assert update_session.added == []


@pytest.mark.asyncio
async def test_upsert_can_leave_embedding_untouched():
    existing = SimpleNamespace(
        id="faq-academics-001",
        question="Old",
        answer="A",
        language="en",
        category="Academics",
        contextBlob="{}",
        embedding=[0.5] * 768,
    )
    session = UpsertSession(existing)
    updated = await kb_service.upsert_faq_entry(
        session,
        id="faq-academics-001",
        question="New",
        answer="A",
        language="en",
        category="Academics",
        context_blob="{}",
        embedding=None,
        update_embedding=False,
    )
    assert updated.question == "New"
    assert updated.embedding == [0.5] * 768
