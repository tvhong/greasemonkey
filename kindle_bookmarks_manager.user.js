// ==UserScript==
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.1
// @match       *://read.amazon.com/notebook
// @grant       GM_addStyle
// ==/UserScript==

// TODOs:
// v Query all Options button
// v Create a button to trigger event when clicked
// v Add confirmation before clicking
// x Remove highlights
// x Remove notes
// x Allow enter to submit
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
  node.setAttribute('placeholder', CMD_CLEAN_ALL);

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

function handleSubmit(event) {
  const cmd = document.getElementById('kbm-command').value;
  if (cmd === CMD_CLEAN_ALL) {
    showMessage(CMD_CLEAN_ALL + ": Cleaning all highlights and notes");
  } else {
    showMessage("Unknown command");
  }
}

function showMessage(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
}


function getOptionElements() {
  const nodes = document.querySelectorAll(`[id^="popover-"]`);
  const elements = Array.from(nodes).filter(e => e.textContent === "Options" && e.tagName === "A");

  console.log(elements); // 👉️ [div#box1]
  console.log("POOP");
}

function getStdoutNode() {
  const node = document.createElement('p');
  node.id = 'kbm-stdout';
  node.innerHTML = "Latest message will be displayed here";
  return node;
}

console.log("POOP1")
addStyle();
addContainer();
console.log("POOP2")
