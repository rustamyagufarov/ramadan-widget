let url =
"https://raw.githubusercontent.com/rustamyagufarov/ramadan-widget/main/widget.js"

const fm = FileManager.local()

const path = fm.joinPath(
  fm.documentsDirectory(),
  "ramadan_remote.js"
)

async function download() {

  try {

    const req = new Request(url)
    req.timeoutInterval = 4

    const code = await req.loadString()

    fm.writeString(path, code)

    return true

  } catch(e) {

    return false

  }

}


let hasCache = fm.fileExists(path)

let updated = await download()


if (!hasCache && !updated) {

  let w = new ListWidget()
  w.addText("Нет интернета")
  Script.setWidget(w)
  Script.complete()
  return

}


let module = importModule("ramadan_remote")

await module.main()
