from __future__ import annotations

import csv
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "output" / "final_yearly.csv"
_annual_data_cache: list[dict[str, str | dict[str, str]]] | None = None


def _reshape_row(row: dict[str, str]) -> dict[str, str | dict[str, str]]:
    ville = row.pop("ville", "")
    nom_usuel = row.pop("NOM_USUEL", "")
    aaaa = row.pop("AAAA", "")

    return {
        "ville": ville,
        "NOM_USUEL": nom_usuel,
        "AAAA": aaaa,
        "data": row,
    }


def load_annual_data() -> list[dict[str, str | dict[str, str]]]:
    global _annual_data_cache

    with _DATA_PATH.open(encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, delimiter=";")
        _annual_data_cache = [_reshape_row(dict(row)) for row in reader]

    return _annual_data_cache


def get_annual_data() -> list[dict[str, str | dict[str, str]]]:
    if _annual_data_cache is None:
        return load_annual_data()

    return _annual_data_cache
