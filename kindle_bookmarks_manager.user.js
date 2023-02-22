// ==UserScript==
// @namespace   https://github.com/tvhong/greasemonkey
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.2
// @match       https://read.amazon.com/notebook
// @grant       GM_addStyle
// @grant       GM.xmlHttpRequest
// ==/UserScript==

let antiCsrfToken = '';

function addStyle() {
  const CSS_STYLE = `
    #kbm-container {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 20px;
      background: black;
      border: 3px outset black;
      margin: 5px;
      opacity: 0.9;
      z-index: 1100;
      padding: 5px 20px;
    }
    #kbm-container p {
      color: white;
      background: black;
    }
    .kbm-btn {
      cursor: pointer;
    }
`;

  const head = document.getElementsByTagName('head')[0];
  if (head) {
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = CSS_STYLE;
    head.appendChild(style);
  }
}


function addContainer() {
  let container = document.createElement('div');
  container.id = 'kbm-container';
  container.appendChild(getDeleteHighlightsButton())
  container.appendChild(getStdoutArea());

  document.getElementById('annotations').appendChild(container);
}

function getDeleteHighlightsButton() {
  let node = document.createElement('button');
  node.id = 'kbm-delete-highlights';
  node.setAttribute('type', 'button');
  node.innerHTML = 'Delete Highlights';
  node.addEventListener('click', handleDeleteHighlights, false);
  node.classList.add('kbm-btn');

  return node;
}

function getStdoutArea() {
  const node = document.createElement('p');
  node.id = 'kbm-stdout';
  return node;
}

function handleDeleteHighlights(event) {
  var result = confirm(`Do you want to remove ${getHighlights().length} highlights and ${getNotes().length} notes from\n"${getCurrentBookTitle()}"?`);
  if (result == true) {
    deleteAll();
  }
}

function getCurrentBookTitle() {
  return document.querySelector('h3.kp-notebook-metadata').innerText;
}

async function deleteAll() {
  print("Sending highlights deletion requests...");
  const highlight_deletion_promises = deleteHighlights();

  print("Sending notes deletion requests...");
  const note_deletion_promises = deleteNotes();

  await Promise.allSettled(highlight_deletion_promises)
    .then(results => {
      print("Highlights deletion report:");
      reportHttpPromiseResults(results);
    });

  await Promise.allSettled(note_deletion_promises)
    .then(results => {
      print("Notes deletion report:");
      reportHttpPromiseResults(results);
    });
}

function deleteHighlights() {
  const highlightIds = getHighlights();
  const promises = highlightIds.map(id => deleteHighlight(id));
  return promises;
}

function deleteNotes() {
  const noteIds = getNotes();
  const promises = noteIds.map(id => deleteNote(id));
  return promises;
}

function getHighlights() {
  const nodes = document.querySelectorAll(`[id^="highlight-"]`);
  const ids = Array.from(nodes).map(n => n.id.replace('highlight-', ''));
  return ids;
}

function getNotes() {
  const nodes = document.querySelectorAll(`[id^="note-QTF"]`);
  const ids = Array.from(nodes).map(n => n.id.replace('note-', ''));
  return ids;
}

function deleteNote(noteId) {
  const itemUrl = 'https://read.amazon.com/notebook/note?noteId=' + noteId;
  return deleteItem(itemUrl);
}

function deleteHighlight(highlightId) {
  const itemUrl = 'https://read.amazon.com/notebook/highlight?highlightId=' + highlightId;
  return deleteItem(itemUrl);
}

function deleteItem(itemUrl) {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'DELETE',
      url: itemUrl,
      headers: {
        'Origin': "https://read.amazon.com",
        'Referrer': "https://read.amazon.com/notebook",
        'anti-csrftoken-a2z': getAntiCsrfToken(),
      },
      onload: function(response) {
        resolve([itemUrl, response.status]);
      },
      onerror: function(error) {
        reject([itemUrl, error]);
      }
    });
  });
}

function getAntiCsrfToken() {
  if (!antiCsrfToken) {
    antiCsrfToken = document.querySelector('input[name=anti-csrftoken-a2z]').getAttribute('value');
  }

  return antiCsrfToken
}

function reportHttpPromiseResults(results) {
  const successValues = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  const resultsByStatusCode = groupBy(successValues, 1);
  for (let status_code in resultsByStatusCode) {
    print(`* Status [${status_code}]: ${resultsByStatusCode[status_code].length}`);
  }

  const failureResults = results.filter(r => r.status === 'rejected');
  print(`* HTTP failures: ${failureResults.length}`)
  failureResults.forEach(s => print(`** ${r.value[0]}[error: ${r.value[1]}]`))

  console.log("Reporting HTTP promise results:");
  console.log(results);
}

function print(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
}

function groupBy(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

addStyle();
addContainer();
