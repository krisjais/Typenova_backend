module.exports = [
  // ─── ENGLISH ───────────────────────────────────────────────────────────────
  {
    id: 'en-general-easy',
    title: 'The Sunny Forest',
    content: 'The quick brown fox jumps over the lazy dog. A warm breeze blows through the trees. It is a beautiful day to learn how to type faster on this clean keyboard.',
    category: 'English',
    difficulty: 'Easy',
    language: 'English'
  },
  {
    id: 'en-general-medium',
    title: 'Muscle Memory',
    content: 'Successful typing requires both accuracy and speed. When you practice daily, your muscle memory builds natural pathways that allow your fingers to glide effortlessly across the home row keys.',
    category: 'English',
    difficulty: 'Medium',
    language: 'English'
  },
  {
    id: 'en-general-hard',
    title: 'Quantum Silicon',
    content: 'Quantum computing utilizes superposition and entanglement (often represented as |0> and |1>) to solve computational problems at speeds exceeding 10^9 times traditional silicon microprocessors.',
    category: 'English',
    difficulty: 'Hard',
    language: 'English'
  },
  {
    id: 'en-code-easy',
    title: 'Area Calculator',
    content: 'const calculateArea = (width, height) => {\n  return width * height;\n};',
    category: 'Code Snippets',
    difficulty: 'Easy',
    language: 'English'
  },
  {
    id: 'en-code-medium',
    title: 'Async Fetch User',
    content: 'async function fetchUserData(userId) {\n  const response = await fetch(`/api/users/${userId}`);\n  if (!response.ok) throw new Error(\'Not found\');\n  return response.json();\n}',
    category: 'Code Snippets',
    difficulty: 'Medium',
    language: 'English'
  },
  {
    id: 'en-code-hard',
    title: 'Generic BST Node',
    content: 'template <typename T>\nclass BinarySearchTree {\npublic:\n  void insert(const T& val) {\n    root = insertNode(root, val);\n  }\nprivate:\n  Node* root = nullptr;\n};',
    category: 'Code Snippets',
    difficulty: 'Hard',
    language: 'English'
  },
  {
    id: 'en-quote-easy',
    title: 'Oscar Wilde',
    content: 'Be yourself; everyone else is already taken. To live is the rarest thing in the world. Most people exist, that is all.',
    category: 'Quotes',
    difficulty: 'Easy',
    language: 'English'
  },
  {
    id: 'en-quote-medium',
    title: 'Lincoln & Teresa',
    content: 'In the end, it\'s not the years in your life that count. It\'s the life in your years. Let us always meet each other with smile, for the smile is the beginning of love.',
    category: 'Quotes',
    difficulty: 'Medium',
    language: 'English'
  },
  {
    id: 'en-quote-hard',
    title: 'Arthur C. Clarke',
    content: 'The only way of discovering the limits of the possible is to venture a little way past them into the impossible. - Arthur C. Clarke (1962)',
    category: 'Quotes',
    difficulty: 'Hard',
    language: 'English'
  },
  {
    id: 'en-tech-easy',
    title: 'Package Install',
    content: 'To install this package, run npm install. Ensure you have Node.js version 18 or higher installed on your computer before running the command.',
    category: 'Technical Documentation',
    difficulty: 'Easy',
    language: 'English'
  },
  {
    id: 'en-tech-medium',
    title: 'REST Architecture',
    content: 'RESTful APIs use HTTP methods (GET, POST, PUT, DELETE) to manage resources. Client-side applications interact with these endpoints by sending JSON payloads in the request body.',
    category: 'Technical Documentation',
    difficulty: 'Medium',
    language: 'English'
  },
  {
    id: 'en-tech-hard',
    title: 'OAuth2 with PKCE',
    content: 'OAuth2 authorization code flow with PKCE prevents authorization code interception attacks by dynamically binding a cryptographically random secret (code_verifier) to the transaction.',
    category: 'Technical Documentation',
    difficulty: 'Hard',
    language: 'English'
  },
  {
    id: 'en-poetry-easy',
    title: 'Red Roses',
    content: 'Roses are red, violets are blue, typing is fun, and good for you too. The stars shine bright in the quiet night.',
    category: 'Poetry',
    difficulty: 'Easy',
    language: 'English'
  },
  {
    id: 'en-poetry-medium',
    title: 'Wordsworth Daffodils',
    content: 'I wandered lonely as a cloud, that floats on high o\'er vales and hills, when all at once I saw a crowd, a host, of golden daffodils.',
    category: 'Poetry',
    difficulty: 'Medium',
    language: 'English'
  },
  {
    id: 'en-poetry-hard',
    title: 'Robert Frost',
    content: 'Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could; - Robert Frost',
    category: 'Poetry',
    difficulty: 'Hard',
    language: 'English'
  },

  // ─── SPANISH ───────────────────────────────────────────────────────────────
  {
    id: 'es-general-easy',
    title: 'El Bosque Alegre',
    content: 'Hola amigo, ¿cómo estás? El sol brilla hoy y hace calor. Me gusta comer manzanas y cantar canciones alegres en el jardín.',
    category: 'English',
    difficulty: 'Easy',
    language: 'Spanish'
  },
  {
    id: 'es-general-medium',
    title: 'Mecanografía Diaria',
    content: 'El aprendizaje de la mecanografía requiere paciencia y constancia. Si practicas quince minutos todos los días, verás una gran mejora en tu velocidad y precisión.',
    category: 'English',
    difficulty: 'Medium',
    language: 'Spanish'
  },
  {
    id: 'es-general-hard',
    title: 'Redes Neuronales',
    content: 'La inteligencia artificial (IA) y el aprendizaje automático (Machine Learning) se basan en algoritmos de optimización matemática para entrenar redes neuronales con millones de parámetros.',
    category: 'English',
    difficulty: 'Hard',
    language: 'Spanish'
  },
  {
    id: 'es-code-easy',
    title: 'Calculador Simple',
    content: '// Calcular el total con impuestos\nconst calcularTotal = (subtotal) => {\n  return subtotal * 1.16;\n};',
    category: 'Code Snippets',
    difficulty: 'Easy',
    language: 'Spanish'
  },
  {
    id: 'es-code-medium',
    title: 'Base de Datos Async',
    content: 'async function conectarDB() {\n  try {\n    await mongoose.connect(process.env.MONGO_URI);\n    console.log(\'Base de datos conectada exitosamente\');\n  } catch (error) {\n    console.error(\'Error de conexion:\', error);\n  }\n}',
    category: 'Code Snippets',
    difficulty: 'Medium',
    language: 'Spanish'
  },
  {
    id: 'es-code-hard',
    title: 'Decorador TypeScript',
    content: 'function Registrable(target: any) {\n  target.prototype.registradoEn = new Date().toISOString();\n  Object.defineProperty(target.prototype, \'id\', {\n    value: () => Math.random().toString(36).substring(2, 9)\n  });\n}',
    category: 'Code Snippets',
    difficulty: 'Hard',
    language: 'Spanish'
  },
  {
    id: 'es-quote-easy',
    title: 'Frase de Paz',
    content: 'No hay camino para la paz, la paz es el camino. La vida es aquello que te va sucediendo mientras te empeñas en hacer otros planes.',
    category: 'Quotes',
    difficulty: 'Easy',
    language: 'Spanish'
  },
  {
    id: 'es-quote-medium',
    title: 'Gabriel García Márquez',
    content: 'El mundo era tan reciente, que muchas cosas carecían de nombre, y para mencionarlas había que señalarlas con el dedo. Lo único que llega con seguridad es la muerte.',
    category: 'Quotes',
    difficulty: 'Medium',
    language: 'Spanish'
  },
  {
    id: 'es-quote-hard',
    title: 'Don Quijote',
    content: 'La pluma es la lengua del alma; cuales fueren los conceptos que en ella se engendraron, tales serán sus escritos. ¡Oh envidia, raíz de infinitos males y carcoma de las virtudes!',
    category: 'Quotes',
    difficulty: 'Hard',
    language: 'Spanish'
  },
  {
    id: 'es-tech-easy',
    title: 'Instalación Básica',
    content: 'Para iniciar el servidor, ejecuta npm run dev en tu terminal. Abre http://localhost:3000 para ver la aplicación web ejecutándose en tiempo real.',
    category: 'Technical Documentation',
    difficulty: 'Easy',
    language: 'Spanish'
  },
  {
    id: 'es-tech-medium',
    title: 'Seguridad JWT',
    content: 'Los tokens JSON Web (JWT) permiten autenticar usuarios de forma segura. El servidor firma el token usando una clave secreta y el cliente debe enviarlo en la cabecera Authorization.',
    category: 'Technical Documentation',
    difficulty: 'Medium',
    language: 'Spanish'
  },
  {
    id: 'es-tech-hard',
    title: 'Integridad Referencial',
    content: 'La integridad referencial es una propiedad de las bases de datos relacionales que asegura que las relaciones entre tablas permanezcan consistentes mediante restricciones de clave externa (Foreign Key).',
    category: 'Technical Documentation',
    difficulty: 'Hard',
    language: 'Spanish'
  },
  {
    id: 'es-poetry-easy',
    title: 'Poema Corto',
    content: 'El cielo es azul, el viento es templado, y en este teclado mi canto ha empezado. La noche brilla con estrellas de plata.',
    category: 'Poetry',
    difficulty: 'Easy',
    language: 'Spanish'
  },
  {
    id: 'es-poetry-medium',
    title: 'Gustavo Adolfo Bécquer',
    content: '¿Qué es poesía? dices mientras clavas en mi pupila tu pupila azul. ¿Qué es poesía? ¿Y tú me lo preguntas? Poesía... eres tú.',
    category: 'Poetry',
    difficulty: 'Medium',
    language: 'Spanish'
  },
  {
    id: 'es-poetry-hard',
    title: 'Federico García Lorca',
    content: 'Verde que te quiero verde. Verde viento. Verdes ramas. El barco sobre la mar y el caballo en la montaña. Con la sombra en la cintura ella sueña en su baranda.',
    category: 'Poetry',
    difficulty: 'Hard',
    language: 'Spanish'
  },

  // ─── FRENCH ────────────────────────────────────────────────────────────────
  {
    id: 'fr-general-easy',
    title: 'Le Beau Chat',
    content: 'Bonjour mon ami! Quel beau jour pour se promener dans le parc. Le chat dort tranquillement sous la table en bois.',
    category: 'English',
    difficulty: 'Easy',
    language: 'French'
  },
  {
    id: 'fr-general-medium',
    title: 'Apprentissage Clavier',
    content: 'Apprendre à taper au clavier demande beaucoup d\'entraînement. Avec du temps et de la patience, vos mains mémoriseront la position de chaque touche.',
    category: 'English',
    difficulty: 'Medium',
    language: 'French'
  },
  {
    id: 'fr-general-hard',
    title: 'Microservices Isolés',
    content: 'L\'architecture microservices permet de déployer des conteneurs isolés (via Docker & Kubernetes) qui communiquent à travers des API RESTful ou des files de messages (RabbitMQ).',
    category: 'English',
    difficulty: 'Hard',
    language: 'French'
  },
  {
    id: 'fr-code-easy',
    title: 'Format Nom',
    content: '// Formater le prenom et le nom\nfunction formatNom(prenom, nom) {\n  return `${prenom.trim()} ${nom.toUpperCase()}`;\n}',
    category: 'Code Snippets',
    difficulty: 'Easy',
    language: 'French'
  },
  {
    id: 'fr-code-medium',
    title: 'Reducteur Redux',
    content: 'const compteurReducer = (state = { count: 0 }, action) => {\n  switch (action.type) {\n    case \'INCREMENTER\':\n      return { count: state.count + 1 };\n    default:\n      return state;\n  }\n};',
    category: 'Code Snippets',
    difficulty: 'Medium',
    language: 'French'
  },
  {
    id: 'fr-code-hard',
    title: 'Promesses Parallèles',
    content: 'const executerEnParallele = async (urls) => {\n  const requetes = urls.map(url => fetch(url).then(r => r.json()));\n  const resultats = await Promise.allSettled(requetes);\n  return resultats.filter(res => res.status === \'fulfilled\').map(res => res.value);\n};',
    category: 'Code Snippets',
    difficulty: 'Hard',
    language: 'French'
  },
  {
    id: 'fr-quote-easy',
    title: 'Saint-Exupéry',
    content: 'On ne voit bien qu\'avec le cœur. L\'essentiel est invisible pour les yeux. Aimer, ce n\'est pas se regarder l\'un l\'autre, c\'est regarder ensemble dans la même direction.',
    category: 'Quotes',
    difficulty: 'Easy',
    language: 'French'
  },
  {
    id: 'fr-quote-medium',
    title: 'Victor Hugo',
    content: 'Rien n\'est plus puissant qu\'une idée dont le temps est venu. Saluer, c\'est respecter; aimer, c\'est vivre; espérer, c\'est survivre. La vie, c\'est la fleur; l\'amour, c\'est le miel.',
    category: 'Quotes',
    difficulty: 'Medium',
    language: 'French'
  },
  {
    id: 'fr-quote-hard',
    title: 'Jean-Paul Sartre',
    content: 'L\'homme est condamné à être libre; parce qu\'une fois jeté dans le monde, il est responsable de tout ce qu\'il fait. L\'existence précède l\'essence; l\'homme se fait lui-même.',
    category: 'Quotes',
    difficulty: 'Hard',
    language: 'French'
  },
  {
    id: 'fr-tech-easy',
    title: 'Lancement Projet',
    content: 'Pour démarrer ce projet, installez d\'abord les dépendances avec npm install, puis lancez le serveur de développement en exécutant npm run dev.',
    category: 'Technical Documentation',
    difficulty: 'Easy',
    language: 'French'
  },
  {
    id: 'fr-tech-medium',
    title: 'Serveur Express',
    content: 'Le framework Express permet de configurer facilement des routes HTTP en Node.js. Les middlewares interceptent les requêtes pour gérer les sessions, valider les données et formater les réponses JSON.',
    category: 'Technical Documentation',
    difficulty: 'Medium',
    language: 'French'
  },
  {
    id: 'fr-tech-hard',
    title: 'Conteneurs Docker',
    content: 'Les fichiers Dockerfile définissent les étapes de construction d\'une image système minimale. Ils permettent de garantir l\'homogénéité des environnements de développement, de test et de production.',
    category: 'Technical Documentation',
    difficulty: 'Hard',
    language: 'French'
  },
  {
    id: 'fr-poetry-easy',
    title: 'Muguet de Mai',
    content: 'Clochettes blanches du joli mois de mai, vous dansez doucement au fond des forêts. Le printemps est de retour pour nous donner du bonheur.',
    category: 'Poetry',
    difficulty: 'Easy',
    language: 'French'
  },
  {
    id: 'fr-poetry-medium',
    title: 'Paul Verlaine',
    content: 'Il pleure dans mon cœur comme il pleut sur la ville; quelle est cette langueur qui pénètre mon cœur? Ô bruit doux de la pluie par terre et sur les toits!',
    category: 'Poetry',
    difficulty: 'Medium',
    language: 'French'
  },
  {
    id: 'fr-poetry-hard',
    title: 'Charles Baudelaire',
    content: 'La Nature est un temple où de vivants piliers laissent parfois sortir de confuses paroles; l\'homme y passe à travers des forêts de symboles qui l\'observent avec des regards familiers.',
    category: 'Poetry',
    difficulty: 'Hard',
    language: 'French'
  },

  // ─── GERMAN ────────────────────────────────────────────────────────────────
  {
    id: 'de-general-easy',
    title: 'Schöner Nachmittag',
    content: 'Guten Tag! Das Wetter ist heute sehr schön. Ich trinke gerne Tee und lese ein gutes Buch am Nachmittag.',
    category: 'English',
    difficulty: 'Easy',
    language: 'German'
  },
  {
    id: 'de-general-medium',
    title: 'Tägliche Übung',
    content: 'Schnelles Tippen auf der Tastatur ist eine wichtige Fähigkeit in der modernen Welt. Übung macht den Meister, also nimm dir jeden Tag etwas Zeit dafür.',
    category: 'English',
    difficulty: 'Medium',
    language: 'German'
  },
  {
    id: 'de-general-hard',
    title: 'Quantenphänomen',
    content: 'Die Quantenverschränkung beschreibt ein Phänomen, bei dem zwei Teilchen unabhängig von ihrer Entfernung einen gemeinsamen Zustand teilen (EPR-Paradoxon).',
    category: 'English',
    difficulty: 'Hard',
    language: 'German'
  },
  {
    id: 'de-code-easy',
    title: 'Hallo Welt',
    content: '// Einfache Konsolenausgabe in JavaScript\nfunction sagHallo(name) {\n  console.log("Hallo, " + name + "!");\n}',
    category: 'Code Snippets',
    difficulty: 'Easy',
    language: 'German'
  },
  {
    id: 'de-code-medium',
    title: 'Klasse Auto',
    content: 'class Auto {\n  constructor(marke, modell) {\n    this.marke = marke;\n    this.modell = modell;\n    this.geschwindigkeit = 0;\n  }\n  beschleunigen(wert) {\n    this.geschwindigkeit += wert;\n  }\n}',
    category: 'Code Snippets',
    difficulty: 'Medium',
    language: 'German'
  },
  {
    id: 'de-code-hard',
    title: 'Zustandshaken',
    content: 'import { useState, useEffect } from \'react\';\nexport function useDatenLaden(url) {\n  const [daten, setDaten] = useState(null);\n  useEffect(() => {\n    fetch(url).then(res => res.json()).then(setDaten);\n  }, [url]);\n  return daten;\n}',
    category: 'Code Snippets',
    difficulty: 'Hard',
    language: 'German'
  },
  {
    id: 'de-quote-easy',
    title: 'Albert Einstein',
    content: 'Fantasie ist wichtiger als Wissen, denn Wissen ist begrenzt. Lernen ist Erfahrung. Alles andere ist einfach nur Information.',
    category: 'Quotes',
    difficulty: 'Easy',
    language: 'German'
  },
  {
    id: 'de-quote-medium',
    title: 'Johann Wolfgang von Goethe',
    content: 'Auch aus Steinen, die einem in den Weg gelegt werden, kann man Schönes bauen. Es ist nicht genug, zu wissen, man muss auch anwenden; es ist nicht genug, zu wollen, man muss auch tun.',
    category: 'Quotes',
    difficulty: 'Medium',
    language: 'German'
  },
  {
    id: 'de-quote-hard',
    title: 'Friedrich Nietzsche',
    content: 'Wer von seinem Tage nicht zwei Drittel für sich hat, ist ein Sklave, er sei übrigens wer er wolle: Staatsmann, Kaufmann, Beamter, Gelehrter. Ohne Musik wäre das Leben ein Irrtum.',
    category: 'Quotes',
    difficulty: 'Hard',
    language: 'German'
  },
  {
    id: 'de-tech-easy',
    title: 'Projekt Starten',
    content: 'Um das Projekt lokal zu starten, verwenden Sie den Befehl npm run dev. Dadurch wird ein lokaler Webserver geöffnet, der unter der Adresse http://localhost:3000 erreichbar ist.',
    category: 'Technical Documentation',
    difficulty: 'Easy',
    language: 'German'
  },
  {
    id: 'de-tech-medium',
    title: 'Objektorientierung',
    content: 'Die objektorientierte Programmierung (OOP) strukturiert Software als Sammlung von Objekten, die Daten und Verhalten kapseln. Wichtige Konzepte sind Vererbung, Polymorphie und Kapselung.',
    category: 'Technical Documentation',
    difficulty: 'Medium',
    language: 'German'
  },
  {
    id: 'de-tech-hard',
    title: 'Kryptografische Signatur',
    content: 'Asymmetrische Verschlüsselungsverfahren nutzen ein Schlüsselpaar aus privatem und öffentlichem Schlüssel. Der private Schlüssel dient der Signatur, der öffentliche der Verifizierung der Nachricht.',
    category: 'Technical Documentation',
    difficulty: 'Hard',
    language: 'German'
  },
  {
    id: 'de-poetry-easy',
    title: 'Sommerwind',
    content: 'Die Sonne lacht, der Wind weht lind, im grünen Gras spielt fröhlich ein Kind. Der Sommer kommt, das Herz wird weit und voller Freude ist diese Zeit.',
    category: 'Poetry',
    difficulty: 'Easy',
    language: 'German'
  },
  {
    id: 'de-poetry-medium',
    title: 'Heinrich Heine',
    content: 'Ich weiß nicht, was soll es bedeuten, dass ich so traurig bin; ein Märchen aus alten Zeiten, das kommt mir nicht aus dem Sinn. Die Luft ist kühl und es dunkelt.',
    category: 'Poetry',
    difficulty: 'Medium',
    language: 'German'
  },
  {
    id: 'de-poetry-hard',
    title: 'Goethe Erlkönig',
    content: 'Wer reitet so spät durch Nacht und Wind? Es ist der Vater mit seinem Kind; er hat den Knaben wohl in dem Arm, er fasst ihn sicher, er hält ihn warm. Mein Sohn, was birgst du so bang dein Gesicht?',
    category: 'Poetry',
    difficulty: 'Hard',
    language: 'German'
  },

  // ─── JAPANESE (ROMAJI) ─────────────────────────────────────────────────────
  {
    id: 'ja-general-easy',
    title: 'Ii Tenki',
    content: 'Konnichiwa! Kyou wa ii tenki desu ne. Watashi wa mainichi pasokon de taipingu no renshuu wo shite imasu.',
    category: 'English',
    difficulty: 'Easy',
    language: 'Japanese'
  },
  {
    id: 'ja-general-medium',
    title: 'Seikaku Taipingu',
    content: 'Taipingu wo hayaku suru tame ni wa, seikakusa ga mottomo juuyou desu. Mainichi renshuu sureba, shizen to yubi ga ugoku youni narimasu.',
    category: 'English',
    difficulty: 'Medium',
    language: 'Japanese'
  },
  {
    id: 'ja-general-hard',
    title: 'Full Stack Dev',
    content: 'Furu-stakku kaihatsusha wa, frontend (React/Next.js) to backend (Node.js/Express) no ryouhou no gijutsu wo rikai suru hitsuyou ga arimasu.',
    category: 'English',
    difficulty: 'Hard',
    language: 'Japanese'
  },
  {
    id: 'ja-code-easy',
    title: 'Kansu Nyuryoku',
    content: '// JavaScript no kantan na kansu\nfunction aisatsu(namae) {\n  return "Konnichiwa, " + namae + "-san!";\n}',
    category: 'Code Snippets',
    difficulty: 'Easy',
    language: 'Japanese'
  },
  {
    id: 'ja-code-medium',
    title: 'Haiki Yoso Map',
    content: 'const shuzui = [1, 2, 3, 4, 5];',
    category: 'Code Snippets',
    difficulty: 'Medium',
    language: 'Japanese'
  }
];