from collections.abc import Callable
from datetime import date


def hoje() -> date:
    """Data de hoje. Função própria para os testes poderem fixá-la, se precisarem."""
    return date.today()


def calcular_idade(nascimento: date, referencia: date | None = None) -> int:
    """Idade completa em anos: só conta o ano depois do aniversário."""
    ref = referencia or hoje()
    return ref.year - nascimento.year - ((ref.month, ref.day) < (nascimento.month, nascimento.day))


def faixa_etaria(minimo: int, maximo: int) -> Callable[[date], date]:
    """
    Validador Pydantic para data de nascimento. A idade muda com o tempo, então a faixa é conferida
    só na ENTRADA (cadastro/edição): um jogador cadastrado com 59 anos pode passar dos 60 depois.
    """

    def validar(nascimento: date) -> date:
        if nascimento > hoje():
            raise ValueError("A data de nascimento não pode estar no futuro")
        idade = calcular_idade(nascimento)
        if not minimo <= idade <= maximo:
            raise ValueError(f"A idade deve estar entre {minimo} e {maximo} anos (hoje teria {idade})")
        return nascimento

    return validar
