import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Layers,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Bot,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCw,
  Search,
  ArrowRight,
  Clock,
  AlertTriangle,
  Upload,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel } from "@/components/cs/ui";
import { CyberSticker, WavyCyberGrid, MemphisDoodle } from "@/components/cs/CyberDecorations";
import { DEMO_COURSES, type DemoCourse } from "@/lib/demo";
import { extractTextFromDocument } from "@/lib/document-parser";
import { generateStudyQuizApi, generateFlashcardsApi } from "@/lib/gemma-client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apprendre")({
  head: () => ({
    meta: [
      { title: "Espace Étudiant & Révision — CyberSafe Online" },
      {
        name: "description",
        content:
          "Tableau de bord étudiant, bibliothèque de cours, quiz interactifs, examens blancs, flashcards et suivi de progression propulsés par Google Gemma.",
      },
    ],
  }),
  component: StudentSpacePage,
});

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  binaryStatement?: string;
  binaryAnswer?: boolean;
  binaryExplanation?: string;
  mcqQuestion?: string;
  mcqOptions?: string[];
  mcqAnswerIndex?: number;
  mcqExplanation?: string;
}

export function normalizeFlashcard(rawCard?: Partial<Flashcard> | null, index: number = 0): Flashcard {
  const card = rawCard || {};
  const front = card.front?.trim() || `Concept clé ${index + 1}`;
  const back = card.back?.trim() || "Consultez les notes pour la définition complète.";

  const binaryStatement = card.binaryStatement?.trim() || front;
  const binaryAnswer = typeof card.binaryAnswer === "boolean" ? card.binaryAnswer : true;
  const binaryExplanation = card.binaryExplanation?.trim() || back;

  const mcqQuestion = card.mcqQuestion?.trim() || front;
  let mcqOptions: string[];
  if (Array.isArray(card.mcqOptions) && card.mcqOptions.length >= 2) {
    mcqOptions = card.mcqOptions.map(String);
  } else {
    mcqOptions = [
      back,
      "Ce mécanisme n'a aucun impact direct sur la sécurité opérationnelle.",
      "Il s'agit d'une recommandation optionnelle non normalisée.",
      "Cette pratique est déconseillée par les standards de sécurité.",
    ];
  }
  const mcqAnswerIndex =
    typeof card.mcqAnswerIndex === "number" &&
    card.mcqAnswerIndex >= 0 &&
    card.mcqAnswerIndex < mcqOptions.length
      ? card.mcqAnswerIndex
      : 0;
  const mcqExplanation = card.mcqExplanation?.trim() || back;

  return {
    id: card.id || `fc-${index + 1}`,
    front,
    back,
    mastered: Boolean(card.mastered),
    binaryStatement,
    binaryAnswer,
    binaryExplanation,
    mcqQuestion,
    mcqOptions,
    mcqAnswerIndex,
    mcqExplanation,
  };
}

export interface StoredCourseItem {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  content: string;
  fileType: "pdf" | "docx" | "pptx" | "txt" | "md" | "manual";
  createdAt: string;
  flashcards: Flashcard[];
}

export interface QuizAttempt {
  id: string;
  courseTitle: string;
  subject: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  weakTopics: string[];
}

const COURSES_STORAGE_KEY = "cybersafe_student_courses_v1";
const QUIZ_HISTORY_KEY = "cybersafe_student_quiz_history_v1";
const ACTIVE_COURSE_KEY = "cybersafe_student_course";

const SUBJECT_LIST = [
  "Tous",
  "Cybersécurité & Réseaux",
  "Informatique & Programmation",
  "Droit & Sciences Juridiques",
  "Mathématiques & Algèbre",
  "Économie, Finance & Gestion",
  "Physique, Chimie & SVT",
];

