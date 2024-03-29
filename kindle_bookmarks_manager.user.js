// ==UserScript==
// @namespace   https://github.com/tvhong/greasemonkey
// @name        Kindle Bookmarks Manager
// @description Manage Kindle Bookmarks (e.g. Extract bookmarks to Anki deck, delete all bookmarks)
// @version     0.2
// @match       https://read.amazon.com/notebook
// @grant       GM_addStyle
// @grant       GM.xmlHttpRequest
// ==/UserScript==

class UserInterface {
  CSS_STYLE = `
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
    #kbm-btns {
      display: flex;
      justify-content: center;
    }
    .kbm-btn {
      cursor: pointer;
      padding: 5px;
      margin: 7px;
    }
  `;

  #exporter;
  #deleter;

  constructor(exporter, deleter) {
    this.#exporter = exporter;
    this.#deleter = deleter;
  }

  addStyle() {
    const head = document.getElementsByTagName('head')[0];
    if (head) {
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.textContent = this.CSS_STYLE;
      head.appendChild(style);
    }
  }

  addUi() {
    document.getElementById('annotations')
        .appendChild(this.#getContainer());
  }

  #getContainer() {
    let container = document.createElement('div');
    container.id = 'kbm-container';
    container.appendChild(this.#getButtons());
    container.appendChild(this.#getStdoutArea());

    return container;
  }

  #getButtons() {
    const container = document.createElement('div');
    container.id = 'kbm-btns';
    container.appendChild(this.#getExportButton())
    container.appendChild(this.#getDeleteButton())

    return container;
  }

  #getDeleteButton() {
    let node = document.createElement('button');
    node.id = 'kbm-btn-delete';
    node.setAttribute('type', 'button');
    node.innerHTML = 'Delete';
    node.addEventListener('click', this.#deleter.handleDeleteHighlights.bind(this.#deleter), false);
    node.classList.add('kbm-btn');

    return node;
  }

  #getExportButton() {
    let node = document.createElement('button');
    node.id = 'kbm-btn-export';
    node.setAttribute('type', 'button');
    node.innerHTML = 'Export';
    node.addEventListener('click', this.#exporter.handleEvent.bind(this.#exporter), false);
    node.classList.add('kbm-btn');

    return node;
  }

  #getStdoutArea() {
    const textArea = document.createElement('p');
    textArea.id = 'kbm-stdout';

    const container = document.createElement('div');
    container.appendChild(textArea);

    return container;
  }
}

class DataProvider {
  #antiCsrfToken;

  getCurrentBookTitle() {
    return document.querySelector('h3.kp-notebook-metadata').innerText;
    //assert(title, "Failed to get the book's title.");

    //return title;
  }

  getHighlights() {
    const nodes = document.querySelectorAll(`[id^="highlight-"]`);
    const ids = Array.from(nodes).map(n => n.id.replace('highlight-', ''));
    return ids;
  }

  getNotes() {
    const nodes = document.querySelectorAll(`[id^="note-QTF"]`);
    const ids = Array.from(nodes).map(n => n.id.replace('note-', ''));
    return ids;
  }

  getNoteHighlightPairs() {
    const pairs = [];

    const pairNodes = document.querySelectorAll('div.kp-notebook-print-override');
    for (const pairNode of pairNodes) {
      const noteNode = pairNode.querySelector('#note');
      const highlightNode = pairNode.querySelector('#highlight');
      pairs.push([noteNode ? noteNode.innerText : '',
                  highlightNode ? highlightNode.innerText : '']);
    }

    return pairs;
  }

  getAntiCsrfToken() {
    if (!this.#antiCsrfToken) {
      this.#antiCsrfToken = document.querySelector('input[name=anti-csrftoken-a2z]').getAttribute('value');
    }

    return this.#antiCsrfToken
  }
}

class Exporter {
  #PLACE_HOLDER_LENGTH = 40;
  #SEPARATOR = '\t';

  #downloadNode;
  #dataProvider;

  constructor(dataProvider) {
    this.#dataProvider = dataProvider;

    // Copied from https://stackoverflow.com/a/64500313
    this.#downloadNode = document.createElement('a');
    document.body.appendChild(this.#downloadNode);
    this.#downloadNode.style = 'display: none';
  }

  handleEvent(event) {
    const cardPriority = this.#promptForPriority();

    const noteHighlightPairs = this.#dataProvider.getNoteHighlightPairs();
    const ankiText = this.#formatForAnki(noteHighlightPairs, cardPriority)
    console.log(ankiText);

    this.#downloadFile("kbm_output.txt", ankiText);

    print("You can now import the file in Anki with");
    print("File > Import");
    print("Enjoy!");
  }

  #promptForPriority() {
    return prompt("What are the cards' priority?", "5")
  }

  #downloadFile(filename, text) {
    // Copied from https://stackoverflow.com/a/64500313
    const objUrl = URL.createObjectURL(new Blob([text], {type: "text/plain"}));
    this.#downloadNode.href = objUrl;
    this.#downloadNode.download = filename;
    this.#downloadNode.click();
    URL.revokeObjectURL(objUrl);
  }

  #formatForAnki(noteHighlightPairs, cardPriority) {
    const bookTitle = this.#dataProvider.getCurrentBookTitle();
    const cards = noteHighlightPairs.map(p => {
      return {
        'title': bookTitle + ' / ' + this.#sanitizeString(p[0], this.#getStringHash(p[1])),
        'text': this.#sanitizeString(p[1]),
        'source': this.#sanitizeString(bookTitle),
        'priority': cardPriority
      };
    })

    return cards.map(c => this.#formatCard(c)).join('\n');
  }

  #formatCard(card) {
    return [card.title, card.text, card.source, card.priority].join('\t');
  }

