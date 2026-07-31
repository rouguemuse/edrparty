import { NextResponse } from 'next/server';

// Full product catalog — used as fallback when DB is unavailable (e.g. Vercel serverless)
const CATALOG = [
  {
    id: 1, slug: 'castle-bounce-house', category: 'bounce',
    name_en: 'Castle Bounce House with Slide', name_es: 'Bricolín Castillo con Resbaladilla',
    description_en: 'Classic primary-colored commercial castle bouncer with entry slide. High inflatable walls, safety ramp, and deep jumping bed.',
    description_es: 'Bricolín inflable comercial estilo castillo en colores primarios con resbaladilla.',
    base_price: 225.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 20, setup_width: 20, setup_height: 15,
    outlets_required: 1, water_required: 0,
    image: '/images/category_bounce.jpg', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 2, slug: 'sunshine-splash', category: 'water',
    name_en: 'Sunshine Splash Water Slide', name_es: 'Tobogán de Agua Sunshine Splash',
    description_en: 'Bright sunshine yellow and sky blue water slide with steep climbing ladder, safety top canopy, and splash pool.',
    description_es: 'Tobogán acuático amarillo y azul con brillante diseño de sol. Escalera inclinada y alberca.',
    base_price: 225.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 20, setup_width: 16, setup_height: 20,
    outlets_required: 1, water_required: 1,
    image: '/images/sunshine20.16.20.png', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 3, slug: 'green-monster', category: 'water',
    name_en: 'Green Monster Water Slide', name_es: 'Tobogán de Agua Monstruo Verde',
    description_en: 'Vibrant green 28ft long commercial water slide. Features deep side rails, slick water runway, and landing pool.',
    description_es: 'Tobogán de agua comercial verde vibrante de 28 pies de largo.',
    base_price: 210.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 28, setup_width: 14, setup_height: 15,
    outlets_required: 1, water_required: 1,
    image: '/images/greenslide28.14.png', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 4, slug: 'ninja-turtles-bounce', category: 'bounce',
    name_en: 'Ninja Turtles Bounce House', name_es: 'Bricolín Tortugas Ninja',
    description_en: 'Action-packed Ninja Turtles commercial bouncer featuring high mesh ventilation windows and safety entrance step.',
    description_es: 'Bricolín temático de las Tortugas Ninja. Ventanas de malla y escalón de seguridad.',
    base_price: 175.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 18, setup_width: 15, setup_height: 20,
    outlets_required: 1, water_required: 0,
    image: '/images/Ninjaturlesbounce_18.15.20.png', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 5, slug: 'princess-castle', category: 'bounce',
    name_en: 'Princess Castle Bounce House', name_es: 'Bricolín Castillo de Princesas',
    description_en: 'Royal pink and purple princess castle bouncer. Perfect compact sizing for smaller backyards and birthday parties.',
    description_es: 'Bricolín castillo de princesas rosa y morado. Tamaño compacto ideal para patios residenciales.',
    base_price: 160.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 12, setup_width: 12, setup_height: 12,
    outlets_required: 1, water_required: 0,
    image: '/images/princess12.12.png', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 6, slug: 'rainbow-double-combo', category: 'bounce',
    name_en: 'Rainbow Double Slide Bounce Combo', name_es: 'Combo Inflable Arcoíris Doble Resbaladilla',
    description_en: 'Multi-activity rainbow castle bouncer featuring dual side exit slides, onion turrets, and central jump area.',
    description_es: 'Bricolín multi-actividad con doble resbaladilla lateral y área central de salto.',
    base_price: 250.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 30, setup_width: 16, setup_height: 15,
    outlets_required: 1, water_required: 0,
    image: '/images/rainbow_combo_studio.jpg', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 7, slug: '20ft-water-slide', category: 'water',
    name_en: '20ft Water Slide with Tower & Pool', name_es: 'Tobogán de Agua de 20ft con Alberca',
    description_en: 'Towering 20ft tall water slide in blue, yellow, and red. Steep climbing ramp, top safety mesh, and deep splash landing pool.',
    description_es: 'Imponente tobogán acuático de 20 pies de alto. Malla superior de seguridad y alberca.',
    base_price: 275.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 20, setup_width: 16, setup_height: 20,
    outlets_required: 1, water_required: 1,
    image: '/images/water_slide_20x16_studio.jpg', active: 1,
    available: true, availableQuantity: 1,
  },
  {
    id: 8, slug: 'dual-bungee-run', category: 'bounce',
    name_en: '20ft Dual Bungee Run', name_es: 'Pista Bungee de Carreras Doble',
    description_en: 'Head-to-head competitive dual lane bungee run. Features twin runway lanes, velcro marker batons, and padded back wall.',
    description_es: 'Pista de carreras bungee interactiva frente a frente. Dos carriles paralelos.',
    base_price: 200.0, tracking_mode: 'serialized', total_quantity: 1,
    setup_length: 25, setup_width: 12, setup_height: 8,
    outlets_required: 1, water_required: 0,
    image: '/images/bungee_run_studio.jpg', active: 1,
    available: true, availableQuantity: 1,
  },
  // Tables & Chairs — shown as packages on the seating page, not individual items in catalog
  {
    id: 9, slug: 'seating-package-small', category: 'seating',
    name_en: 'Seating Package — Small (1 Table + 8 Chairs)', name_es: 'Paquete de Asientos Pequeño (1 Mesa + 8 Sillas)',
    description_en: '1 white 6ft banquet table + 8 white folding chairs. Seats up to 8 guests.',
    description_es: '1 mesa blanca de banquete de 6ft + 8 sillas blancas plegables. Para hasta 8 personas.',
    base_price: 30.0, tracking_mode: 'quantity', total_quantity: 10,
    setup_length: 6, setup_width: 3, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/images/tables_ref.png', active: 1,
    available: true, availableQuantity: 10,
  },
  {
    id: 10, slug: 'seating-package-medium', category: 'seating',
    name_en: 'Seating Package — Medium (2 Tables + 16 Chairs)', name_es: 'Paquete de Asientos Mediano (2 Mesas + 16 Sillas)',
    description_en: '2 white 6ft banquet tables + 16 white folding chairs. Seats up to 16 guests.',
    description_es: '2 mesas blancas de banquete + 16 sillas blancas plegables. Para hasta 16 personas.',
    base_price: 60.0, tracking_mode: 'quantity', total_quantity: 5,
    setup_length: 12, setup_width: 3, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/images/tables_ref.png', active: 1,
    available: true, availableQuantity: 5,
  },
  {
    id: 11, slug: 'seating-package-large', category: 'seating',
    name_en: 'Seating Package — Large (4 Tables + 32 Chairs)', name_es: 'Paquete de Asientos Grande (4 Mesas + 32 Sillas)',
    description_en: '4 white 6ft banquet tables + 32 white folding chairs. Seats up to 32 guests.',
    description_es: '4 mesas blancas de banquete + 32 sillas blancas plegables. Para hasta 32 personas.',
    base_price: 120.0, tracking_mode: 'quantity', total_quantity: 2,
    setup_length: 24, setup_width: 3, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/images/tables_ref.png', active: 1,
    available: true, availableQuantity: 2,
  },
  {
    id: 12, slug: 'seating-package-xl', category: 'seating',
    name_en: 'Seating Package — XL (6 Tables + 50 Chairs)', name_es: 'Paquete de Asientos Extra Grande (6 Mesas + 50 Sillas)',
    description_en: '6 white 6ft banquet tables + 50 white folding chairs. Seats up to 50 guests.',
    description_es: '6 mesas blancas de banquete + 50 sillas blancas plegables. Para hasta 50 personas.',
    base_price: 185.0, tracking_mode: 'quantity', total_quantity: 1,
    setup_length: 36, setup_width: 3, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/images/tables_ref.png', active: 1,
    available: true, availableQuantity: 1,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  // No date = browse mode: return full catalog as-is
  if (!date) {
    return NextResponse.json({ products: CATALOG });
  }

  // Date provided: try DB availability check, fall back to catalog if DB unavailable
  try {
    const { checkDateAvailability } = await import('@/lib/inventory');
    const availability = await checkDateAvailability(date);
    return NextResponse.json({ date, products: availability });
  } catch (error: any) {
    console.error('DB unavailable, serving catalog fallback:', error?.message);
    // Return catalog with all items marked available (soft fallback)
    return NextResponse.json({ date, products: CATALOG });
  }
}

