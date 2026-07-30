// Centralized Translation Engine for EDR Party Rentals

type Translations = Record<string, { en: string; es: string }>;

export const translations: Translations = {
  "rentals": { en: "Rentals", es: "Alquileres" },
  "packages": { en: "Packages", es: "Paquetes" },
  "service_area": { en: "Service Area", es: "Área de servicio" },
  "how_delivery_works": { en: "How Delivery Works", es: "Cómo funciona la entrega" },
  "faqs": { en: "FAQs", es: "Preguntas frecuentes" },
  "my_party": { en: "My Party", es: "Mi fiesta" },
  "check_your_date": { en: "Check Your Date", es: "Consulta tu fecha" },
  "check_availability": { en: "Check Availability", es: "Ver disponibilidad" },
  "bounce_houses": { en: "Bounce Houses", es: "Brincolines" },
  "water_slides": { en: "Water Slides", es: "Toboganes acuáticos" },
  "tables_and_chairs": { en: "Tables & Chairs", es: "Mesas y sillas" },
  "add_to_party": { en: "Add to Party", es: "Agregar a mi fiesta" },
  "view_details": { en: "View Details", es: "Ver detalles" },
  "reserved_for_this_date": { en: "Reserved for this date", es: "Reservado para esta fecha" },
  "select_your_date": { en: "Select Your Date", es: "Elige la fecha" },
  "delivery_address": { en: "Delivery Address", es: "Dirección de entrega" },
  "request_a_quote": { en: "Request a Quote", es: "Solicitar cotización" },
  "seats_up_to_8": { en: "Seats up to 8", es: "Capacidad para hasta 8 personas" },
  // Map / General
  "custom_delivery_quote_required": { en: "Custom delivery quote required", es: "Se requiere cotización de envío" },
  "free_delivery_policy": { en: "Free local delivery on orders of $349+ within 15 miles.", es: "Entrega local gratis en pedidos de $349+ dentro de 15 millas." },
  // Product Details
  "actual_dimensions": { en: "Actual Dimensions", es: "Dimensiones reales" },
  "required_setup_area": { en: "Required Setup Area", es: "Área de instalación requerida" },
  "height": { en: "Height", es: "Altura" },
  "power_required": { en: "Power Required", es: "Energía necesaria" },
  "water_required": { en: "Water Hookup Required", es: "Conexión de agua requerida" },
  "capacity": { en: "Capacity", es: "Capacidad" },
  "age_range": { en: "Recommended Ages", es: "Rango de edad recomendado" },
};

export function t(key: string, lang: 'en' | 'es' = 'en'): string {
  if (!translations[key]) {
    // Development warning for missing translation keys
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Missing translation key: "\${key}"`);
    }
    return key;
  }
  return translations[key][lang] || translations[key]['en'];
}
