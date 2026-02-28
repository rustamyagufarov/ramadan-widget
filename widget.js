module.exports.main = async () => {
// ---------- DATA ----------
let urlTimes =
"https://raw.githubusercontent.com/rustamyagufarov/ramadan-widget/refs/heads/main/times.json"

let urlTimes =
"https://raw.githubusercontent.com/USERNAME/ramadan-widget/main/times.json"

let fm = FileManager.local()

let path = fm.joinPath(
  fm.documentsDirectory(),
  "times_cache.json"
)

let ramadanTimes

try {

  let req = new Request(urlTimes)

  req.timeoutInterval = 10

  ramadanTimes = await req.loadJSON()

  fm.writeString(
    path,
    JSON.stringify(ramadanTimes)
  )

}
catch(e) {

  if (fm.fileExists(path)) {

    ramadanTimes = JSON.parse(
      fm.readString(path)
    )

  } else {

    ramadanTimes = {}

  }

}


// ---------- DATE ----------
function getLocalKey(date) {
  const f = new DateFormatter();
  f.dateFormat = "yyyy-MM-dd";
  return f.string(date);
}

const now = new Date();

let baseKey = getLocalKey(now);
let baseData = ramadanTimes[baseKey];

let displayDate = new Date(now);

// смена дня после ифтара
if (baseData) {

  let [h, m] = baseData.iftar.split(":").map(Number);

  let iftarToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m
  );

  if (now >= iftarToday) {
    displayDate.setDate(displayDate.getDate() + 1);
  }
}

let todayKey = getLocalKey(displayDate);
let todayData = ramadanTimes[todayKey];

// защита последнего дня
if (!todayData) {
  const lastKey = Object.keys(ramadanTimes).pop();
  todayKey = lastKey;
  todayData = ramadanTimes[lastKey];
}

const todayOnly = new Date(
  displayDate.getFullYear(),
  displayDate.getMonth(),
  displayDate.getDate()
);


// ---------- PRAYER LOGIC ----------
let suhurCountdown = null;
let iftarCountdown = null;
let suhurState = "normal";

if (todayData) {

  let [sH, sM] = todayData.suhur.split(":").map(Number);
  let [iH, iM] = todayData.iftar.split(":").map(Number);

  let suhurTime = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    displayDate.getDate(),
    sH,
    sM
  );

  let iftarTime = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    displayDate.getDate(),
    iH,
    iM
  );

  // 🌙 ДО СУХУРА
  if (now < suhurTime) {

    let diff = Math.floor((suhurTime - now) / 60000);

    let h = Math.floor(diff / 60);
    let m = diff % 60;
    suhurCountdown = `${h}ч ${m}м`;
  }

  // ☀ ПОСЛЕ СУХУРА ДО ИФТАРА
  else if (now >= suhurTime && now < iftarTime) {

    suhurState = "done";

    let diff = Math.floor((iftarTime - now) / 60000);

    let h = Math.floor(diff / 60);
    let m = diff % 60;
    iftarCountdown = `${h}ч ${m}м`;
  }

  // 🌇 ПОСЛЕ ИФТАРА
  else {

    // countdown до следующего сухура
    let tomorrowSuhur = new Date(suhurTime);
    tomorrowSuhur.setDate(tomorrowSuhur.getDate() + 1);

    let diff = Math.floor((tomorrowSuhur - now) / 60000);

    let h = Math.floor(diff / 60);
    let m = diff % 60;
    suhurCountdown = `${h}ч ${m}м`;
  }
}

// ---------- WIDGET ----------
let widget = new ListWidget();

let gradient = new LinearGradient();
gradient.colors = [
  new Color("#16261C"),
  new Color("#0F1C14")
];
gradient.locations = [0, 1];

widget.backgroundGradient = gradient;
widget.setPadding(14,16,4,16);


// ---------- TOP ROW ----------
let top = widget.addStack();
top.layoutHorizontally();
top.spacing = 12;

// LEFT (DATE)
let left = top.addStack();
left.layoutVertically();
left.setPadding(6, 0, -8, 0);
//left.borderWidth = 1;
//left.addSpacer();

const df = new DateFormatter();

df.dateFormat = "EEEE";
let weekday = left.addText(df.string(displayDate).toUpperCase());
weekday.font = Font.semiboldSystemFont(18);
weekday.textColor = new Color("#C6A94A");

