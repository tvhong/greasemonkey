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
// x Remove 1 highlight
// x Remove 1 note
// x Remove all highlights & notes
// v Allow enter to submit
// x Re-style
// x Add ability to extract notes so that we can import to Anki

const CMD_CLEAN_ALL = 'clean-all';

function addStyle() {
  const CSS_STYLE = `
    #kbm-container {
      position:               absolute;
      top:                    0;
      left:                   0;
      font-size:              20px;
      background:             orange;
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
      color:                  red;
      background:             white;
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
  //node.setAttribute('placeholder', CMD_CLEAN_ALL);
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
  return node;
}

function handleSubmit(event) {
  const cmd = document.getElementById('kbm-command').value;
  if (cmd === CMD_CLEAN_ALL) {
    print(CMD_CLEAN_ALL + ": Cleaning all highlights and notes");
    deleteAll();
  } else {
    print("Unknown command");
  }
}

function deleteAll() {
  deleteHighlights();
  deleteNotes();
}

function deleteHighlights() {
}

function deleteNotes() {
  const noteIds = getNotes();
  deleteNote(noteIds[1]);
}

function print(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
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

// TODO: function getIds(prefix)

function deleteNote(noteId) {
  console.log("POOP");
  const deleteNoteUrl = 'https://read.amazon.com/notebook/note?noteId=' + noteId + '&';
  GM.xmlHttpRequest({
    method: 'DELETE',
    url: deleteNoteUrl,
    headers: {
      origin: "https://read.amazon.com",
      referrer : "https://read.amazon.com/notebook",
      Accept: "*/*",
//       Accept-Encoding: "gzip, deflate, br",
//      anti-csrftoken-a2z: "hKlboQlMkBFwjCtK9nZIxpJ4jbwhXuEJQfVr3LYi73HGAAAAAGOzgOsAAAAB"
    },
    onload: function(response) {
    console.log(response);
      console.log("Deleted note " + noteId);
    },
    onerror: function(response) {
      console.log("Error: " + response);
    }
  });
  console.log("POOP2");
}

addStyle();
addContainer();
