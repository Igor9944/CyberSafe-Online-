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
  ImageUp,
  RefreshCw,
  Copy,
  CheckCheck,
  Lock,
  ArrowRight,
  Sparkle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiStatusBanner, PageHeader, Panel } from "@/components/cs/ui";
import {
  CyberSticker,
  WavyCyberGrid,
  MemphisDoodle,
} from "@/components/cs/CyberDecorations";
import { useI18n, type Language } from "@/lib/i18n";
import {
  askGemmaAssistantApi,
  extractCourseImageApi,
  generateStudyPlanApi,
  generateStudyQuizApi,
  GemmaApiError,
} from "@/lib/gemma-client";
import { extractTextFromDocument } from "@/lib/document-parser";
import { DEMO_COURSES, type DemoCourse } from "@/lib/demo";
import { cn } from "@/lib/utils";

export interface AssistantSearch {
  cmd?: string;
}

export const Route = createFileRoute("/assistant")({
  validateSearch: (search: Record<string, unknown>): AssistantSearch => {
    const cmdVal = search["cmd"];
    if (typeof cmdVal === "string") {
      return { cmd: cmdVal };
    }
    return {};
  },
  head: () => ({
    meta: [
      { title: "Assistant IA & Tuteur d'Étude (Gemma 4) — CyberSafe Online" },
      {
        name: "description",
        content:
          "Assistant intelligent propulsé par Google Gemma 4 : analyse d'arnaques Mobile Money et tuteur d'étude sur mesure avec quiz adaptatifs et plans de révision.",
      },
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
  proactiveActions?: boolean;
}

interface StoredCourse {
  title: string;
  subject: string;
  content: string;
  examDate: string;
  savedAt: string;
  fileType?: "pdf" | "photo" | "text" | "txt" | "manual" | "docx" | "pptx";
}

const STORAGE_KEY = "cybersafe_student_course";

const SUBJECT_CATEGORIES = [
  { id: "cyber", name: "Cybersécurité & Réseaux", emoji: "🛡️" },
  { id: "maths", name: "Mathématiques & Algèbre", emoji: "📐" },
  { id: "code", name: "Informatique & Programmation", emoji: "💻" },
  { id: "droit", name: "Droit & Sciences Juridiques", emoji: "⚖️" },
  { id: "eco", name: "Économie, Finance & Gestion", emoji: "📊" },
  { id: "sciences", name: "Physique, Chimie & SVT", emoji: "🔬" },
  { id: "philo", name: "Philosophie & Lettérature", emoji: "📚" },
  { id: "langues", name: "Langues Vivantes (FR/EN/EE)", emoji: "🌍" },
];

interface PromptSuggestion {
  category: "security" | "study";
  label: string;
  query: string;
  badge: string;
}

const SUGGESTIONS: Record<Language, PromptSuggestion[]> = {
  fr: [
    {
      category: "security",
      label: "Code OTP réclamé au téléphone",
      query:
        "Un soi-disant agent m'appelle et me demande mon code OTP reçu par SMS pour 'débloquer' mon compte T-Money / Moov Money. Que dois-je faire ?",
      badge: "Mobile Money",
    },
    {
      category: "security",
      label: "Faux transfert de 25 000 FCFA",
      query:
        "Quelqu'un m'a envoyé un SMS disant qu'il m'a transféré 25 000 FCFA par erreur et exige que je lui renvoie l'argent tout de suite. Comment vérifier mon solde réel ?",
      badge: "Arnaque Transfert",
    },
    {
      category: "security",
      label: "Vérifier un SMS officiel opérateur",
      query:
        "Comment reconnaître avec certitude un véritable SMS officiel de Togocom (T-Money) ou Moov Africa face à un faux expéditeur usurpé ?",
      badge: "Détection SMS",
    },
    {
      category: "study",
      label: "Quiz interactif sur la cybersécurité",
      query: "/quiz",
      badge: "Volet Apprendre",
    },
    {
      category: "study",
      label: "Planifier mes révisions d'examen",
      query: "/plan dans 5 jours",
      badge: "Planning",
    },
  ],
  en: [
    {
      category: "security",
      label: "Suspicious OTP Request",
      query:
        "A caller claiming to be support asks for my SMS verification code to prevent account suspension. What should I do?",
      badge: "Mobile Money",
    },
    {
      category: "security",
      label: "Wrong Transfer Scam",
      query:
        "Someone claims they sent 25,000 FCFA by mistake and pressures me for an immediate refund. How can I safely check?",
      badge: "Transfer Scam",
    },
    {
      category: "security",
      label: "Detect Spoofed Operator SMS",
      query:
        "How can I tell a genuine Moov Money or T-Money notification from a spoofed sender name?",
      badge: "SMS Security",
    },
    {
      category: "study",
      label: "Interactive Knowledge Quiz",
      query: "/quiz",
      badge: "Learning Mode",
    },
    {
      category: "study",
      label: "Generate 5-Day Study Plan",
      query: "/plan in 5 days",
      badge: "Planning",
    },
  ],
  ee: [
    {
      category: "security",
      label: "OTP Kɔdi Biabia",
      query:
        "Dɔwɔla aɖe le nye OTP kɔdi biam le ka dzi be yeadzra nye T-Money akɔnta ɖo, nukae mawɔ ?",
      badge: "Mobile Money",
    },
    {
      category: "security",
      label: "Vodada Gaɖoɖo 25 000 F",
      query:
        "Ame aɖe be yeɖo 25 000 F nam le vodada me eye wòle kaba wɔm nam be matrɔe nɛ, aleke mawɔ akpɔ nye ga teƒetɔ ?",
      badge: "Gaɖoɖo Vɔ̃ɖi",
    },
    {
      category: "security",
      label: "Moov kple T-Money SMS Nyateƒetɔ",
      query: "Aleke mawɔ anya Moov alo Togocom ƒe SMS nyateƒetɔ le bebletɔwo dome ?",
      badge: "SMS Dedienɔnɔ",
    },
    {
      category: "study",
      label: "Quiz Kpuie (Nusrɔ̃la)",
      query: "/quiz",
      badge: "Nusrɔ̃la",
    },
    {
      category: "study",
      label: "Nusrɔ̃gbe 5 Ɖoɖo",
      query: "/plan le ŋkeke 5 me",
      badge: "Ɖoɖowɔwɔ",
    },
  ],
};

const SLASH_COMMANDS = [
  {
    cmd: "/apprendre",
    label: "Mode Apprentissage",
    desc: "Active le tuteur d'étude et ouvre l'import de cours (PDF, photo ou texte)",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    cmd: "/plan",
    label: "Plan d'Apprentissage",
    desc: "Génère un rétro-planning méthodique sur mesure selon la date d'examen",
    icon: Calendar,
    badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    cmd: "/quiz",
    label: "Quiz & Correction",
    desc: "Pose des questions ciblées, évalue et réexplique adaptativement les erreurs",
    icon: HelpCircle,
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    cmd: "/resume",
    label: "Fiches & Synthèse",
    desc: "Synthétise les notions clés, formules et pièges fréquents à l'examen",
    icon: FileText,
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    cmd: "/stop",
    label: "Quitter le Mode Étude",
    desc: "Revient instantanément au scanner d'arnaques Mobile Money",
    icon: XCircle,
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
];

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Bouton de copie avec feedback instantané
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Message copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le texte");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copier le message"
      className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:bg-muted hover:text-foreground"
    >
      {copied ? <CheckCheck className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      <span>{copied ? "Copié" : "Copier"}</span>
    </button>
  );
}

/**
 * Rendu markdown propre et stylisé pour le chat SaaS (sans dépendance externe lourde)
 */
function FormattedChatMessage({ content }: { content: string }) {
  // Découpage en blocs (paragraphes, titres, listes)
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 size-1.5 rounded-full bg-electric shrink-0" />
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ul>,
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {idx + 1}
              </span>
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  const renderInline = (str: string): React.ReactNode => {
    // Regex pour découper les inline code, gras et italique
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={i}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-electric border border-border/40 font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={i} className="italic text-foreground/90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Détection titres ###
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={`h4-${i}`}
          className="font-bold text-sm sm:text-base text-foreground mt-3 mb-1.5 flex items-center gap-1.5 font-display"
        >
          <Sparkle className="size-3.5 text-electric shrink-0" />
          <span>{renderInline(trimmed.slice(4))}</span>
        </h4>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-bold text-base sm:text-lg text-foreground mt-4 mb-2 flex items-center gap-2 font-display"
        >
          <span>{renderInline(trimmed.slice(3))}</span>
        </h3>,
      );
      continue;
    }

    // Détection puces - ou *
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(trimmed.slice(2));
      continue;
    }

    // Détection liste ordonnée 1. 2.
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(orderedMatch[2] ?? "");
      continue;
    }

    // Détection citation >
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2 border-l-4 border-electric/60 bg-electric/5 py-1.5 px-3 rounded-r-xl italic text-xs text-muted-foreground"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>,
      );
      continue;
    }

    // Paragraphe normal
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed mb-2 last:mb-0">
        {renderInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function AssistantPage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const [input, setInput] = useState("");
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showCourseEditor, setShowCourseEditor] = useState(false);

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
          ? "Woezɔ na wò **CyberSafe Assistant** si Google Gemma 4 kplɔna !\n\n🛡️ **Dedienɔnɔ & Mobile Money Fiafia** : Collez wò SMS vɔ̃ɖiwo (T-Money / Moov Money) alo bia biabia le securite ŋuti.\n🎓 **Nusrɔ̃la ƒe Tuteur** : Ŋlɔ `/apprendre` be nàde wò agbalẽ me nyawo (PDF, foto alo nuŋɔŋlɔ), eye nàwɔ quiz (`/quiz`), nusrɔ̃gbe ɖoɖo (`/plan`) kple nyatakaka kpuiwo (`/resume`).\n\nNukae mate ŋu awɔ na wò egbe ?"
          : lang === "en"
            ? "Welcome to your **CyberSafe AI Assistant**, powered by **Google Gemma 4 (`gemma-4-26b-a4b-it`)**.\n\n🛡️ **Cyber & Mobile Money Defense** : Paste any suspicious SMS (T-Money / Moov Money), report scam attempts, or ask security questions.\n🎓 **Intelligent Study Tutor** : Type `/apprendre` to upload your course notes (PDF, handwritten notes photo, or text), then generate personalized study schedules (`/plan`), adaptive quizzes (`/quiz`), or quick summary sheets (`/resume`).\n\nHow can I help you today?"
            : "Bienvenue sur votre **Assistant IA CyberSafe**, propulsé par **Google Gemma 4 (`gemma-4-26b-a4b-it`)**.\n\n🛡️ **Protection Cyber & Mobile Money** : Collez un SMS suspect (T-Money, Moov Money), signalez un appel douteux ou posez vos questions de sécurité.\n🎓 **Tuteur d'Apprentissage Intelligent** : Utilisez la commande `/apprendre` pour téléverser votre cours (PDF, photo de vos notes ou texte), puis générez un planning de révision (`/plan`), des quiz adaptatifs (`/quiz`) ou des fiches synthétiques (`/resume`).\n\nComment puis-je vous accompagner aujourd'hui ?",
      lang,
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const saveCourseData = (
    title: string,
    text: string,
    exam: string,
    subject: string,
    fileType: "pdf" | "photo" | "text" | "txt" | "manual" | "docx" | "pptx" = "manual",
  ) => {
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

    toast.success("Cours analysé et prêt pour l'apprentissage !");

    const wordCount = updated.content ? updated.content.split(/\s+/).filter(Boolean).length : 0;
    const examNotice = exam ? ` · 📅 Examen : **${exam}**` : "";
    const typeNotice =
      fileType === "pdf"
        ? " [Document PDF extrait]"
        : fileType === "photo"
          ? " [Photo analysée par Gemma 4 Vision]"
          : "";
    const msg = `🎓 **Cours chargé avec succès : "${updated.title}"** (~${wordCount} mots)${typeNotice}\n📚 Matière : **${updated.subject}**${examNotice}\n\n💡 **Recommandation de votre Tuteur Gemma 4** : Votre contenu d'étude est parfaitement assimilé. Pour aborder sereinement vos révisions, vous pouvez générer votre planning d'ici l'épreuve avec \`/plan\`, lancer un test de connaissances avec \`/quiz\`, ou me poser directement n'importe quelle question sur ce cours !`;

    setMessages((prev) => [
      ...prev,
      {
        id: `course-loaded-${Date.now()}`,
        role: "assistant",
        content: msg,
        lang,
        isStudent: true,
        proactiveActions: true,
      },
    ]);
  };

  const loadDemoCourse = (demo: DemoCourse) => {
    setCourseInputTitle(demo.title);
    setCourseInputSubject(demo.subject);
    setCourseInputText(demo.content);
    setCourseExamDate(demo.examDate);
    saveCourseData(demo.title, demo.content, demo.examDate, demo.subject, "manual");
  };

  const processIncomingFile = async (file: File) => {
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

    if (isImage) {
      setParsingPdf(true);
      toast.loading("Lecture de la photo par Google Gemma 4 Vision...", { id: "img-parse" });
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(String(ev.target?.result || ""));
          r.onerror = () => reject(new Error("Erreur lecture image"));
          r.readAsDataURL(file);
        });
        const extracted = await extractCourseImageApi(base64, file.type || "image/jpeg", lang);
        toast.dismiss("img-parse");
        toast.success("Photo de cours transcrite avec succès par Gemma 4 Vision !");
        const finalTitle = extracted.suggestedTitle || cleanTitle;
        const finalSubject = extracted.suggestedSubject || courseInputSubject;
        setCourseInputTitle(finalTitle);
        setCourseInputSubject(finalSubject);
        setCourseInputText(extracted.text);
        saveCourseData(finalTitle, extracted.text, courseExamDate || "2026-11-07", finalSubject, "photo");
      } catch (err: any) {
        console.error(err);
        toast.dismiss("img-parse");
        toast.error(err.message || "Erreur lors de la lecture de la photo.");
      } finally {
        setParsingPdf(false);
      }
      return;
    }

    setParsingPdf(true);
    toast.loading(`Lecture du document "${file.name}"...`, { id: "doc-parse" });
    try {
      const parsedDoc = await extractTextFromDocument(file, file.name);
      const text = parsedDoc.text;
      if (!text || text.length < 20) {
        toast.dismiss("doc-parse");
        toast.error("Le document ne contient pas suffisamment de texte extractible.");
        setParsingPdf(false);
        return;
      }

      toast.dismiss("doc-parse");
      toast.success(
        `Document [${parsedDoc.format.toUpperCase()}] "${file.name}" extrait avec succès (${parsedDoc.wordCount} mots) !`,
      );

      setCourseInputTitle(cleanTitle);
      setCourseInputText(text);

      let detectedSubject = courseInputSubject;
      const lowerText = (cleanTitle + " " + text.slice(0, 1000)).toLowerCase();
      if (lowerText.includes("math") || lowerText.includes("algèbre") || lowerText.includes("équation")) {
        detectedSubject = "Mathématiques & Algèbre";
      } else if (
        lowerText.includes("droit") ||
        lowerText.includes("juridique") ||
        lowerText.includes("article") ||
        lowerText.includes("loi")
      ) {
        detectedSubject = "Droit & Sciences Juridiques";
      } else if (
        lowerText.includes("code") ||
        lowerText.includes("python") ||
        lowerText.includes("java") ||
        lowerText.includes("programmation") ||
        lowerText.includes("algorithme")
      ) {
        detectedSubject = "Informatique & Programmation";
      } else if (
        lowerText.includes("physique") ||
        lowerText.includes("chimie") ||
        lowerText.includes("biologie")
      ) {
        detectedSubject = "Physique, Chimie & SVT";
      } else if (
        lowerText.includes("gestion") ||
        lowerText.includes("finance") ||
        lowerText.includes("comptabilité") ||
        lowerText.includes("marketing")
      ) {
        detectedSubject = "Économie, Finance & Gestion";
      }

      setCourseInputSubject(detectedSubject);
      saveCourseData(cleanTitle, text, courseExamDate || "2026-11-07", detectedSubject, parsedDoc.format);
    } catch (err: any) {
      console.error(err);
      toast.dismiss("doc-parse");
      toast.error(
        err.message ||
          "Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un format valide (PDF, DOCX, PPTX, TXT).",
      );
    } finally {
      setParsingPdf(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIncomingFile(file);
      e.target.value = "";
    }
  };

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
      }),
    );
  };

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
      }),
    );
  };

  const buildUniversalQuiz = (topic: string, subject: string): QuizQuestion[] => {
    const lower = (topic + " " + subject).toLowerCase();

    if (
      lower.includes("math") ||
      lower.includes("algèbre") ||
      lower.includes("géométrie") ||
      lower.includes("analyse")
    ) {
      return [
        {
          id: 1,
          question: "Quelle est la dérivée de la fonction f(x) = ln(x) pour tout réel x > 0 ?",
          options: ["f'(x) = 1/x", "f'(x) = e^x", "f'(x) = x", "f'(x) = 1/(x^2)"],
          answerIndex: 0,
          explanation:
            "Par définition fondamentale, la dérivée du logarithme népérien ln(x) sur ]0, +∞[ est égale à 1/x.",
        },
        {
          id: 2,
          question: "Dans un triangle rectangle, quel théorème permet de calculer la longueur de l'hypoténuse ?",
          options: [
            "Le théorème de Thalès",
            "Le théorème de Pythagore",
            "La loi des grands nombres",
            "Le théorème d'Euler",
          ],
          answerIndex: 1,
          explanation:
            "Le théorème de Pythagore stipule que dans tout triangle rectangle, le carré de l'hypoténuse égale la somme des carrés des côtés adjacents.",
        },
        {
          id: 3,
          question: "Que vaut la probabilité de l'événement certain dans un espace probabilisé ?",
          options: ["0", "0.5", "1", "+∞"],
          answerIndex: 2,
          explanation:
            "Selon les axiomes de probabilité de Kolmogorov, la mesure de probabilité de l'univers tout entier Ω vaut exactement 1.",
        },
      ];
    }

    if (
      lower.includes("code") ||
      lower.includes("informatique") ||
      lower.includes("python") ||
      lower.includes("programmation") ||
      lower.includes("algo")
    ) {
      return [
        {
          id: 1,
          question:
            "En algorithmique, quelle est la complexité temporelle optimale d'une recherche dichotomique dans un tableau trié de taille N ?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
          answerIndex: 1,
          explanation:
            "La recherche dichotomique divise l'intervalle de recherche par 2 à chaque étape, garantissant une complexité logarithmique O(log N).",
        },
        {
          id: 2,
          question: "En Python, quel type de structure de données est immuable (non modifiable après instanciation) ?",
          options: ["list (liste)", "dict (dictionnaire)", "tuple (uplet)", "set (ensemble)"],
          answerIndex: 2,
          explanation:
            "Les tuples sont immuables en Python, ce qui garantit leur intégrité et permet de les utiliser comme clés de dictionnaires.",
        },
        {
          id: 3,
          question: "Quel protocole réseau sécurisé chiffre les échanges web entre le navigateur et le serveur ?",
          options: ["HTTP", "HTTPS (avec protocole TLS)", "FTP", "Telnet non chiffré"],
          answerIndex: 1,
          explanation:
            "HTTPS utilise le protocole cryptographique TLS pour garantir la confidentialité et l'authenticité des échanges web.",
        },
      ];
    }

    if (
      lower.includes("droit") ||
      lower.includes("loi") ||
      lower.includes("juridique") ||
      lower.includes("justice")
    ) {
      return [
        {
          id: 1,
          question:
            "Selon la hiérarchie des normes (Pyramide de Kelsen), quelle norme juridique prime sur toutes les autres au sein de l'État ?",
          options: ["Le décret ministériel", "La loi ordinaire", "La Constitution", "Le règlement intérieur"],
          answerIndex: 2,
          explanation:
            "La Constitution est la norme suprême au sommet de l'ordre juridique de l'État de droit.",
        },
        {
          id: 2,
          question: "Quelles sont les trois conditions cumulatives pour engager la responsabilité civile délictuelle ?",
          options: [
            "Une faute, un dommage certain et un lien de causalité direct",
            "Un contrat signé, un paiement bancaire et une quittance",
            "Une décision de justice, un avocat et un huissier",
            "Une infraction pénale, une garde à vue et un procès",
          ],
          answerIndex: 0,
          explanation:
            "La responsabilité extracontractuelle requiert la conjonction avérée d'un fait générateur (faute), d'un préjudice (dommage) et d'un lien causal direct.",
        },
        {
          id: 3,
          question: "Dans l'espace OHADA, quel instrument régit de manière uniforme le droit commercial général ?",
          options: [
            "Le Code civil français",
            "Les Actes Uniformes de l'OHADA",
            "Le traité de Rome",
            "La convention de Genève",
          ],
          answerIndex: 1,
          explanation:
            "Les Actes Uniformes adoptés par l'OHADA sont d'application directe et obligatoire dans l'ensemble des pays membres.",
        },
      ];
    }

    return [
      {
        id: 1,
        question: `Dans l'étude de "${topic || "Cybersécurité & Technologies"}", quelle est la règle d'or absolue concernant les codes secrets OTP et PIN ?`,
        options: [
          "Les partager uniquement avec les agents qui se présentent au téléphone.",
          "Ne JAMAIS les divulguer : aucun service officiel légitime ne vous les réclamera.",
          "Les envoyer par retour de SMS si le nom de l'opérateur s'affiche.",
          "Les écrire sur une feuille collée au dos de son téléphone.",
        ],
        answerIndex: 1,
        explanation:
          "Un code OTP est un secret d'authentification strictement personnel. Les opérateurs disposent déjà des droits d'administration et n'ont jamais besoin de votre code.",
      },
      {
        id: 2,
        question:
          "Devant un SMS affirmant qu'une somme vous a été transférée par erreur, comment s'assurer avec certitude de la réalité du transfert ?",
        options: [
          "Faire confiance au SMS reçu et renvoyer la somme immédiatement.",
          "Consulter son solde réel via le menu USSD officiel sécurisé (*155# ou *145#).",
          "Demander à l'appelant une photo de sa carte d'identité.",
          "Éteindre son téléphone pendant deux jours.",
        ],
        answerIndex: 1,
        explanation:
          "Les faux SMS de transfert imitent parfaitement la typographie officielle. Seule l'interrogation du solde via le menu USSD de l'opérateur (*145# ou *155#) est infalsifiable.",
      },
      {
        id: 3,
        question:
          "Quel mécanisme de protection associe un mot de passe et une validation par code éphémère (SMS ou application) ?",
        options: [
          "L'authentification à deux facteurs (2FA / MFA)",
          "Le hachage MD5",
          "Le hameçonnage contextuel",
          "Le protocole Telnet",
        ],
        answerIndex: 0,
        explanation:
          "L'authentification multifactorielle (MFA) exige deux facteurs distincts de vérification, bloquant la majorité des tentatives d'usurpation.",
      },
    ];
  };

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
        day: "Jour 2 — Approfondissement & Exercices d'Application",
        topic: `Résolution d'exercices d'application, études de cas et méthodes d'analyse en ${subject}.`,
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
        topic: "Auto-évaluation chronométrée sur annales ou sujets types et analyse approfondie des erreurs.",
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
    const cmd = (parts[0] ?? "").toLowerCase();
    const rest = parts.slice(1).join(" ");

    setShowSlashMenu(false);
    setApiError(null);

    if (cmd === "/stop") {
      setIsStudentMode(false);
      setShowCourseEditor(false);
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
          content:
            "🛑 **Mode Apprentissage désactivé (`/stop`).**\n\nVous êtes de retour en **Mode Scanner d'Arnaques & Sécurité Mobile Money**. Collez un SMS suspect (T-Money / Moov) ou posez votre question de sécurité dès que vous le souhaitez !",
          lang,
          isStudent: false,
        },
      ]);
      toast.info("Mode apprentissage quitté. Retour au scanner d'arnaques.");
      return;
    }

    if (cmd === "/apprendre") {
      setIsStudentMode(true);
      setShowCourseEditor(true);
      const textToLoad = rest.trim();
      if (textToLoad) {
        setCourseInputTitle(textToLoad);
        saveCourseData(textToLoad, course.content, course.examDate, textToLoad, "manual");
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
            content:
              "🎓 **Mode Apprentissage activé (`/apprendre`) !**\n\nTéléversez votre support d'étude (**document PDF, photo de cours ou notes brutes**) dans le panneau ci-dessus, ou chargez l'un des **Cours d'exemple Démo** en un clic.\n\nUne fois le cours chargé, **Google Gemma 4** se transforme en tuteur privé : planifiez vos révisions (`/plan`), testez vos réflexes avec des quiz adaptatifs (`/quiz`), ou obtenez une synthèse claire (`/resume`). Tapez `/stop` à tout instant pour revenir au scanner.",
            lang,
            isStudent: true,
          },
        ]);
      }
      return;
    }

    if (cmd === "/quiz") {
      setIsStudentMode(true);
      setLoading(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: "/quiz",
          lang,
        },
      ]);

      try {
        const res = await generateStudyQuizApi(
          course.title || course.subject,
          course.subject,
          course.content,
          lang,
        );
        const quizItems =
          res.quiz && res.quiz.length > 0
            ? res.quiz
            : buildUniversalQuiz(course.title, course.subject);

        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content:
              res.reply ||
              `🎯 **Quiz d'Évaluation Adaptatif : "${course.title || course.subject}"**\n\nRépondez aux questions ci-dessous pour valider vos acquis. Si une notion vous échappe, je vous proposerai un approfondissement immédiat :`,
            lang,
            quiz: quizItems,
            isStudent: true,
          },
        ]);
      } catch (err: any) {
        console.warn("Fallback quiz local suite erreur API:", err);
        const quizItems = buildUniversalQuiz(course.title, course.subject);
        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content: `🎯 **Quiz d'Évaluation Interactif : "${course.title || course.subject}"**\n\nTestez vos connaissances en cliquant sur vos réponses ci-dessous :`,
            lang,
            quiz: quizItems,
            isStudent: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (cmd === "/plan") {
      setIsStudentMode(true);
      setLoading(true);
      const targetDate = rest || course.examDate || "Dans 5 jours";
      setMessages((prev) => [
        ...prev,
        {
          id: `cmd-user-${Date.now()}`,
          role: "user",
          content: `/plan ${rest}`.trim(),
          lang,
        },
      ]);

      try {
        const res = await generateStudyPlanApi(
          course.title || course.subject,
          course.subject,
          course.content,
          targetDate,
          lang,
        );
        const planItems =
          res.plan && res.plan.length > 0
            ? res.plan
            : buildUniversalPlan(targetDate, course.title, course.subject);

        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content:
              res.reply ||
              `📅 **Plan d'Apprentissage Structuré : "${course.title || course.subject}"**\nDate cible d'examen : **${targetDate}**\n\nCochez vos étapes au fur et à mesure pour mesurer votre progression :`,
            lang,
            plan: planItems,
            isStudent: true,
          },
        ]);
      } catch (err: any) {
        console.warn("Fallback plan local suite erreur API:", err);
        const planItems = buildUniversalPlan(targetDate, course.title, course.subject);
        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content: `📅 **Rétro-planning d'étude méthodique : "${course.title || course.subject}"**\nDate cible d'examen : **${targetDate}**\n\nCochez vos étapes au fur et à mesure de vos révisions :`,
            lang,
            plan: planItems,
            isStudent: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
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
          "student",
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `cmd-resp-${Date.now()}`,
            role: "assistant",
            content: `📑 **Fiche de Synthèse Clé — ${course.title || course.subject}**\n\n${res.reply}`,
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

  const triggeredCmdRef = useRef(false);
  useEffect(() => {
    if (search.cmd && !triggeredCmdRef.current) {
      triggeredCmdRef.current = true;
      executeCommand(search.cmd);
    }
  }, [search.cmd]);

  const handleExplainQuizMistake = (q: QuizQuestion) => {
    const chosen = q.userSelectedIndex !== undefined ? q.options[q.userSelectedIndex] : "";
    const correct = q.options[q.answerIndex];
    const adaptivePrompt = `Je me suis trompé à la question : "${q.question}". J'ai sélectionné "${chosen}" alors que la bonne réponse est "${correct}". Peux-tu réexpliquer cette notion simplement avec un exemple pratique pour que je ne refasse plus cette erreur ?`;
    send(adaptivePrompt);
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
        isStudentMode ? course.content : undefined,
        isStudentMode ? "student" : "standard",
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
      const msg = err.message || "Erreur de communication avec Google Gemma 4.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Quota API Gemma 4 dépassé" : "Erreur Gemma 4");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec switch tactile des 2 modes principaux */}
      <PageHeader
        icon={Bot}
        title={t("assistant.title")}
        subtitle={
          isStudentMode
            ? "Tuteur d'étude interactif propulsé par Gemma 4 : révisions, quiz adaptatifs et rétro-planning d'examen."
            : "Assistant de sécurité Mobile Money & détection de fraudes, propulsé par Google Gemma 4."
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de Mode en 1 clic */}
          <div className="inline-flex rounded-xl border-2 border-foreground/80 bg-card p-1 shadow-neo-sm">
            <button
              type="button"
              onClick={() => {
                if (isStudentMode) executeCommand("/stop");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black transition-all",
                !isStudentMode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ShieldCheck className="size-3.5 stroke-[2.5]" />
              <span>Scanner d'Arnaques</span>
              {!isStudentMode && (
                <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isStudentMode) executeCommand("/apprendre");
                else setShowCourseEditor(true);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black transition-all",
                isStudentMode
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GraduationCap className="size-3.5 stroke-[2.5]" />
              <span>Mode Apprendre</span>
              {isStudentMode && (
                <span className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
              )}
            </button>
          </div>

          <CyberSticker tone="lime" icon={Sparkles} rotate="none">
            Gemma 4 (26B IT)
          </CyberSticker>
        </div>
      </PageHeader>

      {apiError && (
        <div className="mb-4">
          <AiStatusBanner error={apiError.message} quotaExceeded={apiError.quota} />
        </div>
      )}

      {/* Bannière Tactile du Cours Actif (Mode Apprendre) */}
      {isStudentMode && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-r from-purple-500/10 via-card to-purple-500/5 p-4 text-xs transition-all animate-rise shadow-neo-sm">
          <WavyCyberGrid opacity={0.12} className="text-purple-600" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-600 text-white shadow-neo-sm border-2 border-foreground/80">
                <BookOpen className="size-5" />
              </div>
              <div>
                <div className="font-bold text-foreground text-sm flex flex-wrap items-center gap-2 font-display">
                  <span>{course.title || "Cours d'étude actif"}</span>
                  <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-300">
                    {course.subject || "Général"}
                  </span>
                  {course.fileType === "pdf" && (
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FileCheck2 className="size-3" /> PDF Actif
                    </span>
                  )}
                  {course.fileType === "photo" && (
                    <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1">
                      <ImageUp className="size-3" /> Photo Gemma Vision
                    </span>
                  )}
                  {course.examDate && (
                    <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      Examen : {course.examDate}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5 font-medium">
                  {course.content
                    ? `${course.content.split(/\s+/).filter(Boolean).length} mots analysés · Actions rapides disponibles ci-dessous`
                    : "Aucun cours chargé. Téléversez un PDF ou choisissez un cours démo."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeCommand("/plan")}
                disabled={loading}
                className="gap-1 text-xs h-8 border-foreground/60 shadow-neo-sm"
              >
                <Calendar className="size-3.5 text-blue-500" /> Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeCommand("/quiz")}
                disabled={loading}
                className="gap-1 text-xs h-8 border-foreground/60 shadow-neo-sm"
              >
                <HelpCircle className="size-3.5 text-amber-500" /> Quiz
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeCommand("/resume")}
                disabled={loading}
                className="gap-1 text-xs h-8 border-foreground/60 shadow-neo-sm"
              >
                <FileText className="size-3.5 text-emerald-500" /> Synthèse
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCourseEditor(!showCourseEditor)}
                className="gap-1 text-xs h-8 border-foreground/60 shadow-neo-sm"
              >
                {showCourseEditor ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                {showCourseEditor ? "Fermer" : "Gérer cours"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => executeCommand("/stop")}
                className="text-xs h-8 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="size-3.5 mr-1" /> /stop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tiroir d'Édition et d'Import de Cours */}
      {isStudentMode && showCourseEditor && (
        <Panel className="border-2 border-purple-500/40 bg-card p-5 animate-rise space-y-4 shadow-neo">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-foreground font-display">
                <GraduationCap className="size-4 text-purple-600" /> Volet « Apprendre » — Téléversez votre support d'étude
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Formats acceptés : PDF polycopiés, photos de cours/cahiers (transcription Gemma Vision), documents Word ou texte brut.
              </p>
            </div>
            <CyberSticker tone="purple" icon={Sparkles} rotate="none">
              Gemma 4 Tuteur
            </CyberSticker>
          </div>

          {/* Cours Démo 1-clic */}
          <div className="rounded-xl border-2 border-primary/25 bg-primary/5 p-3.5 space-y-2.5">
            <div className="text-xs font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="size-3.5 text-electric" /> Cours prêts pour la démo (Chargement en 1 clic) :
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {DEMO_COURSES.map((dc) => (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => loadDemoCourse(dc)}
                  className="rounded-xl border-2 border-border/80 bg-card p-2.5 text-left text-xs transition-all hover:border-primary hover:shadow-neo-sm hover:-translate-y-0.5"
                >
                  <div className="font-bold text-foreground line-clamp-1">{dc.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-medium">
                    {dc.subject} · Examen : {dc.examDate}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Choix Discipline */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Discipline / Matière :
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {SUBJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCourseInputSubject(cat.name);
                    if (!courseInputTitle || SUBJECT_CATEGORIES.some((c) => c.name === courseInputTitle)) {
                      setCourseInputTitle(cat.name);
                    }
                  }}
                  className={cn(
                    "rounded-xl border-2 px-3 py-1.5 text-xs transition flex items-center gap-1.5 font-semibold",
                    courseInputSubject === cat.name
                      ? "border-purple-600 bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold shadow-neo-sm"
                      : "border-border/60 bg-muted/40 hover:bg-muted text-foreground/80",
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
              <label className="text-xs font-bold text-muted-foreground">Titre précis du cours :</label>
              <input
                type="text"
                value={courseInputTitle}
                onChange={(e) => setCourseInputTitle(e.target.value)}
                placeholder="Ex: Sécurité Mobile Money, Algèbre Linéaire, Droit des Affaires..."
                className="mt-1.5 w-full rounded-xl border-2 border-border/80 bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Date de l'examen (pour /plan) :</label>
              <input
                type="date"
                value={courseExamDate}
                onChange={(e) => setCourseExamDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-border/80 bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                Contenu du cours (texte saisi, extrait de PDF ou photo) :
              </label>
              {parsingPdf && (
                <span className="flex items-center gap-1.5 text-xs text-purple-600 font-bold animate-pulse">
                  <Loader2 className="size-3.5 animate-spin" /> Analyse du document en cours...
                </span>
              )}
            </div>
            <Textarea
              value={courseInputText}
              onChange={(e) => setCourseInputText(e.target.value)}
              placeholder="Collez ici vos notes de cours ou utilisez le bouton de téléversement ci-dessous..."
              rows={5}
              className="mt-1.5 resize-none rounded-xl text-xs border-2"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-purple-500/60 bg-purple-500/10 px-3.5 py-2 text-xs font-bold hover:bg-purple-500/20 transition text-foreground">
                <Upload className="size-3.5 text-purple-600" />
                <span>Téléverser (PDF, Photo ou TXT)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.text,application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={parsingPdf}
                />
              </label>
              <span className="text-[11px] text-muted-foreground">
                PDF polycopiés, captures et photos de cahier acceptés
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCourseEditor(false)}
                className="text-xs"
              >
                Fermer
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() =>
                  saveCourseData(courseInputTitle, courseInputText, courseExamDate, courseInputSubject)
                }
                disabled={(!courseInputText.trim() && !courseInputTitle.trim()) || parsingPdf}
                className="text-xs gap-1.5 shadow-neo-sm"
              >
                <Check className="size-3.5" /> Enregistrer ce cours
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Zone Principale de Chat + Volet Latéral */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne Chat */}
        <div className="lg:col-span-2 space-y-4">
          <Panel className="min-h-[520px] flex flex-col justify-between p-4 sm:p-6 bg-card/90 backdrop-blur-md border-2 border-border shadow-neo relative overflow-hidden">
            {/* Décoration de fond subtile */}
            <WavyCyberGrid opacity={0.06} className="text-foreground pointer-events-none" />

            {/* Flux de messages */}
            <div className="space-y-5 overflow-y-auto max-h-[560px] pr-2 relative z-10">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} animate-rise`}
                >
                  {/* Avatar Assistant */}
                  {m.role === "assistant" && (
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-electric text-night font-bold shadow-neo-sm border-2 border-foreground/80 mt-1">
                      {m.isStudent ? <GraduationCap className="size-4" /> : <Bot className="size-4" />}
                    </div>
                  )}

                  <div className="max-w-[88%] space-y-3">
                    {/* Bulle de message */}
                    <div
                      className={cn(
                        "rounded-2xl p-4 text-sm leading-relaxed transition-all",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground font-medium shadow-neo-sm ml-auto border-2 border-foreground/60 rounded-tr-xs"
                          : "bg-card text-foreground border-2 border-border/90 shadow-neo-sm rounded-tl-xs",
                      )}
                    >
                      {/* Entête dans la bulle assistant */}
                      {m.role === "assistant" && (
                        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground font-display">
                              {m.isStudent ? "Tuteur Gemma 4" : "Assistant CyberSafe"}
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Gemma 4 IT
                            </span>
                          </div>
                          <CopyButton text={m.content} />
                        </div>
                      )}

                      {/* Rendu markdown enrichi */}
                      {m.role === "assistant" ? (
                        <FormattedChatMessage content={m.content} />
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>

                    {/* Actions proactives suggérées */}
                    {m.proactiveActions && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          variant="neo"
                          size="sm"
                          onClick={() => executeCommand("/plan")}
                          disabled={loading}
                          className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                        >
                          <Calendar className="size-3.5 text-blue-500" /> Générer mon plan (/plan)
                        </Button>
                        <Button
                          type="button"
                          variant="neo"
                          size="sm"
                          onClick={() => executeCommand("/quiz")}
                          disabled={loading}
                          className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                        >
                          <HelpCircle className="size-3.5 text-amber-500" /> Quiz du jour (/quiz)
                        </Button>
                        <Button
                          type="button"
                          variant="neo"
                          size="sm"
                          onClick={() => executeCommand("/resume")}
                          disabled={loading}
                          className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                        >
                          <FileText className="size-3.5 text-emerald-500" /> Fiche de révision (/resume)
                        </Button>
                      </div>
                    )}

                    {/* Quiz Interactif Intégré */}
                    {m.quiz && m.quiz.length > 0 && (
                      <div className="space-y-4 rounded-2xl border-2 border-amber-500/40 bg-card p-4 shadow-neo">
                        <div className="flex items-center justify-between border-b pb-2.5">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="size-4" /> Quiz Interactif & Adaptatif (Gemma 4)
                          </span>
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                            Score : {m.quiz.filter((q) => q.userSelectedIndex === q.answerIndex).length} / {m.quiz.length}
                          </span>
                        </div>

                        {m.quiz.map((q, qIndex) => {
                          const hasAnswered = q.userSelectedIndex !== undefined;
                          const isCorrect = q.userSelectedIndex === q.answerIndex;

                          return (
                            <div key={q.id} className="rounded-xl border-2 border-border/80 bg-muted/20 p-3.5 text-xs space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-amber-500/20 font-bold text-amber-700 dark:text-amber-300 text-[11px]">
                                  {qIndex + 1}
                                </span>
                                <p className="font-bold text-sm text-foreground leading-snug">{q.question}</p>
                              </div>

                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = q.userSelectedIndex === optIdx;
                                  const isTheCorrectOne = optIdx === q.answerIndex;
                                  const letter = OPTION_LETTERS[optIdx] ?? `${optIdx + 1}`;

                                  let btnStyle = "border-border/80 bg-card hover:border-foreground/60 text-foreground";
                                  if (hasAnswered) {
                                    if (isTheCorrectOne) {
                                      btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm";
                                    } else if (isSelected && !isCorrect) {
                                      btnStyle = "border-destructive bg-destructive/15 text-destructive font-bold";
                                    } else {
                                      btnStyle = "opacity-50 border-transparent bg-muted/40";
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleSelectQuizAnswer(m.id, q.id, optIdx)}
                                      disabled={hasAnswered}
                                      className={cn(
                                        "w-full text-left rounded-xl border-2 p-2.5 text-xs transition flex items-center justify-between gap-3 shadow-neo-sm",
                                        btnStyle,
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="grid size-5 shrink-0 place-items-center rounded-md border border-foreground/30 bg-muted font-mono font-bold text-[11px]">
                                          {letter}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {hasAnswered && isTheCorrectOne && (
                                        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                      {hasAnswered && isSelected && !isCorrect && (
                                        <X className="size-4 shrink-0 text-destructive" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div
                                  className={cn(
                                    "rounded-xl p-3 text-xs leading-relaxed border-2 mt-2 space-y-2 animate-rise",
                                    isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                                      : "bg-destructive/10 border-destructive/30 text-destructive-foreground",
                                  )}
                                >
                                  <div>
                                    <strong>{isCorrect ? "✓ Excellente analyse ! " : "✗ Correction pédagogique : "}</strong>
                                    {q.explanation}
                                  </div>
                                  {!isCorrect && (
                                    <button
                                      type="button"
                                      onClick={() => handleExplainQuizMistake(q)}
                                      disabled={loading}
                                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-foreground/60 bg-card px-2.5 py-1 text-[11px] font-bold text-foreground transition hover:bg-accent shadow-neo-sm"
                                    >
                                      <RefreshCw className="size-3 text-electric" /> Notion mal comprise ? Réexpliquer avec Gemma 4
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Plan d'Étude Interactif Intégré */}
                    {m.plan && m.plan.length > 0 && (
                      <div className="space-y-3 rounded-2xl border-2 border-blue-500/40 bg-card p-4 shadow-neo">
                        <div className="flex items-center justify-between border-b pb-2.5">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="size-4" /> Plan d'Étude Méthodique (Gemma 4)
                          </span>
                          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            {m.plan.filter((p) => p.completed).length} / {m.plan.length} étapes validées
                          </span>
                        </div>

                        {/* Barre de Progression */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden border">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                (m.plan.filter((p) => p.completed).length / m.plan.length) * 100,
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          {m.plan.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleTogglePlanItem(m.id, item.id)}
                              className={cn(
                                "w-full text-left rounded-xl border-2 p-3 text-xs transition-all flex items-start gap-3",
                                item.completed
                                  ? "bg-emerald-500/10 border-emerald-500/40 line-through text-muted-foreground shadow-none"
                                  : "bg-card border-border/80 hover:border-foreground/50 text-foreground shadow-neo-sm hover:translate-x-0.5",
                              )}
                            >
                              <div className="mt-0.5">
                                {item.completed ? (
                                  <CheckSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Square className="size-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-[11px] uppercase tracking-wider text-primary">
                                  {item.day}
                                </div>
                                <div className="mt-0.5 font-medium leading-relaxed">{item.topic}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avatar Utilisateur */}
                  {m.role === "user" && (
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary font-bold shadow-neo-sm border-2 border-foreground/60 mt-1">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Indicateur de Réflexion */}
              {loading && (
                <div className="flex items-center gap-2.5 text-xs font-bold text-primary animate-pulse py-2">
                  <div className="grid size-6 place-items-center rounded-lg bg-electric text-night">
                    <Sparkles className="size-3.5 animate-spin" />
                  </div>
                  <span>
                    Google Gemma 4 génère la réponse en {lang === "ee" ? "Eʋegbe" : lang === "en" ? "English" : "Français"}...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Zone de Saisie & Commandes */}
            <div className="mt-4 pt-3 border-t-2 border-border/80 space-y-2.5 relative z-20">
              {/* Menu Popup Slash */}
              {showSlashMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border-2 border-foreground bg-card/95 p-2.5 shadow-neo-lg backdrop-blur-xl animate-rise z-30 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    Commandes Disponibles (Google Gemma 4)
                  </div>
                  {SLASH_COMMANDS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.cmd}
                        onClick={() => executeCommand(item.cmd)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold hover:bg-accent transition text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="size-4 text-electric shrink-0" />
                          <strong className="font-mono text-primary">{item.cmd}</strong>
                          <span className="text-muted-foreground">— {item.label}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Raccourcis de Commandes `/` Tactiles */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
                  Actions `/` :
                </span>
                {SLASH_COMMANDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.cmd}
                      onClick={() => executeCommand(item.cmd)}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-foreground/60 bg-card px-2.5 py-1 text-[11px] font-bold text-foreground transition hover:border-foreground hover:bg-accent shadow-neo-sm shrink-0 active:translate-y-0.5"
                    >
                      <Icon className="size-3 text-electric" />
                      {item.cmd}
                    </button>
                  );
                })}
              </div>

              {/* Champ Textarea & Boutons */}
              <div className="flex items-end gap-2">
                <label
                  title="Téléverser un cours (PDF, photo ou document)"
                  className={cn(
                    "grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-foreground/70 bg-card text-foreground transition hover:border-foreground hover:bg-accent shadow-neo-sm active:translate-y-0.5",
                    parsingPdf && "animate-pulse pointer-events-none opacity-60",
                  )}
                >
                  {parsingPdf ? (
                    <Loader2 className="size-4 animate-spin text-electric" />
                  ) : (
                    <Paperclip className="size-4" />
                  )}
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.text,application/pdf,image/png,image/jpeg,image/webp"
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
                        ? `Posez une question sur "${course.title || course.subject}" ou tapez /plan, /quiz, /resume, /stop...`
                        : "Collez un SMS suspect (T-Money/Moov), posez une question de sécurité, ou cliquez sur /apprendre..."
                    }
                    className="resize-none rounded-xl border-2 text-xs focus:ring-2 focus:ring-primary"
                    disabled={loading || parsingPdf}
                  />
                </div>

                <Button
                  variant="hero"
                  className="shrink-0 h-11 px-4 shadow-neo-sm"
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

              {/* Barre d'état inférieure */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <Sparkles className="size-3 text-electric" />
                  Moteur : <strong>Google Gemma 4 (26B IT)</strong>
                  {isStudentMode ? ` · Tuteur (${course.subject})` : " · Scanner Mobile Money"}
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
                  className="hover:underline inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" /> {t("assistant.clearChat")}
                </button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Volet Latéral Droite : Suggestions & Informations */}
        <div className="space-y-4">
          {/* Suggestions Pratiques par Catégorie */}
          <Panel className="border-2 border-border shadow-neo-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center justify-between font-display text-foreground">
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-electric" />
                {t("assistant.suggested")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                1 Clic
              </span>
            </h3>

            <div className="space-y-2.5">
              {(SUGGESTIONS[lang] || SUGGESTIONS.fr).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.query.startsWith("/")) {
                      executeCommand(item.query);
                    } else {
                      send(item.query);
                    }
                  }}
                  className="w-full text-left rounded-xl border-2 border-border/80 bg-card p-3 text-xs transition-all hover:border-foreground hover:shadow-neo-sm hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-electric">
                      {item.badge}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-bold text-foreground leading-snug">{item.label}</div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {item.query}
                  </p>
                </button>
              ))}
            </div>
          </Panel>

          {/* Guide Rapide des Commandes / */}
          <Panel className="border-2 border-purple-500/40 bg-card shadow-neo-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-display">
                <GraduationCap className="size-4" />
                Commandes `/` (Tuteur Gemma 4)
              </h4>
              <MemphisDoodle variant="spark" className="size-4 text-purple-600 opacity-60" />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Activez des super-pouvoirs d'apprentissage instantanément en tapant <code>/</code> :
            </p>

            <div className="space-y-2 text-xs">
              {SLASH_COMMANDS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.cmd}
                    onClick={() => executeCommand(item.cmd)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/60 transition group border border-transparent hover:border-border/60"
                  >
                    <Icon className="size-3.5 text-purple-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-primary text-[11px]">
                          {item.cmd}
                        </code>
                        <span className="text-[11px] font-bold text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Carte de Sécurité & Confidentialité Certifiée */}
          <Panel className="border-2 border-foreground/60 bg-night text-night-foreground shadow-neo space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-electric flex items-center gap-1.5 font-display">
              <ShieldCheck className="size-4" />
              Confidentialité & Sécurité
            </h4>
            <p className="text-xs text-night-muted leading-relaxed font-medium">
              {t("assistant.eweWarning")}
            </p>

            <div className="rounded-xl bg-night-foreground/10 p-3 text-[11px] text-night-muted space-y-2 border border-white/10">
              <div className="flex items-center gap-2 text-night-foreground font-bold">
                <Lock className="size-3.5 text-emerald-400 shrink-0" />
                Zéro conservation de données personnelles
              </div>
              <p className="leading-relaxed">
                Vos SMS et documents d'étude sont analysés en mémoire vive pour générer les réponses. Aucune donnée bancaire ni aucun numéro de téléphone n'est enregistré.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold pt-1 text-[10px]">
                <CheckCircle2 className="size-3" /> Clés API protégées côté serveur
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
