import type { Language } from "./i18n";

export interface DemoItem {
  label: string;
  text: string;
}

export const MULTILINGUAL_DEMO_SMS: Record<Language, DemoItem[]> = {
  fr: [
    {
      label: "SMS légitime (Notification officielle)",
      text: "Transfert reçu de 5 000 FCFA du 90 00 00 00. Nouveau solde : 12 500 FCFA. Réf : TX0000001.",
    },
    {
      label: "Faux bonus et lien piégé",
      text: "FÉLICITATIONS ! Vous avez gagné un bonus de 150 000 FCFA. Réclamez vite sous 2h sur www.moov-bonus-tg.xyz sinon votre lot expire.",
    },
    {
      label: "Demande de code OTP par faux agent",
      text: "Service client Moov Money : votre compte sera bloqué. Pour le réactiver, envoyez immédiatement le code de validation reçu par SMS au 99 00 00 00.",
    },
    {
      label: "Faux transfert par erreur (Code-switching)",
      text: "Bonjour mon frère, j'ai fait une erreur de transfert de 25 000 FCFA sur ton compte T-Money. Na trɔ ga nam kaba s'il te plaît, c'est pour l'hôpital !",
    },
    {
      label: "URL malveillante connue (VirusTotal v3)",
      text: "URGENT T-Money : Activité anormale. Vérifiez votre compte sur http://testsafebrowsing.appspot.com/s/phishing.html",
    },
    {
      label: "Lien avec token confidentiel (Vie privée)",
      text: "Lien de réinitialisation: https://espace-client.tg/reset?token=secret123456 ne le partagez avec personne.",
    },
  ],
  en: [
    {
      label: "Legitimate transfer (Official notification)",
      text: "Transfer of 5,000 FCFA received from 90 00 00 00. New balance: 12,500 FCFA. Ref: TX0000001.",
    },
    {
      label: "Fake bonus lottery with malicious link",
      text: "CONGRATULATIONS! You won a promotional bonus of 150,000 FCFA. Claim within 2 hours at www.moov-bonus-tg.xyz or prize expires.",
    },
    {
      label: "Urgent OTP theft attempt by fake agent",
      text: "Customer Support: Your wallet is scheduled for suspension. Reply immediately with the OTP validation code sent to your phone to cancel.",
    },
    {
      label: "Wrong transfer refund trick",
      text: "Hello, I mistakenly transferred 25,000 FCFA to your number. Please refund it immediately via *145*1# to avoid police report.",
    },
    {
      label: "Known malicious URL (VirusTotal v3)",
      text: "URGENT T-Money: Unusual activity. Verify your account at http://testsafebrowsing.appspot.com/s/phishing.html",
    },
    {
      label: "Private token link (Privacy protected)",
      text: "Your private account reset link: https://espace-client.tg/reset?token=secret123456 do not share with anyone.",
    },
  ],
  ee: [
    {
      label: "SMS nyateƒetɔ (Kɔmpani se vavã)",
      text: "Èxɔ ga 5 000 FCFA tso 90 00 00 00 gbɔ. Ga si le asiwò fifia : 12 500 FCFA. Dzesi : TX0000001.",
    },
    {
      label: "Fetu beble kple kadodo vɔ̃ɖi",
      text: "KAFUKAFU ! Èxɔ fetu 150 000 FCFA. Yi kaba le gaƒoƒo 2 me ɖe www.moov-bonus-tg.xyz hafi wò nunana natrɔ megbe.",
    },
    {
      label: "SMS kɔdi biabia le kaba me",
      text: "Moov Money dɔwɔla : woatutu wò akɔnta. Be nàgaxɔe la, tsɔ validation kɔdi si va le SMS me na dɔwɔla le 99 00 00 00 kaba fifia.",
    },
    {
      label: "Ga ɖoɖo le vodada me beble",
      text: "Mía nɔvi, meɖo ga 25 000 FCFA na wò le vodada me. Trɔ ga nam kaba, dɔlele gã le edzi nam !",
    },
    {
      label: "Kadodo vɔ̃ɖi si woanya (VirusTotal)",
      text: "KABA T-Money : Míekpɔ beble le wò akɔnta ŋu le http://testsafebrowsing.appspot.com/s/phishing.html",
    },
    {
      label: "Token kadodo ɣaɣla (Ameŋununya takpɔkpɔ)",
      text: "Wò kadodo ɣaɣla be nàtrɔ gɔmedzedze : https://espace-client.tg/reset?token=secret123456 mègana ame aɖeke o.",
    },
  ],
};

export const DEMO_SMS = MULTILINGUAL_DEMO_SMS.fr;

export const DEMO_QR_CONTENT = "http://tmoney-gift.top/claim?user=verify";

export const MULTILINGUAL_TRANSCRIPTS: Record<Language, string> = {
  fr: "Bonjour, je suis agent Moov Money. Il y a eu une erreur de transfert sur votre compte, nous devons le suspendre. Pour éviter cela, composez *155*4*1# puis donnez-moi le code secret que vous allez recevoir. C'est urgent, faites-le maintenant.",
  en: "Hello, I am calling from T-Money customer care. An unauthorized transaction was flagged on your account. To prevent account freeze, dial *145*2# and read back the 6-digit confirmation code. Do it right now, it is urgent.",
  ee: "Alo nɔvi, meye Moov Money dɔwɔla tso Lomé. Míekpɔ vodada gã aɖe le wò akɔnta me eye woatui. Be woagatuie o la, zi *155*4*1# dzi kaba eye nàgblɔ kɔdi ɣaɣla si nàxɔ la nam fifia. Kaba wɔe !",
};

export const DEMO_TRANSCRIPT = MULTILINGUAL_TRANSCRIPTS.fr;
