// ==UserScript==
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.1
// @match       *://read.amazon.com/notebook
// @grant       GM_addStyle
// ==/UserScript==

// TODOs:
// v Query all Options button
// x Create a button to trigger event when clicked
// x Add highlight removal
// x Add note removal
// x Add ability to extract notes so that we can import to Anki

function addStyle() {
  const CSS_STYLE = `
    #myContainer {
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
    #myButton {
        cursor:                 pointer;
    }
    #myContainer p {
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


function addButton() {  
  var zNode       = document.createElement('div');
  zNode.innerHTML = '<button id="myButton" type="button">'
                  + 'For Pete\'s sake, don\'t click me!</button>'
                  ;
  zNode.setAttribute('id', 'myContainer');
  document.body.appendChild(zNode);

  //--- Activate the newly added button.
  document.getElementById("myButton").addEventListener (
      "click", ButtonClickAction, false
  );
}

function ButtonClickAction(zEvent) {
  /*--- For our dummy action, we'll just add a line of text to the top
          of the screen.
      */
  var zNode = document.createElement('p');
  zNode.innerHTML = 'The button was clicked.';
  document.getElementById("myContainer").appendChild(zNode);
}


function getOptionElements() {
  const nodes = document.querySelectorAll(`[id^="popover-"]`);
  const elements = Array.from(nodes).filter(e => e.textContent === "Options" && e.tagName === "A");

  console.log(elements); // 👉️ [div#box1]
}

addStyle()
addButton()
