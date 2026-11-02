import type { Language } from "./i18n";

export interface DemoItem {
  label: string;
  text: string;
  tag?: "legit" | "scam";
}

export interface DemoQrItem {
  label: string;
  content: string;
  tag: "legit" | "scam";
  description: string;
}

export interface DemoAudioItem {
  id: string;
  title: string;
  caller: string;
  tag: "scam" | "legit";
  transcript: string;
  notes: string;
}

export type DemoAudioScenario = DemoAudioItem;

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

export interface DemoCourse {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  content: string;
  flashcards?: Flashcard[];
}

export const DEMO_COURSES: DemoCourse[] = [
  {
    id: "cyber-lbs",
    title: "Sécurité des Paiements Mobiles & Cryptographie (LBS)",
    subject: "Cybersécurité & Réseaux",
    examDate: "2026-11-06",
    content: `CHAPITRE 1 : ARCHITECTURE DE SÉCURITÉ MOBILE MONEY (T-MONEY & MOOV MONEY)
1. Authentification forte et Code Secret (PIN) :
Le code PIN est un secret cryptographique strictement personnel qui signe les transactions USSD (*145# pour T-Money / Yas, *155# pour Moov Money / Flooz). Aucun agent ou administrateur opérateur n'a besoin du PIN ou du code OTP (One-Time Password) pour annuler ou débloquer une opération.
2. Conformité des notifications SMS officielles :
Un SMS légitime de transaction contient systématiquement : un identifiant d'expéditeur court officiel (TMoney, MoovMoney), le montant exact en FCFA, le nouveau solde actualisé et une référence unique de transaction (Réf / TxID). Il ne contient jamais de lien web externe ni de demande de renvoi d'argent.

CHAPITRE 2 : VECTEURS D'INGÉNIERIE SOCIALE AU TOGO
1. L'arnaque au faux dépôt par erreur :
L'attaquant envoie un faux SMS depuis un numéro personnel (+228 9X XX XX XX) imitant un reçu de dépôt, puis appelle la victime dans l'urgence (prétexte d'hôpital ou de famille) pour réclamer le remboursement immédiat. Parade : toujours vérifier le solde réel via USSD (*145# ou *155#) avant toute action.
2. Fausses tontines et faux concours promotionnels :
Promesse de doublement de mise ou de loterie avec lien de phishing (.xyz, .top) visant à dérober le PIN + OTP pour associer un nouvel appareil au portefeuille de la victime.

CHAPITRE 3 : PROTOCOLES CRYPTOGRAPHIQUES (TLS, HACHAGE & MFA)
- TLS 1.3 chiffre les communications de bout en bout.
- Le hachage (SHA-256, Argon2) protège les secrets stockés de manière irréversible.
- L'authentification multifacteur (MFA / 2FA) combine ce que l'utilisateur sait (PIN) et ce qu'il possède (carte SIM / OTP).`,
    flashcards: [
      {
        id: "cyber-fc-1",
        front: "Code PIN Mobile Money & Tiers",
        back: "Le code PIN est un secret cryptographique strictement personnel. Aucun agent ou opérateur légitime ne demande jamais votre code PIN ou OTP.",
        mastered: false,
        binaryStatement:
          "Un agent officiel du service client T-Money ou Moov Money est habilité à vous demander votre code secret PIN pour annuler une transaction frauduleuse.",
        binaryAnswer: false,
        binaryExplanation:
          "FAUX. Aucun agent, technicien ou responsable d'opérateur n'a le droit de réclamer votre code PIN ou votre code temporaire OTP. Toute demande de cet ordre est une escroquerie avérée.",
        mcqQuestion:
          "Lors d'un prétendu virement Mobile Money reçu par erreur, quelle est la démarche rigoureusement recommandée avant d'agir ?",
        mcqOptions: [
          "Vérifier son solde réel directement via le menu USSD officiel (*145# ou *155#)",
          "Faire confiance au SMS reçu et renvoyer la somme réclamée par l'appelant",
          "Transférer le code temporaire OTP reçu par SMS au conseiller au téléphone",
          "Cliquer sur le lien d'annulation web contenu dans le message reçu",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "La règle fondamentale de défense contre l'arnaque au faux dépôt est de vérifier systématiquement son solde réel via la commande USSD opérateur (*145# ou *155#) et non de se fier aux SMS reçus d'un numéro ordinaire.",
      },
      {
        id: "cyber-fc-2",
        front: "Notifications SMS officielles d'opérateur",
        back: "Un SMS légitime émane d'un identifiant court officiel (TMoney, MoovMoney), mentionne le nouveau solde exact et ne contient jamais de lien web externe.",
        mastered: false,
        binaryStatement:
          "Un SMS officiel de transaction Mobile Money comporte obligatoirement un identifiant d'expéditeur court certifié et une référence unique de transaction (TxID).",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. Les notifications officielles émises par les passerelles télécoms comportent toujours l'expéditeur court vérifié (ex: TMoney, MoovMoney), le solde actualisé et la référence d'opération (TxID), sans lien hypertexte.",
        mcqQuestion:
          "Quel indicateur technique signale immédiatement un SMS frauduleux tentant d'imiter Mobile Money ?",
        mcqOptions: [
          "L'expéditeur est un numéro mobile personnel ordinaire (+228 9X...) accompagné d'un lien raccourci",
          "Le message mentionne le montant exact en francs CFA (FCFA)",
          "Le message comporte l'horodatage précis de l'opération",
          "Le SMS indique le montant des frais appliqués",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "Les escrocs ne peuvent pas émettre depuis le Sender ID certifié des opérateurs et recourent donc à des puces SIM prépayées classiques avec un lien de phishing externe.",
      },
      {
        id: "cyber-fc-3",
        front: "Authentification Multifacteur (MFA / 2FA)",
        back: "La MFA combine au moins deux facteurs distincts : ce que l'on sait (PIN), ce que l'on possède (SIM / OTP), ou ce que l'on est (biométrie).",
        mastered: false,
        binaryStatement:
          "L'utilisation simultanée d'un mot de passe et d'une validation par empreinte digitale constitue une authentification multifacteur (MFA).",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. Le mot de passe relève du facteur de connaissance ('ce que je sais') et l'empreinte digitale relève du facteur d'inhérence ('ce que je suis'). La combinaison des deux valide la MFA.",
        mcqQuestion:
          "Dans le protocole TLS 1.3, quel avantage sécuritaire majeur est systématiquement imposé par rapport aux anciennes versions ?",
        mcqOptions: [
          "Poignée de main (handshake) accélérée à 1-RTT et chiffrement systématique avec Perfect Forward Secrecy",
          "Suppression définitive du besoin de certificats cryptographiques",
          "Autorisation de l'algorithme MD5 pour signer les clés de session",
          "Compatibilité avec les transferts de mots de passe en texte clair",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "TLS 1.3 réduit la poignée de main à un seul aller-retour (1-RTT), élimine toutes les suites cryptographiques obsolètes et impose la confidentialité persistante (PFS).",
      },
      {
        id: "cyber-fc-4",
        front: "Hachage cryptographique et stockage de mots de passe",
        back: "Une fonction à sens unique irréversible conçue pour stocker les mots de passe et vérifier l'intégrité sans jamais divulguer le secret original.",
        mastered: false,
        binaryStatement:
          "Le hachage cryptographique SHA-256 est une méthode réversible permettant de recalculer le mot de passe initial grâce à une clé secrète de déchiffrement.",
        binaryAnswer: false,
        binaryExplanation:
          "FAUX. Le hachage est une fonction mathématique à sens unique stricte : il est calculatoirement impossible d'inverser le condensat (hash) pour retrouver le mot de passe original.",
        mcqQuestion:
          "Quel algorithme de hachage est particulièrement recommandé pour stocker les mots de passe grâce à sa résistance prouvée face aux attaques massives par GPU ?",
        mcqOptions: [
          "Argon2id (avec coût mémoire et temporel paramétrable)",
          "MD5 (rapide et compact)",
          "SHA-1 (largement répandu)",
          "Base64 (encodage standard)",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "Argon2id (vainqueur du Password Hashing Competition) applique un coût mémoire et processeur configurable qui sature la mémoire vive des puces graphiques (GPU/ASIC), rendant le cassage par force brute inopérant.",
      },
    ],
  },
  {
    id: "droit-ohada",
    title: "Droit Commercial Général & Cybercriminalité au Togo",
    subject: "Droit & Sciences Juridiques",
    examDate: "2026-11-08",
    content: `COURS : DROIT DES AFFAIRES OHADA ET LUTTE CONTRE LA CYBERCRIMINALITÉ AU TOGO
1. La hiérarchie des normes et les Actes Uniformes OHADA :
En vertu de l'article 10 du Traité de l'OHADA, les Actes Uniformes sont directement applicables et obligatoires dans les États Parties (dont le Togo), nonobstant toute disposition contraire de droit interne.
2. La responsabilité civile délictuelle :
Toute action en responsabilité civile extracontractuelle requiert la réunion cumulative de trois éléments : une faute prouvée, un dommage certain (préjudice matériel ou moral) et un lien de causalité direct entre la faute et le dommage.
3. Cadre légal de la cybersécurité au Togo (Loi n° 2018-026) :
La loi togolaise sur la cybersécurité et la lutte contre la cybercriminalité réprime sévèrement l'usurpation d'identité numérique, l'escroquerie par moyen de communication électronique (faux SMS Mobile Money) et l'accès frauduleux à un système d'information. L'ANCy (Agence Nationale de la Cybersécurité) coordonne la protection nationale.`,
    flashcards: [
      {
        id: "droit-fc-1",
        front: "Supériorité des Actes Uniformes OHADA",
        back: "Les Actes Uniformes OHADA sont directement applicables et obligatoires dans les États membres nonobstant toute disposition contraire de droit interne.",
        mastered: false,
        binaryStatement:
          "Un tribunal togolais a la faculté d'écarter un Acte Uniforme OHADA au profit d'une loi nationale commerciale antérieure.",
        binaryAnswer: false,
        binaryExplanation:
          "FAUX. Selon l'article 10 du Traité de l'OHADA, les Actes Uniformes priment de plein droit et de manière absolue sur toute disposition contraire de droit interne des États membres.",
        mcqQuestion:
          "Quels sont les trois éléments cumulatifs indispensables pour engager une action en responsabilité civile délictuelle ?",
        mcqOptions: [
          "Une faute prouvée, un dommage certain et un lien de causalité direct",
          "Un contrat commercial écrit, un retard d'exécution et une mise en demeure",
          "Une infraction pénale caractérisée, une plainte avec constitution de partie civile et un huissier",
          "Un consentement mutuel formel, une cause licite et un objet déterminé",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "L'engagement de la responsabilité civile extracontractuelle exige obligatoirement la preuve simultanée d'une faute, d'un préjudice réel et d'un lien direct de cause à effet.",
      },
      {
        id: "droit-fc-2",
        front: "Cadre légal de la cybersécurité au Togo (Loi n° 2018-026)",
        back: "La loi togolaise punit l'accès non autorisé aux systèmes informatiques, l'usurpation d'identité en ligne et la fraude par voie électronique.",
        mastered: false,
        binaryStatement:
          "La loi togolaise n° 2018-026 érige en infraction pénale l'escroquerie commise au moyen d'un réseau de communication électronique.",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. La législation togolaise sanctionne lourdement l'escroquerie numérique, l'usurpation d'identité en ligne et les faux SMS de paiement mobile.",
        mcqQuestion:
          "Quelle entité publique togolaise pilote la stratégie nationale et la réponse aux incidents de sécurité des systèmes d'information ?",
        mcqOptions: [
          "L'ANCy (Agence Nationale de la Cybersécurité)",
          "L'Autorité de Régulation des Télécoms (ARCEP)",
          "L'Union Économique et Monétaire Ouest-Africaine (UEMOA)",
          "La Chambre de Commerce et d'Industrie du Togo",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "L'ANCy est l'agence gouvernementale togolaise mandatée pour protéger le cyberespace national, certifier les opérateurs d'importance vitale et contrer les cybermenaces.",
      },
      {
        id: "droit-fc-3",
        front: "Valeur juridique de la preuve électronique",
        back: "L'écrit électronique a la même force probante que l'écrit papier si l'identité du signataire est attestée et l'intégrité de l'acte garantie.",
        mastered: false,
        binaryStatement:
          "En droit OHADA et togolais, un document sous forme électronique bénéficie de la même force probante que l'écrit sur support papier dès lors que son auteur est identifiable et son intégrité préservée.",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. Le droit consacre l'équivalence stricte de la preuve numérique sous réserve d'identification certaine de l'auteur et d'intégrité assurée par des mécanismes fiables.",
        mcqQuestion:
          "Quelle technologie confère à une signature numérique une présomption de fiabilité équivalente à la signature manuscrite ?",
        mcqOptions: [
          "La signature électronique qualifiée reposant sur un certificat cryptographique asymétrique",
          "La numérisation d'une signature manuscrite insérée comme image JPEG dans un traitement de texte",
          "L'envoi du contrat par courrier électronique simple avec accusé de réception",
          "La mention 'Lu et approuvé' tapée au clavier à la fin d'un courriel",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "Seul un certificat de signature électronique qualifié, adossé à une paire de clés asymétriques et délivré par une autorité de certification reconnue, garantit l'opposabilité juridique pleine.",
      },
    ],
  },
  {
    id: "algo-python",
    title: "Algorithmique, Complexité & Structures de Données en Python",
    subject: "Informatique & Programmation",
    examDate: "2026-11-10",
    content: `COURS : ALGORITHMIQUE ET STRUCTURES DE DONNÉES (PYTHON)
1. Complexité algorithmique (Notation Grand O) :
- Accès dans une table de hachage (dict / set en Python) : O(1) en moyenne.
- Recherche dichotomique (Binary Search) dans un tableau trié de taille N : O(log N), car l'espace de recherche est divisé par 2 à chaque étape.
- Tri fusion (Merge Sort) et Timsort (utilisé par list.sort() en Python) : O(N log N) dans le pire des cas.
- Tri à bulles (Bubble Sort) : O(N^2) dans le pire des cas.
2. Mutabilité des structures en Python :
- Structures mutables (modifiables sur place) : list, dict, set.
- Structures immuables (non modifiables après création) : tuple, str, int, frozenset. Seuls les objets immuables (hashables) peuvent servir de clés dans un dictionnaire Python.`,
    flashcards: [
      {
        id: "algo-fc-1",
        front: "Complexité d'accès aux dictionnaires Python",
        back: "L'accès à une clé dans un dictionnaire (`dict`) ou ensemble (`set`) en Python s'exécute en temps moyen amorti O(1).",
        mastered: false,
        binaryStatement:
          "Dans un dictionnaire Python standard (dict), l'accès à une clé existante s'effectue en complexité moyenne O(1).",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. Le dictionnaire Python s'appuie sur une table de hachage hautement optimisée, permettant des opérations de lecture, d'insertion et de suppression en temps moyen constant O(1).",
        mcqQuestion:
          "Quelle est la complexité temporelle dans le pire des cas d'une recherche dichotomique (Binary Search) opérant sur un tableau trié de taille N ?",
        mcqOptions: ["O(log N)", "O(N)", "O(N log N)", "O(1)"],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "À chaque étape, l'algorithme divise l'intervalle de recherche par 2, ce qui donne une complexité logarithmique O(log N).",
      },
      {
        id: "algo-fc-2",
        front: "Mutabilité et clés de dictionnaires en Python",
        back: "Les listes sont mutables. Seuls les types immuables et hachables (tuples, chaînes, entiers) peuvent servir de clés dans un dictionnaire.",
        mastered: false,
        binaryStatement:
          "Une liste Python classique (`list`) peut être utilisée en tant que clé au sein d'un dictionnaire `dict` standard.",
        binaryAnswer: false,
        binaryExplanation:
          "FAUX. Les listes Python sont mutables et ne sont donc pas hachables (`TypeError: unhashable type: 'list'`). Seuls les objets immuables peuvent servir de clés de dictionnaire.",
        mcqQuestion:
          "Quel algorithme de tri hybride performant est exécuté par la méthode native `list.sort()` en Python ?",
        mcqOptions: [
          "Timsort (combinaison adaptée de Merge Sort et Insertion Sort)",
          "Quicksort avec pivot aléatoire",
          "Tri par sélection (Selection Sort)",
          "Tri à bulles (Bubble Sort)",
        ],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "Python utilise le Timsort, un algorithme adaptatif et stable offrant une complexité de O(N log N) dans le pire des cas et de O(N) sur des listes déjà partiellement ordonnées.",
      },
      {
        id: "algo-fc-3",
        front: "File vs Pile (FIFO vs LIFO)",
        back: "Une file (Queue) fonctionne en FIFO (premier entré, premier sorti), alors qu'une pile (Stack) fonctionne en LIFO (dernier entré, premier sorti).",
        mastered: false,
        binaryStatement:
          "Dans une structure de file (Queue), le premier élément inséré est le premier élément à être extrait (principe FIFO).",
        binaryAnswer: true,
        binaryExplanation:
          "VRAI. La file observe rigoureusement le principe FIFO (First-In, First-Out), à l'opposé de la pile qui observe le principe LIFO (Last-In, First-Out).",
        mcqQuestion:
          "Quelle structure de la bibliothèque standard Python offre une complexité O(1) garantie pour les insertions et suppressions aux deux extrémités d'une file ?",
        mcqOptions: ["collections.deque", "list standard avec pop(0)", "tuple immuable", "set"],
        mcqAnswerIndex: 0,
        mcqExplanation:
          "Un `collections.deque` (double-ended queue) est implémenté sous forme de liste doublement chaînée par blocs, garantissant des opérations push/pop en O(1) à gauche comme à droite.",
      },
    ],
  },
];

export const MULTILINGUAL_DEMO_SMS: Record<Language, DemoItem[]> = {
  fr: [
    {
      label: "✅ SMS légitime T-Money (Format officiel)",
      text: "De: TMoney — Transfert reçu de 15 000 FCFA du 90 12 00 00 (KOFFI A.). Frais: 0 FCFA. Nouveau solde : 42 500 FCFA. Réf : TX261031001.",
      tag: "legit",
    },
    {
      label: "🚨 Faux concours & lien piégé (VirusTotal)",
      text: "FÉLICITATIONS ! Votre numéro a gagné 150 000 FCFA au tirage Moov/T-Money. Réclamez sous 2h sur http://testsafebrowsing.appspot.com/s/phishing.html sinon votre lot expire.",
      tag: "scam",
    },
    {
      label: "🚨 Faux agent demandant le code OTP / PIN",
      text: "Service client Moov Money : votre compte sera bloqué pour activité suspecte. Pour annuler, communiquez immédiatement votre code secret PIN et le code OTP reçu par SMS au 99 00 00 00.",
      tag: "scam",
    },
    {
      label: "🚨 Arnaque au dépôt par erreur (Urgence hôpital)",
      text: "De: +228 91 00 00 00 — Vous avez reçu 25 000 FCFA sur votre T-Money. Bonjour mon frère, j'ai fait ce dépôt par erreur, renvoie-moi vite au 91 00 00 00 stp c'est pour payer l'ordonnance à l'hôpital !",
      tag: "scam",
    },
    {
      label: "🚨 Fausse tontine / Doublement de mise",
      text: "GRANDE TONTINE SOLIDAIRE LOMÉ : Envoyez 10 000 FCFA par Moov Money au 98 00 00 00 et recevez 50 000 FCFA en 30 minutes garanties ! Places limitées aujourd'hui.",
      tag: "scam",
    },
    {
      label: "✅ SMS légitime Moov Money (Format officiel)",
      text: "De: MoovMoney — Vous avez reçu 8 500 FCFA de 99 00 11 22. Nouveau solde Flooz : 19 200 FCFA. ID Transaction : MV8849201.",
      tag: "legit",
    },
  ],
  en: [
    {
      label: "✅ Legitimate T-Money transfer (Official format)",
      text: "From: TMoney — Transfer of 15,000 FCFA received from 90 12 00 00. New balance: 42,500 FCFA. Ref: TX261031001.",
      tag: "legit",
    },
    {
      label: "🚨 Fake lottery & malicious link (VirusTotal)",
      text: "CONGRATULATIONS! You won 150,000 FCFA in the Mobile Money promo. Claim within 2h at http://testsafebrowsing.appspot.com/s/phishing.html or prize expires.",
      tag: "scam",
    },
    {
      label: "🚨 Fake agent OTP / PIN theft attempt",
      text: "Customer Support: Your wallet will be suspended. Reply immediately with your PIN and the 6-digit OTP validation code sent to your phone.",
      tag: "scam",
    },
    {
      label: "🚨 Wrong deposit refund scam",
      text: "From: +228 91 00 00 00 — Hello, I mistakenly sent 25,000 FCFA to your T-Money account. Please send it back immediately to 91 00 00 00, it is for an emergency at the hospital!",
      tag: "scam",
    },
    {
      label: "🚨 Fake tontine / Money multiplier scam",
      text: "EXPRESS TONTINE TOGO: Deposit 10,000 FCFA via Moov Money to 98 00 00 00 and receive 50,000 FCFA within 30 minutes guaranteed!",
      tag: "scam",
    },
    {
      label: "✅ Legitimate Moov Money transfer (Official format)",
      text: "From: MoovMoney — You received 8,500 FCFA from 99 00 11 22. New Flooz balance: 19,200 FCFA. Transaction ID: MV8849201.",
      tag: "legit",
    },
  ],
  ee: [
    {
      label: "✅ T-Money SMS nyateƒetɔ (Kɔmpani se vavã)",
      text: "Tso: TMoney — Èxɔ ga 15 000 FCFA tso 90 12 00 00 gbɔ. Ga si le asiwò fifia : 42 500 FCFA. Dzesi : TX261031001.",
      tag: "legit",
    },
    {
      label: "🚨 Fetu beble kple kadodo vɔ̃ɖi (VirusTotal)",
      text: "KAFUKAFU ! Èxɔ fetu 150 000 FCFA. Yi kaba le gaƒoƒo 2 me ɖe http://testsafebrowsing.appspot.com/s/phishing.html hafi wò nunana natrɔ megbe.",
      tag: "scam",
    },
    {
      label: "🚨 SMS OTP kple PIN kɔdi biabia",
      text: "Moov Money dɔwɔla : woatutu wò akɔnta. Tsɔ wò PIN kple validation kɔdi si va le SMS me na dɔwɔla le 99 00 00 00 kaba fifia.",
      tag: "scam",
    },
    {
      label: "🚨 Ga ɖoɖo le vodada me beble (Dépôt par erreur)",
      text: "Mía nɔvi, meɖo ga 25 000 FCFA na wò le vodada me ɖe wò T-Money dzi. Trɔ ga nam kaba le 91 00 00 00 dzi, dɔnɔ le kɔdzi !",
      tag: "scam",
    },
    {
      label: "🚨 Egbɔgroup / Tontine beble",
      text: "TONTINE KABA LOMÉ : Ɖo 10 000 FCFA ɖe 98 00 00 00 dzi eye nàxɔ 50 000 FCFA le aɖabaƒoƒo 30 me !",
      tag: "scam",
    },
    {
      label: "✅ Moov Money SMS nyateƒetɔ (Kɔmpani se vavã)",
      text: "Tso: MoovMoney — Èxɔ ga 8 500 FCFA tso 99 00 11 22 gbɔ. Ga si le Flooz me fifia : 19 200 FCFA. Dzesi : MV8849201.",
      tag: "legit",
    },
  ],
};

export const DEMO_SMS = MULTILINGUAL_DEMO_SMS.fr;

export const DEMO_QR_ITEMS: DemoQrItem[] = [
  {
    label: "🚨 Phishing Moov Money (Faux bonus 50 000 F)",
    content: "http://testsafebrowsing.appspot.com/s/phishing.html?promo=moov50k&token=fake",
    tag: "scam",
    description:
      "Lien pirate usurpant Moov Africa Togo promettant un bonus pour voler le code PIN.",
  },
  {
    label: "🚨 Faux QR T-Money (Mise à jour SIM piégée)",
    content: "http://tmoney-gift.top/claim?user=verify&action=steal_pin",
    tag: "scam",
    description:
      "Domaine suspect (.top) non affilié à Togocom exigeant les identifiants Mobile Money.",
  },
  {
    label: "✅ QR Marchand T-Money Officiel (Lomé Assigamé)",
    content: "TMONEY:PAY:MERCHANT_ID=90882143:NAME=BOUTIQUE_KODJOVI_LOME:CURRENCY=XOF",
    tag: "legit",
    description: "Format de paiement marchand officiel T-Money sans URL externe ni redirection.",
  },
  {
    label: "✅ Site Officiel Moov Africa Togo (Sécurisé)",
    content: "https://www.moov-africa.tg/particuliers/services-financiers-mobiles/flooz/",
    tag: "legit",
    description: "Portail officiel sécurisé en HTTPS hébergé sur le domaine opérateur certifié.",
  },
];

export const DEMO_QR_CONTENT = DEMO_QR_ITEMS[0]?.content ?? "";

export const DEMO_AUDIO_SCENARIOS: DemoAudioItem[] = [
  {
    id: "scam-moov-pin",
    title: "🚨 Faux agent Moov Money (Demande de code PIN)",
    caller: "Numéro masqué (+228 99 XX XX XX)",
    tag: "scam",
    transcript:
      "Bonjour madame, je vous appelle depuis le centre technique Moov Africa Togo à Déckon. Nous avons détecté une anomalie critique sur votre portefeuille Flooz. Votre compte sera bloqué dans 10 minutes. Pour annuler la suspension, tapez *155# puis dictez-moi immédiatement le code secret à 4 chiffres que vous utilisez d'habitude, ainsi que le SMS de validation OTP.",
    notes: "Urgence simulée, autorité usurpée, demande directe du PIN secret et de l'OTP.",
  },
  {
    id: "scam-tmoney-depot",
    title: "🚨 Arnaque au faux dépôt par erreur (Urgence Hôpital)",
    caller: "+228 91 44 22 11",
    tag: "scam",
    transcript:
      "Allô mon cher frère ! Je suis désespéré, ma femme accouche au CHU Sylvanus Olympio de Tokoin. Je devais envoyer 45 000 FCFA à la sage-femme mais j'ai tapé votre numéro par erreur. Vous avez reçu le SMS de dépôt T-Money à l'instant ! Renvoyez-moi vite les 45 000 FCFA au 91 44 22 11 sinon ils ne vont pas opérer ma femme !",
    notes:
      "Pression émotionnelle extrême, faux SMS reçu préalablement, refus de laisser la victime vérifier son vrai solde.",
  },
  {
    id: "scam-loterie-avance",
    title: "🚨 Faux gain de loterie Togocom (Frais d'activation)",
    caller: "+228 92 88 77 66",
    tag: "scam",
    transcript:
      "Félicitations cher abonné ! Votre numéro a été tiré au sort lors de la grande tombola nationale Togocom. Vous gagnez un million de FCFA cash et une moto Haojue. Pour débloquer et valider votre chèque auprès de l'huissier, vous devez juste envoyer les frais de timbre fiscal de 15 000 FCFA par T-Money à notre agent comptable avant 17 heures.",
    notes: "Faux gain trop beau pour être vrai, demande de frais préalables (avance de frais).",
  },
  {
    id: "scam-ewe-hopital",
    title: "🚨 Scame vocal en Éwé (Eʋegbe — Faux dépôt)",
    caller: "+228 90 33 22 11",
    tag: "scam",
    transcript:
      "Alo nɔvi, meye Moov Money dɔwɔla tso Lomé. Míekpɔ vodada gã aɖe le wò akɔnta me eye woatui. Be woagatuie o la, zi *155*4*1# dzi kaba eye nàgblɔ kɔdi ɣaɣla si nàxɔ la nam fifia. Kaba wɔe elabena dɔnɔ le kɔdzi eye ga le hiahiãm vevie !",
    notes: "Appel ciblé en langue locale éwé pour tromper les personnes vulnérables ou âgées.",
  },
  {
    id: "legit-appel-famille",
    title: "✅ Appel légitime d'un proche (Sans demande de code)",
    caller: "+228 90 12 34 56 (Maman)",
    tag: "legit",
    transcript:
      "Allô Kodjo, c'est maman depuis le marché d'Adawlato. Je voulais juste savoir si tu as bien reçu les 10 000 FCFA que ton oncle t'a envoyés par T-Money ce matin pour tes fournitures scolaires ? Prends ton temps pour vérifier sur ton téléphone en faisant *145# et rappelle-moi.",
    notes: "Aucune urgence suspecte, pas de demande de code confidentiel ni de lien.",
  },
];

export const MULTILINGUAL_TRANSCRIPTS: Record<Language, string> = {
  fr: DEMO_AUDIO_SCENARIOS[0]?.transcript ?? "",
  en: "Hello, I am calling from T-Money customer care Lomé. An unauthorized transaction was flagged on your account. To prevent account freeze, dial *145*2# and read back the 6-digit confirmation code. Do it right now, it is urgent.",
  ee: DEMO_AUDIO_SCENARIOS[3]?.transcript ?? "",
};

export const DEMO_TRANSCRIPT = MULTILINGUAL_TRANSCRIPTS.fr;
