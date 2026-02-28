module.exports.main = async () => {

//// ---------------- LOAD TIMES ----------------

async function loadTimes() {

  let url =
  "https://raw.githubusercontent.com/rustamyagufarov/ramadan-widget/main/times.json"

  let fm = FileManager.local()
  let dir = fm.libraryDirectory()
  let path = fm.joinPath(dir, "times_cache.json")

  let data = {}

  if (fm.fileExists(path)) {
    try {
      data = JSON.parse(fm.readString(path))
    } catch(e) {}
  }

  try {
    let req = new Request(url)
    req.timeoutInterval = 5

    let json = await req.loadJSON()

    data = json

    fm.writeString(
      path,
      JSON.stringify(json)
    )

  } catch(e) {}

  return data
}



//// ---------------- HELPERS ----------------

function getKey(date) {

  let f = new DateFormatter()
  f.dateFormat = "yyyy-MM-dd"

  return f.string(date)
}



function diffText(ms) {

  let m = Math.floor(ms / 60000)

  let h = Math.floor(m / 60)
  let mm = m % 60

  return `${h}ч ${mm}м`
}



//// ---------------- STATE ----------------

function buildState(times) {

  let now = new Date()

  let baseKey = getKey(now)
  let baseData = times[baseKey]

  let displayDate = new Date(now)


  // смена дня после ифтара

  if (baseData) {

    let [h,m] =
    baseData.iftar.split(":").map(Number)

    let iftarToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m
    )

    if (now >= iftarToday) {
      displayDate.setDate(
        displayDate.getDate() + 1
      )
    }
  }


  let todayKey = getKey(displayDate)

  let todayData = times[todayKey]

  if (!todayData) {

    let last =
    Object.keys(times).pop()

    todayKey = last
    todayData = times[last]
  }


  let suhurCountdown = null
  let iftarCountdown = null
  let suhurState = "normal"


  if (todayData) {

    let [sH,sM] =
    todayData.suhur.split(":").map(Number)

    let [iH,iM] =
    todayData.iftar.split(":").map(Number)


    let suhurTime = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      displayDate.getDate(),
      sH,
      sM
    )

    let iftarTime = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      displayDate.getDate(),
      iH,
      iM
    )


    if (now < suhurTime) {

      suhurCountdown =
      diffText(suhurTime - now)

    }

    else if (
      now >= suhurTime &&
      now < iftarTime
    ) {

      suhurState = "done"

      iftarCountdown =
      diffText(iftarTime - now)

    }

    else {

      let tomorrow = new Date(suhurTime)

      tomorrow.setDate(
        tomorrow.getDate() + 1
      )

      suhurCountdown =
      diffText(tomorrow - now)
    }
  }


  return {

    now,
    displayDate,
    todayKey,
    todayData,

    suhurCountdown,
    iftarCountdown,
    suhurState
  }
}



//// ---------------- UI ----------------

function addCard(parent, title, text) {

  let card = parent.addStack()
  card.layoutVertically()

  card.backgroundColor =
  new Color("#1B3A24",0.45)

  card.cornerRadius = 10

  card.setPadding(8,10,8,10)


  let top = card.addStack()
  top.layoutHorizontally()

  let titleTxt =
  top.addText(title.toUpperCase())

  titleTxt.font =
  Font.semiboldSystemFont(12)

  titleTxt.textColor =
  new Color("#C6A94A")

  top.addSpacer()


  let parts = text.split("•")

  let time = parts[0].trim()

  let timeTxt =
  top.addText(time)

  timeTxt.font =
  Font.semiboldSystemFont(24)

  timeTxt.textColor =
  new Color("#F5F5F7")


  if (parts.length > 1) {

    let bottom =
    card.addStack()

    bottom.layoutHorizontally()

    bottom.addSpacer()

    let small =
    bottom.addText(
      parts[1].trim()
    )

    small.font =
    Font.semiboldMonospacedSystemFont(10)

    small.textColor =
    new Color("#D8E3DC",0.7)
  }
}



function addCalendar(widget, state) {

  let startDate =
  new Date("2026-02-19")

  let totalDays = 29

  let layout = [7,7,7,8]

  let counter = 0


  let title =
  widget.addText("РАМАДАН 1447")

  title.font =
  Font.semiboldSystemFont(16)

  title.textColor =
  new Color("#C6A94A")

  widget.addSpacer(10)


  for (let r = 0; r < layout.length; r++) {

    let row = widget.addStack()
    row.layoutHorizontally()

    for (let c = 0; c < layout[r]; c++) {

      if (counter >= totalDays) break

      let dayDate =
      new Date(startDate)

      dayDate.setDate(
        startDate.getDate()
        + counter
      )

      let key = getKey(dayDate)

      let cell =
      row.addStack()

      cell.size =
      new Size(30,30)

      cell.centerAlignContent()


      let t =
      cell.addText(
        String(counter+1)
      )

      t.font =
      Font.semiboldSystemFont(16)

      t.textColor =
      new Color("#f2f2f7")


      if (
        key === state.todayKey
      ) {

        cell.cornerRadius = 15

        cell.borderWidth = 5

        cell.borderColor =
        new Color("#C6A94A",0.6)

        t.textColor =
        Color.white()
      }

      counter++

      if (c < layout[r]-1)
        row.addSpacer()
    }

    widget.addSpacer(12)
  }
}



function buildWidget(state) {

  let widget =
  new ListWidget()

  let gradient =
  new LinearGradient()

  gradient.colors = [
    new Color("#16261C"),
    new Color("#0F1C14")
  ]

  gradient.locations = [0,1]

  widget.backgroundGradient =
  gradient

  widget.setPadding(14,16,4,16)


  //// TOP

  let top =
  widget.addStack()

  top.layoutHorizontally()
  top.spacing = 12


  //// DATE

  let left =
  top.addStack()

  left.layoutVertically()

  let df =
  new DateFormatter()


  df.dateFormat = "EEEE"

  let weekday =
  left.addText(
    df.string(state.displayDate)
      .toUpperCase()
  )

  weekday.font =
  Font.semiboldSystemFont(18)

  weekday.textColor =
  new Color("#C6A94A")


  df.dateFormat = "d"

  let day =
  left.addText(
    df.string(state.displayDate)
  )

  day.font =
  Font.systemFont(70)

  day.textColor =
  new Color("#F5F5F7")


  //// CARDS

  let right =
  top.addStack()

  right.layoutVertically()
  right.spacing = 6


  if (state.todayData) {

    let suhurText =
    state.todayData.suhur

    if (state.suhurState === "done") {

      suhurText +=
      " • СУХУР НАСТУПИЛ"
    }

    else if (state.suhurCountdown) {

      suhurText +=
      " • через " +
      state.suhurCountdown
    }

    addCard(
      right,
      "Сухур",
      suhurText
    )


    let iftarText =
    state.todayData.iftar

    if (state.iftarCountdown) {

      iftarText +=
      " • через " +
      state.iftarCountdown
    }

    addCard(
      right,
      "Ифтар",
      iftarText
    )
  }


  widget.addSpacer()


  addCalendar(
    widget,
    state
  )


  return widget
}



//// ---------------- MAIN ----------------

let times =
await loadTimes()

let state =
buildState(times)

let widget =
buildWidget(state)


if (!config.runsInWidget) {
  await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

}
