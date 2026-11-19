import re


def somente_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def validar_cpf(valor: str) -> str:
    """Remove a máscara e confere os dígitos verificadores. Retorna só os 11 dígitos."""
    cpf = somente_digitos(valor)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise ValueError("CPF inválido")
    for tamanho in (9, 10):
        soma = sum(int(cpf[i]) * (tamanho + 1 - i) for i in range(tamanho))
        digito = (soma * 10 % 11) % 10
        if digito != int(cpf[tamanho]):
            raise ValueError("CPF inválido")
    return cpf


def validar_cnpj(valor: str) -> str:
    """Remove a máscara e confere os dígitos verificadores. Retorna só os 14 dígitos."""
    cnpj = somente_digitos(valor)
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        raise ValueError("CNPJ inválido")
    pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for tamanho in (12, 13):
        soma = sum(int(cnpj[i]) * pesos[i + 13 - tamanho] for i in range(tamanho))
        resto = soma % 11
        digito = 0 if resto < 2 else 11 - resto
        if digito != int(cnpj[tamanho]):
            raise ValueError("CNPJ inválido")
    return cnpj


def mascarar_cpf(cpf: str) -> str:
    """Exibe só os 2 últimos dígitos: ***.***.***-09 (minimização de dados, LGPD)."""
    return f"***.***.***-{cpf[-2:]}" if cpf else cpf
