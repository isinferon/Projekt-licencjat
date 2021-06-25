const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { ensureAuthenticated } = require("../config/auth");
const _ = require("lodash");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const nodemailer = require("nodemailer");

//User model
const User = require("../models/User");
const { db, findById } = require("../models/User");

//BMI page
router.get("/bmi", ensureAuthenticated, (req, res) =>
  res.render("bmi", {
    user: req.user,
  })
);

// Dodanie BMi do bazy i sprawdzenie czy sa zpaelnione pola
router.post("/bmi", async (req, res) => {
  if (!req.body.waga || !req.body.wzrost) {
    res.redirect("/dashboard/bmi");
  } else {
    const { waga, wzrost } = req.body;
    const goodWzrost = wzrost / 100;
    const BMI = waga / goodWzrost / goodWzrost;
    const user = await User.findById(req.user._id);
    user.bmi = BMI.toFixed(2);
    await user.save();
    console.log(user.bmi);
    res.redirect("/dashboard/bmi");
  }
});

//BMR page
router.get("/bmr", ensureAuthenticated, (req, res) =>
  res.render("bmr", {
    user: req.user,
  })
);

router.post("/bmr", async (req, res) => {
  if (
    !req.body.waga ||
    !req.body.wzrost ||
    !req.body.wiek ||
    req.body.plec === "Wybierz płeć" ||
    req.body.aktywnosc === "Wybierz rodzaj aktywności fizycznej" ||
    req.body.cel === "Wybierz co chcesz osiagnąć"
  ) {
    res.redirect("/dashboard/bmr");
  } else {
    let activity, celDiety;
    let BMR;
    if (req.body.aktywnosc === "mala") activity = 1.2;
    if (req.body.aktywnosc === "umiarkowana") activity = 1.4;
    if (req.body.aktywnosc === "duza") activity = 1.6;
    if (req.body.aktywnosc === "bardzoDuza") activity = 1.8;
    if (req.body.cel === "schudnac") celDiety = 0.85;
    if (req.body.cel === "utrzymacWage") celDiety = 1;
    if (req.body.cel === "nabracMasy") celDiety = 1.2;

    if (req.body.plec === "kobieta") {
      BMR =
        (655 +
          9.6 * req.body.waga +
          1.8 * req.body.wzrost -
          4.7 * req.body.wiek) *
        activity *
        celDiety;
    } else {
      BMR =
        (66 +
          13.7 * req.body.waga +
          5 * req.body.wzrost -
          6.8 * req.body.wiek) *
        activity *
        celDiety;
    }
    const user = await User.findById(req.user._id);
    user.bmr = BMR.toFixed(0);
    await user.save();
    console.log(user.bmr);
    res.redirect("/dashboard/user");
  }
});

//TODO page
// ensureAuthenticated

router.get("/todo", ensureAuthenticated, (req, res) => {
  User.findById(req.user._id, function (err, data) {
    if (err) throw err;
    res.render("todo", {
      user: req.user,
      todos: data.list,
    });
  });
});

router.post("/todo", async (req, res) => {
  console.log(req.body.item);
  let errors = [];
  if (!req.body.item) {
    res.redirect("/dashboard/todo");
  } else {
    const user = await User.findById(req.user._id);
    user.list.push(req.body.item);
    await user.save();
    res.render("todo", {
      user: user,
      todos: user.list,
    });
  }
});

router.get("/todo/:name", async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!req.params.name) {
    res.redirect("/dashboard/todo");
  } else {
    user.list.pull(req.params.name);
    await user.save((err) => {
      if (err) return err;
      res.render("todo", {
        user: user,
        todos: user.list,
      });
    });
  }
});

//START page
router.get("/start", ensureAuthenticated, (req, res) =>
  res.render("start", {
    user: req.user,
  })
);

