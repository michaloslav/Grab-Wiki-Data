// init global vars
results = []
settingsOpen = false
useCustomLang = false

function getData(){

  // get the all the input data
  let separator = $("#separator").val()
  let terms = $('#term').val().split(separator)
  let lang = useCustomLang ? customLang : $('#lang').val()
  let html = $("#html").is(":checked")
  let length = $("#length").val()

  // if the user selected "Other" as lang but then didn't properly select a customLang..
  if(lang == "custom" || lang.length < 2){
    // show an error and exit the function execution
    $("#langDiv label, #langDiv input, label[for=customLang]").addClass("langError")
    return
  }
  // else remove the error class
  else $("#langDiv label, #langDiv input, label[for=customLang]").removeClass("langError")

  // init the array of new results
  newResults = []

  // make an ajax to the API for every term
  terms.forEach((el, i) => {
    $.ajax({
      url: `https://${lang}.wikipedia.org/w/api.php`,
      data: {
        action: 'query',
        titles: el,
        prop: 'extracts',
        exlimit: 1,
        exchars: length,
        explaintext: html ? undefined : 1,
        format: 'json',
        origin: '*'
      }
    }).done(res => {
      //console.log(res.query.pages);

      // log warnings/errors
      if(res.warnings) console.log(res.warnings);
      if(res.query.pages[-1]) console.log(res.query.pages[-1]);

      // get the relevant part of the response
      let resPages = res.query.pages
      let index = Object.keys(res.query.pages)[0]
      let text = resPages[index].extract
      let title = resPages[index].title

      // push the result into the newResults array
      newResults.push({title, text})

      // save it to the global variable
      results.push({title, text})

      // if it's the last one
      if(i == terms.length - 1){
        // short timeout to make sure all the results are received (the order could be differnt from the call order)
        setTimeout(() => {

          // sort the results by the title
          newResults.sort((a, b) => {
            let sortedTitles = [a.title, b.title].sort()
            return sortedTitles[0] == a.title ? -1: 1
          })

          // show the results
          newResults.forEach((result) => {

            //console.log(result);

            // in case the API didn't find the extract..
            let notFound = !result.text || result.text == "…"

            // append to the ul (make it red if notFound)
            $("#results").append(`
              <li${notFound ? ' style="color:red;"' : ''}><b>${result.title}:</b> ${notFound ? 'Not Found' : result.text}</li>
              `)
          })
        }, 100)
      }

      //$("#newResults").append(`<li><b>${el}:</b> ${text}</li>`)
    })
  })
}

function deleteResults(){
  $("#results li").remove()
}

function downloadResults(){

  // init the array
  let resultsArray = []

  // push the results into the temporary array (with a line break at the end of every item) and sort them
  results.forEach(el => {
    resultsArray.push(`${el.title}: ${el.text}\r\n`)
  })
  resultsArray.sort()

  //console.log(resultsArray);

  // create the file
  let file = new Blob(resultsArray, {type: 'text/txt'})

  // trigger the download
  $("body").append(`<a id="downloadLink" href="${URL.createObjectURL(file)}" download="Wikipedia Results.txt"></a>`)
  $("#downloadLink")[0].click()
}

// open/close settings - animation
function toggleSettings(){
  $("#settings").slideToggle(200, "linear")

  $("#settingsIcon").animate(
    {deg: settingsOpen ? 0 : 120},
    {
      duration: 200,
      step: now => {
        $("#settingsIcon").css({transform: `rotate(${now}deg)`})
      }
    }
  )

  // update the global var that stores the settings state
  settingsOpen = !settingsOpen
}

function changedCustomLang(){
  customLang = $("#customLang").val()

  if(customLang.length == 0) useCustomLang = false
  else{
    useCustomLang = true
    // if the #lang select elemtent isn't already set to "Other"
    if($("#lang").val() != "custom"){
      // set the #lang select el to "Other"
      $("#lang").val("custom")
      $("#lang").formSelect()
    }
  }
}

function langChange(){
  let val = $("#lang").val()

  // if the user selected "Other", open the relevent settings div
  if(val == "custom"){
    if(!settingsOpen) toggleSettings()
    $('.collapsible').collapsible('open');
  }
  else useCustomLang = false
}

// init
$(() => {
  M.AutoInit(); // materialize

  // submit on enter
  $('#term').keyup((e) => {
    if(e.which == 13) getData()
  })
});