  #sanitizeString(s, placeholder = '') {
    return s ? s.replace(this.#SEPARATOR, '-') : placeholder;
  }

  #getStringHash(str) {
    // https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=4261728#gistcomment-4261728
    let h = [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
    return h.toString();
  }
}

class Deleter {
  dataProvider;

  constructor(dataProvider) {
    this.dataProvider = dataProvider;
  }

  handleDeleteHighlights(event) {
    var result = confirm(`Do you want to remove ${this.dataProvider.getHighlights().length} highlights and ${this.dataProvider.getNotes().length} notes from\n"${this.dataProvider.getCurrentBookTitle()}"?`);
    if (result == true) {
      this.#deleteAll();
    }
  }

  async #deleteAll() {
    print("Sending highlights deletion requests...");
    const highlight_deletion_promises = this.#deleteHighlights();

    print("Sending notes deletion requests...");
    const note_deletion_promises = this.#deleteNotes();

    await Promise.allSettled(highlight_deletion_promises)
      .then(results => {
        print("Highlights deletion report:");
        this.#reportHttpPromiseResults(results);
      });

    await Promise.allSettled(note_deletion_promises)
      .then(results => {
        print("Notes deletion report:");
        this.#reportHttpPromiseResults(results);
      });
  }

  #deleteHighlights() {
    const highlightIds = this.dataProvider.getHighlights();
    const promises = highlightIds.map(id => this.#deleteHighlight(id));
    return promises;
  }

  #deleteNotes() {
    const noteIds = this.dataProvider.getNotes();
    const promises = noteIds.map(id => this.#deleteNote(id));
    return promises;
  }

  #deleteNote(noteId) {
    const itemUrl = 'https://read.amazon.com/notebook/note?noteId=' + noteId;
    return this.#deleteItem(itemUrl);
  }

  #deleteHighlight(highlightId) {
    const itemUrl = 'https://read.amazon.com/notebook/highlight?highlightId=' + highlightId;
    return this.#deleteItem(itemUrl);
  }

  #deleteItem(itemUrl) {
    const delayMs = Math.random() * 1000; // Sleep up to 1 s
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        GM.xmlHttpRequest({
          method: 'DELETE',
          url: itemUrl,
          headers: {
            'Origin': "https://read.amazon.com",
            'Referrer': "https://read.amazon.com/notebook",
            'anti-csrftoken-a2z': this.dataProvider.getAntiCsrfToken(),
          },
          onload: function (response) {
            resolve([itemUrl, response.status]);
          },
          onerror: function (error) {
            reject([itemUrl, error]);
          }
        });
      });
    }, delayMs);
  }

  #reportHttpPromiseResults(results) {
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
}

function print(message) {
  const node = document.getElementById('kbm-stdout');
  node.innerHTML += '<br />' + message;
}

function groupBy(xs, key) {
  // Copied from StackOverflow: https://stackoverflow.com/a/34890276
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

window.addEventListener('load', function() {
  const dataProvider = new DataProvider();
  const exporter = new Exporter(dataProvider);
  const deleter = new Deleter(dataProvider);

  const ui = new UserInterface(exporter, deleter);
  ui.addStyle();
  ui.addUi();
}, false);

