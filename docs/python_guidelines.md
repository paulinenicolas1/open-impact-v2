# Python Coding Guidelines

This document outlines the coding standards and best practices for Python development in this project. We prioritize type safety, modern language features, readability, and efficiency.

## Core Principles

- **Strong Typing**: All code must be fully typed.
- **Modern Python**: Use features from Python 3.13+.
- **Readability**: Code should be self-documenting and easy to understand.
- **Efficiency**: Write performant code without sacrificing readability.

## 1. Type Safety

We use `ruff` and `mypy`/`pyright` for strict type checking.

### Rules
- **Always** use type hints for function arguments and return values.
- **Avoid** `Any`. Use `object` if you really mean "anything", or specific protocols/unions.
- Use `Optional[T]` or `T | None` for nullable values.

### Example

```python
# DO
def calculate_total(items: list[float], tax_rate: float) -> float:
    return sum(items) * (1 + tax_rate)

# DON'T
def calculate_total(items, tax_rate):
    return sum(items) * (1 + tax_rate)
```

## 2. Data Structures

### Dataclasses vs. Dictionaries
**Always** use `dataclasses` (or `pydantic` models where appropriate) instead of dictionaries for structured data. Dataclasses provide type safety, auto-completion, and memory efficiency.

```python
from dataclasses import dataclass

# DO
@dataclass(frozen=True, slots=True)
class User:
    id: int
    username: str
    email: str

# DON'T
user = {
    "id": 1,
    "username": "jdoe",
    "email": "jdoe@example.com"
}
```

*Note: `slots=True` improves memory usage and access speed.*

### Enums vs. Magic Values
**Always** use `Enum` for fixed sets of values or states.

```python
from enum import StrEnum, auto

# DO
class OrderStatus(StrEnum):
    PENDING = auto()
    SHIPPED = auto()
    DELIVERED = auto()

def process_order(status: OrderStatus) -> None:
    if status == OrderStatus.PENDING:
        ...

# DON'T
def process_order(status: str) -> None:
    if status == "pending":
        ...
```

## 3. File Handling

### Pathlib vs. os.path
**Always** use `pathlib.Path` instead of `os.path` or string manipulation for file paths.

```python
from pathlib import Path

# DO
path = Path("data") / "users.json"
content = path.read_text(encoding="utf-8")

# DON'T
import os
path = os.path.join("data", "users.json")
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
```

## 4. Modern Syntax & Features

### String Formatting
Use f-strings for all string interpolation.

```python
name = "Alice"
# DO
greeting = f"Hello, {name}"

# DON'T
greeting = "Hello, " + name
greeting = "Hello, {}".format(name)
```

### Pattern Matching over isinstance
Use `match` statements instead of `isinstance` checks. Pattern matching is more expressive, type-safe, and aligns with modern Python.

```python
from dataclasses import dataclass

@dataclass
class Circle:
    radius: float

@dataclass
class Rectangle:
    width: float
    height: float

# DO
def calculate_area(shape: Circle | Rectangle) -> float:
    match shape:
        case Circle(radius=r):
            return 3.14159 * r * r
        case Rectangle(width=w, height=h):
            return w * h

# DON'T
def calculate_area(shape):
    if isinstance(shape, Circle):
        return 3.14159 * shape.radius * shape.radius
    elif isinstance(shape, Rectangle):
        return shape.width * shape.height
```

## 5. Composition Over Inheritance

Favor composition over inheritance. Use protocols and composition to build flexible, testable systems.

```python
from typing import Protocol

# DO - Composition
class Logger(Protocol):
    def log(self, message: str) -> None: ...

@dataclass
class UserService:
    logger: Logger
    
    def create_user(self, name: str) -> None:
        self.logger.log(f"Creating user: {name}")

# DON'T - Deep inheritance hierarchies
class BaseService:
    def log(self, message: str) -> None:
        print(message)

class UserService(BaseService):
    def create_user(self, name: str) -> None:
        self.log(f"Creating user: {name}")
```

## 6. Union Types for Expected Outcomes

Use union types (similar to Rust's `Result` type) to express expected outcomes in the type system.

```python
from dataclasses import dataclass
from typing import TypeAlias

@dataclass(frozen=True)
class Success[T]:
    value: T

@dataclass(frozen=True)
class Failure:
    error: str

Result: TypeAlias = Success[T] | Failure

# DO
def parse_int(s: str) -> int | None:
    try:
        return int(s)
    except ValueError:
        return None

# Even better - use Result types
def parse_int_result(s: str) -> Result[int]:
    try:
        return Success(int(s))
    except ValueError:
        return Failure(f"Invalid integer: {s}")

# DON'T - exceptions for expected cases
def parse_int(s: str) -> int:
    return int(s)  # Raises ValueError
```

## 7. Error Handling Philosophy

### Expected vs Unexpected Errors

- **Expected errors**: Use the type system (`None`, `Result` types, unions).
- **Unexpected errors**: Fail fast with exceptions.

### Rules

1. **Return `None` or `Result` types** for expected failure cases (not found, validation failed, parse error).
2. **Raise exceptions** only for truly unexpected, unrecoverable errors (programming bugs, system failures).
3. **Fail fast**: Don't catch exceptions unless you can meaningfully handle them.
4. **Never silence errors**: Avoid empty `except` blocks.

```python
# DO - Expected failure returns None
def find_user(user_id: int) -> User | None:
    user = db.query(User).filter_by(id=user_id).first()
    return user  # None if not found

# DO - Unexpected error fails fast
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Division by zero")  # Programming error
    return a / b

# DON'T - Exception for expected case
def find_user(user_id: int) -> User:
    user = db.query(User).filter_by(id=user_id).first()
    if user is None:
        raise UserNotFoundError()  # Expected case!
    return user
```

## 8. Imports

- Use absolute imports.
- Group imports: standard library, third-party, local application.
- Remove unused imports (enforced by `ruff`).

```python
# DO
from myproject.models import User
from myproject.utils import helper

# DON'T
from .models import User
import sys, os
```
