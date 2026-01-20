export const translations = {
  es: {
    title: "Ingeniero de Sistemas e Informática",
    bio: "Profesional apasionado por la tecnología con más de 6 años de experiencia en ciberseguridad, desarrollo e implementación. Especializado en crear soluciones óptimas y liderar equipos de alto rendimiento.",
    phone: "Teléfono",
    email: "Correo",
    location: "Ubicación",
    githubInsights: "GitHub Insights",
    repos: "Proyectos",
    stars: "Estrellas",
    followers: "Seguidores",
    topRepo: "Top Repo Stars",
    annualActivity: "Actividad Anual",
    online: "En línea",
    historyHint: "← Desliza para ver historial",
    recentActivity: "Actividad reciente",
    skills: "Habilidades",
    personalProjects: "Proyectos Personales",
    professionalExperience: "Experiencia Profesional",
    education: "Educación",
    certifications: "Certificaciones",
    references: "Referencias",
    launchDemo: "Lanzar Demo",
    viewCode: "Ver Código",
    verProyecto: "Ver proyecto online",
    recentProjects: "Proyectos Recientes",
    videoEditorDesc:
      "Un editor de video robusto construido con React y Remotion. Permite la edición en tiempo real de líneas de tiempo, capas y efectos con una interfaz profesional e intuitiva.",
    scrollHint: "Desliza para ver actividad anterior",
    university: "Univ. Tecnológica del Perú",
    degree: "Ingeniería de Sistemas e Informática",
    footer:
      "© 2026 Pablito Silva Inca • Construido con Next.js, Shadcn & Antigravity",
    expCliquify:
      "Liderazgo en el desarrollo de editores de imágenes y video avanzados. Implementación de tecnologías complejas de manipulación de lioenzos.",
    expMyDesign:
      "Desarrollo de editores de imágenes en Vue JS con renderizado optimizado a través de AWS Lambda. Integración de herramientas de diseño interactivas.",
    expDrawify:
      "Desarrollo de herramientas de diseño con integraciones de AWS S3 y pasarelas de pago Stripe. Control de versiones y despliegue continuo.",
    expTelefonica:
      "Operador avanzado de ciberseguridad en el área EDR. Despliegue, soporte y monitoreo del producto Cortex XDR para clientes corporativos.",
    roleFrontend: "Desarrollador Front-end",
    roleAnalyst: "Analista XDR",
    rolePM: "Project Manager",
    roleFullstack: "Desarrollador Full-stack Sr",
    roleTelecom: "Analista de Telecomunicaciones",
  },
  en: {
    title: "Systems and Informatics Engineer",
    bio: "Technology enthusiast professional with over 6 years of experience in cybersecurity, development, and implementation. Specialized in creating optimal solutions and leading high-performance teams.",
    phone: "Phone",
    email: "Email",
    location: "Location",
    githubInsights: "GitHub Insights",
    repos: "Projects",
    stars: "Stars",
    followers: "Followers",
    topRepo: "Top Repo Stars",
    annualActivity: "Annual Activity",
    online: "Online",
    historyHint: "← Swipe for history",
    recentActivity: "Recent activity",
    skills: "Skills",
    personalProjects: "Personal Projects",
    professionalExperience: "Professional Experience",
    education: "Education",
    certifications: "Certifications",
    references: "References",
    launchDemo: "Launch Demo",
    viewCode: "View Code",
    verProyecto: "View project online",
    recentProjects: "Recent Projects",
    videoEditorDesc:
      "A robust video editor built with React and Remotion. Enables real-time editing of timelines, layers, and effects with a professional and intuitive interface.",
    scrollHint: "Swipe to see previous activity",
    university: "Technological University of Peru",
    degree: "Systems and Informatics Engineering",
    footer:
      "© 2026 Pablito Silva Inca • Built with Next.js, Shadcn & Antigravity",
    expCliquify:
      "Leading the development of advanced image and video editors. Implementation of complex canvas manipulation technologies.",
    expMyDesign:
      "Development of image editors in Vue JS with optimized rendering via AWS Lambda. Integration of interactive design tools.",
    expDrawify:
      "Development of design tools with AWS S3 integrations and Stripe payment gateways. Version control and continuous deployment.",
    expTelefonica:
      "Advanced cybersecurity operator in the EDR area. Deployment, support, and monitoring of the Cortex XDR product for corporate clients.",
    roleFrontend: "Front-end Developer",
    roleAnalyst: "XDR Analyst",
    rolePM: "Project Manager",
    roleFullstack: "Sr. Full-stack Developer",
    roleTelecom: "Telecommunications Analyst",
  },
};

export type Language = "es" | "en";
export type TranslationKey = keyof typeof translations.es;
