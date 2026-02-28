module.exports.main = async () => {

// ---------- LOAD TIMES ----------

let urlTimes = "https://raw.githubusercontent.com/rustamyagufarov/ramadan-widget/main/times.json"

let fm = FileManager.local()
let dir = fm.libraryDirectory()
let path = fm.joinPath(dir,"times_cache.json")

let ramadanTimes = {}
let needDownload = true

if (fm.fileExists(path)) {
  try {
    ramadanTimes = JSON.parse(fm.readString(path))
    needDownload = false
  } catch(e) {
    needDownload = true
  }
}

if (needDownload) {
  try {
    let req = new Request(urlTimes)
    req.timeoutInterval = 8
    let json = await req.loadJSON()
    ramadanTimes = json
    fm.writeString(path,JSON.stringify(json))
  } catch(e) {
    if (fm.fileExists(path)) {
      ramadanTimes = JSON.parse(fm.readString(path))
    } else {
      ramadanTimes = {}
    }
  }
}

// ---------- HELPERS ----------

function getKey(d){
  let f = new DateFormatter()
  f.dateFormat = "yyyy-MM-dd"
  return f.string(d)
}

function getStartDate(times){
  let keys = Object.keys(times)
  keys.sort()
  return new Date(keys[0])
}

// ---------- STATE ----------

function getState(times){

  let now = new Date()
  let baseKey = getKey(now)
  let baseData = times[baseKey]

  let displayDate = new Date(now)

  if(baseData){
    let [h,m]=baseData.iftar.split(":").map(Number)
    let iftarToday=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m)
    if(now>=iftarToday) displayDate.setDate(displayDate.getDate()+1)
  }

  let todayKey=getKey(displayDate)
  let todayData=times[todayKey]

  if(!todayData){
    let lastKey=Object.keys(times).pop()
    todayKey=lastKey
    todayData=times[lastKey]
  }

  let todayOnly=new Date(displayDate.getFullYear(),displayDate.getMonth(),displayDate.getDate())

  let suhurCountdown=null
  let iftarCountdown=null
  let suhurState="normal"

  if(todayData){

    let [sH,sM]=todayData.suhur.split(":").map(Number)
    let [iH,iM]=todayData.iftar.split(":").map(Number)

    let suhurTime=new Date(displayDate.getFullYear(),displayDate.getMonth(),displayDate.getDate(),sH,sM)
    let iftarTime=new Date(displayDate.getFullYear(),displayDate.getMonth(),displayDate.getDate(),iH,iM)

    if(now<suhurTime){
      let diff=Math.floor((suhurTime-now)/60000)
      suhurCountdown=`${Math.floor(diff/60)}ч ${diff%60}м`
    }
    else if(now>=suhurTime && now<iftarTime){
      suhurState="done"
      let diff=Math.floor((iftarTime-now)/60000)
      iftarCountdown=`${Math.floor(diff/60)}ч ${diff%60}м`
    }
    else{
      let tomorrow=new Date(suhurTime)
      tomorrow.setDate(tomorrow.getDate()+1)
      let diff=Math.floor((tomorrow-now)/60000)
      suhurCountdown=`${Math.floor(diff/60)}ч ${diff%60}м`
    }
  }

  return {
    times,
    displayDate,
    todayKey,
    todayData,
    todayOnly,
    suhurCountdown,
    iftarCountdown,
    suhurState
  }
}

// ---------- UI ----------

function addCard(parent,title,text){

  let card=parent.addStack()
  card.layoutVertically()
  card.backgroundColor=new Color("#1B3A24",0.45)
  card.cornerRadius=10
  card.setPadding(8,10,8,10)

  let top=card.addStack()
  top.layoutHorizontally()

  let t1=top.addText(title.toUpperCase())
  t1.font=Font.semiboldSystemFont(12)
  t1.textColor=new Color("#C6A94A")

  top.addSpacer()

  let parts=text.split("•")
  let time=parts[0].trim()

  let t2=top.addText(time)
  t2.font=Font.semiboldSystemFont(24)
  t2.textColor=new Color("#F5F5F7")

  if(parts.length>1){
    let bottom=card.addStack()
    bottom.layoutHorizontally()
    bottom.addSpacer()
    let small=bottom.addText(parts[1].trim())
    small.font=Font.semiboldMonospacedSystemFont(10)
    small.textColor=new Color("#D8E3DC",0.7)
  }
}

// ---------- CALENDAR ----------

function addCalendar(widget,state){

  let startDate = getStartDate(state.times)

  let keys = Object.keys(state.times)
  keys.sort()

  let totalDays = keys.length

  let perRow = 7

  let title = widget.addText("РАМАДАН")
  title.font = Font.semiboldSystemFont(16)
  title.textColor = new Color("#C6A94A")

  widget.addSpacer(10)

  let counter = 0

  while(counter < totalDays){

    let row = widget.addStack()
    row.layoutHorizontally()

    for(let i=0;i<perRow;i++){

      if(counter >= totalDays) break

      let dayDate = new Date(startDate)
      dayDate.setDate(
        startDate.getDate() + counter
      )

      let key = getKey(dayDate)

      let cell = row.addStack()

      cell.size = new Size(30,30)
      cell.centerAlignContent()

      let t = cell.addText(
        String(counter+1)
      )

      t.font =
      Font.semiboldSystemFont(16)

      t.textColor =
      new Color("#f2f2f7")

      // прошедшие

      if(
        dayDate < state.todayOnly &&
        key !== state.todayKey
      ){
        cell.backgroundColor =
        new Color("#1B3A24")

        cell.cornerRadius = 15

        t.textColor =
        new Color("#f2f2f7",0.5)
      }

      // сегодня

      if(
        key === state.todayKey
      ){
        cell.cornerRadius = 15

        cell.borderWidth = 5

        cell.borderColor =
        new Color("#C6A94A",0.6)

        t.textColor = Color.white()
      }

      counter++

      if(i < perRow-1)
        row.addSpacer()
    }

    widget.addSpacer(12)
  }
}
// ---------- BUILD ----------

function buildWidget(state){

  let w=new ListWidget()

  let g=new LinearGradient()
  g.colors=[new Color("#16261C"),new Color("#0F1C14")]
  g.locations=[0,1]

  w.backgroundGradient=g
  w.setPadding(14,16,4,16)

  let top=w.addStack()
  top.layoutHorizontally()
  top.spacing=12

  let left=top.addStack()
  left.layoutVertically()

  let df=new DateFormatter()

  df.dateFormat="EEEE"
  let weekday=left.addText(df.string(state.displayDate).toUpperCase())
  weekday.font=Font.semiboldSystemFont(18)
  weekday.textColor=new Color("#C6A94A")

  df.dateFormat="d"
  let day=left.addText(df.string(state.displayDate))
  day.font=Font.systemFont(70)
  day.textColor=new Color("#F5F5F7")

  let right=top.addStack()
  right.layoutVertically()
  right.spacing=6

  if(state.todayData){

    let s=state.todayData.suhur

    if(state.suhurState==="done")
      s+=" • СУХУР НАСТУПИЛ"
    else if(state.suhurCountdown)
      s+=" • через "+state.suhurCountdown

    addCard(right,"Сухур",s)

    let i=state.todayData.iftar

    if(state.iftarCountdown)
      i+=" • через "+state.iftarCountdown

    addCard(right,"Ифтар",i)
  }

  w.addSpacer()

  addCalendar(w,state)

  return w
}

// ---------- MAIN ----------

let state=getState(ramadanTimes)

let widget=buildWidget(state)

if(!config.runsInWidget){
  await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

}
