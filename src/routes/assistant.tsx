import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Send,
  Sparkles,
  User,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Calendar,
  HelpCircle,
  FileText,
  XCircle,
  Upload,
  BookOpen,
  Check,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiStatusBanner, PageHeader, Panel } from "@/components/cs/ui";
import { useI18n, type Language } from "@/lib/i18n";
import { askGemmaAssistantApi, GemmaApiError } from "@/lib/gemma-client";
import { extractTextFromPdf } from "@/lib/pdf-parser";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant CyberSafe — CyberSafe Online" },
      { name: "description", content: "Posez vos questions de cybersécurité ou révisez tous vos cours (PDF, TXT) en Français, Anglais et Éwé (Eʋegbe) avec l'IA CyberSafe." },
    ],
  }),
  component: AssistantPage,
});

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

interface PlanItem {
  id: number;
  day: string;
  topic: string;
  completed: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  lang: Language;
  quiz?: QuizQuestion[];
  plan?: PlanItem[];
  isStudent?: boolean;
}

interface StoredCourse {
  title: string;
  subject: string;
  content: string;
  examDate: string;
  savedAt: string;
  fileType?: "pdf" | "text" | "manual";
}

const STORAGE_KEY = "cybersafe_student_course";

const SUBJECT_CATEGORIES = [
  { id: "cyber", name: "Cybersécurité & Réseaux", emoji: "🛡️" },
  { id: "maths", name: "Mathématiques & Algèbre", emoji: "📐" },
  { id: "code", name: "Informatique & Programmation", emoji: "💻" },
  { id: "droit", name: "Droit & Sciences Juridiques", emoji: "⚖️" },
  { id: "eco", name: "Économie, Finance & Gestion", emoji: "📊" },
  { id: "sciences", name: "Physique, Chimie & SVT", emoji: "🔬" },
  { id: "philo", name: "Philosophie & Littérature", emoji: "📚" },
  { id: "langues", name: "Langues Vivantes (FR/EN/EE)", emoji: "🌍" },
];

const SUGGESTIONS: Record<Language, string[]> = {
  fr: [
    "Un agent me demande mon code OTP pour débloquer mon compte, que faire ?",
    "Quelqu'un m'a transféré 25 000 FCFA par erreur et me harcèle, que faire ?",
    "Comment reconnaître un vrai SMS de Moov ou Togocom ?",
  ],
  en: [
    "An agent calls asking for my SMS code to prevent account suspension, what should I do?",
    "Someone sent money by mistake and asks for immediate refund, how to verify?",
    "How to detect a fake Moov Money or T-Money notification?",
  ],
  ee: [
    "Dɔwɔla aɖe le nye OTP kɔdi biam be yeadzra nye akɔnta ɖo, nukae mawɔ ?",
    "Ame aɖe be yeɖo 25 000 F nam le vodada me eye wòle kaba wɔm nam, nukae mawɔ ?",
    "Aleke mawɔ anya Moov alo Togocom ƒe SMS nyateƒetɔ ?",
  ],
};

const SLASH_COMMANDS = [
  {
    cmd: "/apprendre",
    label: "Mode Étudiant",
    desc: "Téléverser un cours (PDF / TXT) ou choisir un sujet",
    icon: GraduationCap,
  },
  {
    cmd: "/plan",
    label: "Plan d'Examen",
    desc: "Rétro-planning méthodique adapté à votre date d'examen",
    icon: Calendar,
  },
  {
    cmd: "/quiz",
    label: "Quiz Interactif",
    desc: "QCM d'évaluation interactif basé sur votre cours ou sujet",
    icon: HelpCircle,
  },
  {
    cmd: "/resume",
    label: "Fiche Synthèse",
    desc: "Notions essentielles, formules, définitions et pièges",
    icon: FileText,
  },
  {
    cmd: "/stop",
    label: "Quitter le Mode",
    desc: "Revenir à l'assistant de sécurité standard",
    icon: XCircle,
  },
];