export function StudentSpacePage() {
  const { lang } = useI18n();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "quiz" | "flashcards" | "progress">("overview");
  const [courses, setCourses] = useState<StoredCourseItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Cybersécurité & Réseaux");
  const [newExamDate, setNewExamDate] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeQuizCourse, setActiveQuizCourse] = useState<StoredCourseItem | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const [activeFlashcardCourse, setActiveFlashcardCourse] = useState<StoredCourseItem | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // Mode Flashcard: Format QCM (Bonne Réponse) exclusif remplaçant le mode Oui / Non
  const [flashcardMode, setFlashcardMode] = useState<"binary" | "mcq">("mcq");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedBinaryAnswer, setSelectedBinaryAnswer] = useState<boolean | null>(null);
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [flashcardSessionScore, setFlashcardSessionScore] = useState(0);
  const [flashcardSessionAttempts, setFlashcardSessionAttempts] = useState(0);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COURSES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalizedCourses: StoredCourseItem[] = parsed.map((c: any) => ({
            ...c,
            flashcards: Array.isArray(c.flashcards) && c.flashcards.length > 0
              ? c.flashcards.map((f: any, idx: number) => normalizeFlashcard(f, idx))
              : generateFlashcardsForContent(c.title || "Cours", c.content || ""),
          }));
          setCourses(normalizedCourses);
          return;
        }
      }

      const initial: StoredCourseItem[] = [];
      setCourses(initial);
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(initial));
    } catch {
    }

    try {
      const qHist = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (qHist) {
        setQuizHistory(JSON.parse(qHist));
      } else {
        const initialAttempt: QuizAttempt = {
          id: "init-1",
          courseTitle: "Sécurité des Paiements Mobiles (LBS)",
          subject: "Cybersécurité & Réseaux",
          date: new Date(Date.now() - 86400000).toISOString(),
          score: 75,
          totalQuestions: 4,
          correctAnswers: 3,
          weakTopics: ["Authentification USSD sécurisée"],
        };
        setQuizHistory([initialAttempt]);
        localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify([initialAttempt]));
      }
    } catch {}
  }, []);

  const saveCoursesToStorage = (updated: StoredCourseItem[]) => {
    setCourses(updated);
    try {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  function generateFlashcardsForContent(title: string, text: string): Flashcard[] {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 20);
    const cards: Flashcard[] = [];
    if (lines.length >= 2 && lines[0] && lines[1]) {
      const line0 = lines[0];
      const line1 = lines[1];
      cards.push(
        normalizeFlashcard(
          {
            id: "fc-1",
            front: `Définition / Règle clé pour : ${title}`,
            back: line0,
            binaryStatement: `${title} : ${line0}`,
            binaryAnswer: true,
            binaryExplanation: `Exact. Selon le cours, ${line0}`,
            mcqQuestion: `Concernant ${title}, quelle est l'affirmation correcte ?`,
            mcqOptions: [
              line0,
              "Cette notion a été dépréciée et n'est plus applicable.",
              "Ce principe ne s'applique qu'aux systèmes non connectés.",
              "Cette pratique est déconseillée par les standards de sécurité.",
            ],
            mcqAnswerIndex: 0,
            mcqExplanation: `Explication pédagogique : ${line0}`,
            mastered: false,
          },
          0
        )
      );
      cards.push(
        normalizeFlashcard(
          {
            id: "fc-2",
            front: "Notion essentielle à retenir pour l'examen",
            back: line1,
            binaryStatement: `Le cours indique expressément : ${line1}`,
            binaryAnswer: true,
            binaryExplanation: `Vrai. C'est un élément fondamental vérifié lors des évaluations : ${line1}`,
            mcqQuestion: `Quelle notion clé est associée à ${title} ?`,
            mcqOptions: [
              line1,
              "Aucune vérification n'est requise pour ce composant.",
              "Cette méthode est réservée à des fins purement théoriques.",
              "Ce mécanisme affaiblit la résilience opérationnelle.",
            ],
            mcqAnswerIndex: 0,
            mcqExplanation: `Détail : ${line1}`,
            mastered: false,
          },
          1
        )
      );
      if (lines[2]) {
        cards.push(
          normalizeFlashcard(
            {
              id: "fc-3",
              front: "Exemple pratique ou protocole d'application",
              back: lines[2],
              binaryStatement: `Dans le cadre de ${title}, la règle suivante est considérée comme proscrite : ${lines[2]}`,
              binaryAnswer: false,
              binaryExplanation: `Faux. L'affirmation formulée est en réalité préconisée selon le cours : ${lines[2]}`,
              mcqQuestion: `Quel protocole d'application est recommandé pour ${title} ?`,
              mcqOptions: [
                lines[2],
                "Ignorer systématiquement les alertes d'incompatibilité.",
                "Désactiver l'authentification lors des transferts.",
                "Révéler les clés de session aux interlocuteurs tiers.",
              ],
              mcqAnswerIndex: 0,
              mcqExplanation: `Explication pédagogique : ${lines[2]}`,
              mastered: false,
            },
            2
          )
        );
      }
    } else {
      const summary = text.slice(0, 160) || `Notions fondamentales de ${title}`;
      cards.push(
        normalizeFlashcard(
          {
            id: "fc-def",
            front: `Concept principal : ${title}`,
            back: summary,
            binaryStatement: `${title} porte sur les principes suivants : ${summary}`,
            binaryAnswer: true,
            binaryExplanation: `Vrai. Résumé direct du cours : ${summary}`,
            mcqQuestion: `Quel est l'objectif central du cours « ${title} » ?`,
            mcqOptions: [
              summary,
              "Remplacer les standards par des pratiques obsolètes.",
              "Déléguer la sécurité sans contrôle préalable.",
              "Ignorer les risques d'usurpation d'identité.",
            ],
            mcqAnswerIndex: 0,
            mcqExplanation: `Explication détaillée : ${summary}`,
            mastered: false,
          },
          0
        )
      );
    }
    return cards;
  }

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (15 Mo maximum).");
      return;
    }

    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
    setIsParsingDoc(true);

    try {
      toast.loading(`Lecture du document "${file.name}"...`, { id: "doc-read" });
      const parsedDoc = await extractTextFromDocument(file, file.name);
      toast.dismiss("doc-read");
      const extractedText = parsedDoc.text;

      setNewTitle(cleanTitle);
      setNewContent(extractedText);

      const lower = (cleanTitle + " " + extractedText.slice(0, 1500)).toLowerCase();
      if (lower.includes("droit") || lower.includes("juridique") || lower.includes("loi")) {
        setNewSubject("Droit & Sciences Juridiques");
      } else if (lower.includes("math") || lower.includes("algèbre") || lower.includes("théorème")) {
        setNewSubject("Mathématiques & Algèbre");
      } else if (lower.includes("code") || lower.includes("python") || lower.includes("algorithme")) {
        setNewSubject("Informatique & Programmation");
      } else if (lower.includes("éco") || lower.includes("gestion") || lower.includes("finance")) {
        setNewSubject("Économie, Finance & Gestion");
      }

      toast.success(`Fichier [${parsedDoc.format.toUpperCase()}] "${file.name}" chargé avec succès (${parsedDoc.wordCount} mots) !`);
    } catch (err: any) {
      toast.dismiss("doc-read");
      toast.error(err.message || "Erreur lors de la lecture du fichier.");
    } finally {
      setIsParsingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Veuillez renseigner au minimum un titre et du contenu.");
      return;
    }

    const newCourseItem: StoredCourseItem = {
      id: `course-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject,
      examDate: newExamDate || "2026-11-08",
      content: newContent.trim(),
      fileType: "manual",
      createdAt: new Date().toISOString(),
      flashcards: generateFlashcardsForContent(newTitle.trim(), newContent.trim()),
    };

    const updated = [newCourseItem, ...courses];
    saveCoursesToStorage(updated);

    try {
      localStorage.setItem(
        ACTIVE_COURSE_KEY,
        JSON.stringify({
          title: newCourseItem.title,
          subject: newCourseItem.subject,
          content: newCourseItem.content,
          examDate: newCourseItem.examDate,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}

    toast.success(`Cours "${newCourseItem.title}" ajouté à votre bibliothèque !`);
    setShowAddModal(false);
    setNewTitle("");
    setNewContent("");
    setNewExamDate("");
  };

  const handleDeleteCourse = (id: string, title: string) => {
    if (window.confirm(`Supprimer définitivement le cours "${title}" ?`)) {
      const updated = courses.filter((c) => c.id !== id);
      saveCoursesToStorage(updated);
      toast.success("Cours supprimé.");
    }
  };

  const launchBotWithCourse = (course: StoredCourseItem, command: "/apprendre" | "/plan" | "/quiz" | "/resume") => {
    try {
      localStorage.setItem(
        ACTIVE_COURSE_KEY,
        JSON.stringify({
          title: course.title,
          subject: course.subject,
          content: course.content,
          examDate: course.examDate,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}
    toast.info(`Ouverture de l'Assistant avec ${command}...`);
    navigate({ to: "/assistant", search: { cmd: command } });
  };

  const buildTopicGroundedQuiz = (course: StoredCourseItem) => {
    const lower = (course.title + " " + course.subject + " " + course.content.slice(0, 500)).toLowerCase();

    if (lower.includes("math") || lower.includes("algèbre") || lower.includes("calcul")) {
      return [
        {
          id: 1,
          question: `Dans le cours "${course.title}", quelle est la propriété fondamentale des fonctions continues sur un intervalle fermé borné ?`,
          options: [
            "Le théorème des valeurs intermédiaires garantit qu'elles atteignent toutes les valeurs comprises entre leurs bornes",
            "Elles sont obligatoirement strictement croissantes sur tout R",
            "Leur dérivée seconde est nulle en tout point",
            "Elles n'admettent aucun maximum local",
          ],
          answerIndex: 0,
          explanation: "Le théorème des valeurs intermédiaires est le résultat fondamental d'analyse pour toute fonction continue sur un compact.",
        },
        {
          id: 2,
          question: "Quelle méthode matricielle permet de résoudre un système d'équations linéaires de dimension N ?",
          options: [
            "L'élimination de Gauss-Jordan",
            "Le crible d'Ératosthène",
            "L'algorithme de Dijkstra",
            "Le théorème de Shannon",
          ],
          answerIndex: 0,
          explanation: "Le pivot de Gauss / Gauss-Jordan est la méthode canonique de résolution des systèmes linéaires.",
        },
        {
          id: 3,
          question: "En probabilités, si deux événements A et B sont indépendants, quelle relation est toujours vérifiée ?",
          options: [
            "P(A ∩ B) = P(A) × P(B)",
            "P(A ∪ B) = P(A) + P(B)",
            "P(A) + P(B) = 1",
            "P(A | B) = 0",
          ],
          answerIndex: 0,
          explanation: "L'indépendance probabiliste est définie rigoureusement par la factorisation de la probabilité conjointe.",
        },
      ];
    }

    if (lower.includes("code") || lower.includes("python") || lower.includes("programmation") || lower.includes("algo")) {
      return [
        {
          id: 1,
          question: `Pour le module "${course.title}", quelle structure garantit un temps d'accès moyen en O(1) pour la recherche de clé ?`,
          options: [
            "La table de hachage (Hash Map ou Dictionnaire)",
            "La liste simplement chaînée",
            "L'arbre binaire de recherche non équilibré",
            "La file d'attente (FIFO)",
          ],
          answerIndex: 0,
          explanation: "Les tables de hachage offrent une complexité temporelle amortie en O(1) grâce au calcul direct d'empreinte mémoire.",
        },
        {
          id: 2,
          question: "Quel principe de programmation orientée objet (POO) permet de cacher les détails d'implémentation interne d'une classe ?",
          options: [
            "L'encapsulation (attributs privés et accesseurs)",
            "Le polymorphisme ad hoc",
            "L'héritage multiple non contraint",
            "La compilation dynamique",
          ],
          answerIndex: 0,
          explanation: "L'encapsulation isole l'état interne d'un objet et ne l'expose que via une interface publique maîtrisée.",
        },
        {
          id: 3,
          question: "Dans une architecture logicielle sécurisée, pourquoi ne doit-on jamais stocker les mots de passe en clair ?",
          options: [
            "Il faut obligatoirement utiliser une fonction de hachage robuste avec sel (ex: Argon2 ou bcrypt)",
            "Parce que les disques durs ne peuvent pas écrire de texte alphabétique",
            "Car le protocole TCP rejette les mots de passe sans compression",
            "Pour économiser l'espace mémoire dans la base SQL",
          ],
          answerIndex: 0,
          explanation: "Le hachage cryptographique irréversible avec sel protège les utilisateurs en cas de fuite de la base de données.",
        },
      ];
    }

    if (lower.includes("droit") || lower.includes("loi") || lower.includes("juridique")) {
      return [
        {
          id: 1,
          question: `Dans le cadre juridique de "${course.title}", quelle est la force obligatoire d'un contrat valablement conclu ?`,
          options: [
            "Les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites",
            "Le contrat est révocable à tout moment par simple volonté unilatérale",
            "Seules les administrations publiques sont tenues de respecter leurs engagements",
            "Le contrat verbal n'engage jamais la responsabilité de son auteur",
          ],
          answerIndex: 0,
          explanation: "Le principe de la force obligatoire des contrats (Pacta sunt servanda) est la pierre angulaire du droit des obligations.",
        },
        {
          id: 2,
          question: "Quelle est la juridiction suprême commune en matière commerciale dans l'espace OHADA ?",
          options: [
            "La Cour Commune de Justice et d'Arbitrage (CCJA) à Abidjan",
            "La Cour Pénale Internationale",
            "Le Tribunal Arbitral du Sport",
            "La Commission de l'UEMOA",
          ],
          answerIndex: 0,
          explanation: "La CCJA est l'unique juridiction suprême de cassation pour les contentieux relevant du droit OHADA.",
        },
        {
          id: 3,
          question: "En droit pénal, quel adage consacre le principe de légalité des délits et des peines ?",
          options: [
            "Nullum crimen, nulla poena sine lege",
            "Pacta sunt servanda",
            "Nemo censetur ignorare legem",
            "De minimis non curat praetor",
          ],
          answerIndex: 0,
          explanation: "Ce principe cardinal interdit de punir une infraction qui n'a pas été préalablement définie par un texte de loi clair.",
        },
      ];
    }

    if (lower.includes("éco") || lower.includes("gestion") || lower.includes("finance")) {
      return [
        {
          id: 1,
          question: `Dans l'analyse économique de "${course.title}", que désigne le seuil de rentabilité (point mort) ?`,
          options: [
            "Le niveau d'activité (chiffre d'affaires) pour lequel le résultat net de l'entreprise est exactement égal à zéro",
            "Le montant maximal des dividendes versés aux actionnaires",
            "Le ratio de dette bancaire sur capitaux propres",
            "Le taux d'intérêt directeur fixé par la banque centrale",
          ],
          answerIndex: 0,
          explanation: "Le point mort correspond à l'équilibre où les revenus totaux couvrent précisément les charges fixes et variables.",
        },
        {
          id: 2,
          question: "Quelle institution monétaire émet le Franc CFA (XOF) au sein de la zone UMOA (Afrique de l'Ouest) ?",
          options: [
            "La BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)",
            "La Banque Mondiale",
            "Le FMI",
            "La BEAC",
          ],
          answerIndex: 0,
          explanation: "La BCEAO est la banque centrale commune aux 8 pays de l'Union Monétaire Ouest-Africaine.",
        },
        {
          id: 3,
          question: "En finance d'entreprise, que mesure le Besoin en Fonds de Roulement (BFR) ?",
          options: [
            "Le décalage de trésorerie entre les encaissements clients, les stocks et les décaissements fournisseurs",
            "Le total des investissements corporels amortissables",
            "La valeur boursière totale des capitaux propres",
            "La rentabilité financière des actifs liquides",
          ],
          answerIndex: 0,
          explanation: "Le BFR représente le montant nécessaire au financement du cycle d'exploitation courant de l'entreprise.",
        },
      ];
    }

    return [
      {
        id: 1,
        question: `Dans le cours "${course.title}", quelle est la règle absolue concernant le code PIN Mobile Money et le mot de passe temporaire (OTP) ?`,
        options: [
          "Ne JAMAIS les communiquer à quiconque : aucun agent légitime ne les réclame par téléphone ou SMS",
          "Les transmettre uniquement si l'appelant affirme être un inspecteur Togocom ou Moov",
          "Les stocker en clair dans une capture d'écran sur son téléphone",
          "Les envoyer par retour de SMS pour bloquer un prétendu piratage",
        ],
        answerIndex: 0,
        explanation: "Le code secret est strictement confidentiel. Tout appel réclamant un code secret constitue une tentative d'escroquerie caractérisée.",
      },
      {
        id: 2,
        question: "Devant un appel déclarant un dépôt d'argent 'par erreur' et exigeant un renvoi immédiat, que faut-il faire ?",
        options: [
          "Vérifier soi-même son solde réel via le code USSD officiel (*145# ou *155#) sans se fier au SMS reçu",
          "Renvoyer la somme tout de suite pour éviter d'être accusé de vol",
          "Éteindre son téléphone pendant plusieurs heures",
          "Donner son numéro de compte bancaire pour vérification",
        ],
        answerIndex: 0,
        explanation: "Les escrocs simulent de fausses notifications de réception de fonds. Seul le menu USSD officiel de l'opérateur atteste de la réalité du solde.",
      },
      {
        id: 3,
        question: "Quel protocole cryptographique garantit le chiffrement de bout en bout des échanges web ?",
        options: [
          "TLS (Transport Layer Security) via HTTPS",
          "FTP standard sur le port 21",
          "Telnet en clair",
          "Le protocole HTTP 1.0 sans certificat",
        ],
        answerIndex: 0,
        explanation: "TLS garantit la confidentialité, l'authenticité et l'intégrité des flux de données entre client et serveur.",
      },
      {
        id: 4,
        question: `Pour préparer efficacement l'évaluation du ${course.examDate || "prochainement"}, quelle méthode offre la meilleure rétention ?`,
        options: [
          "La répétition active espacée avec quiz quotidiens et révision des points faibles",
          "La lecture passive du texte une seule fois la veille au soir",
          "L'apprentissage sans compréhension des concepts fondamentaux",
          "L'impasse sur les chapitres identifiés comme difficiles",
        ],
        answerIndex: 0,
        explanation: "La répétition active espacée et le test régulier des connaissances sont validés par les sciences cognitives pour une mémorisation pérenne.",
      },
    ];
  };

  const startQuiz = async (course: StoredCourseItem) => {
    setActiveQuizCourse(course);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setAnsweredMap({});
    setQuizFinished(false);
    setGeneratingQuiz(true);
    setActiveTab("quiz");

    try {
      toast.loading("Génération du quiz sur mesure par Google Gemma...", { id: "quiz-gen" });
      const apiRes = await generateStudyQuizApi(course.title, course.subject, course.content, lang);
      toast.dismiss("quiz-gen");
      if (apiRes.quiz && apiRes.quiz.length > 0) {
        setQuizQuestions(apiRes.quiz);
        toast.success(`Quiz personnalisé généré par Gemma (${apiRes.quiz.length} questions) !`);
        setGeneratingQuiz(false);
        return;
      }
    } catch (err: any) {
      console.warn("Gemma hors-ligne pour quiz direct, activation fallback pédagogique:", err);
      toast.dismiss("quiz-gen");
      toast.info("Gemma temporairement indisponible (quota ou réseau). Mode entraînement activé.");
    } finally {
      setGeneratingQuiz(false);
    }

    const fallbackQuestions = buildTopicGroundedQuiz(course);
    setQuizQuestions(fallbackQuestions);
  };

  const handleSelectQuizOption = (optIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optIndex);
    setAnsweredMap((prev) => ({ ...prev, [currentQIndex]: optIndex }));
  };

  const handleNextQuizQuestion = () => {
    if (currentQIndex < quizQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAnswer(answeredMap[currentQIndex + 1] ?? null);
    } else {
      let correct = 0;
      const weak: string[] = [];
      quizQuestions.forEach((q, idx) => {
        if (answeredMap[idx] === q.answerIndex) {
          correct += 1;
        } else {
          weak.push(`Question ${idx + 1} : ${q.question.slice(0, 40)}...`);
        }
      });

      const finalScore = Math.round((correct / quizQuestions.length) * 100);
      setQuizScore(finalScore);
      setQuizFinished(true);

      const attempt: QuizAttempt = {
        id: `att-${Date.now()}`,
        courseTitle: activeQuizCourse?.title || "Quiz Général",
        subject: activeQuizCourse?.subject || "Général",
        date: new Date().toISOString(),
        score: finalScore,
        totalQuestions: quizQuestions.length,
        correctAnswers: correct,
        weakTopics: weak,
      };

      const updatedHistory = [attempt, ...quizHistory];
      setQuizHistory(updatedHistory);
      try {
        localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {}

      toast.success(`Quiz terminé ! Note : ${finalScore}%`);
    }
  };

  const startFlashcards = (course: StoredCourseItem) => {
    const normalizedCourse: StoredCourseItem = {
      ...course,
      flashcards: course.flashcards.map((f, idx) => normalizeFlashcard(f, idx)),
    };
    setActiveFlashcardCourse(normalizedCourse);
    setFlashcardIndex(0);
    setHasAnswered(false);
    setSelectedBinaryAnswer(null);
    setSelectedMcqAnswer(null);
    setIsAnswerCorrect(null);
    setIsFlipped(false);
    setActiveTab("flashcards");
  };

  const handleSwitchMode = (mode: "binary" | "mcq") => {
    setFlashcardMode(mode);
    setHasAnswered(false);
    setSelectedBinaryAnswer(null);
    setSelectedMcqAnswer(null);
    setIsAnswerCorrect(null);
    setIsFlipped(false);
  };

  const handleBinaryAnswer = (choice: boolean) => {
    if (hasAnswered || !activeFlashcardCourse) return;
    const rawCard = activeFlashcardCourse.flashcards[flashcardIndex];
    if (!rawCard) return;

    const currentCard = normalizeFlashcard(rawCard, flashcardIndex);
    const correct = choice === currentCard.binaryAnswer;

    setSelectedBinaryAnswer(choice);
    setHasAnswered(true);
    setIsAnswerCorrect(correct);
    setFlashcardSessionAttempts((prev) => prev + 1);

    if (correct) {
      setFlashcardSessionScore((prev) => prev + 1);
      if (!currentCard.mastered) {
        const updatedCards = [...activeFlashcardCourse.flashcards];
        updatedCards[flashcardIndex] = { ...currentCard, mastered: true };
        const updatedCourse = { ...activeFlashcardCourse, flashcards: updatedCards };
        setActiveFlashcardCourse(updatedCourse);
        const updatedList = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
        saveCoursesToStorage(updatedList);
      }
      toast.success("Bonne réponse ! Affirmation validée.");
    } else {
      toast.error("Inexact ! Consultez l'explication pédagogique.");
    }
  };

  const handleMcqAnswer = (optionIndex: number) => {
    if (hasAnswered || !activeFlashcardCourse) return;
    const rawCard = activeFlashcardCourse.flashcards[flashcardIndex];
    if (!rawCard) return;

    const currentCard = normalizeFlashcard(rawCard, flashcardIndex);
    const correct = optionIndex === currentCard.mcqAnswerIndex;

    setSelectedMcqAnswer(optionIndex);
    setHasAnswered(true);
    setIsAnswerCorrect(correct);
    setFlashcardSessionAttempts((prev) => prev + 1);

    if (correct) {
      setFlashcardSessionScore((prev) => prev + 1);
      if (!currentCard.mastered) {
        const updatedCards = [...activeFlashcardCourse.flashcards];
        updatedCards[flashcardIndex] = { ...currentCard, mastered: true };
        const updatedCourse = { ...activeFlashcardCourse, flashcards: updatedCards };
        setActiveFlashcardCourse(updatedCourse);
        const updatedList = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
        saveCoursesToStorage(updatedList);
      }
      toast.success("Excellente réponse ! Option exacte.");
    } else {
      toast.error("Choix incorrect ! Consultez l'explication.");
    }
  };

  const goToNextFlashcard = () => {
    if (!activeFlashcardCourse) return;
    if (flashcardIndex < activeFlashcardCourse.flashcards.length - 1) {
      setFlashcardIndex((prev) => prev + 1);
      setHasAnswered(false);
      setSelectedBinaryAnswer(null);
      setSelectedMcqAnswer(null);
      setIsAnswerCorrect(null);
      setIsFlipped(false);
    }
  };

  const goToPrevFlashcard = () => {
    if (flashcardIndex > 0) {
      setFlashcardIndex((prev) => prev - 1);
      setHasAnswered(false);
      setSelectedBinaryAnswer(null);
      setSelectedMcqAnswer(null);
      setIsAnswerCorrect(null);
      setIsFlipped(false);
    }
  };

  const toggleFlashcardMastered = () => {
    if (!activeFlashcardCourse) return;
    const cards = [...activeFlashcardCourse.flashcards];
    if (cards[flashcardIndex]) {
      cards[flashcardIndex] = {
        ...cards[flashcardIndex]!,
        mastered: !cards[flashcardIndex]!.mastered,
      };
      const updatedCourses = courses.map((c) =>
        c.id === activeFlashcardCourse.id ? { ...c, flashcards: cards } : c
      );
      saveCoursesToStorage(updatedCourses);
      setActiveFlashcardCourse({ ...activeFlashcardCourse, flashcards: cards });
      toast.success(cards[flashcardIndex]!.mastered ? "Marqué comme maîtrisé !" : "Remis à réviser");
    }
  };

  const handleRegenerateFlashcards = async () => {
    if (!activeFlashcardCourse) return;
    setGeneratingFlashcards(true);
    toast.loading("Génération des flashcards par Gemma...", { id: "fc-gen" });
    try {
      const cards = await generateFlashcardsApi(
        activeFlashcardCourse.title,
        activeFlashcardCourse.subject,
        activeFlashcardCourse.content,
        lang
      );
      toast.dismiss("fc-gen");
      if (cards && cards.length > 0) {
        const formatted: Flashcard[] = cards.map((c, idx) => normalizeFlashcard(c, idx));
        const updatedCourse = { ...activeFlashcardCourse, flashcards: formatted };
        setActiveFlashcardCourse(updatedCourse);
        const updatedList = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
        saveCoursesToStorage(updatedList);
        setFlashcardIndex(0);
        setHasAnswered(false);
        setSelectedBinaryAnswer(null);
        setSelectedMcqAnswer(null);
        setIsAnswerCorrect(null);
        setIsFlipped(false);
        toast.success(`${formatted.length} flashcards générées par Gemma !`);
      } else {
        toast.info("Aucune nouvelle carte générée.");
      }
    } catch (err: any) {
      toast.dismiss("fc-gen");
      toast.error(err.message || "Erreur lors de la génération des flashcards.");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const totalCourses = courses.length;
  const totalQuizzes = quizHistory.length;
  const avgScore = totalQuizzes > 0 ? Math.round(quizHistory.reduce((acc, q) => acc + q.score, 0) / totalQuizzes) : 0;
  const upcomingExams = courses.filter((c) => c.examDate).sort((a, b) => a.examDate.localeCompare(b.examDate));
  const nextExam = upcomingExams[0];

  const weakSubjects = Array.from(
    new Set(quizHistory.filter((q) => q.score < 70).map((q) => q.subject))
  );

  const filteredCourses = courses.filter((c) => {
    const matchSub = selectedSubject === "Tous" || c.subject === selectedSubject;
    const matchQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchQuery;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Espace Étudiant & Révision Augmentée"
        subtitle="Organisez vos cours, passez des quiz générés par Gemma 4, mémorisez avec des flashcards et suivez votre progression d'examen."
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="lime" icon={Sparkles} rotate="none">
            Gemma 4 Study Studio
          </CyberSticker>
          <CyberSticker tone="purple" icon={GraduationCap} rotate="none">
            Répétition Espacée
          </CyberSticker>
          <Button
            size="sm"
            variant="neo"
            onClick={() => setShowAddModal(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" /> Ajouter un cours
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="gap-1.5 border-2 border-foreground/15 shadow-neo-sm font-bold"
          >
            <Link to="/assistant">
              <Bot className="size-4 text-electric" /> Mode Bot (/apprendre)
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex overflow-x-auto border-b-2 border-foreground/15 pb-2 scrollbar-none gap-2">
        {[
          { id: "overview", label: "Tableau de Bord", icon: TrendingUp },
          { id: "courses", label: `Bibliothèque (${courses.length})`, icon: BookOpen },
          { id: "quiz", label: "Quiz & Examens Blancs", icon: HelpCircle },
          { id: "flashcards", label: "Flashcards Mémo", icon: Layers },
          { id: "progress", label: "Progression & Résultats", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shrink-0 border-2",
                active
                  ? "border-foreground bg-primary text-primary-foreground shadow-neo-sm"
                  : "border-foreground/10 bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-card"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6 animate-rise">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Panel className="p-4 flex items-center gap-3 border-2 border-foreground/15 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/20">
                <BookOpen className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-black">{totalCourses}</div>
                <div className="text-xs text-muted-foreground font-medium">Cours enregistrés</div>
              </div>
            </Panel>

            <Panel className="p-4 flex items-center gap-3 border-2 border-foreground/15 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-electric/10 text-electric border-2 border-electric/20">
                <HelpCircle className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-black">{totalQuizzes}</div>
                <div className="text-xs text-muted-foreground font-medium">Quiz passés</div>
              </div>
            </Panel>

            <Panel className="p-4 flex items-center gap-3 border-2 border-foreground/15 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20">
                <Award className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-black">{avgScore}%</div>
                <div className="text-xs text-muted-foreground font-medium">Moyenne générale</div>
              </div>
            </Panel>

            <Panel className="p-4 flex items-center gap-3 border-2 border-foreground/15 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 border-2 border-amber-500/20">
                <Calendar className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black truncate">
                  {nextExam ? nextExam.examDate : "Aucune"}
                </div>
                <div className="text-xs text-muted-foreground truncate font-medium">
                  {nextExam ? nextExam.title : "Prochain examen"}
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="border-2 border-foreground/20 bg-card shadow-neo p-5 space-y-3 relative overflow-hidden">
            <WavyCyberGrid opacity={0.06} />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-electric">
                <Sparkles className="size-4" /> Recommandation d'Étude Proactive de Gemma 4
              </div>
              <CyberSticker tone="cyan" rotate="none">
                IA Adaptative
              </CyberSticker>
            </div>
            <p className="relative z-10 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {weakSubjects.length > 0 ? (
                <>
                  D'après vos récents quiz, vous avez des lacunes identifiées en{" "}
                  <strong className="text-destructive font-semibold">{weakSubjects.join(", ")}</strong>.
                  Nous vous suggérons de générer un plan de renforcement sur 3 jours avec la commande{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">/plan</code> ou de réviser les flashcards associées avant de retenter un examen blanc.
                </>
              ) : (
                <>
                  Excellent rythme de travail ! Vos scores récents sont solides. Pour consolider vos acquis jusqu'à votre prochaine date d'examen ({nextExam?.examDate || "prochainement"}), passez en revue les <strong>flashcards mémo</strong> et testez-vous avec un <strong>examen blanc chronométré</strong>.
                </>
              )}
            </p>
            <div className="relative z-10 pt-1 flex flex-wrap gap-2">
              {nextExam && (
                <Button
                  size="sm"
                  variant="hero"
                  onClick={() => startQuiz(nextExam)}
                  className="gap-1.5 text-xs shadow-neo-sm"
                >
                  <HelpCircle className="size-3.5" /> Lancer le quiz du jour : {nextExam.title.slice(0, 25)}...
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                asChild
                className="gap-1.5 text-xs border-2 border-foreground/15 shadow-neo-sm font-semibold"
              >
                <Link to="/assistant">
                  <Bot className="size-3.5" /> Discuter avec Gemma (/resume, /plan)
                </Link>
              </Button>
            </div>
          </Panel>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Vos Cours Récents
              </h3>
              <button
                onClick={() => setActiveTab("courses")}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Voir tous les cours <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {courses.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border-2 border-foreground/15 bg-card p-4 space-y-3 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {c.subject}
                    </span>
                    <h4 className="font-bold text-sm leading-snug">{c.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.content.slice(0, 120)}...
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Calendar className="size-3 text-amber-500" /> {c.examDate || "Non définie"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startFlashcards(c)}
                        className="size-7 p-0 hover:bg-electric/15"
                        title="Réviser les Flashcards"
                      >
                        <Layers className="size-3.5 text-electric" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startQuiz(c)}
                        className="size-7 p-0 hover:bg-primary/15"
                        title="Lancer le Quiz"
                      >
                        <HelpCircle className="size-3.5 text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="space-y-4 animate-rise">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm border-2 border-foreground/15 shadow-neo-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {SUBJECT_LIST.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all border-2",
                    selectedSubject === sub
                      ? "border-foreground bg-primary text-primary-foreground shadow-neo-sm"
                      : "border-foreground/10 bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-sm"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <Panel className="text-center py-12 space-y-3 border-2 border-foreground/15 shadow-neo-sm">
              <BookOpen className="size-10 text-muted-foreground mx-auto" />
              <p className="font-bold text-sm">Aucun cours trouvé</p>
              <p className="text-xs text-muted-foreground">
                Ajoutez un cours ou réinitialisez vos filtres pour commencer vos révisions.
              </p>
              <Button size="sm" variant="neo" onClick={() => setShowAddModal(true)}>
                <Plus className="size-4" /> Ajouter un nouveau cours
              </Button>
            </Panel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((c) => (
                <Panel key={c.id} className="flex flex-col justify-between p-5 space-y-4 border-2 border-foreground/15 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <CyberSticker tone="cyan" rotate="none">
                        {c.subject}
                      </CyberSticker>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <h3 className="font-bold text-base leading-snug">{c.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {c.content}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="size-3.5 text-amber-500" /> Examen : {c.examDate || "Non fixée"}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Layers className="size-3.5 text-electric" /> {c.flashcards.length} cartes
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startQuiz(c)}
                        className="text-xs gap-1 px-2 border-2 border-foreground/15 shadow-neo-sm font-bold"
                      >
                        <HelpCircle className="size-3 text-primary" /> Quiz
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startFlashcards(c)}
                        className="text-xs gap-1 px-2 border-2 border-foreground/15 shadow-neo-sm font-bold"
                      >
                        <Layers className="size-3 text-electric" /> Cartes
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => launchBotWithCourse(c, "/plan")}
                        className="text-xs gap-1 px-2 text-primary hover:bg-primary/10 font-bold"
                        title="Demander un plan personnalisé à Gemma"
                      >
                        <Bot className="size-3" /> /plan
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "quiz" && (
        <div className="space-y-4 animate-rise max-w-2xl mx-auto">
          {!activeQuizCourse ? (
            <Panel className="text-center py-10 space-y-3 border-2 border-foreground/15 shadow-neo">
              <HelpCircle className="size-10 text-primary mx-auto" />
              <h3 className="font-bold text-base">Sélectionnez un cours pour commencer un quiz</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Testez vos connaissances en conditions d'examen. Gemma génère des explications adaptatives pour chaque proposition.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {courses.slice(0, 3).map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    onClick={() => startQuiz(c)}
                    className="border-2 border-foreground/15 shadow-neo-sm font-bold"
                  >
                    {c.title.slice(0, 25)}...
                  </Button>
                ))}
              </div>
            </Panel>
          ) : generatingQuiz ? (
            <Panel className="text-center py-12 space-y-4 border-2 border-foreground/15 shadow-neo">
              <div className="grid size-14 mx-auto place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse border-2 border-primary/20">
                <Sparkles className="size-7 text-electric animate-spin" />
              </div>
              <h3 className="text-lg font-bold">Google Gemma prépare votre quiz sur mesure...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Analyse du contenu et génération de questions interactives adaptées.
              </p>
            </Panel>
          ) : quizFinished ? (
            <Panel className="text-center py-8 space-y-4 border-2 border-foreground/20 shadow-neo">
              <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-primary/10 text-primary shadow-neo-sm border-2 border-primary/30">
                <Award className="size-8" />
              </div>
              <h3 className="text-2xl font-black font-display">Résultat de votre Quiz</h3>
              <div className="text-4xl font-black text-primary">{quizScore}%</div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {quizScore >= 75
                  ? "Félicitations ! Vous maîtrisez parfaitement les concepts clés de ce cours."
                  : quizScore >= 50
                    ? "Bon score ! Révisez les points d'explication ci-dessous pour viser l'excellence."
                    : "Des notions sont encore fragiles. Consultez vos flashcards ou demandez un résumé à Gemma."}
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <Button size="sm" variant="neo" onClick={() => startQuiz(activeQuizCourse)}>
                  <RotateCw className="size-4" /> Recommencer ce quiz
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("courses")} className="border-2 border-foreground/15 shadow-neo-sm font-bold">
                  Choisir un autre cours
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel className="space-y-5 border-2 border-foreground/20 shadow-neo">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {activeQuizCourse.subject}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {activeQuizCourse.title}
                  </h3>
                </div>
                <CyberSticker tone="lime" rotate="none">
                  Question {currentQIndex + 1}/{quizQuestions.length}
                </CyberSticker>
              </div>

              {quizQuestions[currentQIndex] && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-foreground leading-snug">
                    {quizQuestions[currentQIndex].question}
                  </h4>

                  <div className="space-y-2">
                    {quizQuestions[currentQIndex].options.map((opt: string, idx: number) => {
                      const isPicked = selectedAnswer === idx;
                      const isCorrect = idx === quizQuestions[currentQIndex].answerIndex;
                      const hasAnswered = selectedAnswer !== null;

                      let btnStyle = "border-foreground/15 bg-card hover:border-foreground hover:shadow-neo-sm hover:translate-x-0.5";
                      if (hasAnswered) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-neo-sm";
                        } else if (isPicked) {
                          btnStyle = "border-destructive bg-destructive/15 text-destructive shadow-neo-sm";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => handleSelectQuizOption(idx)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-3 shadow-sm",
                            btnStyle
                          )}
                        >
                          <span>{opt}</span>
                          {hasAnswered && isCorrect && (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                          )}
                          {hasAnswered && isPicked && !isCorrect && (
                            <XCircle className="size-4 shrink-0 text-destructive" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswer !== null && (
                    <div className="rounded-xl border-2 border-primary/30 bg-muted/50 p-3.5 text-xs space-y-1 shadow-neo-sm animate-rise">
                      <div className="font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-electric" /> Explication Pédagogique Gemma :
                      </div>
                      <p className="text-muted-foreground leading-relaxed font-medium">
                        {quizQuestions[currentQIndex].explanation}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="hero"
                      disabled={selectedAnswer === null}
                      onClick={handleNextQuizQuestion}
                      className="gap-1.5 shadow-neo-sm"
                    >
                      {currentQIndex === quizQuestions.length - 1 ? "Voir les résultats" : "Question suivante"}{" "}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>
      )}

      {activeTab === "flashcards" && (
        <div className="space-y-4 animate-rise max-w-xl mx-auto">
          {!activeFlashcardCourse || activeFlashcardCourse.flashcards.length === 0 ? (
            <Panel className="text-center py-10 space-y-3 border-2 border-foreground/15 shadow-neo dark:border-foreground/20 dark:bg-card">
              <Layers className="size-10 text-electric mx-auto" />
              <h3 className="font-bold text-base">
                {!activeFlashcardCourse
                  ? "Sélectionnez un cours pour réviser les flashcards (0 carte active)"
                  : "Aucune carte disponible dans ce cours (0 carte)"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                La mémorisation active par répétition espacée permet d'ancrer durablement les concepts clés.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {courses.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    onClick={() => startFlashcards(c)}
                    className="border-2 border-foreground/15 shadow-neo-sm font-bold dark:border-foreground/20"
                  >
                    {c.title.slice(0, 25)}...
                  </Button>
                ))}
              </div>
            </Panel>
          ) : (
            (() => {
              const currentCard = normalizeFlashcard(
                activeFlashcardCourse.flashcards[flashcardIndex],
                flashcardIndex
              );
              const totalCards = activeFlashcardCourse.flashcards.length;
              const masteredCards = activeFlashcardCourse.flashcards.filter((f) => f.mastered).length;
              const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
              const sessionRate =
                flashcardSessionAttempts > 0
                  ? Math.round((flashcardSessionScore / flashcardSessionAttempts) * 100)
                  : 0;

              return (
                <div className="space-y-4">
                  {/* Top Bar Navigation & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("courses")}
                      className="font-bold text-xs"
                    >
                      ← Retour aux cours
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={generatingFlashcards}
                        onClick={handleRegenerateFlashcards}
                        className="gap-1.5 text-xs text-electric border-2 border-electric/40 hover:bg-electric/10 shadow-neo-sm font-bold dark:border-electric/50"
                      >
                        <Sparkles className="size-3.5" />
                        {generatingFlashcards ? "Génération..." : "Régénérer avec Gemma"}
                      </Button>
                      <CyberSticker tone="purple" rotate="none">
                        Carte {flashcardIndex + 1}/{totalCards}
                      </CyberSticker>
                    </div>
                  </div>

                  {/* Mode QCM Exclusif Header */}
                  <div className="p-3 rounded-2xl border-2 border-foreground/15 bg-card dark:border-foreground/20 flex items-center justify-between shadow-neo-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-bold shadow-neo-sm">
                        <HelpCircle className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-foreground uppercase tracking-wider font-display flex items-center gap-2">
                          <span>Mode QCM (Choix Multiples)</span>
                          <span className="rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold">
                            Bonne Réponse
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          Sélectionnez la bonne réponse parmi les options proposées pour valider la notion
                        </div>
                      </div>
                    </div>
                    <CyberSticker tone="purple" rotate="none">
                      Format QCM
                    </CyberSticker>
                  </div>

                  {/* Session Score & Course Mastery Progress Bar */}
                  <div className="p-3 rounded-2xl border-2 border-foreground/15 bg-card dark:border-foreground/20 shadow-neo-sm space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="size-3.5 text-primary" />
                        Score de session :{" "}
                        <strong className="text-foreground dark:text-white font-black">
                          {flashcardSessionScore} / {flashcardSessionAttempts}
                        </strong>{" "}
                        ({sessionRate}%)
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Award className="size-3.5 text-emerald-500" />
                        Maîtrise :{" "}
                        <strong className="text-emerald-500 font-black">
                          {masteredCards}/{totalCards} ({masteryPercent}%)
                        </strong>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60 dark:bg-slate-800 border border-foreground/10">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${masteryPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Main Interactive Card Container */}
                  <div className="rounded-3xl border-2 border-foreground/25 bg-card p-6 shadow-neo-lg flex flex-col justify-between text-left transition-all duration-200 dark:border-foreground/30 dark:bg-card relative min-h-[300px]">
                    {/* Mode Header & Subject */}
                    <div className="text-[11px] font-mono uppercase text-muted-foreground flex items-center justify-between font-bold border-b border-border/50 pb-2">
                      <span>{activeFlashcardCourse.subject}</span>
                      <span className="text-electric flex items-center gap-1.5 font-bold">
                        <HelpCircle className="size-3.5" />
                        Mode QCM (Bonne Réponse)
                      </span>
                    </div>

                    {/* Mode QCM Interactif Exclusif */}
                    <div className="my-auto py-4 space-y-4">
                      <div className="text-center space-y-2">
                        <span className="inline-block text-[11px] uppercase tracking-wider font-mono font-bold text-muted-foreground bg-muted/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          Question à Choix Multiples (QCM)
                        </span>
                        <p className="text-base sm:text-lg font-black text-foreground leading-relaxed dark:text-slate-100">
                          {currentCard.mcqQuestion}
                        </p>
                      </div>

                      {/* MCQ Options List */}
                      <div className="space-y-2 pt-1">
                        {currentCard.mcqOptions?.map((opt, optIdx) => {
                          const isPicked = selectedMcqAnswer === optIdx;
                          const isRight = optIdx === currentCard.mcqAnswerIndex;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={hasAnswered}
                              onClick={() => handleMcqAnswer(optIdx)}
                              className={cn(
                                "w-full text-left p-3 rounded-xl border-2 text-xs font-semibold transition-all flex items-start gap-2.5 shadow-neo-sm",
                                !hasAnswered &&
                                  "border-foreground/15 bg-background hover:border-primary hover:bg-primary/5 dark:border-foreground/20 dark:bg-card dark:hover:bg-slate-800/80",
                                hasAnswered &&
                                  isRight &&
                                  "border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200 font-bold",
                                hasAnswered &&
                                  isPicked &&
                                  !isRight &&
                                  "border-destructive bg-destructive/20 text-destructive dark:border-red-400 dark:bg-red-950/50 dark:text-red-200 font-bold",
                                hasAnswered && !isPicked && !isRight && "border-foreground/10 opacity-50 bg-muted/30 dark:opacity-40"
                              )}
                            >
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-foreground/30 font-mono text-[10px] font-black">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                              {hasAnswered && isRight && (
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                              )}
                              {hasAnswered && isPicked && !isRight && (
                                <XCircle className="size-4 text-destructive shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Detailed Pedagogical Explanation */}
                      {hasAnswered && (
                        <div
                          className={cn(
                            "p-4 rounded-2xl border-2 text-xs leading-relaxed space-y-1.5 animate-rise shadow-neo-sm",
                            isAnswerCorrect
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500/50"
                              : "border-destructive/40 bg-destructive/10 text-destructive dark:bg-red-950/40 dark:text-red-200 dark:border-red-500/50"
                          )}
                        >
                          <div className="flex items-center gap-2 font-black text-sm">
                            {isAnswerCorrect ? (
                              <>
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>
                                  Bonne réponse ! L'option {String.fromCharCode(65 + (currentCard.mcqAnswerIndex ?? 0))} est la bonne réponse.
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="size-4 text-destructive shrink-0" />
                                <span>
                                  Choix incorrect ! La réponse exacte était l'option {String.fromCharCode(65 + (currentCard.mcqAnswerIndex ?? 0))}.
                                </span>
                              </>
                            )}
                          </div>
                          <p className="font-medium text-foreground dark:text-slate-200">
                            <strong className="font-bold">Explication pédagogique détaillée : </strong>
                            {currentCard.mcqExplanation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Status */}
                    <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex items-center justify-between font-semibold">
                      <span>Concept : {currentCard.front}</span>
                      <span className={cn(currentCard.mastered ? "text-emerald-500 font-bold" : "text-muted-foreground")}>
                        {currentCard.mastered ? "✓ Notion acquise" : "En cours d'apprentissage"}
                      </span>
                    </div>
                  </div>

                  {/* Navigation & Mastery Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={flashcardIndex === 0}
                      onClick={goToPrevFlashcard}
                      className="border-2 border-foreground/15 shadow-neo-sm font-bold dark:border-foreground/20"
                    >
                      Précédent
                    </Button>

                    <Button
                      size="sm"
                      variant={currentCard.mastered ? "neo" : "outline"}
                      onClick={toggleFlashcardMastered}
                      className="gap-1.5 border-2 border-foreground/15 shadow-neo-sm font-bold dark:border-foreground/20"
                    >
                      <Check className="size-4" />
                      {currentCard.mastered ? "Maîtrisé" : "Marquer comme su"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={flashcardIndex === totalCards - 1}
                      onClick={goToNextFlashcard}
                      className="border-2 border-foreground/15 shadow-neo-sm font-bold dark:border-foreground/20"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-6 animate-rise">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel className="space-y-3 border-2 border-foreground/15 shadow-neo-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Synthèse Globale
              </h3>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Examens & Quiz complétés :</span>
                  <span className="font-black text-foreground">{quizHistory.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Moyenne générale :</span>
                  <span className="font-black text-primary">{avgScore}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Cartes flashcards mémorisées :</span>
                  <span className="font-black text-emerald-400">
                    {courses.reduce((acc, c) => acc + c.flashcards.filter((f) => f.mastered).length, 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Session flashcards (réussite) :</span>
                  <span className="font-black text-foreground">
                    {flashcardSessionScore} / {flashcardSessionAttempts}{" "}
                    {flashcardSessionAttempts > 0
                      ? `(${Math.round((flashcardSessionScore / flashcardSessionAttempts) * 100)}%)`
                      : "(100%)"}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel className="space-y-3 border-2 border-foreground/15 shadow-neo-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" /> Points Faibles Détectés
              </h3>
              {weakSubjects.length === 0 ? (
                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-bold flex items-center gap-2 shadow-neo-sm">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Aucune faiblesse critique identifiée. Continuez à vous entraîner !
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Matières nécessitant une révision prioritaire :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {weakSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-lg bg-destructive/10 border-2 border-destructive/30 px-2.5 py-1 text-xs font-bold text-destructive shadow-neo-sm"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <Panel className="space-y-3 border-2 border-foreground/15 shadow-neo-sm">
            <h3 className="font-bold text-sm">Historique Réel des Tentatives</h3>
            {quizHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center font-medium">Aucun quiz enregistré.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {quizHistory.map((q) => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{q.courseTitle}</div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {q.subject} · {new Date(q.date).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-black font-mono border-2 shadow-neo-sm",
                        q.score >= 75
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : q.score >= 50
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                            : "bg-destructive/15 border-destructive/40 text-destructive"
                      )}
                    >
                      {q.score}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-foreground/30 bg-card p-6 shadow-neo-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> Ajouter un Cours
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddModal(false)} className="font-bold">
                ✕
              </Button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-2xl border-2 border-dashed border-foreground/25 bg-primary/5 p-4 text-center space-y-2">
                <Upload className="size-7 text-primary mx-auto" />
                <div className="font-bold text-xs text-foreground">
                  Téléverser un document de cours (PDF, DOCX, PPTX, TXT, MD)
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Extraction et indexation automatique par Gemma pour vos quiz et fiches.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.pptx,.txt,.md"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isParsingDoc}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs border-2 border-foreground/15 shadow-neo-sm font-bold"
                >
                  {isParsingDoc ? "Lecture du document..." : "Choisir un fichier"}
                </Button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs">Titre du cours</label>
                <Input
                  required
                  placeholder="Ex: Sécurité des Réseaux et Protocoles TLS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="border-2 border-foreground/15 shadow-neo-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Matière</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full rounded-md border-2 border-foreground/15 bg-background px-3 py-2 text-xs shadow-neo-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  >
                    {SUBJECT_LIST.filter((s) => s !== "Tous").map((sub) => (
                      <option key={sub} value={sub} className="bg-popover text-popover-foreground">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs">Date d'évaluation / Examen</label>
                  <Input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="border-2 border-foreground/15 shadow-neo-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs">Contenu ou Notes de cours</label>
                <Textarea
                  required
                  rows={6}
                  placeholder="Collez ici les notions clés, définitions ou chapitres du cours..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-xs border-2 border-foreground/15 shadow-neo-sm font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-2 border-foreground/15 shadow-neo-sm font-bold">
                  Annuler
                </Button>
                <Button type="submit" variant="neo">
                  Enregistrer le cours
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