// START/CWICZENIA PAGE/
const cwiczenia = [
  [
    "/assets/images/cwiczenia/klatkaPic1.jpg",
    "Partia mięśniowa: Klatka piersiowa",
    "Mięśnie zaangażowane: Cała grupa mięśni klatki piersiowej, mięśnie trójgłowe ramion",
    "Nogi ugięte pod kątem prostym i przylegają do podłoża, łokcie prowadzimy w trakcie całego ruchu pod kątem 45 stopni od tułowia oraz trzymamy mostek pokazany na zdjeciu obok, który zapobiega kontuzji.",
  ],
  [
    "/assets/images/cwiczenia/nogiPic1.jpg",
    "Partia mięśniowa: Plecy, nogi",
    "Mięśnie zaangażowane: Mięśnie pośladkowe i prostowniki grzbietu",
    "Stajemy w rozkroku nieco większym niż szerokość barków. Klatka piersiowa wypchnięta ku przodowi, łopatki ściągnięte do siebie. Nogi lekko ugięte w kolanach przez cały czas trwania ćwiczenia. Z takiej pozycji wykonujemy skłon do pozycji zbliżonej do poziomego ułożenia tułowia względem podłogi, następnie wracamy do początkowej pozycji.",
  ],
  [
    "/assets/images/cwiczenia/brzuchPic1.jpg",
    "Partia mięśniowa: Brzuch",
    "Mięśnie zaangażowane: Mieśnie głębokie brzucha",
    "Podpieramy się na palcach i łokciach, skupiamy się na spinaniu brzucha oraz pośladków i przyjemujemy poze widoczną na obrazku obok. Staramy się utrzymać w tej pozycji jak najdłużej.",
  ],
  [
    "/assets/images/cwiczenia/barkiPic1.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Mięśnie czworoboczne grzbietu(kapturowe)",
    "Głowa prosto, ramiona ściągnięte do tyłu, klatka wypięta do przodu. Chwytamy sztangielki i unosimy barki możliwie jak najwyżej ściągając je jednocześnie do tyłu. W najwyższym punkcie wstrzymujemy ruch przez chwilę",
  ],
  [
    "/assets/images/cwiczenia/plecyPic1.jpg",
    "Partia mięśniowa: Plecy, nogi",
    "Mięśnie zaangażowane: Prostowniki grzbietu, mięsnie najszersze grzbietu, pośladkowe, dwugłowe ud",
    "Stajemy przodem do sztangi, w rozkroku na szerokość barków. Nogi lekko ugięte w kolanach, sztangę chwytamy nachwytem, nieco szerzej niż barki. Klatka wypchnięta ku przodowi, tułów wyprostowany. Ćwiczenie polega na unoszeniu sztangi w górę poprzez prostowanie nóg i wyprost tułowia. Ruch kończymy przy pełnym wyproście tułowia. Nie wolno również dopuszczać do tzw. ”kociego grzbietu”. Powrót do pozycji wyjściowej zaczynamy od lekkiego ugięcia nóg w kolanach, a następnie pochylamy tułów robiąc skłon",
  ],
  [
    "/assets/images//cwiczenia/ramionaPic1.jpg",
    "Partia mięśniowa: Ramiona",
    "Mięśnie zaangażowane: Dwugłowe ramion, mięsnie przedramion",
    "Polega na stopniowym obracaniu dłoni w trakcie wykonywania ćwiczenia. W pozycji wyjściowej dłonie zwrócone są ku sobie palcami, a w miarę uginania ramion obracają się tak, by w końcowym momencie ruchu małe palce były wyżej od kciuków. Ruch można wykonywać na przemian-raz jedna ręka, raz druga, obiema rękami jednocześnie.",
  ],
  [
    "/assets/images/cwiczenia/plecyPic2.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Prostowniki grzbietu",
    "Kładziemy się twarzą do dołu na ławce, tak by biodra spoczywały na niej, a nogi były zaparte o specjalną poprzeczkę. Generalnie im głębszy skłon tym większe rozciągnięcie mięsni grzbietu, ale i większe zaangażowanie mięśni dwugłowych ud i pośladkowych. Ruch powinien być płynny, bez „szarpania” i zamaszystych ruchów, które powodują ominięcie najtrudniejszego punktu ćwiczenia.",
  ],
  [
    "/assets/images/cwiczenia/barkiPic2.jpg",
    "Partia mięśniowa: Barki",
    "Mięśnie zaangażowane: Środkowe aktony mięśni naramiennych",
    "W pozycji wyjściowej tułów lekko pochylony, ręce ze sztangielkami nieco ugięte w łokciach, opuszczone w dół. Sztangielki unosimy do linii barków i bez zatrzymania opuszczamy powoli w dół. Ćwiczenie to można również wykonywać jednorącz sztangielką.",
  ],
  [
    "/assets/images/cwiczenia/plecyPic3.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Najszersze grzbietu",
    "Stajemy okrakiem nad gryfem sztangi i chwytamy drążek. Nogi lekko ugięte w kolanach. W takiej pozycji podciągamy sztangę do brzucha i opuszczamy cieżar powoli. W zależności od kąta, pod jakim chcemy zaatakować mięśnie używamy w tym ćwiczeniu różnych drążków.",
  ],
  [
    "/assets/images/cwiczenia/klatkaPic2.jpg",
    "Partia mięśniowa: Klatka piersiowa",
    "Mięśnie zaangażowane: Cała grupa mięśni piersiowych, mięśnie najszersze grzbietu",
    "Kładziemy się w poprzek ławki poziomej w ten sposób, by do jej powierzchni przylegała jedynie część pleców w okolicy łopatek i karku. Chwytamy sztangielkę pod talerzami. Sztangielkę opuszczamy do tyłu w dół do momentu maksymalnego wychylenia, w jakim możemy kontrolować ciężar.Dla lepszego zaangażowania mięśni zębatych można przy opuszczaniu sztangielki w tył jednocześnie obniżyć biodra.",
  ],
  [
    "/assets/images/cwiczenia/nogiPic2.jpg",
    "Partia mięśniowa: Nogi",
    "Mięśnie zaangażowane: Mięśnie pośladkowe",
    "Siadamy w poprzek lawki poziomej, sztange bądź hantel kładziemy na biodra i unosimy sie do góry w taki sposób aby jedynie łopatki przylegały do ławki i w kolanach bylo 90stopni. Gdy jesteśmy w stabilnej pozycji opuszczamy pośladki a następnie unosimy i jednocześnie spinamy mięśnie pośladkowe przy początkowej pozycji.",
  ],
  [
    "/assets/images/cwiczenia/plecyPic4.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Najszersze grzbietu, podgrzebieniowe",
    "Stajemy nad sztangą w rozkroku na szerokość barków, pochylamy tułów do pozycji prawie równoległej do podłoża, nogi lekko ugięte w kolanach. Sztangę chwytamy na szerokość nieco większą od barków i podciągamy ją do brzucha.",
  ],
  [
    "/assets/images/cwiczenia/brzuchPic2.jpg",
    "Partia mięśniowa: Brzuch",
    "Mięśnie zaangażowane: Mięśnie brzucha proste i skośne",
    "Pozycje zaczynami od przejścia na kolana. Spinamy brzuch i powoli odjeżdżamy kołkiem jak najdalej do momentu aż będziemy minimalnie nad podłożem. Nastepnie korzystając z ramion oraz mięsni brzucha przyciągami kółko do siebie, trzeba pamietać aby plecy były w równej pozycji",
  ],
  [
    "/assets/images/cwiczenia/ramionaPic2.jpg",
    "Partia mięśniowa: Ramiona",
    "Mięśnie zaangażowane: Mieśnie trójgłowe ramion",
    "Chwytamy poręcze chwytem neutralnym, ręce wyprostowane, klatka piersiowa wypchnięta do przodu. Opuszczanie i unoszenie tułowia odbywa się poprzez uginanie rąk w stawach łokciowych. Przez cały czas trwania ćwiczenia łokcie powinny znajdować się jak najbliżej tułowia.",
  ],
  [
    "/assets/images/cwiczenia/plecyPic5.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Mięśnie najszersze grzbietu",
    "Wolną ręką opieramy się o coś stabilnego. Tułów w pozycji prawie równoległej do podłogi. W drugą rękę chwytamy sztangielkę. Chwyt przez cały czas trwania ćwiczenia równoległy, łokieć pracuje wzdłuż tułowia,pracują mocniej górne i środkowe części mięsni najszerszych ",
  ],
  [
    "/assets/images/cwiczenia/nogiPic3.jpg",
    "Partia mięśniowa: Nogi",
    "Mięśnie zaangażowane: Mięśnie czworogłowe ud, mieśnie pośladkowe",
    "W ręce trzymając obciążenie kładziemy stope  na podwyższenie które jest za nami. Używając tylko nogi która ma kontakt z podłożem robimy przysiad na jednej nodze do uzyskania 90 stopni w kolanie a następnie unosimy sie do góry. Podczas ruchu należy spiąć brzuch oraz pośladki. ",
  ],
  [
    "/assets/images/cwiczenia/plecyPic6.jpg",
    "Partia mięśniowa: Plecy",
    "Mięśnie zaangażowane: Mięśnie najszersze grzbietu, podgrzebieniowe",
    "Chwytamy drążek prosty nachwytem i przyciągamy ją do klatki. Łopatki ściągamy do siebie, jednocześnie łokcie przywodząc do tyłu. Przy przyciąganiu do klatki tułów nieco odchylony do tyłu. W dolnym położeniu przytrzymujemy drążek na chwilę dla lepszego napięcia mięsni. ",
  ],
  [
    "/assets/images/cwiczenia/barkiPic3.jpg",
    "Partia mięśniowa: Barki",
    "Mięśnie zaangażowane: Tylnia część mięśni naramiennych",
    "Łapiemy nachwytem sznury, postawa wyprostowana, spięty brzuch. Przy przyciąganiu łapatki sciągamy do siebie a łokcie wędruja na boki. Ruch powininen być na wysokości twarzy",
  ],
  [
    "/assets/images/cwiczenia/ramionaPic3.jpg",
    "Partia mięśniowa: Ramiona",
    "Mięśnie zaangażowane: Wszystkie mięśnie trójgłowych ramion",
    "Chwytamy rączkę nachwytem na szerokość około 10-20cm. Lekko pochylamy się w przód i naciskamy rączkę wyciągu w dół. Ramiona przyciśnięte do tułowia. Ruch wykonują tylko przedramiona. Ramiona prostujemy do końca-dla lepszego napięcia mięśni. Nie unosimy łokci, gdy rączka wyciągu jest w górnym położeniu, spowodowałoby to zanik napięcia w tricepsach.",
  ],
  [
    "/assets/images/cwiczenia/klatkaPic3.jpg",
    "Partia mięśniowa: Klatka piersiowa",
    "Mięśnie zaangażowane: Mięsień piersiowy większy, przednie aktony mięśni naramiennych, piersiowy mniejszy",
    "Gdy złapiemy rączki, wychodzimy krok do przodu przed wyciąg i w trakcie ruchu lekko uginamy je w łokciach.  W końcowej fazie ruch można zatrzymać na chwilę w celu lepszego napięcia mięśni. Ważne jest wykonywanie pełnego zakresu ruchu, im większy zakres wykonanego ruchu, tym pełniejszy ogólny rozwój mięśnia.",
  ],
  [
    "/assets/images/cwiczenia/nogiPic4.jpg",
    "Partia mięśniowa: Nogi",
    "Mięśnie zaangażowane: Mieśnie czworogłowem mieśnie pośladkowe ",
    "Wchodzimy pod sztangę stojącą na stojakach, barki opuszczone i odwiedzione w tył, gryf sztangi dotyka naszego karku na mięśniach czworobocznych grzbietu. Dłonie rozstawione w wygodnej i stabilnej pozycji na gryfie. Dolny odcinek grzbietu wypchnięty do przodu, rozstaw stóp w zależności od naszego poczucia stabilności. Rozpoczynamy ruch w dół, przez cały czas plecy wygięte w jednakowy sposób, pracują tylko nogi do momentu rozciagniecia czworogłowych.",
  ],
];

