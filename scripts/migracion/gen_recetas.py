"""
Genera el seed SQL de recetas a partir del mapeo revisado + el Excel.

Uso:
    python scripts/migracion/extract_excel.py      # primero, genera _extract.json
    python scripts/migracion/gen_recetas.py

Entradas:
    docs/migracion/recetas_map.csv          (revisado por Martin)
    scripts/migracion/materias_primas.csv   (para resolver nombres de insumos)
    scripts/migracion/_extract.json         (ingredientes por hoja)
Salida:
    supabase/seeds/002_recetas.sql

Sólo procesa las filas con accion == 'migrar'. Aborta si algún ingrediente
de receta no matchea con una materia prima (para arreglar los alias primero).
"""
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MAP_IN = ROOT / "docs" / "migracion" / "recetas_map.csv"
MP_IN = HERE / "materias_primas.csv"
EXTRACT = HERE / "_extract.json"
SQL_OUT = ROOT / "supabase" / "seeds" / "002_recetas.sql"

YIELD_UNITS = {"unidades", "porciones", "gramos", "kg"}

# Alias: nombre normalizado en la hoja de receta -> nombre normalizado del insumo.
ALIAS = {
    "coco": "coco rayado",
    "polveo hornear": "polvo hornear",
    "polvo hornear": "polvo de hornear",
    # "Chocolate Baño" / "Chocolate Banio": cobertura, $10/g = mismo precio que Chocolate Alfajores
    "chocolate bano": "chocolate alfajores",
    "chocolate banio": "chocolate alfajores",
    "palitos": "palitos cakepop",
    "pasas": "pasas de uva",
    "chocochips": "chips de chocolate",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    s = s.lower().replace("(unidad)", " ")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def slugify(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", norm(s))).strip("-")


def rm_unit_to_ing_unit(rm_unit: str) -> str:
    if rm_unit in ("kg", "g"):
        return "g"
    if rm_unit in ("l", "ml"):
        return "ml"
    return rm_unit  # unidad, sobre, taza


def q(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def main() -> None:
    if not EXTRACT.exists():
        sys.exit("Falta _extract.json — corré primero extract_excel.py")

    extract = json.loads(EXTRACT.read_text(encoding="utf-8"))
    sheets = extract["recipes"]

    # Índice de materias primas: nombre normalizado -> (nombre_final, unit)
    mp_index = {}
    for r in csv.DictReader(MP_IN.read_text(encoding="utf-8").splitlines()):
        final = (r.get("nombre_final") or "").strip()
        if not final:
            continue
        unit = (r.get("unit") or "").strip()
        for key in (r["nombre_excel"], final):
            mp_index[norm(key)] = (final, unit)

    def resolve(ing_name: str):
        n = norm(ing_name)
        n = ALIAS.get(n, n)
        return mp_index.get(n)

    rows = list(csv.DictReader(MAP_IN.read_text(encoding="utf-8").splitlines()))
    recetas = []
    unmatched = []
    errors = []
    slugs = set()

    for i, r in enumerate(rows, start=2):
        if (r.get("accion") or "").strip() != "migrar":
            continue
        name = (r.get("nombre_final") or "").strip()
        sheet = (r.get("hoja_excel") or "").strip()
        cat = (r.get("categoria_slug") or "").strip()
        yq = (r.get("yield_quantity") or "").strip()
        yu = (r.get("yield_unit") or "").strip()

        if not name or not sheet or not cat:
            errors.append(f"fila {i}: falta nombre_final / hoja_excel / categoria_slug")
            continue
        if sheet not in sheets:
            errors.append(f"fila {i} ({name}): la hoja '{sheet}' no existe en el Excel")
            continue
        if yu not in YIELD_UNITS:
            errors.append(f"fila {i} ({name}): yield_unit inválido '{yu}'")
            continue
        # yield_quantity: el CSV manda; si está vacío, se toma del pie de la hoja
        # ("Cantidad de Masitas/Porciones/Alfajores").
        if yq:
            try:
                yq_val = float(yq)
            except ValueError:
                errors.append(f"fila {i} ({name}): yield_quantity inválido '{yq}'")
                continue
        else:
            footer = sheets[sheet]["footer"]
            cant = next(
                (v["una_receta"] for k, v in footer.items()
                 if k.lower().startswith("cantidad") and isinstance(v["una_receta"], (int, float))),
                None,
            )
            yq_val = float(cant) if cant else 1.0

        slug = slugify(name)
        while slug in slugs:
            slug += "-2"
        slugs.add(slug)

        ings = {}  # raw_material name_final -> [qty, unit]
        for ing in sheets[sheet]["ingredients"]:
            qty = ing["qty"]
            if qty in (None, "", 0):
                continue
            hit = resolve(ing["ing"])
            if not hit:
                unmatched.append((name, sheet, ing["ing"]))
                continue
            final, rm_unit = hit
            u = rm_unit_to_ing_unit(rm_unit)
            if final in ings:
                ings[final][0] += float(qty)
            else:
                ings[final] = [float(qty), u]

        recetas.append(
            {"name": name, "slug": slug, "cat": cat, "yq": yq_val, "yu": yu, "ings": ings}
        )

    if errors:
        sys.exit("Errores en recetas_map.csv:\n  " + "\n  ".join(errors))

    if unmatched:
        print("INGREDIENTES SIN MATCH (agregar a ALIAS o revisar el CSV de MP):")
        for rec, sh, ing in unmatched:
            print(f"  [{rec}] hoja '{sh}': '{ing}'  (norm: '{norm(ing)}')")
        sys.exit(f"\n{len(unmatched)} ingredientes sin resolver. No se generó el SQL.")

    # ── Emitir SQL ──
    out = [
        "-- ============================================================",
        "-- Seed: Recetas — La Patisserie",
        "-- Generado por scripts/migracion/gen_recetas.py",
        f"-- Fuente: docs/migracion/recetas_map.csv ({len(recetas)} recetas)",
        "-- Migración plana: cada receta lista sus ingredientes crudos.",
        "-- ============================================================",
        "",
        "begin;",
        "",
    ]

    for rec in recetas:
        vals = ",\n    ".join(
            f"({q(mp)}, {qty:g}, {q(u)})" for mp, (qty, u) in rec["ings"].items()
        )
        out += [
            f"-- {rec['name']}  ({len(rec['ings'])} ingredientes)",
            "with nueva as (",
            "  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)",
            f"  values ({q(rec['name'])}, {q(rec['slug'])}, "
            f"(select id from recipe_categories where slug = {q(rec['cat'])}), "
            f"{rec['yq']:g}, {q(rec['yu'])}, true)",
            "  returning id",
            ")",
            "insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)",
            "select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit",
            "from nueva",
            f"  join (values\n    {vals}\n  ) as v(mp_name, qty, unit) on true",
            "  join raw_materials rm on rm.name = v.mp_name;",
            "",
        ]

    out += [
        "commit;",
        "",
        "-- Verificación",
        "select r.name, rc.total_cost, rc.cost_per_unit,",
        "       (select count(*) from recipe_ingredients ri where ri.recipe_id = r.id) as n_ingredientes",
        "from recipes r left join recipe_costs rc on rc.recipe_id = r.id",
        "order by r.name;",
        "",
    ]

    SQL_OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"Escrito: {SQL_OUT}  ({len(recetas)} recetas)")


if __name__ == "__main__":
    main()
