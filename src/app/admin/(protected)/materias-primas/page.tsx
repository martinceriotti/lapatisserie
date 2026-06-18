import { getMateriasWithHistory, getRecipesForMaterials } from "@/lib/actions/materias-primas";
import { MateriasTable } from "@/components/admin/materias-primas/MateriasTable";

export const metadata = { title: "Materias Primas | Admin" };

export default async function MateriasPrimasPage() {
  const [materias, recipes] = await Promise.all([
    getMateriasWithHistory(),
    getRecipesForMaterials(),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Materias Primas</h1>
        <p className="text-muted-foreground mt-1">
          Gestioná los insumos y sus precios. El historial se guarda automáticamente.
        </p>
      </div>
      <MateriasTable initialData={materias} recipes={recipes} />
    </div>
  );
}
