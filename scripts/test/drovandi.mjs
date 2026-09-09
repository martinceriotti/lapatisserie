/**
 * Test de regresión del parser Drovandi.
 *
 *   node scripts/test/drovandi.mjs
 *
 * Compila src/lib/parsers/*.ts a CommonJS en un dir temporal y corre asserts
 * contra líneas reales de la lista de Drovandi (formato crudo de unpdf:
 * espacios simples, prefijo "**unidad**", códigos alfanuméricos).
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const out = mkdtempSync(join(tmpdir(), "drovandi-test-"));

execFileSync(
  process.execPath,
  [require.resolve("typescript/bin/tsc"),
   join(ROOT, "src/lib/parsers/drovandi.ts"),
   join(ROOT, "src/lib/parsers/utils.ts"),
   join(ROOT, "src/lib/parsers/types.ts"),
   "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck"],
  { stdio: "inherit" }
);

const { parseDrovandi } = require(join(out, "drovandi.js"));

// ── Fixture: líneas reales de la lista Drovandi 20/08/2026 ──
const TEXT = `
CODIGO DESCRIPCION STOCK MARCA U/CAJA PRECIO
1-ACEITES Y VINAGRES
 OLIVA (1.01)
0003290 ACEITE DE OLIVA PREMIUM CJ 4X5LTS 82.00 PREMIUM 4.00 169.739,99
0003290U **unidad**ACEITE DE OLIVA PREMIUM X5LTS 2.00 1.00 42.435,00
0000173 ACEITE DE GIRASOL COSTA DEL SOL CJ4X4.5LTS 72.00 COSTA DEL SOL 4.00 74.817,74
0000173U **unidad**ACEITE DE GIRASOL COSTA DEL SOL X4.5LTS 2.00 COSTA DEL SOL 1.00 18.704,43
0009913 ACEITE GIRASOL COSTA DEL SOL 15X900 -2.00 COSTA DEL SOL 15.00 54.756,55
 MANTECA (24.07)
0MAIN04 MANTECA INTY 4 X 5 KG 0.00 INTY 4.00 207.314,61
0MAIN04U **unidad**MANTECA INTY X 5 KG 1.00 INTY 1.00 53.748,23
1132015 MANTECA COTAMPO CJ8X2.5KG 2.00 COTAMPO 8.00 197.554,94
1132015U **unidad**MANTECA COTAMPO X2.5KG 6.00 CADA DIA 1.00 24.694,37
MAIN005 MANTECA INTY 8 X 2.5 KG 59.00 INTY 8.00 207.314,55
MAIN005U **unidad**MANTECA INTY X 2.5 KG 3.00 INTY 1.00 27.833,90
AZ44CTA AZUCAR TABACAL COMUN AZUL X25KG 71.00 TABACAL 1.00 40.449,55
00MYR10 AZUCAR MYRIAM FARDO X10KG 259.00 MYRIAM 1.00 11.625,00
0000368 AZUCAR TALCO DEWEY BS 10 PQ X 1 KG 64.00  10.00 49.935,80
0102362 SALAME DE MILAN FELA X 1.8 APROX 88.01 FELA 1.00 16.655,11
0001625 AVELLANAS CJX 20 KG 1.50 0 20.00 1.014.088,90
 Página: 19/35 - Fecha de Emisión 20/08/2026, 07:28
`;

const { items } = parseDrovandi(TEXT, 0.21);
const bySku = Object.fromEntries(items.map((i) => [i.supplier_sku, i]));

let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}

check("levanta las 4 filas de MANTECA INTY (códigos alfanuméricos)", () => {
  const inty = items.filter((i) => /MANTECA INTY/i.test(i.product_name));
  assert.equal(inty.length, 4, `encontró ${inty.length}: ${inty.map((i) => i.supplier_sku)}`);
});

check("código con letras al inicio (MAIN005)", () => {
  assert.ok(bySku["MAIN005"], "MAIN005 no parseado");
  assert.equal(bySku["MAIN005"].product_name, "MANTECA INTY 8 X 2.5 KG");
  assert.equal(bySku["MAIN005"].price_final, 207314.55);
});

check("código con dígito + letras (0MAIN04)", () => {
  assert.equal(bySku["0MAIN04"].product_name, "MANTECA INTY 4 X 5 KG");
});

check("fila **unidad**: limpia el prefijo y marca isUnit", () => {
  assert.equal(bySku["MAIN005U"].product_name, "MANTECA INTY X 2.5 KG");
  assert.equal(bySku["MAIN005U"].unit_description, "Unidad");
  assert.equal(bySku["MAIN005U"].price_final, 27833.9);
});

check("nombre no incluye stock/marca/ucaja/precio (línea 7-dígitos clásica)", () => {
  assert.equal(bySku["0000173"].product_name, "ACEITE DE GIRASOL COSTA DEL SOL CJ4X4.5LTS");
});

check("nombre limpio en fila **unidad** de 7 dígitos", () => {
  assert.equal(bySku["0000173U"].product_name, "ACEITE DE GIRASOL COSTA DEL SOL X4.5LTS");
});

check("stock negativo no rompe", () => {
  assert.equal(bySku["0009913"].product_name, "ACEITE GIRASOL COSTA DEL SOL 15X900");
});

check("marca vacía (doble espacio antes de u/caja)", () => {
  assert.equal(bySku["0000368"].product_name, "AZUCAR TALCO DEWEY BS 10 PQ X 1 KG");
});

check("precio de millones (1.014.088,90)", () => {
  assert.equal(bySku["0001625"].price_final, 1014088.9);
  assert.equal(bySku["0001625"].product_name, "AVELLANAS CJX 20 KG");
});

check("descripción con número decimal de 1 dígito (X 1.8 APROX)", () => {
  assert.equal(bySku["0102362"].product_name, "SALAME DE MILAN FELA X 1.8 APROX");
});

check("ignora encabezados / categorías / pie de página", () => {
  assert.ok(!items.some((i) => /CODIGO|Página|ACEITES Y VINAGRES|MANTECA \(24/.test(i.product_name)));
});

check("price_net = price_final / 1.21", () => {
  assert.equal(bySku["0000173"].price_net, Math.round((74817.74 / 1.21) * 100) / 100);
});

console.log(failures === 0 ? "\n✓ todos los casos pasan" : `\n✗ ${failures} caso(s) fallan`);
process.exit(failures === 0 ? 0 : 1);
