from datetime import date, timedelta


def nascido_ha(anos: int) -> str:
    """Data de nascimento (ISO) de quem tem exatamente `anos` anos hoje (fez aniversário ontem)."""
    hoje = date.today()
    try:
        aniversario = hoje.replace(year=hoje.year - anos)
    except ValueError:  # 29/02 em ano não bissexto
        aniversario = hoje.replace(year=hoje.year - anos, day=28)
    return (aniversario - timedelta(days=1)).isoformat()