router.get("/start/cwiczenia", ensureAuthenticated, (req, res) => {
  res.render("cwiczenia", {
    user: req.user,
    cwiczenia: cwiczenia,
  });
});

// START/CWICZENIA/PLANTRENINGOWY
router.get(
  "/start/cwiczenia/planTreningowy",
  ensureAuthenticated,
  (req, res) => {
    res.render("planTreningowy", {
      user: req.user,
      msg: null,
    });
  }
);

//// START/CWICZENIA/PLANTRENINGOWY/nowyPlan
router.get(
  "/start/cwiczenia/planTreningowy/nowyPlan",
  ensureAuthenticated,
  (req, res) => {
    res.render("nowyPlan", {
      user: req.user,
      msg: null,
      dni: null,
    });
  }
);
router.post("/start/cwiczenia/planTreningowy/nowyPlan", async (req, res) => {
  const user = await User.findById(req.user._id);
  const dni = [];
  dni.splice(0, 8);
  if (req.body.poniedzialek) dni.push(req.body.poniedzialek);
  if (req.body.wtorek) dni.push(req.body.wtorek);
  if (req.body.sroda) dni.push(req.body.sroda);
  if (req.body.czwartek) dni.push(req.body.czwartek);
  if (req.body.piatek) dni.push(req.body.piatek);
  if (req.body.sobota) dni.push(req.body.sobota);
  if (req.body.niedziela) dni.push(req.body.niedziela);
  Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
  };

  if (dni.length === 7 || dni.length === 0) {
    res.render("nowyPlan", {
      msg: "Trening musi zawierać od 1 do maksymalnie 5 dni trenujących",
      user: req.user,
    });
  } else {
    if (user.trening[0]) {
      user.trening.splice(0, user.trening.length);
    }
    if (dni.length === 1) {
      user.trening.insert(0, dni[0]);
      user.trening[1] = "Przysiady ze sztangą  5 x 6,5,4,3,2";
      user.trening[2] = "Wiosłowanie sztangą trzymaną podchwytem 5 x 6";
      user.trening[3] = "Martwy ciąg 5 x 5,4,3,2,1";
      user.trening[4] = "Wyciskanie sztangi na ławce poziomej 4 x 6,4,4,2";
      user.trening[5] = "Wyciskanie żołnierskie stojąc 4 x 6";
      user.trening[6] =
        "Wyciskanie poprzez ugięcie w łokciach gryfu łamanego leżąc na ławce poziomej 3 x 6";
      user.trening[7] =
        "Wznosy przedramion ze sztangą trzymaną podchwytem stojąc 3 x 6";
      user.trening[8] = "Wspięcia na palce trzymając hantle w dloniach 4 x 8";
      user.trening[9] =
        "Wznosy nóg wyprostowanych lub ugiętych wisząc na drążku 4 x 6";
    } else if (dni.length === 2) {
      user.trening.insert(0, dni[0]);
      user.trening[1] = 'Przysiady ze sztangą trzymaną z tyłu 4 x 6,4,4,3';
      user.trening[2] = 'Prosotwanie w kolanie nóg na maszynie 4 x 8'
      user.trening[3] = 'Wyciskanie sztangi leżąc na ławce dodatniej 4 x 8'
      user.trening[4] = 'Wyciskanie hantli leżąc na ławce poziomej 3 x 6'
      user.trening[5] = 'Wyciskanie żołnierskie stojąc 4 x 6'
      user.trening[6] = 'Wyciskanie hantli nad głowe 3 x 6'
      user.trening[7] = 'Wyciskanie sztangi wąskim chwytem na ławce poziomej 3 x 6'
      user.trening[8] = 'Wyciskanie hantla zza głowy trzymanego oburącz siedząc 2 x 5'
      user.trening[9] = "Wspięcia na palce trzymając hantle w dloniach 4 x 8"
      user.trening[10] = dni[1];
      user.trening[11] = 'Podciąganie na drążku 4 x 6 (z obciążeniem lub bez)'
      user.trening[12] = 'Wiosłowanie hantlami 3 x 6'
      user.trening[13] = 'Martwy ciąg 4 x 5'
      user.trening[14] = 'Wznosy hantli bokiem w górę w opadzie tułowia 4 x 8'
      user.trening[15] = 'Wznosy przedramion ze sztangą stojąc 3 x 6'
      user.trening[16] = 'Wznosy nóg w zwisie na drążku 4 x 6'
      user.trening[17] = 'Uginanie przedramion z hantlami 4 x 10'
    } else if (dni.length === 3) {
      user.trening.insert(0, dni[0]);
      user.trening[1] = 'Wyciskanie sztangi leżąc (ławka pozioma) 4 x 8'
      user.trening[2] = 'Wyciskanie hantli leżąc na ławce dodatniej 3 x 6'
      user.trening[3] = 'Rozpiętki na maszynie, bramie bądź z hantlami 4 x 10'
      user.trening[4] = 'Wyciskanie sztangi leżąc na ławce ujemnej 4 x 8'
      user.trening[5] = 'Pompki na poręczach 4 x 8'
      user.trening[6] = 'Ściąganie linek wyciągu górnego 4 x 8'
      user.trening[7] = 'Wyciskanie poprzez ugięcie w łokciach gryfu łamanego leżąc na ławce poziomej 3 x 6'
      user.trening[8] = null
      user.trening[9] = null
      user.trening[10] = dni[1];
      user.trening[11] = 'Martwy ciąg 4 x 8'
      user.trening[12] = 'Podciąganie sztangi w opadzie tułowia (wiosłowanie) nachwytem 4 x 8'
      user.trening[13] = 'Podciąganie na drążku 4 x 6'
      user.trening[14] = 'Ściąganie drążka wyciągu górnego za głowę 4 x 10'
      user.trening[15] = 'Uginanie ramion ze sztangą prostą, stojąc 4 x 8'
      user.trening[16] = 'Uginanie ramienia ze sztangielką, w podporze o kolano 4 x 8'
      user.trening[17] = 'Uginanie ramion ze sztangielkami, naprzemiennie, siedząc 4 x 12'
      user.trening[18] = null
      user.trening[19] = null
      user.trening[20] = dni[2];
      user.trening[21] = 'Wyciskanie żołnierskie stojąc 4 x 6'
      user.trening[22] = 'Unoszenie hantli bokiem w górę 4 x 8'
      user.trening[23] = 'Unoszenie sztangi (łamanej) wzdłuż tułowia 4 x 10'
      user.trening[24] = 'Wznosy barków ze sztangą (szrugsy) 4 x 12'
      user.trening[25] = 'Przysiady ze sztangą na karku 4 x 5'
      user.trening[26] = 'Prostowanie nóg na maszynie, siedząc 4 x 8'
      user.trening[27] = 'Zginanie nóg, leżąc na brzuchu (maszyna) 4 x 8'
      user.trening[28] = 'Wspięcia na palce trzymając hantle w dloniach 4 x 8'
    } else if (dni.length === 4) {
      user.trening.insert(0, dni[0]);
      user.trening[1] = 'Przysiady ze sztangą za głową 5 x 8'
      user.trening[2] = 'Wykroki chodzone z hantlami w dłoniach 3 x 8'
      user.trening[3] = 'Martwy ciąg na prostych nogach 3 x 8'
      user.trening[4] = 'Prostowanie nóg na maszynie, siedząc 4 x 8'
      user.trening[5] = 'Wspięcia na palce z hantlami w dłoni 3 x 8'
      user.trening[6] = null
      user.trening[7] = null
      user.trening[8] = null
      user.trening[9] = null
      user.trening[10] = dni[1];
      user.trening[11] = 'Wyciskanie sztangi leżąc na ławce poziomej 4 x 8'
      user.trening[12] = 'Wyciskanie sztangi leżąc/hantli na ławce dodatniej 4 x 8'
      user.trening[13] = 'Rozpiętki 3 x 10'
      user.trening[14] = 'Wyciskanie żołnierskie stojąc 3 x 8'
      user.trening[15] = 'Wznosy hantli na boki stojąc 3 x 8'
      user.trening[16] = 'Wznosy nog wyprostowanych bądź ugiętych do klatki w zwisie na drążku 4 x 10'
      user.trening[17] = null
      user.trening[18] = null
      user.trening[19] = null
      user.trening[20] = dni[2];
      user.trening[21] = 'Ściąganie szeroko drążka wyciągu górnego do klatki 4 x 8'
      user.trening[22] = 'Ściąganie wąskiego drążka w kształcie V do brzucha siedząc 3 x 8'
      user.trening[23] = 'Wiosłowanie podchwytem sztangą do brzucha 3 x 8'
      user.trening[24] = 'Wiosłowanie hantlem w podporze o ławkę 3 x 10'
      user.trening[25] = 'Podciąganie na drążku 4 x 6'
      user.trening[26] = null
      user.trening[27] = null
      user.trening[28] = null
      user.trening[29] = null
      user.trening[30] = dni[3];
      user.trening[31] = 'Prostowanie ramion z hantlą za głową 3 x 10'
      user.trening[32] = 'Wyciskanie sztangi w wąskim chwycie 3 x 8'
      user.trening[33] = 'Pompki na poręczach 3 x 8'
      user.trening[34] = 'Prostowanie ramion z linkami wyciągu górnego 3 x 10'
      user.trening[35] = 'Uginanie ramion z gryfem łamanym 3 x 10'
      user.trening[36] = 'Uginanie ramion z hantlami z rotacją nadgarstka 3 x 10'
      user.trening[37] = 'Uginanie ramion z hantlami chwytem młotkowym 3 x 8'
    } else  {
      user.trening.insert(0, dni[0]);
      user.trening[1] = 'Przysiady ze sztangą na karku 4 x 8'
      user.trening[2] = 'Wejścia na podest/skrzynię (40-50cm) z hantlami w rękach 4 x 12'
      user.trening[3] = 'Wykroki krótkie chodzone z talerzem obciążeniowym trzymanym przy klatce piersiowej 4 x 12'
      user.trening[4] = 'Prostowanie nóg na maszynie, siedząc 4 x 8'
      user.trening[5] = 'Wspięcia na palce trzymając hantle w dloniach 4 x 8'
      user.trening[6] = null
      user.trening[7] = null
      user.trening[8] = null
      user.trening[9] = null
      user.trening[10] = dni[1];
      user.trening[11] = 'Wyciskanie sztangi leżąc na ławce poziomej 4 x 8'
      user.trening[12] = 'Wyciskanie sztangi leżąc/hantli na ławce dodatniej 4 x 8'
      user.trening[13] = 'Rozpiętki z hantlami leżąc na ławce dodatniej 4 x 10'
      user.trening[14] = 'Rozpiętki przy użyciu maszyny 4 x 8'
      user.trening[15] = 'Skłony tułowia przy użyciu linek wyciągu górnego w klęku (allachy) 4 x 12'
      user.trening[16] = 'Przyciąganie ud do brzucha w zwisie na drążku 4 x 10'
      user.trening[17] = null
      user.trening[18] = null
      user.trening[19] = null
      user.trening[20] = dni[2];
      user.trening[21] = 'Podciąganie na drążku stałym szerokim nachwytem 4 x 5'
      user.trening[22] = 'Wiosłowanie hantlem w podporze przodem 4 x 12'
      user.trening[23] = 'Przyciąganie drążka wyciągu górnego do klatki piersiowej trzymanego chwytem neutralnym 4 x 8'
      user.trening[24] = 'Ściąganie wąskiego drążka w kształcie V do brzucha siedząc 3 x 8'
      user.trening[25] = null
      user.trening[26] = null
      user.trening[27] = null
      user.trening[28] = null
      user.trening[29] = null
      user.trening[30] = dni[3];
      user.trening[31] = 'Pompki na poręczach (dipy) 4 x 8'
      user.trening[32] = 'Prostowanie ramion z hantlą za głową 3 x 10'
      user.trening[33] = 'Prostowanie ramion z linkami wyciągu górnego 3 x 10'
      user.trening[34] = 'Uginanie ramion z gryfem łamanym 3 x 10'
      user.trening[35] = 'Uginanie ramion z hantlami chwytem młotkowym 3 x 8'
      user.trening[36] = null
      user.trening[37] = null
      user.trening[38] = null
      user.trening[39] = null
      user.trening[40] = dni[4];
      user.trening[41] = 'Wyciskanie sztangi nad głowę 4 x 10'
      user.trening[42] = 'Jednoczesne unoszenie ramion na bok z hantlami siedząc 4 x 8'
      user.trening[43] = 'Unoszenie sztangi (łamanej) wzdłuż tułowia 4 x 10'
      user.trening[44] = 'Przytrzymywanie pozycji podporu przodem (plank lub deska) 4 x 1min'
      user.trening[45] = 'Przyciąganie ud do brzucha w zwisie na drążku stałym 4 x 12'
      user.trening[46] = 'Przyciąganie ud do brzucha w podporze przodem z nogami na piłce lekarskiej 4 x 12'
    } 

     user.save((err) => {
      if (err) return err;
      res.redirect("/dashboard/start/cwiczenia/planTreningowy")
    });
  }
});

