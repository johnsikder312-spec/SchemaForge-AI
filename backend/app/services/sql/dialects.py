"""Per-dialect SQL rules.

Each dialect owns its own decisions about:
  - auto-increment primary keys
  - data-type spelling
  - identifier quoting
  - whether foreign keys go inline in CREATE TABLE or as ALTER TABLE

The shared rendering loop lives in ``renderer.py`` and delegates every
dialect-specific choice to one of these objects.
"""

import re

_IDENTIFIER_RE = re.compile(r"^[a-z_][a-z0-9_]*$")

# Integer types that can act as an auto-incrementing primary key.
_INT_FAMILY = {
    "smallint": "small",
    "int2": "small",
    "integer": "regular",
    "int": "regular",
    "int4": "regular",
    "bigint": "big",
    "int8": "big",
}

# Capture "<base>(<params>)" e.g. varchar(100) -> ("varchar", "100")
_PARAM_RE = re.compile(r"^([a-z_ ]+?)\s*\(([^)]*)\)$")


def _normalise(raw_type: str) -> str:
    return " ".join(raw_type.strip().lower().split())


def _split_params(normalised: str) -> tuple[str, str | None]:
    match = _PARAM_RE.match(normalised)
    if match:
        base = match.group(1).strip()
        params = ",".join(p.strip() for p in match.group(2).split(","))
        return base, params
    return normalised, None


class Dialect:
    key: str = ""
    label: str = ""
    open_quote: str = '"'
    close_quote: str = '"'
    inline_foreign_keys: bool = False

    def quote(self, name: str) -> str:
        if _IDENTIFIER_RE.match(name):
            return name
        escaped = name.replace(self.close_quote, self.close_quote * 2)
        return f"{self.open_quote}{escaped}{self.close_quote}"

    # --- data types -------------------------------------------------------
    def column_type(self, raw_type: str) -> str:
        """Map a schema data type to this dialect's spelling."""
        raise NotImplementedError

    # --- primary keys ---------------------------------------------------
    def primary_key_column(self, quoted_name: str, raw_type: str) -> str:
        """Full column definition for a single-column primary key,
        including auto-increment where the dialect supports it."""
        raise NotImplementedError

    @staticmethod
    def _int_size(raw_type: str) -> str | None:
        return _INT_FAMILY.get(_normalise(raw_type))


class PostgreSQLDialect(Dialect):
    key = "postgresql"
    label = "PostgreSQL"

    _SERIAL = {"small": "SMALLSERIAL", "regular": "SERIAL", "big": "BIGSERIAL"}

    def column_type(self, raw_type: str) -> str:
        return _normalise(raw_type).upper()

    def primary_key_column(self, quoted_name: str, raw_type: str) -> str:
        size = self._int_size(raw_type)
        if size:
            return f"{quoted_name} {self._SERIAL[size]} PRIMARY KEY"
        return f"{quoted_name} {self.column_type(raw_type)} PRIMARY KEY"


class MySQLDialect(Dialect):
    key = "mysql"
    label = "MySQL"
    open_quote = "`"
    close_quote = "`"

    _INT_SQL = {"small": "SMALLINT", "regular": "INT", "big": "BIGINT"}
    _SIMPLE = {
        "text": "TEXT",
        "boolean": "TINYINT(1)",
        "bool": "TINYINT(1)",
        "uuid": "CHAR(36)",
        "json": "JSON",
        "jsonb": "JSON",
        "bytea": "LONGBLOB",
        "date": "DATE",
        "timestamp": "DATETIME",
        "timestamptz": "DATETIME",
        "timestamp with time zone": "DATETIME",
        "timestamp without time zone": "DATETIME",
        "time": "TIME",
        "time with time zone": "TIME",
        "time without time zone": "TIME",
        "double precision": "DOUBLE",
        "real": "FLOAT",
        "smallint": "SMALLINT",
        "int2": "SMALLINT",
        "integer": "INT",
        "int": "INT",
        "int4": "INT",
        "bigint": "BIGINT",
        "int8": "BIGINT",
    }

    def column_type(self, raw_type: str) -> str:
        normalised = _normalise(raw_type)
        if normalised in self._SIMPLE:
            return self._SIMPLE[normalised]
        base, params = _split_params(normalised)
        if params is not None:
            if base in ("varchar", "character varying"):
                return f"VARCHAR({params})"
            if base in ("char", "character"):
                return f"CHAR({params})"
            if base in ("numeric", "decimal"):
                return f"DECIMAL({params})"
            return f"{base.upper()}({params})"
        return normalised.upper()

    def primary_key_column(self, quoted_name: str, raw_type: str) -> str:
        size = self._int_size(raw_type)
        if size:
            return (
                f"{quoted_name} {self._INT_SQL[size]} "
                f"NOT NULL AUTO_INCREMENT PRIMARY KEY"
            )
        return f"{quoted_name} {self.column_type(raw_type)} PRIMARY KEY"


class SQLiteDialect(Dialect):
    key = "sqlite"
    label = "SQLite"
    # SQLite cannot ALTER TABLE ADD CONSTRAINT - foreign keys must be inline.
    inline_foreign_keys = True

    _TEXT = {
        "text", "uuid", "json", "jsonb", "date",
        "timestamp", "timestamptz", "timestamp with time zone",
        "timestamp without time zone", "time", "time with time zone",
        "time without time zone",
    }
    _INTEGER = {
        "boolean", "bool", "smallint", "int2", "integer", "int", "int4",
        "bigint", "int8",
    }
    _REAL = {"real", "double precision", "float"}
    _NUMERIC = {"numeric", "decimal"}
    _BLOB = {"bytea", "blob"}

    def column_type(self, raw_type: str) -> str:
        normalised = _normalise(raw_type)
        base, _params = _split_params(normalised)
        if normalised in self._TEXT or base in ("varchar", "character varying", "char", "character"):
            return "TEXT"
        if normalised in self._INTEGER:
            return "INTEGER"
        if normalised in self._REAL:
            return "REAL"
        if normalised in self._NUMERIC or base in self._NUMERIC:
            return "NUMERIC"
        if normalised in self._BLOB:
            return "BLOB"
        return "TEXT"

    def primary_key_column(self, quoted_name: str, raw_type: str) -> str:
        if self._int_size(raw_type):
            # INTEGER PRIMARY KEY AUTOINCREMENT is the only auto-increment form.
            return f"{quoted_name} INTEGER PRIMARY KEY AUTOINCREMENT"
        return f"{quoted_name} {self.column_type(raw_type)} PRIMARY KEY"


DIALECTS: dict[str, Dialect] = {
    d.key: d
    for d in (PostgreSQLDialect(), MySQLDialect(), SQLiteDialect())
}

# Order matters: PostgreSQL first (the original default).
SUPPORTED_DIALECTS: tuple[str, ...] = ("postgresql", "mysql", "sqlite")
