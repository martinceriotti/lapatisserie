"""
Genera el seed SQL de materias primas a partir del CSV revisado.

Uso:
    python scripts/migracion/gen_materias_primas.py [--historial]

Entrada:  scripts/migracion/materias_primas.csv   (revisado por Martin)
Salida:   supabase/seeds/001_materias_primas.sql

Reglas:
  - Se omite cualquier fila con `nombre_final` vacío.
  - `unit` debe ser uno de: g, kg, ml, l, unidad, sobre, taza
  - `category` debe ser uno de: dairy, flour, chocolate, sugar, fruit,
    packaging, other, eggs, nuts, powders
  - Con --historial agrega una fila "Carga inicial" en
    raw_material_price_history por cada insumo.
"""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_IN = Path(__file__).resolve().parent / "materias_primas.csv"
SQL_OUT = ROOT / "supabase" / "seeds" / "001_materias_primas.sql"

UNITS = {"g", "kg", "ml", "l", "unidad", "sobre", "taza"}
CATEGORIES = {
    "dairy", "flour", "chocolate", "sugar", "fruit",
    "packaging", "other", "eggs", "nuts", "powders",
}


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    con_historial = "--historial" in sys.argv[1:]

    rows = list(csv.DictReader(CSV_IN.read_text(encoding="utf-8").splitlines()))
    errors = []
    out = []
    for i, r in enumerate(rows, start=2):
        name = (r.get("nombre_final") or "").strip()
        if not name:
            continue
        unit = (r.get("unit") or "").strip()
        cat = (r.get("category") or "").strip()
        price = (r.get("current_price") or "").strip()
        if unit not in UNITS:
            errors.append(f"fila {i} ({name}): unit inválida '{unit}'")
        if cat not in CATEGORIES:
            errors.append(f"fila {i} ({name}): category inválida '{cat}'")
        try:
            float(price)
        except ValueError:
            errors.append(f"fila {i} ({name}): current_price inválido '{price}'")
        out.append((name, unit, cat, price))

    if errors:
        sys.exit("Errores en el CSV:\n  " + "\n  ".join(errors))

    names = [o[0] for o in out]
    dups = {n for n in names if names.count(n) > 1}
    if dups:
        sys.exit(f"Nombres duplicados en el CSV: {sorted(dups)}")

    lines = [
        "-- ============================================================",
        "-- Seed: Materias primas — La Patisserie",
        "-- Generado por scripts/migracion/gen_materias_primas.py",
        f"-- Fuente: scripts/migracion/materias_primas.csv ({len(out)} insumos)",
        "-- ============================================================",
        "",
        "begin;",
        "",
        "insert into raw_materials (name, unit, category, current_price, material_type, stock_quantity, is_active) values",
    ]
    values = [
        f"  ({q(n)}, {q(u)}, {q(c)}, {p}, 'materia_prima', 0, true)"
        for (n, u, c, p) in out
    ]
    lines.append(",\n".join(values) + ";")

    if con_historial:
        lines += [
            "",
            "insert into raw_material_price_history (raw_material_id, price, effective_date, notes)",
            "select id, current_price, current_date, 'Carga inicial'",
            "from raw_materials where material_type = 'materia_prima';",
        ]

    lines += [
        "",
        "commit;",
        "",
        "-- Verificación",
        "select category, count(*), min(current_price), max(current_price)",
        "from raw_materials group by category order by category;",
        "",
    ]

    SQL_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Escrito: {SQL_OUT}  ({len(out)} insumos, historial={'sí' if con_historial else 'no'})")


if __name__ == "__main__":
    main()
