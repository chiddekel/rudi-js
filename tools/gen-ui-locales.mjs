#!/usr/bin/env node
/** Generate locale JSON files: shared UI for 15 langs + course from pl extract / en map. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "locales");
fs.mkdirSync(localesDir, { recursive: true });

const META = {
  en: { code: "en", name: "English", dir: "ltr" },
  pl: { code: "pl", name: "Polski", dir: "ltr" },
  de: { code: "de", name: "Deutsch", dir: "ltr" },
  fr: { code: "fr", name: "Français", dir: "ltr" },
  es: { code: "es", name: "Español", dir: "ltr" },
  it: { code: "it", name: "Italiano", dir: "ltr" },
  "pt-BR": { code: "pt-BR", name: "Português (Brasil)", dir: "ltr" },
  uk: { code: "uk", name: "Українська", dir: "ltr" },
  ar: { code: "ar", name: "العربية", dir: "rtl" },
  hi: { code: "hi", name: "हिन्दी", dir: "ltr" },
  "zh-CN": { code: "zh-CN", name: "中文（简体）", dir: "ltr" },
  "zh-TW": { code: "zh-TW", name: "中文（繁體）", dir: "ltr" },
  ja: { code: "ja", name: "日本語", dir: "ltr" },
  ko: { code: "ko", name: "한국어", dir: "ltr" },
  tr: { code: "tr", name: "Türkçe", dir: "ltr" },
};

/** UI strings: each key -> { lang: text }. English is required. */
const UI = {
  "nav.path": { en: "Path", pl: "Ścieżka", de: "Pfad", fr: "Parcours", es: "Ruta", it: "Percorso", "pt-BR": "Trilha", uk: "Шляхх", ar: "المسار", hi: "पथ", "zh-CN": "路线", "zh-TW": "路線", ja: "パス", ko: "경로", tr: "Yol" },
  "nav.play": { en: "Playground", pl: "Plac zabaw", de: "Spielplatz", fr: "Aire de jeu", es: "Patio", it: "Parco giochi", "pt-BR": "Playground", uk: "Майданчик", ar: "الملعب", hi: "प्लेग्राउंड", "zh-CN": "练习场", "zh-TW": "練習場", ja: "遊び場", ko: "놀이터", tr: "Oyun alanı" },
  "nav.rank": { en: "Ranking", pl: "Ranking", de: "Rangliste", fr: "Classement", es: "Clasificación", it: "Classifica", "pt-BR": "Ranking", uk: "Рейтинг", ar: "الترتيب", hi: "रैंकिंग", "zh-CN": "排行榜", "zh-TW": "排行榜", ja: "ランキング", ko: "랭킹", tr: "Sıralama" },
  "nav.profile": { en: "Profile", pl: "Profil", de: "Profil", fr: "Profil", es: "Perfil", it: "Profilo", "pt-BR": "Perfil", uk: "Профіль", ar: "الملف", hi: "प्रोफ़ाइल", "zh-CN": "个人资料", "zh-TW": "個人資料", ja: "プロフィール", ko: "프로필", tr: "Profil" },
  "nav.aria": { en: "Navigation", pl: "Nawigacja", de: "Navigation", fr: "Navigation", es: "Navegación", it: "Navigazione", "pt-BR": "Navegação", uk: "Навігація", ar: "التنقل", hi: "नेविगेशन", "zh-CN": "导航", "zh-TW": "導覽", ja: "ナビ", ko: "탐색", tr: "Gezinme" },
  "stat.streak": { en: "Day streak", pl: "Seria dni", de: "Tages-Serie", fr: "Série de jours", es: "Racha", it: "Serie di giorni", "pt-BR": "Ofensiva", uk: "Серія днів", ar: "سلسلة الأيام", hi: "दिनों की लकीर", "zh-CN": "连续天数", "zh-TW": "連續天數", ja: "連続日数", ko: "연속 일수", tr: "Gün serisi" },
  "stat.gems": { en: "Gems", pl: "Klejnoty", de: "Edelsteine", fr: "Gemmes", es: "Gemas", it: "Gemme", "pt-BR": "Gemas", uk: "Самоцвіти", ar: "جواهر", hi: "रत्न", "zh-CN": "宝石", "zh-TW": "寶石", ja: "ジェム", ko: "보석", tr: "Mücevher" },
  "stat.hearts": { en: "Hearts", pl: "Serca", de: "Herzen", fr: "Cœurs", es: "Corazones", it: "Cuori", "pt-BR": "Corações", uk: "Серця", ar: "قلوب", hi: "दिल", "zh-CN": "爱心", "zh-TW": "愛心", ja: "ハート", ko: "하트", tr: "Kalpler" },
  "path.module": { en: "Module {n}", pl: "Moduł {n}", de: "Modul {n}", fr: "Module {n}", es: "Módulo {n}", it: "Modulo {n}", "pt-BR": "Módulo {n}", uk: "Модуль {n}", ar: "الوحدة {n}", hi: "मॉड्यूल {n}", "zh-CN": "第 {n} 模块", "zh-TW": "第 {n} 模組", ja: "モジュール {n}", ko: "모듈 {n}", tr: "Modül {n}" },
  "path.guide": { en: "Guide", pl: "Przewodnik", de: "Leitfaden", fr: "Guide", es: "Guía", it: "Guida", "pt-BR": "Guia", uk: "Посібник", ar: "دليل", hi: "गाइड", "zh-CN": "指南", "zh-TW": "指南", ja: "ガイド", ko: "가이드", tr: "Rehber" },
  "path.start": { en: "Start", pl: "Start", de: "Start", fr: "Start", es: "Empezar", it: "Inizia", "pt-BR": "Começar", uk: "Старт", ar: "ابدأ", hi: "शुरू", "zh-CN": "开始", "zh-TW": "開始", ja: "スタート", ko: "시작", tr: "Başla" },
  "path.locked": { en: " (locked)", pl: " (zablokowane)", de: " (gesperrt)", fr: " (verrouillé)", es: " (bloqueado)", it: " (bloccato)", "pt-BR": " (bloqueado)", uk: " (заблоковано)", ar: " (مقفل)", hi: " (लॉक)", "zh-CN": "（已锁定）", "zh-TW": "（已鎖定）", ja: "（ロック）", ko: " (잠김)", tr: " (kilitli)" },
  "path.cheer": { en: "You've got this!", pl: "Dasz radę!", de: "Du schaffst das!", fr: "Tu vas y arriver !", es: "¡Tú puedes!", it: "Ce la puoi fare!", "pt-BR": "Você consegue!", uk: "Ти справишся!", ar: "أنت قادر!", hi: "तुम कर सकते हो!", "zh-CN": "你能行！", "zh-TW": "你做得到！", ja: "できるよ！", ko: "할 수 있어!", tr: "Başarabilirsin!" },
  "path.endBubble": { en: "At the end: your own JS engine!", pl: "Na końcu: Twój własny silnik JS!", de: "Am Ende: deine eigene JS-Engine!", fr: "À la fin : ton propre moteur JS !", es: "Al final: ¡tu propio motor JS!", it: "Alla fine: il tuo motore JS!", "pt-BR": "No fim: seu próprio motor JS!", uk: "Наприкінці: твій власний рушій JS!", ar: "في النهاية: محرك JS خاص بك!", hi: "अंत में: आपका अपना JS इंजन!", "zh-CN": "终点：你自己的 JS 引擎！", "zh-TW": "終點：你自己的 JS 引擎！", ja: "ゴールは自分の JS エンジン！", ko: "끝에는 나만의 JS 엔진!", tr: "Sonda: kendi JS motorun!" },
  "path.chest": { en: "Chest", pl: "Skrzynia", de: "Truhe", fr: "Coffre", es: "Cofre", it: "Forziere", "pt-BR": "Baú", uk: "Скриня", ar: "صندوق", hi: "संदूक", "zh-CN": "宝箱", "zh-TW": "寶箱", ja: "宝箱", ko: "상자", tr: "Sandık" },
  "path.chestOpen": { en: "Opened", pl: "Otwarta", de: "Geöffnet", fr: "Ouvert", es: "Abierto", it: "Aperto", "pt-BR": "Aberto", uk: "Відкрито", ar: "مفتوح", hi: "खुला", "zh-CN": "已开启", "zh-TW": "已開啟", ja: "開封済み", ko: "열림", tr: "Açıldı" },
  "path.chestReward": { en: "Chest +20", pl: "Skrzynia +20", de: "Truhe +20", fr: "Coffre +20", es: "Cofre +20", it: "Forziere +20", "pt-BR": "Baú +20", uk: "Скриня +20", ar: "صندوق +20", hi: "संदूक +20", "zh-CN": "宝箱 +20", "zh-TW": "寶箱 +20", ja: "宝箱 +20", ko: "상자 +20", tr: "Sandık +20" },
  "path.toastPrev": { en: "🔒 Finish earlier lessons first", pl: "🔒 Najpierw ukończ poprzednie lekcje", de: "🔒 Zuerst frühere Lektionen", fr: "🔒 Termine d'abord les leçons précédentes", es: "🔒 Completa primero las lecciones anteriores", it: "🔒 Completa prima le lezioni precedenti", "pt-BR": "🔒 Conclua as lições anteriores primeiro", uk: "🔒 Спочатку заверши попередні уроки", ar: "🔒 أكمل الدروس السابقة أولاً", hi: "🔒 पहले पिछली पाठ पूरे करें", "zh-CN": "🔒 请先完成前面的课程", "zh-TW": "🔒 請先完成前面的課程", ja: "🔒 先に前のレッスンを完了して", ko: "🔒 이전 레슨을 먼저 완료하세요", tr: "🔒 Önce önceki dersleri bitir" },
  "path.toastChestLock": { en: "🔒 Finish the module to open the chest", pl: "🔒 Ukończ moduł, żeby otworzyć skrzynię", de: "🔒 Modul abschließen, um die Truhe zu öffnen", fr: "🔒 Termine le module pour ouvrir le coffre", es: "🔒 Completa el módulo para abrir el cofre", it: "🔒 Completa il modulo per aprire il forziere", "pt-BR": "🔒 Conclua o módulo para abrir o baú", uk: "🔒 Заверши модуль, щоб відкрити скриню", ar: "🔒 أكمل الوحدة لفتح الصندوق", hi: "🔒 संदूक खोलने के लिए मॉड्यूल पूरा करें", "zh-CN": "🔒 完成模块以打开宝箱", "zh-TW": "🔒 完成模組以打開寶箱", ja: "🔒 モジュールを完了して宝箱を開けて", ko: "🔒 모듈을 완료해야 상자를 열 수 있어요", tr: "🔒 Sandığı açmak için modülü bitir" },
  "path.toastChestEmpty": { en: "This chest is already empty", pl: "Ta skrzynia jest już pusta", de: "Diese Truhe ist schon leer", fr: "Ce coffre est déjà vide", es: "Este cofre ya está vacío", it: "Questo forziere è già vuoto", "pt-BR": "Este baú já está vazio", uk: "Ця скриня вже порожня", ar: "هذا الصندوق فارغ بالفعل", hi: "यह संदूक पहले से खाली है", "zh-CN": "这个宝箱已经空了", "zh-TW": "這個寶箱已經空了", ja: "この宝箱はもう空です", ko: "이 상자는 이미 비어 있어요", tr: "Bu sandık zaten boş" },
  "path.toastGems": { en: "💎 +20 gems!", pl: "💎 +20 klejnotów!", de: "💎 +20 Edelsteine!", fr: "💎 +20 gemmes !", es: "💎 ¡+20 gemas!", it: "💎 +20 gemme!", "pt-BR": "💎 +20 gemas!", uk: "💎 +20 самоцвітів!", ar: "💎 +20 جوهرة!", hi: "💎 +20 रत्न!", "zh-CN": "💎 +20 宝石！", "zh-TW": "💎 +20 寶石！", ja: "💎 +20 ジェム！", ko: "💎 +20 보석!", tr: "💎 +20 mücevher!" },
  "path.guideOk": { en: "Got it", pl: "Jasne", de: "Alles klar", fr: "Compris", es: "Entendido", it: "Capito", "pt-BR": "Entendi", uk: "Зрозуміло", ar: "حسنًا", hi: "समझ गया", "zh-CN": "知道了", "zh-TW": "知道了", ja: "了解", ko: "알겠어요", tr: "Anladım" },
  "path.exCount": { en: "{n} ex.", pl: "{n} zad.", de: "{n} Aufg.", fr: "{n} ex.", es: "{n} ej.", it: "{n} es.", "pt-BR": "{n} ex.", uk: "{n} завд.", ar: "{n} تمارين", hi: "{n} प्र.", "zh-CN": "{n} 题", "zh-TW": "{n} 題", ja: "{n} 問", ko: "{n}문제", tr: "{n} soru" },
  "path.nextStop": { en: "Next stop: ", pl: "Następny przystanek: ", de: "Nächster Halt: ", fr: "Prochain arrêt : ", es: "Siguiente parada: ", it: "Prossima fermata: ", "pt-BR": "Próxima parada: ", uk: "Наступна зупинка: ", ar: "المحطة التالية: ", hi: "अगला पड़ाव: ", "zh-CN": "下一站：", "zh-TW": "下一站：", ja: "次のストップ：", ko: "다음 정류장: ", tr: "Sonraki durak: " },
  "hearts.title": { en: "Out of hearts", pl: "Brak serc", de: "Keine Herzen mehr", fr: "Plus de cœurs", es: "Sin corazones", it: "Cuori esauriti", "pt-BR": "Sem corações", uk: "Немає сердець", ar: "لا قلوب متبقية", hi: "दिल खत्म", "zh-CN": "爱心用尽", "zh-TW": "愛心用盡", ja: "ハート切れ", ko: "하트 부족", tr: "Kalp kalmadı" },
  "hearts.body": { en: "Hearts refill every day. You can also top them up.", pl: "Serca odnawiają się codziennie. Możesz też je uzupełnić.", de: "Herzen füllen sich täglich auf. Du kannst sie auch nachfüllen.", fr: "Les cœurs se renouvellent chaque jour. Tu peux aussi les recharger.", es: "Los corazones se renuevan cada día. También puedes recargarlos.", it: "I cuori si rinnovano ogni giorno. Puoi anche ricaricarli.", "pt-BR": "Os corações renovam todo dia. Você também pode recarregá-los.", uk: "Серця відновлюються щодня. Можеш також їх поповнити.", ar: "تتجدد القلوب يوميًا. يمكنك أيضًا تعبئتها.", hi: "दिल हर दिन भर जाते हैं। आप उन्हें टॉप अप भी कर सकते हैं।", "zh-CN": "爱心每天恢复。你也可以补充。", "zh-TW": "愛心每天恢復。你也可以補充。", ja: "ハートは毎日回復します。補充もできます。", ko: "하트는 매일 회복됩니다. 충전할 수도 있어요.", tr: "Kalpler her gün yenilenir. Ayrıca doldurabilirsin." },
  "hearts.refill": { en: "Refill for 30", pl: "Uzupełnij za 30", de: "Auffüllen für 30", fr: "Recharger pour 30", es: "Recargar por 30", it: "Ricarica per 30", "pt-BR": "Recarregar por 30", uk: "Поповнити за 30", ar: "تعبئة مقابل 30", hi: "30 में भरें", "zh-CN": "花 30 补充", "zh-TW": "花 30 補充", ja: "30 で補充", ko: "30으로 충전", tr: "30'a doldur" },
  "hearts.playground": { en: "Practice in the playground", pl: "Poćwicz na placu zabaw", de: "Auf dem Spielplatz üben", fr: "S'entraîner dans l'aire de jeu", es: "Practica en el patio", it: "Allenati nel parco giochi", "pt-BR": "Pratique no playground", uk: "Потренуйся на майданчику", ar: "تدرّب في الملعب", hi: "प्लेग्राउंड में अभ्यास करें", "zh-CN": "在练习场练习", "zh-TW": "在練習場練習", ja: "遊び場で練習", ko: "놀이터에서 연습", tr: "Oyun alanında çalış" },
  "hearts.refilled": { en: "❤️ Hearts refilled", pl: "❤️ Serca uzupełnione", de: "❤️ Herzen aufgefüllt", fr: "❤️ Cœurs rechargés", es: "❤️ Corazones recargados", it: "❤️ Cuori ricaricati", "pt-BR": "❤️ Corações recarregados", uk: "❤️ Серця поповнено", ar: "❤️ تم تعبئة القلوب", hi: "❤️ दिल भर गए", "zh-CN": "❤️ 爱心已补充", "zh-TW": "❤️ 愛心已補充", ja: "❤️ ハートを補充した", ko: "❤️ 하트를 충전했어요", tr: "❤️ Kalpler dolduruldu" },
  "lesson.quitAria": { en: "Quit lesson", pl: "Zakończ lekcję", de: "Lektion beenden", fr: "Quitter la leçon", es: "Salir de la lección", it: "Esci dalla lezione", "pt-BR": "Sair da lição", uk: "Вийти з уроку", ar: "إنهاء الدرس", hi: "पाठ छोड़ें", "zh-CN": "退出课程", "zh-TW": "退出課程", ja: "レッスンを終了", ko: "레슨 종료", tr: "Dersi bitir" },
  "lesson.check": { en: "Check", pl: "Sprawdź", de: "Prüfen", fr: "Vérifier", es: "Comprobar", it: "Controlla", "pt-BR": "Verificar", uk: "Перевірити", ar: "تحقق", hi: "जाँचें", "zh-CN": "检查", "zh-TW": "檢查", ja: "チェック", ko: "확인", tr: "Kontrol et" },
  "lesson.sureTitle": { en: "Are you sure?", pl: "Na pewno?", de: "Sicher?", fr: "Tu es sûr ?", es: "¿Seguro?", it: "Sei sicuro?", "pt-BR": "Tem certeza?", uk: "Точно?", ar: "هل أنت متأكد؟", hi: "पक्का?", "zh-CN": "确定吗？", "zh-TW": "確定嗎？", ja: "よろしいですか？", ko: "정말요?", tr: "Emin misin?" },
  "lesson.sureBody": { en: "Progress in this lesson will be lost.", pl: "Postęp tej lekcji przepadnie.", de: "Der Fortschritt dieser Lektion geht verloren.", fr: "La progression de cette leçon sera perdue.", es: "Se perderá el progreso de esta lección.", it: "I progressi di questa lezione andranno persi.", "pt-BR": "O progresso desta lição será perdido.", uk: "Прогрес цього уроку зникне.", ar: "ستفقد تقدم هذا الدرس.", hi: "इस पाठ की प्रगति खो जाएगी।", "zh-CN": "本课进度将丢失。", "zh-TW": "本課進度將遺失。", ja: "このレッスンの進捗は失われます。", ko: "이 레슨 진행 상황이 사라집니다.", tr: "Bu dersin ilerlemesi kaybolacak." },
  "lesson.stay": { en: "Stay", pl: "Zostaję", de: "Bleiben", fr: "Rester", es: "Quedarme", it: "Resto", "pt-BR": "Ficar", uk: "Залишаюся", ar: "أبقى", hi: "रहता हूँ", "zh-CN": "留下", "zh-TW": "留下", ja: "残る", ko: "남을게요", tr: "Kalıyorum" },
  "lesson.leave": { en: "Leave", pl: "Wyjdź", de: "Verlassen", fr: "Quitter", es: "Salir", it: "Esci", "pt-BR": "Sair", uk: "Вийти", ar: "خروج", hi: "बाहर जाएँ", "zh-CN": "离开", "zh-TW": "離開", ja: "終了", ko: "나가기", tr: "Çık" },
  "lesson.kindChoice": { en: "Choose an answer", pl: "Wybierz odpowiedź", de: "Antwort wählen", fr: "Choisis une réponse", es: "Elige una respuesta", it: "Scegli una risposta", "pt-BR": "Escolha uma resposta", uk: "Обери відповідь", ar: "اختر إجابة", hi: "उत्तर चुनें", "zh-CN": "选择答案", "zh-TW": "選擇答案", ja: "答えを選ぶ", ko: "정답 고르기", tr: "Bir cevap seç" },
  "lesson.kindOrder": { en: "Put in order", pl: "Ułóż w kolejności", de: "In Reihenfolge bringen", fr: "Remets dans l'ordre", es: "Ordena", it: "Metti in ordine", "pt-BR": "Coloque em ordem", uk: "Розстав у порядку", ar: "رتّب", hi: "क्रम में लगाएँ", "zh-CN": "按顺序排列", "zh-TW": "按順序排列", ja: "並べ替える", ko: "순서 맞추기", tr: "Sırala" },
  "lesson.kindInput": { en: "Type the result", pl: "Wpisz wynik", de: "Ergebnis eingeben", fr: "Saisis le résultat", es: "Escribe el resultado", it: "Scrivi il risultato", "pt-BR": "Digite o resultado", uk: "Введи результат", ar: "اكتب النتيجة", hi: "परिणाम लिखें", "zh-CN": "输入结果", "zh-TW": "輸入結果", ja: "結果を入力", ko: "결과 입력", tr: "Sonucu yaz" },
  "lesson.retry": { en: " · retry", pl: " · powtórka", de: " · Wiederholung", fr: " · reprise", es: " · repetición", it: " · ripasso", "pt-BR": " · repetição", uk: " · повтор", ar: " · إعادة", hi: " · दोबारा", "zh-CN": " · 重试", "zh-TW": " · 重試", ja: " · 再挑戦", ko: " · 재시도", tr: " · tekrar" },
  "lesson.tapTiles": { en: "Tap the tiles below", pl: "Dotknij kafelków poniżej", de: "Tippe die Kacheln unten an", fr: "Touche les tuiles ci-dessous", es: "Toca las fichas de abajo", it: "Tocca le tessere sotto", "pt-BR": "Toque nas peças abaixo", uk: "Торкнися плиток нижче", ar: "امسح المربعات أدناه", hi: "नीचे के टाइल्स को छुएँ", "zh-CN": "点按下方卡片", "zh-TW": "點按下方卡片", ja: "下のタイルをタップ", ko: "아래 타일을 탭하세요", tr: "Aşağıdaki parçalara dokun" },
  "lesson.answerAria": { en: "Your answer", pl: "Twoja odpowiedź", de: "Deine Antwort", fr: "Ta réponse", es: "Tu respuesta", it: "La tua risposta", "pt-BR": "Sua resposta", uk: "Твоя відповідь", ar: "إجابتك", hi: "आपका उत्तर", "zh-CN": "你的答案", "zh-TW": "你的答案", ja: "あなたの答え", ko: "내 답", tr: "Cevabın" },
  "lesson.praise0": { en: "Awesome!", pl: "Świetnie!", de: "Super!", fr: "Super !", es: "¡Genial!", it: "Ottimo!", "pt-BR": "Incrível!", uk: "Чудово!", ar: "رائع!", hi: "शानदार!", "zh-CN": "太棒了！", "zh-TW": "太棒了！", ja: "すごい！", ko: "멋져요!", tr: "Harika!" },
  "lesson.praise1": { en: "Exactly!", pl: "Dokładnie!", de: "Genau!", fr: "Exactement !", es: "¡Exacto!", it: "Esatto!", "pt-BR": "Exato!", uk: "Точно!", ar: "بالضبط!", hi: "बिल्कुल!", "zh-CN": "完全正确！", "zh-TW": "完全正確！", ja: "その通り！", ko: "정확해요!", tr: "Aynen!" },
  "lesson.praise2": { en: "Well done!", pl: "Brawo!", de: "Gut gemacht!", fr: "Bravo !", es: "¡Bien hecho!", it: "Bravo!", "pt-BR": "Muito bem!", uk: "Молодець!", ar: "أحسنت!", hi: "शाबाश!", "zh-CN": "做得好！", "zh-TW": "做得好！", ja: "よくできた！", ko: "잘했어요!", tr: "Aferin!" },
  "lesson.praise3": { en: "That's it!", pl: "Tak jest!", de: "So ist es!", fr: "C'est ça !", es: "¡Eso es!", it: "Così!", "pt-BR": "É isso!", uk: "Ось так!", ar: "هذا هو!", hi: "यही तो!", "zh-CN": "就是这样！", "zh-TW": "就是這樣！", ja: "その調子！", ko: "바로 그거예요!", tr: "İşte bu!" },
  "lesson.correctPrefix": { en: "Correct: ", pl: "Poprawnie: ", de: "Richtig: ", fr: "Correct : ", es: "Correcto: ", it: "Corretto: ", "pt-BR": "Correto: ", uk: "Правильно: ", ar: "الصحيح: ", hi: "सही: ", "zh-CN": "正确答案：", "zh-TW": "正確答案：", ja: "正解：", ko: "정답: ", tr: "Doğru: " },
  "lesson.next": { en: "Continue", pl: "Dalej", de: "Weiter", fr: "Continuer", es: "Continuar", it: "Avanti", "pt-BR": "Continuar", uk: "Далі", ar: "متابعة", hi: "आगे", "zh-CN": "继续", "zh-TW": "繼續", ja: "次へ", ko: "계속", tr: "Devam" },
  "lesson.gotIt": { en: "Got it", pl: "Rozumiem", de: "Verstanden", fr: "Compris", es: "Entendido", it: "Ho capito", "pt-BR": "Entendi", uk: "Зрозуміло", ar: "فهمت", hi: "समझ गया", "zh-CN": "明白了", "zh-TW": "明白了", ja: "わかった", ko: "알겠어요", tr: "Anladım" },
  "lesson.locked": { en: "🔒 This lesson is locked", pl: "🔒 Ta lekcja jest zablokowana", de: "🔒 Diese Lektion ist gesperrt", fr: "🔒 Cette leçon est verrouillée", es: "🔒 Esta lección está bloqueada", it: "🔒 Questa lezione è bloccata", "pt-BR": "🔒 Esta lição está bloqueada", uk: "🔒 Цей урок заблоковано", ar: "🔒 هذا الدرس مقفل", hi: "🔒 यह पाठ लॉक है", "zh-CN": "🔒 本课已锁定", "zh-TW": "🔒 本課已鎖定", ja: "🔒 このレッスンはロック中", ko: "🔒 이 레슨은 잠겨 있어요", tr: "🔒 Bu ders kilitli" },
  "done.title": { en: "Lesson complete!", pl: "Lekcja ukończona!", de: "Lektion geschafft!", fr: "Leçon terminée !", es: "¡Lección completada!", it: "Lezione completata!", "pt-BR": "Lição concluída!", uk: "Урок завершено!", ar: "اكتمل الدرس!", hi: "पाठ पूरा!", "zh-CN": "课程完成！", "zh-TW": "課程完成！", ja: "レッスン完了！", ko: "레슨 완료!", tr: "Ders bitti!" },
  "done.time": { en: "Time", pl: "Czas", de: "Zeit", fr: "Temps", es: "Tiempo", it: "Tempo", "pt-BR": "Tempo", uk: "Час", ar: "الوقت", hi: "समय", "zh-CN": "用时", "zh-TW": "用時", ja: "時間", ko: "시간", tr: "Süre" },
  "done.accuracy": { en: "Accuracy", pl: "Trafność", de: "Trefferquote", fr: "Précision", es: "Precisión", it: "Precisione", "pt-BR": "Precisão", uk: "Точність", ar: "الدقة", hi: "सटीकता", "zh-CN": "正确率", "zh-TW": "正確率", ja: "正答率", ko: "정확도", tr: "İsabet" },
  "done.continue": { en: "Continue", pl: "Dalej", de: "Weiter", fr: "Continuer", es: "Continuar", it: "Avanti", "pt-BR": "Continuar", uk: "Далі", ar: "متابعة", hi: "आगे", "zh-CN": "继续", "zh-TW": "繼續", ja: "次へ", ko: "계속", tr: "Devam" },
  "done.repeat": { en: "Retry", pl: "Powtórz", de: "Wiederholen", fr: "Recommencer", es: "Repetir", it: "Ripeti", "pt-BR": "Repetir", uk: "Повторити", ar: "إعادة", hi: "दोहराएँ", "zh-CN": "重练", "zh-TW": "重練", ja: "もう一度", ko: "다시", tr: "Tekrar" },
  "play.title": { en: "Playground", pl: "Plac zabaw", de: "Spielplatz", fr: "Aire de jeu", es: "Patio", it: "Parco giochi", "pt-BR": "Playground", uk: "Майданчик", ar: "الملعب", hi: "प्लेग्राउंड", "zh-CN": "练习场", "zh-TW": "練習場", ja: "遊び場", ko: "놀이터", tr: "Oyun alanı" },
  "play.bubble": { en: "Type code and watch the Rudi.js engine process it!", pl: "Wpisz kod i zobacz, jak silnik Rudi.js go przetwarza!", de: "Schreib Code und sieh zu, wie die Rudi.js-Engine ihn verarbeitet!", fr: "Écris du code et regarde le moteur Rudi.js le traiter !", es: "Escribe código y mira cómo el motor Rudi.js lo procesa.", it: "Scrivi codice e guarda il motore Rudi.js elaborarlo!", "pt-BR": "Digite código e veja o motor Rudi.js processá-lo!", uk: "Введи код і подивись, як рушій Rudi.js його обробляє!", ar: "اكتب شيفرة وشاهد محرك Rudi.js يعالجها!", hi: "कोड लिखें और देखें Rudi.js इंजन कैसे प्रोसेस करता है!", "zh-CN": "输入代码，看 Rudi.js 引擎如何处理！", "zh-TW": "輸入程式碼，看 Rudi.js 引擎如何處理！", ja: "コードを書いて Rudi.js エンジンの動きを見てみよう！", ko: "코드를 입력하고 Rudi.js 엔진이 처리하는 모습을 보세요!", tr: "Kod yaz ve Rudi.js motorunun işlemesini izle!" },
  "play.run": { en: "Run engine", pl: "Uruchom silnik", de: "Engine starten", fr: "Lancer le moteur", es: "Ejecutar motor", it: "Avvia motore", "pt-BR": "Executar motor", uk: "Запустити рушій", ar: "تشغيل المحرك", hi: "इंजन चलाएँ", "zh-CN": "运行引擎", "zh-TW": "執行引擎", ja: "エンジンを実行", ko: "엔진 실행", tr: "Motoru çalıştır" },
  "play.console": { en: "Console (stdout)", pl: "Konsola (stdout)", de: "Konsole (stdout)", fr: "Console (stdout)", es: "Consola (stdout)", it: "Console (stdout)", "pt-BR": "Console (stdout)", uk: "Консоль (stdout)", ar: "الوحدة (stdout)", hi: "कंसोल (stdout)", "zh-CN": "控制台 (stdout)", "zh-TW": "主控台 (stdout)", ja: "コンソール (stdout)", ko: "콘솔 (stdout)", tr: "Konsol (stdout)" },
  "play.ready": { en: "ready", pl: "gotowe", de: "bereit", fr: "prêt", es: "listo", it: "pronto", "pt-BR": "pronto", uk: "готово", ar: "جاهز", hi: "तैयार", "zh-CN": "就绪", "zh-TW": "就緒", ja: "準備完了", ko: "준비됨", tr: "hazır" },
  "play.pressRun": { en: "Press “Run engine”", pl: "Naciśnij „Uruchom silnik”", de: "„Engine starten“ drücken", fr: "Appuie sur « Lancer le moteur »", es: "Pulsa “Ejecutar motor”", it: "Premi “Avvia motore”", "pt-BR": "Pressione “Executar motor”", uk: "Натисни «Запустити рушій»", ar: "اضغط «تشغيل المحرك»", hi: "“इंजन चलाएँ” दबाएँ", "zh-CN": "按下“运行引擎”", "zh-TW": "按下「執行引擎」", ja: "「エンジンを実行」を押して", ko: "“엔진 실행”을 누르세요", tr: "“Motoru çalıştır”a bas" },
  "play.noOutput": { en: "(no output) result: ", pl: "(brak wyjścia) wynik: ", de: "(keine Ausgabe) Ergebnis: ", fr: "(pas de sortie) résultat : ", es: "(sin salida) resultado: ", it: "(nessun output) risultato: ", "pt-BR": "(sem saída) resultado: ", uk: "(немає виводу) результат: ", ar: "(لا مخرجات) النتيجة: ", hi: "(कोई आउटपुट नहीं) परिणाम: ", "zh-CN": "（无输出）结果：", "zh-TW": "（無輸出）結果：", ja: "（出力なし）結果：", ko: "(출력 없음) 결과: ", tr: "(çıktı yok) sonuç: " },
  "play.error": { en: "error: ", pl: "błąd: ", de: "Fehler: ", fr: "erreur : ", es: "error: ", it: "errore: ", "pt-BR": "erro: ", uk: "помилка: ", ar: "خطأ: ", hi: "त्रुटि: ", "zh-CN": "错误：", "zh-TW": "錯誤：", ja: "エラー：", ko: "오류: ", tr: "hata: " },
  "play.doneMs": { en: "ready · {ms} ms · {steps} steps", pl: "gotowe · {ms} ms · {steps} kroków", de: "fertig · {ms} ms · {steps} Schritte", fr: "terminé · {ms} ms · {steps} étapes", es: "listo · {ms} ms · {steps} pasos", it: "fatto · {ms} ms · {steps} passi", "pt-BR": "pronto · {ms} ms · {steps} passos", uk: "готово · {ms} мс · {steps} кроків", ar: "تم · {ms} مللي · {steps} خطوة", hi: "तैयार · {ms} मिसे · {steps} चरण", "zh-CN": "完成 · {ms} 毫秒 · {steps} 步", "zh-TW": "完成 · {ms} 毫秒 · {steps} 步", ja: "完了 · {ms} ms · {steps} ステップ", ko: "완료 · {ms} ms · {steps} 단계", tr: "hazır · {ms} ms · {steps} adım" },
  "play.tokensEof": { en: "{n} tokens + EOF", pl: "{n} tokenów + EOF", de: "{n} Tokens + EOF", fr: "{n} jetons + EOF", es: "{n} tokens + EOF", it: "{n} token + EOF", "pt-BR": "{n} tokens + EOF", uk: "{n} токенів + EOF", ar: "{n} رموز + EOF", hi: "{n} टोकन + EOF", "zh-CN": "{n} 个词法单元 + EOF", "zh-TW": "{n} 個詞彙單元 + EOF", ja: "{n} トークン + EOF", ko: "{n}토큰 + EOF", tr: "{n} token + EOF" },
  "play.tabTokens": { en: "Tokens", pl: "Tokeny", de: "Tokens", fr: "Jetons", es: "Tokens", it: "Token", "pt-BR": "Tokens", uk: "Токени", ar: "الرموز", hi: "टोकन", "zh-CN": "词法单元", "zh-TW": "詞彙單元", ja: "トークン", ko: "토큰", tr: "Tokenlar" },
  "play.tabAst": { en: "AST tree", pl: "Drzewo AST", de: "AST-Baum", fr: "Arbre AST", es: "Árbol AST", it: "Albero AST", "pt-BR": "Árvore AST", uk: "Дерево AST", ar: "شجرة AST", hi: "AST वृक्ष", "zh-CN": "AST 树", "zh-TW": "AST 樹", ja: "AST ツリー", ko: "AST 트리", tr: "AST ağacı" },
  "play.tabBytecode": { en: "Bytecode", pl: "Bytecode", de: "Bytecode", fr: "Bytecode", es: "Bytecode", it: "Bytecode", "pt-BR": "Bytecode", uk: "Байткод", ar: "بايت كود", hi: "बाइटकोड", "zh-CN": "字节码", "zh-TW": "位元組碼", ja: "バイトコード", ko: "바이트코드", tr: "Bytecode" },
  "play.srcAria": { en: "Source code", pl: "Kod źródłowy", de: "Quellcode", fr: "Code source", es: "Código fuente", it: "Codice sorgente", "pt-BR": "Código-fonte", uk: "Вихідний код", ar: "الشيفرة المصدرية", hi: "स्रोत कोड", "zh-CN": "源代码", "zh-TW": "原始碼", ja: "ソースコード", ko: "소스 코드", tr: "Kaynak kod" },
  "play.stageLexer": { en: "Lexer", pl: "Lekser", de: "Lexer", fr: "Analyseur lexical", es: "Léxico", it: "Lexer", "pt-BR": "Lexer", uk: "Лексер", ar: "المحلل اللفظي", hi: "लेक्सर", "zh-CN": "词法分析", "zh-TW": "詞法分析", ja: "字句解析", ko: "렉서", tr: "Lexer" },
  "play.stageParser": { en: "Parser", pl: "Parser", de: "Parser", fr: "Analyseur", es: "Analizador", it: "Parser", "pt-BR": "Parser", uk: "Парсер", ar: "المحلل", hi: "पार्सर", "zh-CN": "语法分析", "zh-TW": "語法分析", ja: "構文解析", ko: "파서", tr: "Parser" },
  "play.lineCol": { en: " (line {line}, col {col})", pl: " (linia {line}, kol. {col})", de: " (Zeile {line}, Sp. {col})", fr: " (ligne {line}, col. {col})", es: " (línea {line}, col. {col})", it: " (riga {line}, col. {col})", "pt-BR": " (linha {line}, col. {col})", uk: " (рядок {line}, кол. {col})", ar: " (سطر {line}، عمود {col})", hi: " (पंक्ति {line}, स्तंभ {col})", "zh-CN": "（第 {line} 行，第 {col} 列）", "zh-TW": "（第 {line} 行，第 {col} 列）", ja: "（行 {line}、列 {col}）", ko: " (줄 {line}, 칸 {col})", tr: " (satır {line}, sütun {col})" },
  "play.samples.add": { en: "Addition", pl: "Dodawanie", de: "Addition", fr: "Addition", es: "Suma", it: "Addizione", "pt-BR": "Soma", uk: "Додавання", ar: "جمع", hi: "जोड़", "zh-CN": "加法", "zh-TW": "加法", ja: "加算", ko: "덧셈", tr: "Toplama" },
  "play.samples.prec": { en: "Precedence", pl: "Precedencja", de: "Vorrang", fr: "Priorité", es: "Precedencia", it: "Precedenza", "pt-BR": "Precedência", uk: "Пріоритет", ar: "الأولوية", hi: "पूर्वता", "zh-CN": "优先级", "zh-TW": "優先順序", ja: "優先順位", ko: "우선순위", tr: "Öncelik" },
  "play.samples.closure": { en: "Closure", pl: "Domknięcie", de: "Closure", fr: "Fermeture", es: "Closure", it: "Chiusura", "pt-BR": "Closure", uk: "Замикання", ar: "إغلاق", hi: "क्लोजर", "zh-CN": "闭包", "zh-TW": "閉包", ja: "クロージャ", ko: "클로저", tr: "Kapama" },
  "play.samples.fib": { en: "Fibonacci", pl: "Fibonacci", de: "Fibonacci", fr: "Fibonacci", es: "Fibonacci", it: "Fibonacci", "pt-BR": "Fibonacci", uk: "Фібоначчі", ar: "فيبوناتشي", hi: "फिबोनाची", "zh-CN": "斐波那契", "zh-TW": "費氏數列", ja: "フィボナッチ", ko: "피보나치", tr: "Fibonacci" },
  "play.samples.error": { en: "Error", pl: "Błąd", de: "Fehler", fr: "Erreur", es: "Error", it: "Errore", "pt-BR": "Erro", uk: "Помилка", ar: "خطأ", hi: "त्रुटि", "zh-CN": "错误", "zh-TW": "錯誤", ja: "エラー", ko: "오류", tr: "Hata" },
  "rank.title": { en: "Ranking", pl: "Ranking", de: "Rangliste", fr: "Classement", es: "Clasificación", it: "Classifica", "pt-BR": "Ranking", uk: "Рейтинг", ar: "الترتيب", hi: "रैंकिंग", "zh-CN": "排行榜", "zh-TW": "排行榜", ja: "ランキング", ko: "랭킹", tr: "Sıralama" },
  "rank.league": { en: "Bytecode League", pl: "Liga Bytecode", de: "Bytecode-Liga", fr: "Ligue Bytecode", es: "Liga Bytecode", it: "Lega Bytecode", "pt-BR": "Liga Bytecode", uk: "Ліга Bytecode", ar: "دوري البايت كود", hi: "बाइटकोड लीग", "zh-CN": "字节码联赛", "zh-TW": "位元組碼聯賽", ja: "バイトコードリーグ", ko: "바이트코드 리그", tr: "Bytecode Ligi" },
  "rank.sub": { en: "Top 3 advance to the JIT League", pl: "Top 3 awansują do Ligi JIT", de: "Top 3 steigen in die JIT-Liga auf", fr: "Le top 3 monte en Ligue JIT", es: "El top 3 asciende a la Liga JIT", it: "La top 3 sale in Lega JIT", "pt-BR": "O top 3 sobe para a Liga JIT", uk: "Топ-3 потрапляють до Ліги JIT", ar: "أفضل 3 يصعدون إلى دوري JIT", hi: "शीर्ष 3 JIT लीग में पहुँचते हैं", "zh-CN": "前三名晋级 JIT 联赛", "zh-TW": "前三名晉級 JIT 聯賽", ja: "上位 3 名は JIT リーグへ", ko: "상위 3명은 JIT 리그로 승급", tr: "İlk 3 JIT Ligine yükselir" },
  "rank.you": { en: "You", pl: "Ty", de: "Du", fr: "Toi", es: "Tú", it: "Tu", "pt-BR": "Você", uk: "Ти", ar: "أنت", hi: "आप", "zh-CN": "你", "zh-TW": "你", ja: "あなた", ko: "나", tr: "Sen" },
  "profile.title": { en: "Profile", pl: "Profil", de: "Profil", fr: "Profil", es: "Perfil", it: "Profilo", "pt-BR": "Perfil", uk: "Профіль", ar: "الملف", hi: "प्रोफ़ाइल", "zh-CN": "个人资料", "zh-TW": "個人資料", ja: "プロフィール", ko: "프로필", tr: "Profil" },
  "profile.heading": { en: "Engine builder", pl: "Konstruktor silników", de: "Engine-Bauer", fr: "Constructeur de moteurs", es: "Constructor de motores", it: "Costruttore di motori", "pt-BR": "Construtor de motores", uk: "Конструктор рушіїв", ar: "باني المحركات", hi: "इंजन निर्माता", "zh-CN": "引擎建造者", "zh-TW": "引擎建造者", ja: "エンジンビルダー", ko: "엔진 제작자", tr: "Motor yapımcısı" },
  "profile.sub": { en: "Course: build a JavaScript engine", pl: "Kurs: jak zbudować silnik JavaScript", de: "Kurs: eine JavaScript-Engine bauen", fr: "Cours : construire un moteur JavaScript", es: "Curso: construye un motor JavaScript", it: "Corso: costruisci un motore JavaScript", "pt-BR": "Curso: construa um motor JavaScript", uk: "Курс: як збудувати рушій JavaScript", ar: "دورة: ابنِ محرك JavaScript", hi: "पाठ्यक्रम: JavaScript इंजन बनाएँ", "zh-CN": "课程：构建 JavaScript 引擎", "zh-TW": "課程：打造 JavaScript 引擎", ja: "コース：JavaScript エンジンを作る", ko: "코스: JavaScript 엔진 만들기", tr: "Kurs: bir JavaScript motoru kur" },
  "profile.streakDays": { en: "day streak", pl: "dni serii", de: "Tage Serie", fr: "jours de série", es: "días de racha", it: "giorni di serie", "pt-BR": "dias de ofensiva", uk: "днів серії", ar: "أيام متتالية", hi: "दिनों की लकीर", "zh-CN": "连续天数", "zh-TW": "連續天數", ja: "連続日数", ko: "연속 일수", tr: "gün serisi" },
  "profile.xpTotal": { en: "total XP", pl: "XP łącznie", de: "XP gesamt", fr: "XP total", es: "XP total", it: "XP totali", "pt-BR": "XP total", uk: "XP загалом", ar: "إجمالي XP", hi: "कुल XP", "zh-CN": "总 XP", "zh-TW": "總 XP", ja: "合計 XP", ko: "총 XP", tr: "toplam XP" },
  "profile.gems": { en: "gems", pl: "klejnoty", de: "Edelsteine", fr: "gemmes", es: "gemas", it: "gemme", "pt-BR": "gemas", uk: "самоцвіти", ar: "جواهر", hi: "रत्न", "zh-CN": "宝石", "zh-TW": "寶石", ja: "ジェム", ko: "보석", tr: "mücevher" },
  "profile.lessons": { en: "lessons", pl: "lekcji", de: "Lektionen", fr: "leçons", es: "lecciones", it: "lezioni", "pt-BR": "lições", uk: "уроків", ar: "دروس", hi: "पाठ", "zh-CN": "课程", "zh-TW": "課程", ja: "レッスン", ko: "레슨", tr: "ders" },
  "profile.badges": { en: "Badges", pl: "Odznaki", de: "Abzeichen", fr: "Badges", es: "Insignias", it: "Badge", "pt-BR": "Emblemas", uk: "Відзнаки", ar: "الشارات", hi: "बैज", "zh-CN": "徽章", "zh-TW": "徽章", ja: "バッジ", ko: "뱃지", tr: "Rozetler" },
  "profile.settings": { en: "Settings", pl: "Ustawienia", de: "Einstellungen", fr: "Réglages", es: "Ajustes", it: "Impostazioni", "pt-BR": "Configurações", uk: "Налаштування", ar: "الإعدادات", hi: "सेटिंग्स", "zh-CN": "设置", "zh-TW": "設定", ja: "設定", ko: "설정", tr: "Ayarlar" },
  "profile.dark": { en: "Dark mode", pl: "Tryb ciemny", de: "Dunkelmodus", fr: "Mode sombre", es: "Modo oscuro", it: "Tema scuro", "pt-BR": "Modo escuro", uk: "Темний режим", ar: "الوضع الداكن", hi: "डार्क मोड", "zh-CN": "深色模式", "zh-TW": "深色模式", ja: "ダークモード", ko: "다크 모드", tr: "Karanlık mod" },
  "profile.design": { en: "Design system", pl: "Design system", de: "Designsystem", fr: "Design system", es: "Sistema de diseño", it: "Design system", "pt-BR": "Design system", uk: "Дизайн-система", ar: "نظام التصميم", hi: "डिज़ाइन सिस्टम", "zh-CN": "设计系统", "zh-TW": "設計系統", ja: "デザインシステム", ko: "디자인 시스템", tr: "Tasarım sistemi" },
  "profile.reset": { en: "Reset progress", pl: "Resetuj postęp", de: "Fortschritt zurücksetzen", fr: "Réinitialiser la progression", es: "Restablecer progreso", it: "Azzera progressi", "pt-BR": "Redefinir progresso", uk: "Скинути прогрес", ar: "إعادة تعيين التقدم", hi: "प्रगति रीसेट करें", "zh-CN": "重置进度", "zh-TW": "重設進度", ja: "進捗をリセット", ko: "진행 초기화", tr: "İlerlemeyi sıfırla" },
  "profile.resetTitle": { en: "Reset progress?", pl: "Zresetować postęp?", de: "Fortschritt zurücksetzen?", fr: "Réinitialiser la progression ?", es: "¿Restablecer el progreso?", it: "Azzerare i progressi?", "pt-BR": "Redefinir o progresso?", uk: "Скинути прогрес?", ar: "إعادة تعيين التقدم؟", hi: "प्रगति रीसेट करें?", "zh-CN": "重置进度？", "zh-TW": "重設進度？", ja: "進捗をリセットしますか？", ko: "진행을 초기화할까요?", tr: "İlerleme sıfırlansın mı?" },
  "profile.resetBody": { en: "You will lose XP, streak and completed lessons.", pl: "Stracisz XP, serię i ukończone lekcje.", de: "XP, Serie und abgeschlossene Lektionen gehen verloren.", fr: "Tu perdras XP, série et leçons terminées.", es: "Perderás XP, racha y lecciones completadas.", it: "Perderai XP, serie e lezioni completate.", "pt-BR": "Você perderá XP, ofensiva e lições concluídas.", uk: "Втратиш XP, серію та завершені уроки.", ar: "ستفقد XP والسلسلة والدروس المكتملة.", hi: "आप XP, लकीर और पूरे पाठ खो देंगे।", "zh-CN": "将丢失 XP、连续天数和已完成课程。", "zh-TW": "將遺失 XP、連續天數和已完成課程。", ja: "XP・連続・完了レッスンが失われます。", ko: "XP, 연속, 완료 레슨이 사라집니다.", tr: "XP, seri ve biten dersler silinir." },
  "profile.resetConfirm": { en: "Yes, reset", pl: "Tak, resetuj", de: "Ja, zurücksetzen", fr: "Oui, réinitialiser", es: "Sí, restablecer", it: "Sì, azzera", "pt-BR": "Sim, redefinir", uk: "Так, скинути", ar: "نعم، أعد التعيين", hi: "हाँ, रीसेट करें", "zh-CN": "是的，重置", "zh-TW": "是的，重設", ja: "はい、リセット", ko: "네, 초기화", tr: "Evet, sıfırla" },
  "profile.cancel": { en: "Cancel", pl: "Anuluj", de: "Abbrechen", fr: "Annuler", es: "Cancelar", it: "Annulla", "pt-BR": "Cancelar", uk: "Скасувати", ar: "إلغاء", hi: "रद्द करें", "zh-CN": "取消", "zh-TW": "取消", ja: "キャンセル", ko: "취소", tr: "İptal" },
  "profile.resetDone": { en: "Progress cleared", pl: "Postęp wyczyszczony", de: "Fortschritt gelöscht", fr: "Progression effacée", es: "Progreso borrado", it: "Progressi cancellati", "pt-BR": "Progresso limpo", uk: "Прогрес очищено", ar: "تم مسح التقدم", hi: "प्रगति साफ़ हो गई", "zh-CN": "进度已清除", "zh-TW": "進度已清除", ja: "進捗を消去した", ko: "진행이 초기화됐어요", tr: "İlerleme temizlendi" },
  "profile.lang": { en: "Language", pl: "Język", de: "Sprache", fr: "Langue", es: "Idioma", it: "Lingua", "pt-BR": "Idioma", uk: "Мова", ar: "اللغة", hi: "भाषा", "zh-CN": "语言", "zh-TW": "語言", ja: "言語", ko: "언어", tr: "Dil" },
  "profile.langHint": { en: "App and course language", pl: "Język aplikacji i kursu", de: "Sprache von App und Kurs", fr: "Langue de l'app et du cours", es: "Idioma de la app y el curso", it: "Lingua di app e corso", "pt-BR": "Idioma do app e do curso", uk: "Мова застосунку та курсу", ar: "لغة التطبيق والدورة", hi: "ऐप और पाठ्यक्रम की भाषा", "zh-CN": "应用与课程语言", "zh-TW": "應用程式與課程語言", ja: "アプリとコースの言語", ko: "앱과 코스 언어", tr: "Uygulama ve kurs dili" },
  "app.title": { en: "Rudi.js", pl: "Rudi.js", de: "Rudi.js", fr: "Rudi.js", es: "Rudi.js", it: "Rudi.js", "pt-BR": "Rudi.js", uk: "Rudi.js", ar: "Rudi.js", hi: "Rudi.js", "zh-CN": "Rudi.js", "zh-TW": "Rudi.js", ja: "Rudi.js", ko: "Rudi.js", tr: "Rudi.js" },
  "modal.aria": { en: "Dialog", pl: "Okno", de: "Dialog", fr: "Boîte de dialogue", es: "Diálogo", it: "Finestra", "pt-BR": "Diálogo", uk: "Вікно", ar: "مربع حوار", hi: "संवाद", "zh-CN": "对话框", "zh-TW": "對話框", ja: "ダイアログ", ko: "대화상자", tr: "Pencere" },
};