df.dateFormat = "d";
let dayNumber = left.addText(df.string(displayDate));
dayNumber.font = Font.systemFont(70);
dayNumber.textColor = new Color("#F5F5F7");

// RIGHT (CARDS)
let right = top.addStack();
right.layoutVertically();
right.spacing = 6;
//right.borderWidth = 1;


function addCard(parent, title, text) {

  let card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = new Color("#1B3A24", 0.45);
  card.cornerRadius = 10;
  card.setPadding(8, 10, 8, 10);


  // -------- верхняя строка --------

  let top = card.addStack();
  top.layoutHorizontally();

  let titleTxt = top.addText(title.toUpperCase());
  titleTxt.font = Font.semiboldSystemFont(12);
  titleTxt.textColor = new Color("#C6A94A");

  top.addSpacer();


  // разбиваем текст
  let parts = text.split("•");

  let time = parts[0].trim();

  let timeTxt = top.addText(time);
  timeTxt.font = Font.semiboldSystemFont(24);
  timeTxt.textColor = new Color("#F5F5F7");


  // -------- нижняя строка --------

  if (parts.length > 1) {

    let bottom = card.addStack();
    bottom.layoutHorizontally();

    bottom.addSpacer();

    let small = bottom.addText(parts[1].trim());

    small.font = Font.semiboldMonospacedSystemFont(10);
    small.textColor = new Color("#D8E3DC", 0.7);
  }

}
if (todayData) {

  let suhurText = todayData.suhur;

  if (suhurState === "done") {
    suhurText += " • СУХУР НАСТУПИЛ";
  }
  else if (suhurCountdown) {
    suhurText += " • через " + suhurCountdown;
  }

  addCard(right, "Сухур", suhurText);

  let iftarText = todayData.iftar;

  if (iftarCountdown) {
    iftarText += " • через " + iftarCountdown;
  }

  addCard(right, "Ифтар", iftarText);
}


widget.addSpacer();

// ---------- CALENDAR ----------
let title = widget.addText("РАМАДАН 1447");
title.font = Font.semiboldSystemFont(16);
title.textColor = new Color("#C6A94A");

widget.addSpacer(10);

const startDate = new Date("2026-02-19");
const totalDays = 29;

// 7 + 7 + 7 + 8
const layout = [7, 7, 7, 8];

let counter = 0;

for (let r = 0; r < layout.length; r++) {

  let row = widget.addStack();
  row.layoutHorizontally();
  
  for (let c = 0; c < layout[r]; c++) {

    if (counter >= totalDays) break;

    let dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + counter);

    let key = getLocalKey(dayDate);

    let cell = row.addStack();

    cell.size = new Size(30, 30);
    cell.centerAlignContent();

    let text = cell.addText(String(counter + 1));
    text.font = Font.semiboldSystemFont(16);
    text.textColor = new Color("#f2f2f7");


    // прошедшие
    if (dayDate < todayOnly && key !== todayKey) {

      cell.backgroundColor = new Color("#1B3A24");
      cell.cornerRadius = 15;

      text.textColor = new Color("#f2f2f7", 0.5);
    }


    // сегодня
    if (key === todayKey) {

      //cell.backgroundColor = new Color("#C6A94A", 0.6);
      cell.cornerRadius = 15;
      cell.borderWidth = 5;
      cell.borderColor = new Color("#C6A94A", 0.6);

      text.textColor = Color.white();
      text.font = Font.semiboldSystemFont(14);
    }

    counter++;

    // воздух между кружками
    if (c < layout[r] - 1) {
      row.addSpacer();
    }
  }

  widget.addSpacer(12);
}
// ---------- REFRESH ----------
if (todayData) {

  let [sH, sM] = todayData.suhur.split(":").map(Number);
  let [iH, iM] = todayData.iftar.split(":").map(Number);

  let suhurTime = new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate(), sH, sM);
  let iftarTime = new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate(), iH, iM);

  if (now < suhurTime) {
    widget.refreshAfterDate = suhurTime;
  }
  else if (now >= suhurTime && now < iftarTime) {
    widget.refreshAfterDate = iftarTime;
  }
  else {
    widget.refreshAfterDate = new Date(Date.now() + 60 * 1000);
  }
}


if (!config.runsInWidget) {
  await widget.presentLarge();
}

Script.setWidget(widget);
Script.complete();
}