//Start/wiedza PAGE
const wiedza = [
  [
    "/assets/images/wiedza/deficyt1.jpg",
    "/assets/images/wiedza/deficyt2.jpg",
    "TEMATYKA: Co naprawdę wpływa na spalanie tłuszczu ",
    "Poziom tkanki tłuszczowej jest zależny od tego ile spożywamy w ciągu dnia. Osoby z nadmierną jej ilością mają nadwagę bądź otyłość. Warto wspomnieć, że nie ma żadnych produktów dzięki którymi spalimy tłuszcz. Poziom tkanki tłuszczowej możemy obniżyc dzięki deficytowy kalorycznemu. Jeżeli przeciętna osoba  potrzbuje 2300kcal do utrzymania poziomy tkanki to spożywając 2000kcal mamy 300 kcal na deficycie kalorycznym. Jest to najważnmiejsza zasada, która trzeba się kierować przy odchudzaniu.  Głównym problemem związanym z dietą na bardzo niskim poziomie tkanki tłuszczowej jest to, że gdy stajemy się szczuplejsi, zwiększa się głód i zmniejsza się nasz wydatek energetyczny. Tak więc nasz deficyt staje się coraz mniejszy, a wyniki zaczynają zwalniać. ⁣Ważnym elementem jest przyjmowanie odpowiedniej ilości białka aby nasze ciało nie pobierało energii z białka tylko z tłuszczy. Dodając trening otrzymamy bodziec to utrzymania masy mieśniowej więc energia będzie czerpana z komórek tłuszczowych.",
  ],
  [
    "/assets/images/wiedza/6pm.jpg",
    "/assets/images/wiedza/6pm2.jpg",
    "Tematyka: Wieczorne jedzenie węglowodanów",
    "Jest to mit przez, który dużo ludzi ogranicza jedzenie po określonej godzinie co wpływa negatywnie na samopoczucie a wcale tak nie musi być. Ograniczenie jakiegokolwiek jedzenia po godzinie np. 18 nie sprawi redukcji tkanki tłuszczowej tylko sprawi to  deficyt kaloryczny. Gdy ostatni posiłek jest wliczony w dzienny limit kaloryczny to żaden pojedynczy makroskładnik odżywczy nie bedzie miał wplywu na sklad ciala, bez względy na czas spożycia. Wieczorny posiłek pozytywnie wpływa na samopoczucie i sen. Węglowodany mają wiele zalet, regulują hormony jak leptyna czy seratonina, które hamują uczucie głodu. Tak rygorystyczna dieta najprawdopodobniej nie będzie trwała długo ponieważ chodzenie spać głodnemu źle wpływa na nasz stan psychiczny.",
  ],
  [
    "/assets/images/wiedza/damage1.jpg",
    "/assets/images/wiedza/damage2.jpg",
    "Tematyka: Uszkodzenia mięśni = przyrost ???",
    "Trening siłowy wydaje się powodować większe zniszczenie mięśni a także hipertrofię. Tylko faktem jest, że wielkość uszkodzenia nie ma wpływu z jakimkolwiek przyrostem. Nawet jeżeli jest odpowiednia ilość makroskładników nie ma rzeczywistego przyrostu. Uszkodzenia mięśni poprzez długotrwały trening nie ma negatywnego odniesienia do zwiększenia masy mięśniowej lecz czasami  mięśnie potrzebują bodźca, który powstanie przy zrobieniu treningu z większym obciążeniem. Niezależnie czy trening będzie siłowy czy też długotrwały spowoduje przyrost mięśni a odczucie zniszczenia, które możemy odczuwać podczas treningu nie ma żadnego wpływu.",
  ],
  [
    "/assets/images/wiedza/breathe1.jpg",
    "/assets/images/wiedza/breathe2.jpg",
    "Tematyka: Jak skutecznie oddychać przy podnoszeniu dużych cieżarów",
    "Podnoszenie cieżarów szczególnie tych o dużym obciążeniu wymaga od nas dużej stabilizacji, może to nam zapewnić umiejętność prawidłowego oddychania. Głównym celem tego jest stworzenie ciśnienia poprzez wzięcie głebokiego oddechu, tym sposobem naciskamy na przeponę, która kurczy się i wytwarza ciśnienie w jamie brzusznej oraz mięśniach skośnych i lędźwiowych. Można to porównać do puszki z ciśnieniem, im większe tym cięzej jest zniekształcić jej kształt. Aby to zrobić wystarczy wziąć wystarczającą ilość tlenu aby brzuch pod wpływem ciśnienia powiększał się a następnie spiąć mięsnie brzucha, które powoduja zmiejszenie objętości brzucha co sprawia wzrost ciśnienia czyli większą stabilizacje i napięcie. Ważnym elementem w wykonaniu tego jest wstrzymanie oddechu podczas całego ruchu i zrobieniu wydechu po ukończeniu powtórzenia. ",
  ],
  [
    "/assets/images/wiedza/deficit1.jpg",
    "/assets/images/wiedza/deficit2.jpg",
    "Tematyka: Poprawna ilośc deficytu kalorczynego",
    "Jest to temat bardzo ciężki ponieważ każda dieta z deficytem powinna być przystosowana do osoby. Warto mieć jednak wiedzę na temat jak deficyt wpływa na utrate wagi. W celu utraty 1 kg tkanki tłuszczowe przyjeło się, że należy spalić 7000kcal. Zakładając deficyt ~500kcal dziennie, musimy poświęcić 14 dni aby z naszego organizmu znikneło 1 kg tłuszczu. Deficyt przy którym dostarczami poniżej 75% naszego dziennego spożycia kcal jest bardzo rygorystyczny lecz powoduję najszybsze efekty pod względem utraty wagi. Taką dietę należy pilnować pod okiem dietetyka oraz powinna być używana w krótkim okresie czasu bo może negatywnie wpłynąć na nasz organizm a co najważniejsze na złe samopoczucie. Dieta, której przedział kaloryczny jest między 75% a 85% jest najbardziej optymalna i średnio pozwala nam spalic przy siedzącym trybie życia około 500kcal i w miesiącu ubędzie nam ~2kg. Można ją stosować długoterminowo. Ostatnim przedział mieści się w okolicach około 90%. Jest to deficyt kalorczyny, który jest przystosowany do długoterminowej diety. Efekty pojawiają się stopniowo oraz bardzo powoli ale są. Mieszanie kaloryki może negatywnie wpłynąc na prace organizmu co sprawi dziwne wahania wagi. Zaleca się utrzymanie kaloryki na tym samym poziomie przez pewien okres czasu a następnie go zwiększyć bądź zmiejszyć w zależnosci do naszych potrzeb.",
  ],
];
router.get("/start/wiedza", ensureAuthenticated, (req, res) => {
  res.render("wiedza", {
    user: req.user,
    wiedza: wiedza,
  });
});

