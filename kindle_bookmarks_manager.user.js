// ==UserScript==
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.1
// @match       *://read.amazon.com/notebook
// @grant       GM_addStyle
// @grant       GM.xmlHttpRequest
// ==/UserScript==

// TODOs:
// v Query all Options button
// v Create a button to trigger event when clicked
// v Add confirmation before clicking
// v Remove 1 highlight
// v Remove 1 note
// v Remove all highlights & notes
// v Allow enter to submit
// x Automatically get the csrf token
// x Add ability to extract notes so that we can import to Anki
// v Re-style

const CMD_DELETE_ALL = 'delete-all';
const CSRF_TOKEN = 'foo';

function addStyle() {
  const CSS_STYLE = `
    #kbm-container {
      position:               absolute;
      top:                    0;
      left:                   0;
      font-size:              20px;
      background:             black;
      border:                 3px outset black;
      margin:                 5px;
      opacity:                0.9;
      z-index:                1100;
      padding:                5px 20px;
    }
    #kbm-submit {
      cursor:                 pointer;
    }
    #kbm-container p {
      color:                  white;
      background:             black;
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
  document.body.appendChild(container);

  container.appendChild(getCommandNode());
  container.appendChild(getSubmitNode());
  container.appendChild(getStdoutNode());
}

function getCommandNode() {
  let node  = document.createElement('input');
  node.id = 'kbm-command';
  node.setAttribute('type', 'text');
  node.onkeydown = function(e) {
    if(e.keyCode == 13){
       handleSubmit(e);
    }
  }

  return node;
}

function getSubmitNode() {
  let node = document.createElement('button');
  node.id = 'kbm-submit';
  node.setAttribute('type', 'button');
  node.innerHTML = 'Submit';
  node.addEventListener('click', handleSubmit, false);

  return node;
}

function getStdoutNode() {
  const node = document.createElement('p');
  node.id = 'kbm-stdout';
  node.innerHTML = "Available commands: " + CMD_DELETE_ALL;
  return node;
}

function handleSubmit(event) {
  const cmd = document.getElementById('kbm-command').value;
  if (cmd === CMD_DELETE_ALL) {
    deleteAll();
  } else {
    print("Unknown command");
  }
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