export function AssistantPage() {
  const { t, lang } = useI18n();
  const [input, setInput] = useState("");
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showCourseEditor, setShowCourseEditor] = useState(false);

  // État du cours & Mode étudiant universel
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [course, setCourse] = useState<StoredCourse>({
    title: "",
    subject: "Cybersécurité & Réseaux",
    content: "",
    examDate: "",
    savedAt: "",
  });

  const [courseInputTitle, setCourseInputTitle] = useState("");
  const [courseInputSubject, setCourseInputSubject] = useState("Cybersécurité & Réseaux");
  const [courseInputText, setCourseInputText] = useState("");
  const [courseExamDate, setCourseExamDate] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le cours persistant depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.content || parsed.title)) {
          setCourse(parsed);
          setCourseInputTitle(parsed.title || "");
          setCourseInputSubject(parsed.subject || "Cybersécurité & Réseaux");
          setCourseInputText(parsed.content || "");
          setCourseExamDate(parsed.examDate || "");
          setIsStudentMode(true);
        }
      }
    } catch (e) {
      console.warn("Could not read student course from localStorage", e);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        lang === "ee"
          ? "Woezɔ ! Nye CyberSafe Nunyanyenye (IA) Kpekpedenutɔ. Bia wò dedienɔnɔ biabiawo le Eʋegbe, Fransegbe alo Eŋlisigbe me. Nàte ŋu aɖo PDF alo agbalẽ ɖesiaɖe ɖa hena nusrɔ̃ƒe (Maths, Droit, Code, Cybersécurité) kple /apprendre, /plan, /quiz, /resume."
          : lang === "en"
            ? "Welcome! I am your CyberSafe AI Assistant. Ask any security questions or upload your courses (PDF / TXT in any subject: Math, Law, Code, Physics, etc.) using /apprendre, /plan, /quiz, /resume."
            : "Bienvenue ! Je suis votre assistant CyberSafe propulsé par l'IA CyberSafe. Posez vos questions de cybersécurité ou déposez vos cours (PDF, TXT) dans n'importe quelle matière (Maths, Droit, Informatique, Sciences, etc.) avec /apprendre, /plan, /quiz, /resume.",
      lang,
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Sauvegarder le cours
  const saveCourseData = (title: string, text: string, exam: string, subject: string, fileType: "pdf" | "text" | "manual" = "manual") => {
    const updated: StoredCourse = {
      title: title.trim() || subject || "Cours d'étude",
      subject: subject.trim() || "Matière générale",
      content: text.trim(),
      examDate: exam,
      savedAt: new Date().toISOString(),
      fileType,
    };
    setCourse(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to write to localStorage", e);
    }
    setIsStudentMode(true);
    setShowCourseEditor(false);

    toast.success("Cours enregistré dans votre espace étudiant !");

    const wordCount = updated.content ? updated.content.split(/\s+/).filter(Boolean).length : 0;
    const examNotice = exam ? ` (Examen programmé : ${exam})` : "";
    const typeNotice = fileType === "pdf" ? " [Document PDF extrait]" : "";
    const msg = `🎓 **Cours chargé : "${updated.title}"** (~${wordCount} mots)${typeNotice} — Matière : **${updated.subject}**${examNotice}.\n\nVous pouvez désormais utiliser :
- \`/plan\` : Générer votre calendrier de révision jour par jour
- \`/quiz\` : Lancer un test d'auto-évaluation interactif sur ce cours
- \`/resume\` : Obtenir la fiche synthétique des formules, définitions et pièges
- \`/stop\` : Revenir au mode cybersécurité standard`;

    setMessages((prev) => [
      ...prev,
      {
        id: `course-loaded-${Date.now()}`,
        role: "assistant",
        content: msg,
        lang,
        isStudent: true,
      },
    ]);
  };

  // Traitement d'un fichier (PDF, TXT, MD)
  const processIncomingFile = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

    if (isPdf) {
      setParsingPdf(true);
      toast.loading("Extraction du texte du document PDF en cours...", { id: "pdf-parse" });
      try {
        const text = await extractTextFromPdf(file);
        if (!text || text.length < 20) {
          toast.dismiss("pdf-parse");
          toast.error("Le document PDF ne contient pas suffisamment de texte extractible.");
          setParsingPdf(false);
          return;
        }

        toast.dismiss("pdf-parse");
        toast.success(`PDF "${file.name}" extrait avec succès (${text.split(/\s+/).filter(Boolean).length} mots) !`);

        setCourseInputTitle(cleanTitle);
        setCourseInputText(text);

        // Détection automatique de la matière
        let detectedSubject = courseInputSubject;
        const lowerText = (cleanTitle + " " + text.slice(0, 1000)).toLowerCase();
        if (lowerText.includes("math") || lowerText.includes("algèbre") || lowerText.includes("équation")) detectedSubject = "Mathématiques & Algèbre";
        else if (lowerText.includes("droit") || lowerText.includes("juridique") || lowerText.includes("article") || lowerText.includes("loi")) detectedSubject = "Droit & Sciences Juridiques";
        else if (lowerText.includes("code") || lowerText.includes("python") || lowerText.includes("java") || lowerText.includes("programmation") || lowerText.includes("algorithme")) detectedSubject = "Informatique & Programmation";
        else if (lowerText.includes("physique") || lowerText.includes("chimie") || lowerText.includes("biologie")) detectedSubject = "Physique, Chimie & SVT";
        else if (lowerText.includes("gestion") || lowerText.includes("finance") || lowerText.includes("comptabilité") || lowerText.includes("marketing")) detectedSubject = "Économie, Finance & Gestion";

        setCourseInputSubject(detectedSubject);
        saveCourseData(cleanTitle, text, courseExamDate, detectedSubject, "pdf");
      } catch (err: any) {
        console.error(err);
        toast.dismiss("pdf-parse");
        toast.error("Erreur lors de la lecture du fichier PDF. Assurez-vous qu'il contient du texte numérique.");
      } finally {
        setParsingPdf(false);
      }
      return;
    }

    // Fichier texte classique (.txt, .md)
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || "");
      setCourseInputTitle(cleanTitle);
      setCourseInputText(content);
      saveCourseData(cleanTitle, content, courseExamDate, courseInputSubject, "text");
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIncomingFile(file);
      e.target.value = "";
    }
  };

  // Traiter les réponses aux Quiz
  const handleSelectQuizAnswer = (messageId: string, questionId: number, optionIdx: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.quiz) return msg;
        const updatedQuiz = msg.quiz.map((q) => {
          if (q.id === questionId) {
            return { ...q, userSelectedIndex: optionIdx };
          }
          return q;
        });
        return { ...msg, quiz: updatedQuiz };
      })
    );
  };

  // Basculer un jalon du plan
  const handleTogglePlanItem = (messageId: string, itemId: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.plan) return msg;
        const updatedPlan = msg.plan.map((item) => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        return { ...msg, plan: updatedPlan };
      })
    );
  };

  // Génération de quiz interactif universel (selon la matière et le cours)
  const buildUniversalQuiz = (topic: string, subject: string): QuizQuestion[] => {
    const lower = (topic + " " + subject).toLowerCase();

    // 1. Mathématiques
    if (lower.includes("math") || lower.includes("algèbre") || lower.includes("géométrie") || lower.includes("analyse")) {
      return [
        {
          id: 1,
          question: "Quelle est la dérivée de la fonction f(x) = ln(x) pour tout réel x > 0 ?",
          options: ["f'(x) = 1/x", "f'(x) = e^x", "f'(x) = x", "f'(x) = 1/(x^2)"],
          answerIndex: 0,
          explanation: "Par définition, la dérivée de la fonction logarithme népérien ln(x) sur ]0, +∞[ est 1/x.",
        },
        {
          id: 2,
          question: "Dans un triangle rectangle, quel théorème permet de calculer la longueur de l'hypoténuse ?",
          options: ["Le théorème de Thalès", "Le théorème de Pythagore", "La loi des grands nombres", "Le théorème d'Euler"],
          answerIndex: 1,
          explanation: "Le théorème de Pythagore stipule que le carré de l'hypoténuse est égal à la somme des carrés des côtés adjacents.",
        },
        {
          id: 3,
          question: "Que vaut la probabilité de l'événement certain dans un espace probabilisé ?",
          options: ["0", "0.5", "1", "+∞"],
          answerIndex: 2,
          explanation: "Dans les axiomes de Kolmogorov, la mesure de probabilité de l'univers tout entier Ω est égale à 1.",
        },
      ];
    }

    // 2. Informatique & Code
    if (lower.includes("code") || lower.includes("informatique") || lower.includes("python") || lower.includes("programmation") || lower.includes("algo")) {
      return [
        {
          id: 1,
          question: "En algorithmique, quelle est la complexité temporelle optimale d'une recherche dichotomique dans un tableau déjà trié de taille N ?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
          answerIndex: 1,
          explanation: "La recherche dichotomique divise l'intervalle de recherche par 2 à chaque itération, ce qui donne une complexité logarithmique O(log N).",
        },
        {
          id: 2,
          question: "En Python, quel type de structure de données est immuable (non modifiable après création) ?",
          options: ["list (liste)", "dict (dictionnaire)", "tuple (uplet)", "set (ensemble)"],
          answerIndex: 2,
          explanation: "Les tuples sont des séquences immuables, contrairement aux listes ou dictionnaires qui sont mutables.",
        },
        {
          id: 3,
          question: "Quel protocole réseau sécurisé chiffre les échanges web entre le navigateur et le serveur ?",
          options: ["HTTP", "HTTPS (avec TLS)", "FTP", "Telnet"],
          answerIndex: 1,
          explanation: "HTTPS s'appuie sur le protocole cryptographique TLS pour garantir la confidentialité et l'intégrité des données transmises.",
        },
      ];
    }

    // 3. Droit & Législation
    if (lower.includes("droit") || lower.includes("loi") || lower.includes("juridique") || lower.includes("justice")) {
      return [
        {
          id: 1,
          question: "Selon la hiérarchie des normes (Pyramide de Kelsen), quelle norme juridique prime sur toutes les autres dans un État ?",
          options: ["Le décret ministériel", "La loi ordinaire", "La Constitution", "Le règlement intérieur"],
          answerIndex: 2,
          explanation: "La Constitution est la norme suprême au sommet de l'ordre juridique étatique.",
        },
        {
          id: 2,
          question: "Quelles sont les trois conditions cumulatives pour engager la responsabilité civile délictuelle ?",
          options: [
            "Une faute, un dommage et un lien de causalité direct",
            "Un contrat signé, un paiement et une preuve écrite",
            "Une décision de justice, un avocat et un huissier",
            "Une infraction pénale, une garde à vue et un procès",
          ],
          answerIndex: 0,
          explanation: "La responsabilité extracontractuelle exige la réunion prouvée d'une faute, d'un préjudice certain (dommage) et du lien de cause à effet direct entre les deux.",
        },
        {
          id: 3,
          question: "Dans l'espace OHADA, quel texte régit de manière unifiée le droit commercial général et les sociétés commerciales ?",
          options: ["Le Code civil français", "Les Actes Uniformes de l'OHADA", "Le traité de Rome", "La convention de Genève"],
          answerIndex: 1,
          explanation: "Les Actes Uniformes adoptés par l'OHADA s'appliquent directement et obligatoirement dans tous les États membres.",
        },
      ];
    }

    // 4. Économie & Gestion
    if (lower.includes("éco") || lower.includes("eco") || lower.includes("gestion") || lower.includes("finance") || lower.includes("compta")) {
      return [
        {
          id: 1,
          question: "En économie de marché, que se produit-il généralement lorsque la demande d'un bien augmente alors que l'offre reste constante ?",
          options: [
            "Le prix d'équilibre a tendance à augmenter.",
            "Le prix d'équilibre s'effondre immédiatement.",
            "L'inflation globale devient nulle.",
            "L'offre diminue automatiquement de moitié.",
          ],
          answerIndex: 0,
          explanation: "Une hausse de la demande sans variation de l'offre crée une rareté relative qui pousse le prix d'équilibre à la hausse.",
        },
        {
          id: 2,
          question: "En comptabilité, quel document de synthèse présente le patrimoine de l'entreprise (Actif et Passif) à une date donnée ?",
          options: ["Le compte de résultat", "Le bilan comptable", "Le tableau des flux de trésorerie", "La balance générale"],
          answerIndex: 1,
          explanation: "Le bilan est la photographie patrimoniale de l'entreprise : ce qu'elle possède (Actif) et ce qu'elle doit (Passif).",
        },
        {
          id: 3,
          question: "Quel indicateur mesure la richesse totale produite sur le territoire national durant une année ?",
          options: ["Le PNB", "Le PIB (Produit Intérieur Brut)", "Le taux de refinancement", "L'indice CAC 40"],
          answerIndex: 1,
          explanation: "Le PIB mesure la valeur monétaire totale des biens et services finaux produits dans un pays au cours d'une période.",
        },
      ];
    }

    // 5. Par défaut / Cybersécurité & Technologies
    return [
      {
        id: 1,
        question: `Dans l'étude de "${topic || "Cybersécurité & Technologies"}", quelle est la règle d'or concernant les codes secrets OTP et PIN ?`,
        options: [
          "Les partager uniquement avec les agents officiels se présentant au téléphone.",
          "Ne JAMAIS les divulguer, aucun agent légitime ne les réclamera.",
          "Les envoyer par retour de SMS si le nom de l'opérateur s'affiche.",
          "Les écrire sur un papier collé au dos de son téléphone.",
        ],
        answerIndex: 1,
        explanation: "Un code OTP est un secret d'authentification personnel. Les services officiels ont déjà les droits d'administration et n'ont jamais besoin de votre code.",
      },
      {
        id: 2,
        question: "Devant un message affirmant qu'une somme vous a été transférée par erreur, comment s'assurer de la réalité du transfert ?",
        options: [
          "Faire confiance au SMS reçu et renvoyer la somme immédiatement.",
          "Consulter son solde réel via la syntaxe officielle (*155# ou *145#).",
          "Demander à l'appelant une photo de sa pièce d'identité.",
          "Attendre 2 jours sans consulter son téléphone.",
        ],
        answerIndex: 1,
        explanation: "Les faux SMS de transfert imitent parfaitement la mise en page officielle. Seule l'interrogation du solde via le menu USSD sécurisé de l'opérateur fait foi.",
      },
      {
        id: 3,
        question: "Quel mécanisme de sécurité associe un mot de passe et une validation par code SMS ou application mobile ?",
        options: [
          "L'authentification à deux facteurs (2FA / MFA)",
          "Le hachage MD5",
          "Le phishing contextuel",
          "Le protocole Telnet non sécurisé",
        ],
        answerIndex: 0,
        explanation: "L'authentification à deux facteurs (2FA) exige deux preuves distinctes de l'identité de l'utilisateur pour autoriser l'accès.",
      },
    ];
  };

  // Génération de plan de révision universel
  const buildUniversalPlan = (examDateStr: string, topic: string, subject: string): PlanItem[] => {
    return [
      {
        id: 1,
        day: "Jour 1 — Fondations & Définitions Clés",
        topic: `Maîtriser le socle théorique, la terminologie et les théorèmes fondamentaux de ${topic || subject}.`,
        completed: true,
      },
      {
        id: 2,
        day: "Jour 2 — Approfondissement & Analyse Pratique",
        topic: `Résolution d'exercices d'application, études de cas et démonstrations méthodologiques en ${subject}.`,
        completed: false,
      },
      {
        id: 3,
        day: "Jour 3 — Synthèse & Fiches Mémorielles",
        topic: "Élaboration des formules indispensables, définitions exactes et synthèse des pièges fréquents.",
        completed: false,
      },
      {
        id: 4,
        day: `Jour 4 — Mise en Situation d'Examen${examDateStr ? ` (Objectif : ${examDateStr})` : ""}`,
        topic: "Auto-évaluation chronométrée sur annales ou sujets types et analyse des erreurs.",
        completed: false,
      },
      {
        id: 5,
        day: "Jour 5 — Relecture Stratégique & Consolidation",
        topic: "Mémorisation active des points cardinaux et révision finale la veille de l'épreuve.",
        completed: false,
      },
    ];
  };

  const executeCommand = async (cmdString: string) => {
    const parts = cmdString.trim().split(" ");
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1).join(" ");

    setShowSlashMenu(false);

    if (cmd === "/stop") {
      setIsStudentMode(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: "/stop",
          lang,
        },
        {
          id: `cmd-resp-${Date.now()}`,
          role: "assistant",
          content: "✅ **Mode Étudiant clôturé avec succès.**\n\nVous êtes de retour dans l'**Assistant de Sécurité CyberSafe**. Posez vos questions de protection Mobile Money, fraudes ou vérifications techniques quand vous le souhaitez !",
          lang,
          isStudent: false,
        },
      ]);
      toast.info("Mode étudiant désactivé. Retour au mode standard.");
      return;
    }

    if (cmd === "/apprendre") {
      setIsStudentMode(true);
      setShowCourseEditor(true);
      const textToLoad = rest.trim();
      if (textToLoad) {
        setCourseInputTitle(textToLoad);
        saveCourseData(textToLoad, "", course.examDate, textToLoad, "manual");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-user-${Date.now()}`,
            role: "user",
            content: "/apprendre",
            lang,
          },
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content: "🎓 **Mode Étudiant Universel Activé !**\n\nVous pouvez réviser **n'importe quelle matière** (Cybersécurité, Mathématiques, Informatique, Droit, Économie, Sciences, etc.) :\n1. Déposez votre cours au format **PDF** ou **TXT** avec le bouton ci-dessus ou le trombone 📎.\n2. Ou sélectionnez une matière et collez vos leçons pour commencer.",
            lang,
            isStudent: true,
          },
        ]);
      }
      return;
    }

    if (cmd === "/quiz") {
      setIsStudentMode(true);
      const quizItems = buildUniversalQuiz(course.title, course.subject);
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: "/quiz",
          lang,
        },
        {
          id: `cmd-resp-${Date.now()}`,
          role: "assistant",
          content: `🎯 **Quiz d'Évaluation Interactif : "${course.title || course.subject}"**\n\nTestez vos connaissances en cliquant sur vos réponses ci-dessous :`,
          lang,
          quiz: quizItems,
          isStudent: true,
        },
      ]);
      return;
    }

    if (cmd === "/plan") {
      setIsStudentMode(true);
      const targetDate = course.examDate || rest || "Dans 1 semaine";
      const planItems = buildUniversalPlan(targetDate, course.title, course.subject);
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: `/plan ${rest}`.trim(),
          lang,
        },
        {
          id: `cmd-resp-${Date.now()}`,
          role: "assistant",
          content: `📅 **Rétro-planning d'étude méthodique : "${course.title || course.subject}"**\nDate cible d'examen : **${targetDate}**\n\nCochez vos étapes au fur et à mesure de vos révisions :`,
          lang,
          plan: planItems,
          isStudent: true,
        },
      ]);
      return;
    }

    if (cmd === "/resume") {
      setIsStudentMode(true);
      setLoading(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: "/resume",
          lang,
        },
      ]);

      try {
        const prompt = course.content
          ? `Génère une fiche de synthèse pédagogique structurée pour ce cours intitulé "${course.title}" en ${course.subject}. Inclure : 1. Notions et concepts fondamentaux, 2. Définitions et formules clés, 3. Les 3 pièges fréquents à l'examen, 4. La synthèse mémorisable.`
          : `Génère une fiche de synthèse pédagogique sur la matière "${course.subject || "Cybersécurité"}" : concepts fondamentaux, formules ou règles clés, pièges d'examen et méthode de réussite.`;

        const res = await askGemmaAssistantApi(
          prompt,
          [],
          lang,
          course.content,
          "student"
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content: `📑 **Fiche de Synthèse — ${course.title || course.subject}**\n\n${res.reply}`,
            lang,
            isStudent: true,
          },
        ]);
      } catch (err: any) {
        console.error(err);
        const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
        const msg = err.message || "Erreur lors de la génération de la synthèse.";
        setApiError({ message: msg, quota: isQuota });
      } finally {
        setLoading(false);
      }
      return;
    }

    send(cmdString);
  };

  const send = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    if (text.startsWith("/")) {
      executeCommand(text);
      setInput("");
      return;
    }

    setInput("");
    setShowSlashMenu(false);
    setApiError(null);

    const newMsgs: Message[] = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        lang,
      },
    ];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const hist = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askGemmaAssistantApi(
        text,
        hist,
        lang,
        course.content,
        isStudentMode ? "student" : "standard"
      );

      setMessages([
        ...newMsgs,
        {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          lang,
          isStudent: isStudentMode,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur de communication avec l'IA CyberSafe.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Quota API IA CyberSafe dépassé" : "Erreur IA CyberSafe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title={t("assistant.title")}
        subtitle={t("assistant.subtitle")}
      >
        <div className="flex flex-wrap items-center gap-2">
          {isStudentMode ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-electric/40 bg-electric/15 px-3 py-1 text-xs font-bold text-electric">
              <GraduationCap className="size-3.5" /> Mode Étudiant Universel Actif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> IA CyberSafe Active
            </span>
          )}
        </div>
      </PageHeader>

      {apiError && (
        <div className="mb-4">
          <AiStatusBanner error={apiError.message} quotaExceeded={apiError.quota} />
        </div>
      )}

      {/* Bandeau d'état du cours actif */}
      {isStudentMode && (
        <div className="rounded-2xl border border-electric/30 bg-electric/5 p-4 text-xs transition-all animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-electric text-night shadow-glow">
                <BookOpen className="size-4" />
              </div>
              <div>
                <div className="font-bold text-foreground text-sm flex flex-wrap items-center gap-2">
                  <span>{course.title || "Cours en cours d'étude"}</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {course.subject || "Général"}
                  </span>
                  {course.fileType === "pdf" && (
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FileCheck2 className="size-3" /> PDF Actif
                    </span>
                  )}
                  {course.examDate && (
                    <span className="rounded-md bg-electric/20 px-2 py-0.5 text-[11px] font-semibold text-electric">
                      Examen : {course.examDate}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {course.content
                    ? `${course.content.split(/\s+/).filter(Boolean).length} mots analysés · Commandes /plan, /quiz, /resume actives`
                    : "Aucun texte ou document n'a encore été déposé. Cliquez sur 'Modifier le cours' ou joignez un PDF."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCourseEditor(!showCourseEditor)}
                className="gap-1.5 text-xs h-8"
              >
                {showCourseEditor ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                {showCourseEditor ? "Fermer" : "Modifier / Changer de matière"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => executeCommand("/stop")}
                className="text-xs h-8 text-destructive hover:text-destructive"
              >
                <XCircle className="size-3.5 mr-1" /> Quitter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Éditeur / Zone de téléversement du cours (Tous sujets + PDF) */}
      {showCourseEditor && (
        <Panel className="border-electric/30 bg-card p-5 animate-rise space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <GraduationCap className="size-4 text-electric" /> Espace Étudiant — Tous Sujets d'Étude & Documents PDF
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Étudiez n'importe quelle matière : déposez un polycopié PDF ou collez vos cours.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Persistance automatique</span>
          </div>

          {/* Sélection rapide de discipline / matière */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Matière ou Discipline d'étude :</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {SUBJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCourseInputSubject(cat.name);
                    if (!courseInputTitle || SUBJECT_CATEGORIES.some(c => c.name === courseInputTitle)) {
                      setCourseInputTitle(cat.name);
                    }
                  }}
                  className={cn(
                    "rounded-xl border px-2.5 py-1 text-xs transition flex items-center gap-1.5",
                    courseInputSubject === cat.name
                      ? "border-electric bg-electric/20 text-electric font-bold shadow-sm"
                      : "border-border/60 bg-muted/40 hover:bg-muted text-foreground/80"
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Titre du cours ou Thématique précise</label>
              <input
                type="text"
                value={courseInputTitle}
                onChange={(e) => setCourseInputTitle(e.target.value)}
                placeholder="Ex: Algèbre Linéaire, Droit des Sociétés, Génie Logiciel..."
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-electric outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Date de l'examen (pour le planning)</label>
              <input
                type="date"
                value={courseExamDate}
                onChange={(e) => setCourseExamDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-electric outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Contenu du cours (ou texte extrait du PDF)
              </label>
              {parsingPdf && (
                <span className="flex items-center gap-1.5 text-xs text-electric font-semibold animate-pulse">
                  <Loader2 className="size-3.5 animate-spin" /> Extraction du PDF...
                </span>
              )}
            </div>
            <Textarea
              value={courseInputText}
              onChange={(e) => setCourseInputText(e.target.value)}
              placeholder="Collez ici les leçons, théorèmes, lois, chapitres ou résumés de votre cours à étudier..."
              rows={5}
              className="mt-1.5 resize-none rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-muted/40 px-3.5 py-2 text-xs font-semibold hover:bg-muted transition text-foreground">
                <Upload className="size-3.5 text-primary" />
                <span>Téléverser un cours (PDF, TXT, MD)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.text,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={parsingPdf}
                />
              </label>
              <span className="text-[11px] text-muted-foreground">PDFs avec texte numérique acceptés</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCourseEditor(false)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => saveCourseData(courseInputTitle, courseInputText, courseExamDate, courseInputSubject)}
                disabled={(!courseInputText.trim() && !courseInputTitle.trim()) || parsingPdf}
                className="text-xs gap-1.5"
              >
                <Check className="size-3.5" /> Enregistrer le cours
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fenêtre de discussion principale */}
        <div className="lg:col-span-2 space-y-4">
          <Panel className="min-h-[500px] flex flex-col justify-between p-4 sm:p-6 bg-card/80 backdrop-blur-md">
            <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} animate-rise`}
                >
                  {m.role === "assistant" && (
                    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-electric text-primary-foreground shadow-glow">
                      {m.isStudent ? <GraduationCap className="size-4" /> : <Bot className="size-4" />}
                    </div>
                  )}

                  <div className="max-w-[86%] space-y-3">
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground font-medium shadow-sm ml-auto"
                          : "bg-muted/70 text-foreground border border-border/50 shadow-sm"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Rendu interactif des Quiz */}
                    {m.quiz && m.quiz.length > 0 && (
                      <div className="space-y-3 rounded-2xl border border-electric/30 bg-background/80 p-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-bold text-electric uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="size-3.5" /> Questions d'Auto-Évaluation
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            Score : {m.quiz.filter((q) => q.userSelectedIndex === q.answerIndex).length} / {m.quiz.length}
                          </span>
                        </div>

                        {m.quiz.map((q) => {
                          const hasAnswered = q.userSelectedIndex !== undefined;
                          const isCorrect = q.userSelectedIndex === q.answerIndex;

                          return (
                            <div key={q.id} className="rounded-xl border bg-muted/30 p-3 text-xs space-y-2.5">
                              <p className="font-semibold text-foreground">{q.id}. {q.question}</p>

                              <div className="space-y-1.5">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = q.userSelectedIndex === optIdx;
                                  const isTheCorrectOne = optIdx === q.answerIndex;

                                  let btnStyle = "border-border bg-background hover:border-primary/50 text-foreground";
                                  if (hasAnswered) {
                                    if (isTheCorrectOne) {
                                      btnStyle = "border-success bg-success/15 text-success font-semibold";
                                    } else if (isSelected && !isCorrect) {
                                      btnStyle = "border-destructive bg-destructive/15 text-destructive";
                                    } else {
                                      btnStyle = "opacity-60 border-transparent bg-muted/40";
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleSelectQuizAnswer(m.id, q.id, optIdx)}
                                      disabled={hasAnswered}
                                      className={cn(
                                        "w-full text-left rounded-lg border p-2.5 text-xs transition flex items-center justify-between gap-2",
                                        btnStyle
                                      )}
                                    >
                                      <span>{opt}</span>
                                      {hasAnswered && isTheCorrectOne && (
                                        <Check className="size-4 shrink-0 text-success" />
                                      )}
                                      {hasAnswered && isSelected && !isCorrect && (
                                        <X className="size-4 shrink-0 text-destructive" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div className={cn(
                                  "rounded-lg p-2.5 text-[11px] leading-relaxed border mt-2",
                                  isCorrect ? "bg-success/10 border-success/30 text-success-foreground" : "bg-destructive/10 border-destructive/30 text-destructive-foreground"
                                )}>
                                  <strong>{isCorrect ? "Excellente réponse ! " : "Explication : "}</strong>
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rendu interactif du Plan de Révision */}
                    {m.plan && m.plan.length > 0 && (
                      <div className="space-y-3 rounded-2xl border border-primary/30 bg-background/80 p-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="size-3.5" /> Jalons de Révision Méthodique
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {m.plan.filter((p) => p.completed).length} / {m.plan.length} terminés
                          </span>
                        </div>

                        <div className="space-y-2">
                          {m.plan.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleTogglePlanItem(m.id, item.id)}
                              className={cn(
                                "w-full text-left rounded-xl border p-3 text-xs transition flex items-start gap-3",
                                item.completed
                                  ? "bg-success/5 border-success/30 line-through text-muted-foreground"
                                  : "bg-muted/30 border-border hover:border-primary/40 text-foreground"
                              )}
                            >
                              <div className="mt-0.5">
                                {item.completed ? (
                                  <CheckSquare className="size-4 text-success" />
                                ) : (
                                  <Square className="size-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-[11px] uppercase tracking-wider text-primary">
                                  {item.day}
                                </div>
                                <div className="mt-0.5 font-medium">{item.topic}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-primary animate-pulse py-2">
                  <Sparkles className="size-4 animate-spin text-electric" />
                  <span>L'IA CyberSafe réfléchit en {lang === "ee" ? "Eʋegbe" : lang === "en" ? "English" : "Français"}...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Zone de saisie, trombone PDF et commandes slash */}
            <div className="mt-4 pt-3 border-t space-y-2 relative">
              {/* Menu surgissant des commandes slash */}
              {showSlashMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-electric/30 bg-card p-2 shadow-2xl backdrop-blur-xl animate-rise z-20 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Commandes Mode Étudiant Universel
                  </div>
                  {SLASH_COMMANDS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.cmd}
                        onClick={() => executeCommand(item.cmd)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium hover:bg-electric/10 hover:text-electric transition text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="size-4 text-electric" />
                          <strong className="font-mono text-primary">{item.cmd}</strong>
                          <span className="text-muted-foreground">— {item.label}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Barre de pilules de raccourcis rapides */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
                  Commandes :
                </span>
                {SLASH_COMMANDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.cmd}
                      onClick={() => executeCommand(item.cmd)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-electric hover:bg-electric/15 hover:text-electric shrink-0"
                    >
                      <Icon className="size-3 text-electric" />
                      {item.cmd}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-end gap-2">
                {/* Bouton trombone direct pour upload rapide de PDF */}
                <label
                  title="Téléverser un cours en PDF ou texte"
                  className={cn(
                    "grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-muted/50 text-foreground transition hover:border-electric hover:bg-electric/10 hover:text-electric",
                    parsingPdf && "animate-pulse pointer-events-none opacity-60"
                  )}
                >
                  {parsingPdf ? (
                    <Loader2 className="size-4 animate-spin text-electric" />
                  ) : (
                    <Paperclip className="size-4" />
                  )}
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.text,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading || parsingPdf}
                  />
                </label>

                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInput(val);
                      if (val === "/") {
                        setShowSlashMenu(true);
                      } else if (showSlashMenu && !val.startsWith("/")) {
                        setShowSlashMenu(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (input.startsWith("/")) {
                          executeCommand(input);
                          setInput("");
                        } else {
                          send(input);
                        }
                      }
                    }}
                    rows={2}
                    placeholder={
                      isStudentMode
                        ? `Posez une question sur "${course.title || course.subject}" ou tapez /plan, /quiz, /resume...`
                        : t("assistant.placeholder")
                    }
                    className="resize-none rounded-xl"
                    disabled={loading || parsingPdf}
                  />
                </div>

                <Button
                  variant="hero"
                  className="shrink-0 h-10 px-4"
                  onClick={() => {
                    if (input.startsWith("/")) {
                      executeCommand(input);
                      setInput("");
                    } else {
                      send(input);
                    }
                  }}
                  disabled={loading || !input.trim() || parsingPdf}
                >
                  <Send className="size-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3 text-electric" />
                  Moteur actif : <strong>IA CyberSafe</strong> {isStudentMode ? `· ${course.subject}` : ""}
                </span>
                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: `reset-${Date.now()}`,
                        role: "assistant",
                        content: t("home.welcome"),
                        lang,
                      },
                    ])
                  }
                  className="hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> {t("assistant.clearChat")}
                </button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Barre latérale droite : Suggestions & Guide universel */}
        <div className="space-y-4">
          {/* Bloc Suggestions */}
          <Panel>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {t("assistant.suggested")}
            </h3>
            <div className="space-y-2">
              {(SUGGESTIONS[lang] || SUGGESTIONS.fr).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => send(q)}
                  className="w-full text-left rounded-xl border bg-muted/40 p-3 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </Panel>

          {/* Guide Mode Étudiant Universel & PDF */}
          <Panel className="border-electric/30 bg-gradient-to-b from-card to-background space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-electric flex items-center gap-1.5">
              <GraduationCap className="size-4" />
              Mode Étudiant Universel
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              L'IA CyberSafe s'adapte à <strong>toutes vos matières</strong> académiques (Maths, Droit, Code, Sciences, Éco, etc.) :
            </p>

            <div className="rounded-xl border border-dashed border-electric/40 bg-electric/5 p-2.5 text-xs text-foreground space-y-1">
              <div className="font-semibold text-electric flex items-center gap-1.5">
                <Paperclip className="size-3.5" /> Support des fichiers PDF
              </div>
              <p className="text-[11px] text-muted-foreground">
                Déposez vos polycopiés de cours en PDF. Le texte est extrait et analysé pour vos quiz et fiches.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-foreground/80">
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-electric font-mono text-[11px]">/apprendre</code>
                <span>Ouvrir l'éditeur ou charger un cours PDF/TXT.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-electric font-mono text-[11px]">/plan</code>
                <span>Créer un rétro-planning d'examen adapté.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-electric font-mono text-[11px]">/quiz</code>
                <span>Générer des questions interactives sur la matière.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-electric font-mono text-[11px]">/resume</code>
                <span>Synthétiser les notions et pièges d'examen.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-destructive font-mono text-[11px]">/stop</code>
                <span>Quitter et revenir à l'assistant standard.</span>
              </div>
            </div>
          </Panel>

          {/* Panneau Sécurité & Confidentialité */}
          <Panel className="border-sidebar-border bg-night text-night-foreground space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-electric flex items-center gap-1.5">
              <ShieldCheck className="size-4" />
              IA CyberSafe — Sécurité Server-Side
            </h4>
            <p className="text-xs text-night-muted leading-relaxed">
              {t("assistant.eweWarning")}
            </p>
            <div className="rounded-lg bg-night-foreground/10 p-2.5 text-[11px] text-night-muted space-y-1.5">
              <div className="flex items-center gap-1.5 text-night-foreground font-semibold">
                <CheckCircle2 className="size-3.5 text-success" />
                Confidentialité & Données
              </div>
              <p>Vos cours et documents PDF restent privés et traités sur le serveur sans persistance externe non sollicitée.</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