// DIETA page

router.get("/start/dieta", ensureAuthenticated, (req, res) =>
  res.render("dieta", {
    user: req.user,
  })
);

// nowaDieta page

router.get("/start/dieta/nowaDieta", ensureAuthenticated, (req, res) =>
  res.render("nowaDieta", {
    user: req.user,
    msg: null,
  })
);


router.post("/start/dieta/nowaDieta", async (req, res) => {
  const user = await User.findById(req.user._id);
  if (
    req.body.liczbaP === "Wybierz liczbę posiłków" ||
    req.body.choroba === "Wybierz opcje"
  ) {
    res.redirect("/dashboard/start/dieta/nowaDieta");
  } else if (req.body.choroba === "tak") {
    res.render("nowaDieta", {
      msg: "Dieta nie jest przystosowana dla wszystkich, skontaktuj się z profesjonalnym dietetykiem",
      user: req.user,
    });
  } else {
    if (user.dieta[0]) {
      user.dieta.splice(0, 10);
    }
    if (user.bmr <= 1800) {
      if (req.body.liczbaP === "4") {
        user.dieta.push(
          "Jajecznica z 3 jaj lub z 4 jaj na maśle - 385/489kcal"
        );
        user.dieta.push(
          "Gruszka/jabłko, jugort naturalny do którego wsypujemy orzechu włoskie 10g i wiórki kokosowe 10g - 320kcal"
        );
        user.dieta.push("Dowolny owoc- +/-200g - 180kcal ");
        user.dieta.push("Skyr wysokobiałkowy-150g - 120kcal");
        user.dieta.push(
          "Mieszanka warzyw-450g, filet z pierśi z kurczaka 300g, ryż-50/100g - 770/950kcal "
        );
        user.dieta.push(
          "Makaron(dowolny)- 100g, boczek- 50/100g, śmietana 12% -150ml - 700/850kcal "
        );
        user.dieta.push(null);
        user.dieta.push(null);
        user.dieta.push(
          "Kanapki z 2/3 kromek chleba żytniego, polędwicy 100g i sera 35g - 360/450kcal "
        );
        user.dieta.push(
          "Jogurt smakowy-200g z płatkami owsianymi- 50g/dowolnym owocem - 380/500kcal"
        );
      } else if (req.body.liczbaP === "5") {
        user.dieta.push(
          "Jajecznica z 2 jaj lub z 3 jaj na maśle - 281/385kcal"
        );
        user.dieta.push(
          "25/50g szklanki płatkow owsianych, 1/2 szklanki mleka, 20g orzechów włoskich i 100g pokorjonych owoców -250/320kcal"
        );
        user.dieta.push("Dowolny jeden owoc- +/-200g - 180kcal ");
        user.dieta.push("Skyr wysokobiałkowy-150g - 120kcal");
        user.dieta.push(
          "Mieszanka warzyw-450g, filet z pierśi z kurczaka 200g, ryż-50/100g - 650/830kcal "
        );
        user.dieta.push(
          "Makaron(dowolny)- 100g, boczek- 50g/mięso mielone- 100g, śmietana 12% -100ml - 630/750kcal "
        );
        user.dieta.push(
          "Sałatka z marchwi, ogórka, pomidora, orzechów w 100g w sosie jogurtowym- 200kcal"
        );
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi w 100g - 200kcal"
        );
        user.dieta.push(
          "Kanapki z 2 kromek chleba żytniego, polędwicy 50g i sera 35g - 310kcal "
        );
        user.dieta.push(
          "Jogurt smakowy-200g z płatkami owsianymi- 50g/dowolnym owocem - 380/500kcal"
        );
      }
    } else if (user.bmr > 1800 || user.bmr <= 2400) {
      if (req.body.liczbaP === "4") {
        user.dieta.push(
          "Omlet z 4/5 jaj, polany jogurtem smakowym 100g - 613/736 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 75/100g, pokrojony jeden banan i zalane mlekiem 2% 200ml -515/600kcal"
        );
        user.dieta.push(
          "Skyr wysokobiałkowy-150g z musli-50/75g - 300/390kcal"
        );
        user.dieta.push(
          "Twarog pół-tłusty- 100/200g polany miodem 50g 250/350kcal"
        );
        user.dieta.push(
          "Makaron(dowolny)- 150g, boczek- 50g/mięso mielone- 100g, śmietana 12% -100ml - 800/920kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 100g - 770/950kcal"
        );
        user.dieta.push(null);
        user.dieta.push(null);
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas w 100g - 300kcal"
        );
        user.dieta.push(
          "Kanapki z 2 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 35g - 310kcal"
        );
      } else if (req.body.liczbaP === "5") {
        user.dieta.push(
          "Omlet z 3/4 jaj, polany jogurtem smakowym 100g - 490/613 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 75/100g, pokrojony jeden banan i zalane mlekiem 2% 200ml -515/600kcal"
        );
        user.dieta.push(
          "Skyr wysokobiałkowy-150g z musli-25/50g - 210/300kcal"
        );
        user.dieta.push("Twarog pół-tłusty- 100g polany miodem 50g 250kcal");
        user.dieta.push(
          "Makaron(dowolny)- 150g, boczek- 50g/mięso mielone- 100g, śmietana 12% -100ml - 800/920kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy/schabowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 100g - 770/950kcal"
        );
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas w 100g - 300kcal"
        );
        user.dieta.push("Frytki na słodko z batatów- 100g - 180kcal");
        user.dieta.push("Baton 50g - 200kcal");
        user.dieta.push(
          "Kanapki z 2 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 35g - 310kcal"
        );
      }
    } else if (user.bmr > 2400 || user.bmr <= 3000) {
      if (req.body.liczbaP === "4") {
        user.dieta.push(
          "Jajecznica z 4 jaj, pomidor lub ogórek 100g, 2/3 kromki chleba - 710/800 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 100g, pokrojony jeden banan oraz jabłko i zalane mlekiem 2% 200ml -675kcal"
        );
        user.dieta.push(
          "Skyr wysokobiałkowy-150g z musli-50/75g - 300/390kcal"
        );
        user.dieta.push(
          "Twarog pół-tłusty- 100/200g polany miodem 50g 250/350kcal"
        );
        user.dieta.push(
          "Makaron(dowolny)- 200g, boczek- 100g/mięso mielone- 200g, śmietana 12% -100ml - 1100/1220kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 100g - 770/950kcal"
        );
        user.dieta.push(null);
        user.dieta.push(null);
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas (100g) oraz baton wysokobiałkowy 50g - 450kcal"
        );
        user.dieta.push(
          "Kanapki z 4/5 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 50g - 550/630kcal"
        );
      } else if (req.body.liczbaP === "5") {
        user.dieta.push(
          "Jajecznica z 4 jaj, pomidor lub ogórek 100g, 2/3 kromki chleba - 710/800 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 100g, pokrojony jeden banan oraz jabłko i zalane mlekiem 2% 200ml -675kcal"
        );
        user.dieta.push(
          "Skyr wysokobiałkowy-150g z musli-50/75g - 300/390kcal"
        );
        user.dieta.push(
          "Twarog pół-tłusty- 100/200g polany miodem 50g 250/350kcal"
        );
        user.dieta.push(
          "Makaron(dowolny)- 150g, boczek- 100g/mięso mielone- 200g, śmietana 12% -100ml - 950/1070kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 100g - 770/950kcal"
        );
        user.dieta.push("Baton wysokobiałkowy 50g/75g - 200/300kcal");
        user.dieta.push(
          "Jeden Banan/truskawki 300g  maczane w mlecznej czekoladzie -50g  - 350kcal"
        );
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas (100g)  - 300kcal"
        );
        user.dieta.push(
          "Kanapki z 3/4 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 35g - 443/523kcal"
        );
      }
    } else if (user.bmr > 3000) {
      if (req.body.liczbaP === "4") {
        user.dieta.push(
          "Jajecznica z 6 jaj, pomidor lub ogórek 100g, 3/4 kromki chleba - 1011/1089 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 100g, pokrojony jeden banan oraz jabłko i zalane mlekiem 2% 200ml, 2 kromki chleba posmarowane dżemem 50g  -907kcal"
        );
        user.dieta.push("Skyr wysokobiałkowy-150g z musli-75g - 390kcal");
        user.dieta.push(
          "Twarog pół-tłusty- 100/200g polany miodem 50g 250/350kcal"
        );
        user.dieta.push(
          "2 totrille, wołowina 300/400g, sos dowolny na bazie jogurtu 200g, warzywa 200g, frytki z piekarnika 200g  - 1454/1638kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 200g - 850/1012kcal"
        );
        user.dieta.push(null);
        user.dieta.push(null);
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas (100g) oraz baton wysokobiałkowy 50g - 450kcal"
        );
        user.dieta.push(
          "Kanapki z 4/5 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 50g - 550/630kcal"
        );
      } else if (req.body.liczbaP === "5") {
        user.dieta.push(
          "Jajecznica z 4 jaj, pomidor lub ogórek 100g, 2/3 kromki chleba - 710/800 kcal"
        );
        user.dieta.push(
          "Płatki owsiane 100g, pokrojony jeden banan oraz jabłko i zalane mlekiem 2% 200ml -675kcal"
        );
        user.dieta.push(
          "Skyr wysokobiałkowy-150g z musli-50/75g - 300/390kcal"
        );
        user.dieta.push(
          "Twarog pół-tłusty- 100/200g polany miodem 50g 250/350kcal"
        );
        user.dieta.push(
          "2 totrille, wołowina 200/300g, sos dowolny na bazie jogurtu 200g, warzywa 200g, frytki z piekarnika 200g  - 1181/1454kcal"
        );
        user.dieta.push(
          "Kotlet wieprzowy- 150g, ryz- 50/100g, surowka z ogórka bądz pomidora- 100g - 770/950kcal"
        );
        user.dieta.push("Baton wysokobiałkowy 50g/75g - 200/300kcal");
        user.dieta.push(
          "Jeden Banan/truskawki 300g  maczane w mlecznej czekoladzie -50g  - 350kcal"
        );
        user.dieta.push(
          "Sałatka z owoców arbuz, jabłko, gruszki, kiwi, ananas (100g)  - 300kcal"
        );
        user.dieta.push(
          "Kanapki z 3/4 kromek chleba żytniego, łososia w plastrach/polędwicy 50g i sera 35g - 443/523kcal"
        );
      }
    }
  }
  await user.save((err) => {
    console.log(user.dieta);
    if (err) return err;
    res.render("dieta", {
      user: user,
    });
  });
});

