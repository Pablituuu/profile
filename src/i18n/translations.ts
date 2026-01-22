export type Language = "es" | "en";

export const translations = {
  es: {
    "media.upload": "Cargar",
    "media.create_ai": "Crear assets AI",
    "media.generate_unique": "Genera contenido único",
    "image.upload": "Cargar imagen",
    "image.generate_ai": "Generar AI Image",
    "image.create_unique": "Crea imágenes únicas",
  },
  en: {
    "media.upload": "Upload",
    "media.create_ai": "Create AI Assets",
    "media.generate_unique": "Generate unique content",
    "image.upload": "Upload Image",
    "image.generate_ai": "Generate AI Image",
    "image.create_unique": "Create unique images",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;
