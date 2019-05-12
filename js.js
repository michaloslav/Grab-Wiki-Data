// init global vars
results = []
settingsOpen = false
useCustomLang = false

// wrappers
const getValById = id => document.getElementById(id).value
const setValById = (id, value) => document.getElementById(id).value = value
function addOrRemoveClass(query, classToAddOrRemove, addOrRemove){
  let nodes = [...document.querySelectorAll(query)]
  nodes.forEach(el => {
    if(addOrRemove) el.classList.add(classToAddOrRemove)
    else el.classList.remove(classToAddOrRemove)
  })
}

function getUrl(lang, terms, length, html){
  let params = {
    action: 'query',
    prop: 'extracts',
    titles: terms,
    exlimit: terms.length,
    exchars: length,
    explaintext: html ? undefined : 1,
    format: 'json',
    origin: '*',
    redirects: true,
    exintro: true
  }

  let paramsString = ""
  for(let param in params){
    paramsString += `${param}=`

    if(param === "titles"){
      for(let title of params[param]){
        paramsString += `${title}|`
      }

      paramsString = paramsString.slice(0, -1) // remove the last "|"
    }
    else paramsString += params[param]

    paramsString += "&"
  }
  paramsString = paramsString.slice(0, -1) // remove the last "&"

  let url = `https://${lang}.wikipedia.org/w/api.php?${paramsString}`
  return url
}


async function getData(){

  // get the all the input data
  let separator = getValById("separator")
  let terms = getValById("term").split(separator)
  let lang = useCustomLang ? customLang : getValById("lang")
  let html = document.getElementById("html").checked
  let length = getValById("length")

  // if the user selected "Other" as lang but then didn't properly select a customLang..
  if(lang == "custom" || lang.length < 2){
    // show an error and exit the function execution
    addOrRemoveClass("#langDiv label, #langDiv input, label[for=customLang]", "langError", true)
    return
  }
  // else remove the error class
  else addOrRemoveClass("#langDiv label, #langDiv input, label[for=customLang]", "langError", false)

  // make an ajax to the API
  let res = await fetch(getUrl(lang, terms, length, html))
  res = await res.json()

  // log warnings/errors
  if(res.warnings) console.log(res.warnings);
  if(res.query.pages[-1]) console.log(res.query.pages[-1]);

  // loop over the pages in the response, add them to an array (makes the processing easaier)
  let resPages = res.query.pages
  let newResults = []
  for(let page in resPages){
    let {title, extract} = resPages[page]
    newResults.push({title, extract})

    // save it to the global variable
    results.push({title, extract})
  }

  // sort the results by their titles
  newResults.sort((a, b) => {
    let sortedTitles = [a.title, b.title].sort()
    return sortedTitles[0] == a.title ? -1: 1
  })

  // show the results
  let ul = document.getElementById("results")
  newResults.forEach(result => {
    // in case the API didn't find the article
    let notFound = !result.extract || result.extract === "…"

    // append to the ul, make it red if notFound
    let li = document.createElement("li")
    if(notFound) li.style = "color: red;"
    let titleNode = document.createElement("b")
    let titleTextNode = document.createTextNode(result.title + ":")
    titleNode.appendChild(titleTextNode)
    let extractNode = document.createTextNode(" " + (notFound ? 'Not Found' : result.extract))
    li.appendChild(titleNode)
    li.appendChild(extractNode)
    ul.appendChild(li)
  })
}

function deleteResults(){
  var resultsUl = document.getElementById("results")
  while(resultsUl.firstChild) resultsUl.removeChild(resultsUl.firstChild)
}

function downloadResults(){

  // init the array
  let resultsArray = []

  // push the results into the temporary array (with a line break at the end of every item) and sort them
  results.forEach(el => {
    resultsArray.push(`${el.title}: ${el.extract}\r\n`)
  })
  resultsArray.sort()

  //console.log(resultsArray);

  // create the file
  let file = new Blob(resultsArray, {type: 'text/txt'})

  // trigger the download
  let a = document.createElement("a")
  a.id = "downloadLink"
  a.href = URL.createObjectURL(file)
  a.download = "Wikipedia Results.txt"
  a.click()
}

// open/close settings - animation
function toggleSettings(){
  let settings = document.getElementById("settings")
  let settingsIcon = document.getElementById("settingsIcon")
  if(settings.classList.contains("open")){
    // close settings
    settings.classList.remove("open")

    // settings icon animation
    settingsIcon.classList.remove("open")
    settingsIcon.classList.add("closed")
  }
  else{
    // open settings
    settings.classList.add("open")

    // settings icon animation
    settingsIcon.classList.add("open")
    settingsIcon.classList.remove("closed")
  }

  // update the global var that stores the settings state
  settingsOpen = !settingsOpen
}

function changedCustomLang(){
  customLang = getValById("customLang")

  if(customLang.length == 0) useCustomLang = false
  else{
    useCustomLang = true
    // if the #lang select elemtent isn't already set to "Other"
    let langEl = document.getElementById("lang")
    if(langEl.value != "custom"){
      // set the #lang select el to "Other"
      langEl.value = "custom"
      M.FormSelect.init(langEl)
    }
  }
}

function langChange(){
  let val = getValById("lang")

  // if the user selected "Other", open the relevent settings div
  if(val == "custom"){
    if(!settingsOpen) toggleSettings()

    let collapsible = document.getElementsByClassName("collapsible")[0]
    M.Collapsible.getInstance(collapsible).open(0)
  }
  else useCustomLang = false
}

// init
document.addEventListener('DOMContentLoaded', () => {
  M.AutoInit(); // materialize

  // submit on enter
  let term = document.getElementById("term")
  term.addEventListener("keyup", e => {
    if(e.key == "Enter") getData()
  })

  // when the user open/closes the material collapsible, adjust settings length
  let collapsibleHeader = document.querySelector("#customLangCollapsible .collapsible-header")
  let settings = document.getElementById("settings")
  collapsibleHeader.addEventListener("click", e => {
    if(settings.classList.contains("collapsibleOpen")){
      settings.classList.remove("collapsibleOpen")
    }
    else settings.classList.add("collapsibleOpen")
  })
})