//User page
router.get("/User", ensureAuthenticated, (req, res) =>
  res.render("User", {
    user: req.user,
  })
);

// Edycja Usera page
router.get("/eUser", ensureAuthenticated, (req, res) =>
  res.render("eUser", {
    user: req.user,
  })
);

router.post("/eUser", async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.ramie) {
    user.ramie = req.body.ramie;
  }
  if (req.body.udo) {
    user.udo = req.body.udo;
  }
  if (req.body.talia) {
    user.talia = req.body.talia;
  }
  if (req.body.klatka) {
    user.klatka = req.body.klatka;
  }
  if (req.body.masa) {
    user.waga = req.body.masa;
  }
  await user.save();
  console.log(user);
  res.redirect("/dashboard/User");
});

// MAIL PAGE
router.get("/mail", ensureAuthenticated, (req, res) =>
  res.render("mail", {
    user: req.user,
    msg: null,
  })
);

router.post("/mail", async (req, res) => {
  const user = await User.findById(req.user._id);
  let ramie, udo, talia, klatka, waga, bmr;
  if (!user.ramie) {
    ramie = `Uzupełnij profil`;
  } else ramie = user.ramie;
  if (!user.udo) {
    udo = `Uzupełnij profil`;
  } else udo = user.udo;
  if (!user.talia) {
    talia = `Uzupełnij profil`;
  } else talia = user.talia;
  if (!user.klatka) {
    klatka = `Uzupełnij profil`;
  } else klatka = user.klatka;
  if (!user.waga) {
    waga = `Uzupełnij profil`;
  } else waga = user.waga;
  if (!user.bmr) {
    bmr = `Uzupełnij profil`;
  } else bmr = user.bmr;

  const output = `
    <p>Nowa wiadomość</p>
    <h3>Twoje dane</h3>
    <ul>
    <li>Imie: ${user.name}</li>
    <p>Wymiary</p>;
    <li>Ramie: <strong> ${ramie} </strong></li>
    <li>Udo: <strong> ${udo} </strong></li>
    <li>Talia: <strong> ${talia} </strong></li>
    <li>Klatka: <strong> ${klatka} </strong></li>
    <li>Waga: <strong> ${waga} </strong></li>
    <p>Zapotrzebowanie kaloryczne</p>;
    <li>Kcal: <strong> ${bmr} </strong></li>
    </ul>
    <h3>Wiadomość</h3>
    <p>${req.body.message}</p>
  `;

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "gajdalicencjat@gmail.com",
      pass: "728881901923",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  let info = await transporter.sendMail({
    from: '"Mobilny trener oraz dietetyk" <gajdalicencjat@gmail.com>',
    to: user.email,
    subject: "Witaj",
    text: "Hello world?",
    html: output,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  res.render("mail", { msg: "Email wyslany" });
});

module.exports = router;
