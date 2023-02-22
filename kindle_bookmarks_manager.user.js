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
  var result = confirm(`Do you want to remove X highlights and Y notes from\n"${getCurrentBookTitle()}"?`);
  if (result == true) {
    deleteAll();
  }
}

function getCurrentBookTitle() {
  return document.querySelector('h3.kp-notebook-metadata').innerText;
}

function deleteAll() {
  print("Deleting highlights...");
  deleteHighlights();
  print("Done!");

  print("Deleting notes...");
  deleteNotes();
  print("Done!");
}

function deleteHighlights() {
  const highlightIds = getHighlights();
  highlightIds.forEach(hlid => deleteHighlight(hlid));
}

function deleteNotes() {
  const noteIds = getNotes();
  noteIds.forEach(nid => deleteNote(nid));
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
  deleteItem(itemUrl);
}

function deleteHighlight(highlightId) {
  const itemUrl = 'https://read.amazon.com/notebook/highlight?highlightId=' + highlightId;
  deleteItem(itemUrl);
}

function deleteItem(itemUrl) {
  GM.xmlHttpRequest({
    method: 'DELETE',
    url: itemUrl,
    headers: {
      'Origin': "https://read.amazon.com",
      'Referrer': "https://read.amazon.com/notebook",
      'anti-csrftoken-a2z': CSRF_TOKEN,
    },
    onload: function(response) {
      console.log(response);
      console.log("Delete [" + response.status + "] [" + itemUrl + "]");
    }
  });
}

function print(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
}

addStyle();
addContainer();
