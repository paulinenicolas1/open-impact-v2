---
trigger: glob
globs: **/*.py
---

# Python Development Guide

## Philosophy: Modern, Fast, Strict

We write **modern, strictly typed, and async-first** Python. Code must be expressive, concise, and correct. We prioritize **separation of concerns** and **clear naming** over excessive commentary.

## 1. Tooling & Environment

- **Package Manager**: **`uv`** (Blazing fast, replaces pip/poetry).
- **Linter/Formatter**: **`ruff`** (Strict config, replaces black/isort/flake8).
- **Type Checker**: **`ty`** (Zero-config, fast, strict).

## 2. Style & Quality

### 2.1 "Light" Style
- **No redundant comments**: Code should explain itself.
- **Good Naming**: Use descriptive, intention-revealing names (`user_id` vs `uid`).
- **Separation of Concerns**: Single Responsibility Principle.

### 2.2 Strict Typing
- **100% Type Coverage**: No untyped functions.
- **No `Any`**: Use `TypeVar`, `Generic`, or specific protocols.
- **Modern Syntax**: Use `list[str] | None` and `typing.Self`.

## 3. Modern Language Features (Python 3.10+)

### 3.1 Data Structures
- **Internal**: `@dataclass(frozen=True)` for immutability.
- **External/API**: `Pydantic BaseModel` for validation.
- **Enums**: `enum.StrEnum` for fixed choices.

### 3.2 Control Flow & Exhaustiveness
- **Pattern Matching**: Use `match` for complex conditions.
- **Exhaustiveness**: Use `typing.assert_never` to guarantee all cases are handled.

```python
from typing import assert_never

def process_status(status: Status) -> None:
    match status:
        case Status.ACTIVE:
            process_active()
        case Status.ARCHIVED:
            archive_item()
        case _ as unreachable:
            assert_never(unreachable)
```

- **Walrus Operator**: Use `:=` strictly to reduce redundancy in conditions.

```python
if (item := fetch_item(item_id)) is not None:
    process(item)
```

## 4. Asynchrony & I/O

- **Async First**: All I/O (DB, HTTP, File) must be `async`.
- **No Blocking**: Never block the event loop.

## 5. Recommended Libraries

- **Web Framework**: **FastAPI** (fast, typed, async).
- **CLI**: **Typer** (type-driven).
- **HTTP Client**: **httpx** (async standard).
- **Configuration**: **pydantic-settings** (typed environment config).
- **Logging**: **structlog** (structured, JSON-friendly).
    - Fully compatible with standard `logging`.
    - Use `structlog.get_logger()` (respects module boundaries).
- **Paths**: `pathlib.Path` (over `os.path`).

## 6. Summary Checklist

- [ ] Is it typed?
- [ ] Is it async?
- [ ] specific types over broad `Any` or `dict`?
- [ ] Does `match` handle all cases with `assert_never`?