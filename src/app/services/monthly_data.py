from __future__ import annotations

import csv
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "output" / "final_monthly.csv"
_monthly_data_cache: list[dict[str, str | dict[str, str]]] | None = None


def _reshape_row(row: dict[str, str]) -> dict[str, str | dict[str, str]]:
    ville = row.pop("ville", "")
    nom_usuel = row.pop("NOM_USUEL", "")
    aaaa = row.pop("AAAA", "")
    mm = row.pop("MM", "")
    mois = row.pop("MOIS", "")

    return {
        "ville": ville,
        "NOM_USUEL": nom_usuel,
        "AAAA": aaaa,
        "MM": mm,
        "MOIS": mois,
        "data": row,
    }


def load_monthly_data() -> list[dict[str, str | dict[str, str]]]:
    global _monthly_data_cache

    with _DATA_PATH.open(encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, delimiter=";")
        _monthly_data_cache = [_reshape_row(dict(row)) for row in reader]

    return _monthly_data_cache


def get_monthly_data() -> list[dict[str, str | dict[str, str]]]:
    if _monthly_data_cache is None:
        return load_monthly_data()

    return _monthly_data_cache
