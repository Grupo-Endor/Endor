/**
 * Lista cerrada de ~40 rubros (México).
 * Sin giro de lista cerrada no hay benchmark.
 */

export interface SectorOption {
  id: string;
  label: string;
  group: string;
}

export const SECTORS: SectorOption[] = [
  // Alimentos y hospitalidad
  { id: "restaurantes", label: "Restaurantes", group: "Alimentos y hospitalidad" },
  { id: "cafeterias", label: "Cafeterías / tostadores", group: "Alimentos y hospitalidad" },
  { id: "panaderias", label: "Panadería / pastelería", group: "Alimentos y hospitalidad" },
  { id: "food_beverage", label: "Alimentos y bebidas (CPG)", group: "Alimentos y hospitalidad" },
  { id: "hoteles", label: "Hoteles / hospedaje", group: "Alimentos y hospitalidad" },
  { id: "bares", label: "Bares / cantinas", group: "Alimentos y hospitalidad" },
  // Retail y consumo
  { id: "moda", label: "Moda / ropa", group: "Retail y consumo" },
  { id: "belleza", label: "Belleza / cosmética", group: "Retail y consumo" },
  { id: "joyeria", label: "Joyería / accesorios", group: "Retail y consumo" },
  { id: "muebles", label: "Muebles / hogar", group: "Retail y consumo" },
  { id: "ecommerce", label: "E-commerce / marketplace propio", group: "Retail y consumo" },
  { id: "deportes", label: "Deportes / outdoors", group: "Retail y consumo" },
  // Salud y bienestar
  { id: "clinicas", label: "Clínicas / consultorios", group: "Salud y bienestar" },
  { id: "dental", label: "Dental", group: "Salud y bienestar" },
  { id: "fitness", label: "Gimnasios / fitness", group: "Salud y bienestar" },
  { id: "spa", label: "Spa / bienestar", group: "Salud y bienestar" },
  { id: "farmacia", label: "Farmacia / suplementos", group: "Salud y bienestar" },
  // Servicios profesionales
  { id: "despachos", label: "Despacho legal / contable", group: "Servicios profesionales" },
  { id: "consultoria", label: "Consultoría / advisory", group: "Servicios profesionales" },
  { id: "agencias", label: "Agencia (marketing, creativa, digital)", group: "Servicios profesionales" },
  { id: "arquitectura", label: "Arquitectura / interiorismo", group: "Servicios profesionales" },
  { id: "educacion", label: "Educación / capacitación", group: "Servicios profesionales" },
  // Tecnología y digital
  { id: "saas", label: "Software / SaaS", group: "Tecnología" },
  { id: "fintech", label: "Fintech / pagos", group: "Tecnología" },
  { id: "apps", label: "Apps / plataformas", group: "Tecnología" },
  { id: "it_services", label: "Servicios de TI", group: "Tecnología" },
  // Inmobiliario y construcción
  { id: "inmobiliaria", label: "Inmobiliaria / desarrollos", group: "Inmobiliario" },
  { id: "construccion", label: "Construcción / contratistas", group: "Inmobiliario" },
  { id: "coworking", label: "Coworking / espacios", group: "Inmobiliario" },
  // Automotriz y movilidad
  { id: "autos", label: "Automotriz / dealers", group: "Movilidad" },
  { id: "logistica", label: "Logística / paquetería", group: "Movilidad" },
  { id: "movilidad", label: "Movilidad / transporte", group: "Movilidad" },
  // Industria y B2B
  { id: "manufactura", label: "Manufactura", group: "Industria y B2B" },
  { id: "distribucion", label: "Distribución / mayoreo", group: "Industria y B2B" },
  { id: "energia", label: "Energía / sustentabilidad", group: "Industria y B2B" },
  { id: "agro", label: "Agro / campo", group: "Industria y B2B" },
  // Otros
  { id: "ong", label: "ONG / fundación", group: "Otros" },
  { id: "eventos", label: "Eventos / entretenimiento", group: "Otros" },
  { id: "mascotas", label: "Mascotas", group: "Otros" },
  { id: "seguros", label: "Seguros / broker", group: "Otros" },
  { id: "otro", label: "Otro (especificar en notas)", group: "Otros" },
];

export function sectorLabel(id: string): string {
  return SECTORS.find((s) => s.id === id)?.label ?? id;
}

export function sectorsByGroup(): Record<string, SectorOption[]> {
  return SECTORS.reduce(
    (acc, s) => {
      (acc[s.group] ??= []).push(s);
      return acc;
    },
    {} as Record<string, SectorOption[]>
  );
}
