import os
from pathlib import Path
import pandas as pd


AGG_SPEC = {
    'TMM': ('TMM', 'mean'),
    'TXAB': ('TXAB', 'max'),
    'TXMIN': ('TXMIN', 'min'),
    'NBJTX25': ('NBJTX25', 'sum'),
    'RR': ('RR', 'sum'),
    'RRAB': ('RRAB', 'max'),
}

MAPPING_MOIS = {
    1: 'Janvier',  2: 'Février',  3: 'Mars',
    4: 'Avril',    5: 'Mai',      6: 'Juin',
    7: 'Juillet',  8: 'Août',     9: 'Septembre',
    10: 'Octobre', 11: 'Novembre',12: 'Décembre'
}

def load_city_df(
    city: str,
    data_folder: str,
    config: dict,
    year_max_exclusive: int = 2026,
    sep: str = ';',
    mapping_mois: dict[int, str] = MAPPING_MOIS,
) -> pd.DataFrame:
    folder = Path(os.path.join(data_folder, config['stations'][city]['folder']))
    csv_files = [f for f in folder.iterdir() if f.suffix == ".csv"]

    df = pd.concat([pd.read_csv(f, sep=sep) for f in csv_files], ignore_index=True)

    station_name = config['stations'][city]['name']
    df = df[df['NOM_USUEL'] == station_name].copy()

    # AAAAMM numeric -> AAAA / MM
    df['AAAA'] = df['AAAAMM'] // 100
    df['MM'] = df['AAAAMM'] % 100
    df['MOIS'] = df['MM'].map(mapping_mois)

    df = df[df['AAAA'] < year_max_exclusive].copy()
    return df


def add_ma5(
    df: pd.DataFrame,
    value_col: str = "TMM",
    group_col: str = "NOM_USUEL",
    order_cols: list[str] | None = None,
    window: int = 5,
    min_periods: int = 5,
    round_digits: int = 1,
    out_col: str | None = None,
) -> pd.DataFrame:
    if order_cols is None:
        order_cols = [group_col]

    df = df.sort_values(order_cols).copy()
    out_col = out_col or f"{value_col}_ma5"

    df[out_col] = (
        df.groupby(group_col)[value_col]
          .rolling(window=window, min_periods=min_periods)
          .mean()
          .round(round_digits)
          .reset_index(level=0, drop=True)
    )
    return df


def build_yearly(df: pd.DataFrame) -> pd.DataFrame:
    out = (
        df.groupby(['AAAA', 'NOM_USUEL'], as_index=False)
          .agg(**AGG_SPEC)
          .round({'TMM': 1})
    )
    out = add_ma5(out, value_col="TMM", group_col="NOM_USUEL", order_cols=["NOM_USUEL", "AAAA"])
    return out


def build_monthly(df: pd.DataFrame) -> pd.DataFrame:
    out = (
        df.groupby(['AAAA', 'MM', 'MOIS', 'NOM_USUEL'], as_index=False)
          .agg(**AGG_SPEC)
          .round({'TMM': 1})
    )
    out = add_ma5(out, value_col="TMM", group_col="NOM_USUEL", order_cols=["NOM_USUEL", "AAAA", "MM"])
    return out


def build_all_cities(
    cities: list[str],
    data_folder: str,
    config: dict,
    year_max_exclusive: int = 2026,
    logger=None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    yearly_frames = []
    monthly_frames = []

    for city in cities:
        if logger:
            logger.info(f'Building dataset for {city}')

        df = load_city_df(city, data_folder, config, year_max_exclusive=year_max_exclusive)

        df_yearly = build_yearly(df)
        df_monthly = build_monthly(df)

        df_yearly['ville'] = city
        df_monthly['ville'] = city

        yearly_frames.append(df_yearly)
        monthly_frames.append(df_monthly)

    final_yearly = pd.concat(yearly_frames, ignore_index=True)
    final_monthly = pd.concat(monthly_frames, ignore_index=True)

    return final_yearly, final_monthly