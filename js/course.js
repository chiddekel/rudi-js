/* Rudi.js course content: how to build a JavaScript engine.
   Exercise kinds:
     choice: { q, code?, options[], answer (index), explain }
     order:  { q, code?, tiles[] (correct order; string or {t, type}), extra?[] (distractors), explain }
     input:  { q, code?, answer (string | string[]), explain }   — "what does it print?" style */
window.RUDI_COURSE = [
  {
    id: "m1", title: "Lekser", subtitle: "Ze znaków w tokeny", color: "fox",
    lessons: [
      { id: "m1l1", title: "Droga kodu", icon: "path", exercises: [
        { kind: "choice", q: "Co silnik JS robi jako pierwsze z tekstem programu?",
          options: ["Dzieli go na tokeny", "Wykonuje linijka po linijce", "Kompiluje do kodu maszynowego", "Rysuje drzewo AST"], answer: 0,
          explain: "Najpierw lekser (skaner) zamienia ciąg znaków na listę tokenów. Dopiero z nich parser buduje AST." },
        { kind: "order", q: "Ułóż etapy potoku silnika w kolejności.",
          tiles: ["Źródło", "Tokeny", "AST", "Bytecode", "Wynik"],
          explain: "Źródło → lekser → tokeny → parser → AST → kompilator → bytecode → maszyna wirtualna → wynik." },
        { kind: "choice", q: "Co jest wyjściem parsera?",
          options: ["Lista tokenów", "Drzewo AST", "Bytecode", "Wynik programu"], answer: 1,
          explain: "Parser czyta tokeny i buduje abstrakcyjne drzewo składni (AST)." },
        { kind: "choice", q: "Który silnik napędza Chrome i Node.js?",
          options: ["SpiderMonkey", "JavaScriptCore", "V8", "Hermes"], answer: 2,
          explain: "V8: Chrome i Node.js. SpiderMonkey: Firefox. JavaScriptCore: Safari. Hermes: React Native." }
      ]},
      { id: "m1l2", title: "Tokeny", icon: "star", exercises: [
        { kind: "order", q: "Na jakie tokeny lekser podzieli ten kod?", code: "let x = 40 + 2;",
          tiles: [{ t: "let", type: "keyword" }, { t: "x", type: "identifier" }, { t: "=", type: "operator" }, { t: "40", type: "number" },
                  { t: "+", type: "operator" }, { t: "2", type: "number" }, { t: ";", type: "punctuation" }],
          explain: "7 tokenów: słowo kluczowe, identyfikator, operator, liczba, operator, liczba, średnik." },
        { kind: "choice", q: "Jakim tokenem jest \"let\" zapisane w cudzysłowie?", code: "const s = \"let\";",
          options: ["Słowo kluczowe", "String", "Identyfikator", "Operator"], answer: 1,
          explain: "W cudzysłowie to po prostu tekst: token typu string. Lekser rozpoznaje to po znaku otwierającym \"." },
        { kind: "choice", q: "Ile tokenów (bez EOF) ma to wyrażenie?", code: "a >= 10",
          options: ["2", "3", "4", "5"], answer: 1,
          explain: "a, >=, 10. Lekser wybiera najdłuższe dopasowanie (maximal munch), więc >= to jeden token, nie > i =." },
        { kind: "choice", q: "Co nasz lekser robi z białymi znakami i komentarzami //?",
          options: ["Tworzy z nich tokeny", "Pomija je", "Zgłasza błąd", "Zamienia na średniki"], answer: 1,
          explain: "Spacje i komentarze tylko oddzielają tokeny. Lekser je przeskakuje. (Prawdziwy JS pamięta nowe linie dla ASI.)" }
      ]},
      { id: "m1l3", title: "Piszemy skaner", icon: "bolt", exercises: [
        { kind: "choice", q: "Co doda ten fragment dla wejścia 123+4 (i = 0)?",
          code: "if (/[0-9]/.test(src[i])) {\n  let start = i;\n  while (/[0-9]/.test(src[i])) i++;\n  tokens.push({ type: \"number\",\n    value: src.slice(start, i) });\n}",
          options: ["{ number \"1\" }", "{ number \"123\" }", "{ number \"123+4\" }", "{ number 127 }"], answer: 1,
          explain: "Pętla zjada cyfry aż do +. slice(0, 3) to \"123\"." },
        { kind: "choice", q: "Dlaczego operatory sprawdzamy od najdłuższych: === przed == przed =?",
          options: ["Bo tak jest szybciej", "Żeby === nie rozpadło się na == i =", "Bo tak wymaga Unicode", "Kolejność nie ma znaczenia"], answer: 1,
          explain: "Maximal munch: gdyby = było pierwsze, === zostałoby zjedzone jako trzy osobne =." },
        { kind: "input", q: "Ile tokenów (bez EOF) wygeneruje lekser?", code: "console.log(\"hi\");", answer: "7",
          explain: "console . log ( \"hi\" ) ; – razem 7." }
      ]}
    ]
  },
  {
    id: "m2", title: "Parser", subtitle: "Z tokenów w drzewo", color: "sky",
    lessons: [
      { id: "m2l1", title: "Drzewo AST", icon: "path", exercises: [
        { kind: "choice", q: "Jaki węzeł jest korzeniem każdego AST w naszym silniku?",
          options: ["Program", "BlockStatement", "Root", "ExpressionStatement"], answer: 0,
          explain: "Program trzyma listę instrukcji (body). Tak samo jak w ESTree." },
        { kind: "choice", q: "Co jest korzeniem tego wyrażenia?", code: "40 + 2 * 3",
          options: ["BinaryExpression *", "BinaryExpression +", "Literal 40", "Literal 3"], answer: 1,
          explain: "* wiąże mocniej, więc 2 * 3 staje się prawym dzieckiem +. Korzeniem jest +." },
        { kind: "order", q: "Ułóż węzły na ścieżce od korzenia do liczby 1.", code: "let a = f(1);",
          tiles: ["Program", "VariableDeclaration", "VariableDeclarator", "CallExpression", "Literal"],
          extra: ["BinaryExpression"],
          explain: "Program → VariableDeclaration → VariableDeclarator (init) → CallExpression (arguments) → Literal 1." }
      ]},
      { id: "m2l2", title: "Precedencja", icon: "star", exercises: [
        { kind: "input", q: "Jaki jest wynik?", code: "2 + 3 * 4", answer: "14",
          explain: "* ma wyższą siłę wiązania niż +, więc 2 + (3 * 4) = 14." },
        { kind: "input", q: "Operator ** jest prawostronnie łączny. Jaki jest wynik?", code: "2 ** 3 ** 2", answer: "512",
          explain: "2 ** (3 ** 2) = 2 ** 9 = 512. W parserze Pratta: prawą stronę parsujemy z bp − 1." },
        { kind: "choice", q: "W parserze Pratta: kiedy operator „przejmuje” lewe wyrażenie?",
          options: ["Gdy jego siła wiązania > minimalna", "Gdy stoi pierwszy w pliku", "Gdy jest dłuższy", "Zawsze"], answer: 0,
          explain: "Pętla: while (bp(op) > minBp) { … }. To jedna linijka, która załatwia całą precedencję." },
        { kind: "choice", q: "Jak powinno zostać zgrupowane to wyrażenie?", code: "10 - 4 - 3",
          options: ["(10 - 4) - 3", "10 - (4 - 3)"], answer: 0,
          explain: "Odejmowanie jest lewostronnie łączne: (10 − 4) − 3 = 3. Inaczej wyszłoby 9." }
      ]},
      { id: "m2l3", title: "Instrukcje", icon: "bolt", exercises: [
        { kind: "choice", q: "Jaki węzeł powstanie z tego kodu?", code: "if (a) b(); else c();",
          options: ["IfStatement { consequent, alternate }", "ConditionalExpression", "LogicalExpression ||", "Dwa osobne IfStatement"], answer: 0,
          explain: "IfStatement ma test, consequent (gałąź then) i alternate (gałąź else)." },
        { kind: "choice", q: "Co powinien zgłosić parser?", code: "let = 5;",
          options: ["ReferenceError", "SyntaxError: oczekiwano nazwy zmiennej", "Nic, x = 5", "TypeError"], answer: 1,
          explain: "Po let parser oczekuje identyfikatora. To błąd składni, wykryty zanim cokolwiek się wykona." },
        { kind: "choice", q: "Dlaczego to jest błąd?", code: "x + 1 = 5",
          options: ["Brakuje średnika", "Lewa strona = musi być celem przypisania", "5 to zła liczba", "To nie jest błąd"], answer: 1,
          explain: "Przypisać można do Identifier (albo właściwości), nie do BinaryExpression." }
      ]}
    ]
  },
  {
    id: "m3", title: "Interpreter", subtitle: "Ożywiamy drzewo", color: "teal",
    lessons: [
      { id: "m3l1", title: "Chodzenie po drzewie", icon: "path", exercises: [
        { kind: "choice", q: "Interpreter typu tree-walking…",
          options: ["Rekurencyjnie oblicza węzły AST", "Zamienia kod na asembler", "Czyta tokeny bez parsera", "Działa tylko na liczbach"], answer: 0,
          explain: "evaluate(node) patrzy na node.type i rekurencyjnie oblicza dzieci. Prosto, ale wolniej niż bytecode." },
        { kind: "input", q: "Co wypisze program?", code: "let s = 0;\nlet i = 1;\nwhile (i <= 4) {\n  s += i;\n  i += 1;\n}\nconsole.log(s);", answer: "10",
          explain: "1 + 2 + 3 + 4 = 10." },
        { kind: "choice", q: "Kiedy b() NIE zostanie wywołane?", code: "a && b()",
          options: ["Gdy a jest fałszywe", "Gdy a jest prawdziwe", "Nigdy", "Zawsze"], answer: 0,
          explain: "Short-circuit: LogicalExpression oblicza prawą stronę tylko wtedy, gdy musi." }
      ]},
      { id: "m3l2", title: "Zakresy", icon: "star", exercises: [
        { kind: "input", q: "Co wypisze program?", code: "let x = 1;\n{\n  let x = 2;\n}\nconsole.log(x);", answer: "1",
          explain: "Blok tworzy nowe środowisko. Wewnętrzne x znika po wyjściu z bloku." },
        { kind: "choice", q: "Jak interpreter szuka zmiennej?",
          options: ["Tylko w globalnym", "W bieżącym środowisku, potem w rodzicach", "W losowej kolejności", "W tokenach"], answer: 1,
          explain: "Łańcuch środowisk: env → env.parent → … → global. Nie ma? ReferenceError." },
        { kind: "choice", q: "Co się stanie?", code: "const k = 1;\nk = 2;",
          options: ["k będzie 2", "TypeError: Assignment to constant variable", "SyntaxError parsera", "Nic"], answer: 1,
          explain: "Środowisko pamięta, które nazwy są const, i blokuje przypisanie w czasie wykonania." }
      ]},
      { id: "m3l3", title: "Domknięcia", icon: "bolt", exercises: [
        { kind: "input", q: "Co wypisze program?",
          code: "function makeCounter() {\n  let n = 0;\n  return function () {\n    n += 1;\n    return n;\n  };\n}\nconst c = makeCounter();\nc(); c();\nconsole.log(c());", answer: "3",
          explain: "Funkcja wewnętrzna trzyma referencję do środowiska z n. Każde wywołanie zwiększa to samo n." },
        { kind: "choice", q: "Co przechowuje obiekt funkcji (closure) w naszym silniku?",
          options: ["Tylko nazwę", "Węzeł AST + środowisko utworzenia", "Kopię wszystkich zmiennych globalnych", "Skompilowany asembler"], answer: 1,
          explain: "new Closure(node, env). Przy wywołaniu tworzymy nowe Env, którego rodzicem jest zapamiętane env." },
        { kind: "input", q: "Co wypisze program?", code: "function add(a) {\n  return function (b) { return a + b; };\n}\nconst add5 = add(5);\nconsole.log(add5(10));", answer: "15",
          explain: "add5 pamięta a = 5. 5 + 10 = 15." }
      ]}
    ]
  },
  {
    id: "m4", title: "Bytecode VM", subtitle: "Płasko i szybko", color: "plum",
    lessons: [
      { id: "m4l1", title: "Maszyna stosowa", icon: "path", exercises: [
        { kind: "order", q: "Ułóż bytecode dla wyrażenia.", code: "40 + 2",
          tiles: [{ t: "PUSH_CONST 40", type: "op" }, { t: "PUSH_CONST 2", type: "op" }, { t: "ADD", type: "op" }],
          extra: [{ t: "SUB", type: "op" }],
          explain: "Najpierw oba argumenty na stos, potem ADD zdejmuje dwa i wrzuca wynik." },
        { kind: "input", q: "Jaka wartość zostanie na szczycie stosu?", code: "PUSH 3\nPUSH 4\nMUL\nPUSH 2\nSUB", answer: "10",
          explain: "3 · 4 = 12, potem 12 − 2 = 10." },
        { kind: "choice", q: "Po co bytecode zamiast chodzenia po AST?",
          options: ["Płaska lista instrukcji jest szybsza do wykonania", "Bo AST nie da się wykonać", "Żeby kod był czytelniejszy", "Bo przeglądarki tego wymagają"], answer: 0,
          explain: "Mniej skakania po wskaźnikach, lepsza pamięć podręczna CPU, łatwiej o optymalizacje. V8 ma interpreter Ignition." }
      ]},
      { id: "m4l2", title: "Skoki", icon: "star", exercises: [
        { kind: "choice", q: "Jaką instrukcję wygeneruje kompilator dla warunku if?",
          options: ["CALL", "JUMP_IF_FALSE", "RETURN", "DUP"], answer: 1,
          explain: "Oblicz test → JUMP_IF_FALSE za gałąź then. Gdy jest else, na końcu then dodajemy JUMP za else." },
        { kind: "order", q: "Ułóż schemat kompilacji pętli.", code: "while (c) body",
          tiles: ["oblicz c", "JUMP_IF_FALSE → koniec", "body", "JUMP → początek"],
          explain: "Test na górze, skok warunkowy na koniec, ciało i skok bezwarunkowy z powrotem do testu." }
      ]}
    ]
  },
  {
    id: "m5", title: "Pamięć i GC", subtitle: "Kto sprząta?", color: "berry",
    lessons: [
      { id: "m5l1", title: "Mark & sweep", icon: "path", exercises: [
        { kind: "choice", q: "Które obiekty usuwa mark & sweep?",
          options: ["Najstarsze", "Nieosiągalne z korzeni", "Największe", "Wszystkie po każdej funkcji"], answer: 1,
          explain: "Korzenie: zmienne globalne, stos, rejestry. Co nie da się z nich osiągnąć, to śmieci." },
        { kind: "order", q: "Ułóż fazy odśmiecania.",
          tiles: ["Znajdź korzenie", "Oznacz osiągalne", "Zamieć nieoznaczone"],
          explain: "Mark: przejście grafu od korzeni. Sweep: zwolnienie wszystkiego, co nie ma znacznika." },
        { kind: "choice", q: "Dlaczego liczenie referencji nie radzi sobie z cyklem a ↔ b?",
          options: ["Liczniki nigdy nie spadną do 0", "Cykle są zabronione w JS", "Bo jest za szybkie", "Radzi sobie bez problemu"], answer: 0,
          explain: "a trzyma b, b trzyma a. Nawet gdy nikt inny ich nie widzi, oba mają licznik 1." }
      ]},
      { id: "m5l2", title: "Generacje", icon: "star", exercises: [
        { kind: "choice", q: "Hipoteza generacyjna mówi, że…",
          options: ["Większość obiektów umiera młodo", "Stare obiekty są najczęściej usuwane", "Obiekty nigdy nie umierają", "GC działa raz na minutę"], answer: 0,
          explain: "Dlatego młodą generację sprząta się często i tanio, a starą rzadko." },
        { kind: "choice", q: "Jakim algorytmem V8 sprząta młodą generację?",
          options: ["Liczeniem referencji", "Scavenge (kopiujący, semi-space)", "Nie sprząta jej", "Ręcznym free()"], answer: 1,
          explain: "Żywe obiekty są kopiowane do drugiej połowy przestrzeni. Martwe znikają za darmo." }
      ]}
    ]
  },
  {
    id: "m6", title: "JIT", subtitle: "Turbo dla gorącego kodu", color: "sun",
    lessons: [
      { id: "m6l1", title: "Ukryte klasy", icon: "path", exercises: [
        { kind: "choice", q: "Kiedy dwa obiekty dzielą ukrytą klasę (shape)?",
          options: ["Mają te same właściwości dodane w tej samej kolejności", "Mają te same wartości", "Zawsze", "Gdy są w jednej tablicy"], answer: 0,
          explain: "{x, y} i {y, x} to różne kształty. Dlatego warto inicjalizować pola w stałej kolejności." },
        { kind: "choice", q: "Inline cache przyspiesza obj.x, ponieważ…",
          options: ["Zapamiętuje shape i offset z poprzedniego dostępu", "Kopiuje obiekt", "Usuwa właściwość x", "Wyłącza GC"], answer: 0,
          explain: "Ten sam shape? Czytamy od razu spod zapamiętanego offsetu, bez szukania po nazwie." }
      ]},
      { id: "m6l2", title: "Poziomy kompilacji", icon: "trophy", exercises: [
        { kind: "order", q: "Ułóż poziomy wykonania w V8 od najprostszego.",
          tiles: ["Ignition", "Sparkplug", "Maglev", "TurboFan"],
          explain: "Ignition: interpreter bytecode. Sparkplug: szybki baseline. Maglev: średni optymalizator. TurboFan: najmocniejszy." },
        { kind: "choice", q: "Kiedy następuje deoptymalizacja?",
          options: ["Gdy założenia JIT (np. typy) przestają być prawdziwe", "Co 10 sekund", "Gdy kod jest za krótki", "Nigdy"], answer: 0,
          explain: "JIT założył, że x to zawsze liczba. Przyszedł string? Wracamy do wolniejszego, bezpiecznego kodu." }
      ]}
    ]
  }
];
