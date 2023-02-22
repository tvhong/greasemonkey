// ==UserScript==
// @namespace   https://github.com/tvhong/greasemonkey
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.2
// @match       https://read.amazon.com/notebook
// @grant       GM_addStyle
// @grant       GM.xmlHttpRequest
// ==/UserScript==

const CSRF_TOKEN = 'foo';

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

function deleteAll() {
  print("Sending highlight deletion requests...");
  const highlight_deletion_promises = deleteHighlights();

  print("Sending note deletion requests...");
  const note_deletion_promises = deleteNotes();

  Promise.allSettled(highlight_deletion_promises)
    .then(results => {
      const success_results = results.filter(r => r.status === 'fulfilled');
      const success_200_results = success_results.filter(r => r.value[1] === 200);
      const success_other_results = success_results.filter(r => r.value[1] !== 200);
      const success_other_results_str = success_other_results.map(r => `${r.value[0]}[${r.value[1]}]`)
      const failure_results = results.filter(r => r.status === 'rejected');
      const failure_results_str = failure_results.map(r => `${r.value[0]}[error: ${r.value[1]}]`);
      print("Highlight deletion report:");
      print(`* Success: ${success_results.length}`)
      print(`* Success with 200 status: ${success_200_results.length}`)
      print(`* Success with other status: ${success_other_results.length}`)
      success_other_results_str.forEach(s => print(`** ${s}`))

      print(`* Failure: ${failure_results.length}`)
      failure_results_str.forEach(s => print(`** ${s}`))
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
        'anti-csrftoken-a2z': CSRF_TOKEN,
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

function print(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
}

addStyle();
addContainer();