function pickUi(lang) {
  const out = {};
  for (const [key, map] of Object.entries(UI)) {
    out[key] = map[lang] ?? map.en;
  }
  return out;
}

function extractPlCourse() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/course.js"), "utf8"), ctx);
  const COURSE = ctx.window.RUDI_COURSE;
  const course = { modules: {}, lessons: {}, exercises: {} };
  for (const m of COURSE) {
    course.modules[m.id] = { title: m.title, subtitle: m.subtitle };
    for (const l of m.lessons) {
      course.lessons[l.id] = { title: l.title };
      course.exercises[l.id] = l.exercises.map((ex) => {
        const o = { q: ex.q, explain: ex.explain };
        if (ex.kind === "choice") o.options = ex.options;
        if (ex.kind === "order") {
          o.tiles = ex.tiles.map((t) => (typeof t === "string" ? t : t.t));
          if (ex.extra) o.extra = ex.extra.map((t) => (typeof t === "string" ? t : t.t));
        }
        return o;
      });
    }
  }
  return course;
}

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

// Load English course if tools/course.en.json exists; else keep Polish as temporary until translator fills it.
function loadEnCourse(plCourse) {
  const p = path.join(root, "tools/course.en.json");
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return deepClone(plCourse); // placeholder — replaced by translator pack
}

const plCourse = extractPlCourse();
const enCoursePath = path.join(root, "tools/course.en.json");
let enCourse = fs.existsSync(enCoursePath) ? JSON.parse(fs.readFileSync(enCoursePath, "utf8")) : null;

for (const lang of Object.keys(META)) {
  const coursePath = path.join(root, `tools/course.${lang}.json`);
  let course;
  if (lang === "pl") course = plCourse;
  else if (fs.existsSync(coursePath)) course = JSON.parse(fs.readFileSync(coursePath, "utf8"));
  else if (lang === "en" && enCourse) course = enCourse;
  else if (enCourse) course = deepClone(enCourse); // non-translated langs fall back to English course
  else course = deepClone(plCourse);

  const doc = { meta: META[lang], ui: pickUi(lang), course };
  fs.writeFileSync(path.join(localesDir, `${lang}.json`), JSON.stringify(doc, null, 2) + "\n");
  console.log("wrote", lang, "exercises", Object.values(course.exercises).reduce((a, b) => a + b.length, 0));
}
