from __future__ import annotations

import logging
from pathlib import Path

import click
import pandas as pd
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
import yaml

from pipelines.data_processing.build_weather_datasets import build_monthly, build_yearly, load_city_df


console = Console()


def make_logger(verbosity: int) -> logging.Logger:
    """
    verbosity: 0 = WARNING, 1 = INFO, 2+ = DEBUG
    """
    level = logging.WARNING if verbosity == 0 else logging.INFO if verbosity == 1 else logging.DEBUG
    logger = logging.getLogger("meteo-cli")
    logger.setLevel(level)

    logger.propagate = False
    return logger


def load_config(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
def main():
    """Outils de build des datasets météo (yearly / monthly)."""
    pass


@main.command("build_datasets")
@click.option(
    "--data-folder",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    required=True,
    help="Dossier racine contenant les sous-dossiers CSV par ville.",
)
@click.option(
    "--config",
    "config_path",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    required=True,
    help="Fichier de config JSON (stations, folders, name, ...).",
)
@click.option(
    "--cities",
    type=str,
    default=None,
    help='Liste de villes séparées par des virgules (ex: "Paris,Lyon"). Si omis: toutes les villes du config.',
)
@click.option(
    "--year-max",
    type=int,
    default=2026,
    show_default=True,
    help="Année max exclusive (ex: 2026 => garde < 2026).",
)
@click.option(
    "--output-dir",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default=Path("outputs"),
    show_default=True,
    help="Dossier de sortie pour les fichiers CSV.",
)
@click.option(
    "--output-filename-yearly",
    type=str,
    default="final_yearly.csv",
    show_default=True,
    help="Nom du CSV yearly.",
)
@click.option(
    "--output-filename-monthly",
    type=str,
    default="final_monthly.csv",
    show_default=True,
    help="Nom du CSV monthly.",
)
@click.option(
    "--sep",
    type=str,
    default=";",
    show_default=True,
    help="Séparateur CSV en sortie.",
)
@click.option(
    "--verbosity",
    "-v",
    count=True,
    help="Augmente la verbosité (-v = info, -vv = debug).",
)
def build_cmd(
    data_folder: Path,
    config_path: Path,
    cities: str | None,
    year_max: int,
    output_dir: Path,
    output_filename_yearly: str,
    output_filename_monthly: str,
    sep: str,
    verbosity: int,
):
    """
    Construit les datasets agrégés (yearly + monthly) et les écrit en CSV.
    """
    logger = make_logger(verbosity)

    # --- load config
    config = load_config(config_path)

    # --- determine cities
    if cities:
        cities_list = [c.strip() for c in cities.split(",") if c.strip()]
    else:
        # toutes les villes présentes dans config["stations"]
        cities_list = list(config.get("stations", {}).keys())

    if not cities_list:
        raise click.ClickException("Aucune ville trouvée (option --cities vide et config sans stations).")

    output_dir.mkdir(parents=True, exist_ok=True)
    out_yearly_path = output_dir / output_filename_yearly
    out_monthly_path = output_dir / output_filename_monthly

    console.print(
        f"[bold]Build météo[/bold]\n"
        f"• data-folder: [cyan]{data_folder}[/cyan]\n"
        f"• config: [cyan]{config_path}[/cyan]\n"
        f"• cities: [cyan]{', '.join(cities_list)}[/cyan]\n"
        f"• year-max: [cyan]{year_max}[/cyan]\n"
        f"• out: [cyan]{output_dir}[/cyan]\n"
    )

    # --- progress + build (on appelle tes fonctions ville par ville pour avoir une vraie barre)
    yearly_frames: list[pd.DataFrame] = []
    monthly_frames: list[pd.DataFrame] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Construction des datasets", total=len(cities_list))

        for city in cities_list:
            logger.info(f"Building dataset for {city}")

            df_raw = load_city_df(city, str(data_folder), config, year_max_exclusive=year_max)
            df_yearly = build_yearly(df_raw)
            df_monthly = build_monthly(df_raw)

            df_yearly["ville"] = city
            df_monthly["ville"] = city

            yearly_frames.append(df_yearly)
            monthly_frames.append(df_monthly)

            progress.advance(task)

    final_yearly = pd.concat(yearly_frames, ignore_index=True)
    final_monthly = pd.concat(monthly_frames, ignore_index=True)

    # --- write outputs
    final_yearly.to_csv(out_yearly_path, index=False, sep=sep, encoding="utf-8")
    final_monthly.to_csv(out_monthly_path, index=False, sep=sep, encoding="utf-8")

    console.print("[green]✅ Terminé ![/green]")
    console.print(f"• Yearly:  [cyan]{out_yearly_path}[/cyan]  ({len(final_yearly):,} lignes)")
    console.print(f"• Monthly: [cyan]{out_monthly_path}[/cyan] ({len(final_monthly):,} lignes)")


if __name__ == "__main__":
    main()
