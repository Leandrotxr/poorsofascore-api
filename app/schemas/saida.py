from pydantic import ConfigDict

# Configuração comum a todo schema de SAÍDA:
# - from_attributes: lê direto dos objetos do SQLAlchemy;
# - json_schema_serialization_defaults_required: a API sempre envia todos os campos (mesmo os com
#   valor padrão, como `equipe: None`), então o OpenAPI os marca como obrigatórios. Assim os tipos
#   gerados para o front (npm run tipos) não ficam cheios de campos opcionais.
CONFIG_SAIDA = ConfigDict(from_attributes=True, json_schema_serialization_defaults_required=True)
