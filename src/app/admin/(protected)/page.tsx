import { Package, BookOpen, ShoppingBag, TrendingUp } from "lucide-react";

const cards = [
  {
    label: "Materias Primas",
    description: "Gestioná insumos y precios",
    icon: Package,
    href: "/admin/materias-primas",
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Recetas",
    description: "Creá y editá recetas con costos automáticos",
    icon: BookOpen,
    href: "/admin/recetas",
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Productos",
    description: "Vinculá recetas a productos para la tienda",
    icon: ShoppingBag,
    href: "/admin/productos",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Rentabilidad",
    description: "Márgenes y alertas de precio",
    icon: TrendingUp,
    href: "/admin/productos",
    color: "bg-violet-50 text-violet-600",
  },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al panel de gestión de La Patisserie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="group flex items-start gap-4 p-5 bg-surface border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className={`p-2.5 rounded-xl ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {card.label}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {card.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
