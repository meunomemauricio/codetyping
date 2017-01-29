import Vue from 'vue';

// Visual representation for spaces and line ends;
let space = '\u02FD';
let lineEnd = '\u23CE\n';

// GitHub API URLs
let gistURL = 'https://api.github.com/gists/public';
let params = '?page=1&per_page=100';

// Max size of files to be used for typing
const maxFileSize = 512;

// Stopwatch to calculate WPM
let Stopwatch = require('./stopwatch.js');
let sw = new Stopwatch();

// WPM calculator
let wpmCalc = require('./wpmCalc.js');


/**
 * Extract files from each Gist and add to a list;
 *
 * Gists can contain multiple files. This function extracts them to a new
 * array;
 *
 * @param {Array} gists - Array of gists objects retrieved from the API;
 * @return {Array} List of all files on all Gists;
 */
function extractFilesFromGists(gists) {
  let files = [];
  // TODO: Maybe this can be made clearer;
  gists.forEach((el) => {
    for (let file in el.files) {
      if (Object.prototype.hasOwnProperty.call(el.files, file)) {
        files.push(el.files[file]);
      }
    }
  });
  return files;
}


/**
 * Filter function to exclude Text files from the gists.
 *
 * @param {Object} file - File extracted from the Gists.
 * @return {boolean} true if the file is NOT plain text.
 */
function excludeTextFiles(file) {
  return !/text\/plain/.test(file.type);
}


/**
 * Filter function to exclude files bigger than `maxFileSize`;
 *
 * @param {Object} file - File extracted from the Gists;
 * @return {boolean} true if the file is smaller than `maxFileSize`;
 */
function capFileSize(file) {
  return file.size <= maxFileSize;
}


/**
 * Replace spaces and endlines with visual indicators.
 *
 * It's important to give visual feeback for spaces and linebreaks, otherwise
 * it's really easy to get lost when typing them.
 *
 * @param {string} input - Input string to have the spaces substituted.
 * @return {string} String with spaces substituted to visual characters.
 */
function replaceSpaces(input) {
  let output = input.replace(/ /g, space)
          .replace(/\n/g, lineEnd);
  return output;
}


/**
 * Check if the string has multiple characters.
 *
 * @param {string} typedKey - String to be checked against.
 * @return {boolean} true if string has multiple characters.
 */
function isMultipleChars(typedKey) {
  return /^.$/.test(typedKey) ? false : true;
}


/**
 * Check if the used typed the correct key.
 *
 * @param {string} currentKey - The expected key to be typed.
 * @param {string} typedKey - The key typed by the user.
 * @return {string} verifiedItem.key - Typed key, ready to be displayed.
 * @return {boolean} verifiedItem.correct - If the typed key was correctly
 * typed or not;
 * @return {string} verifiedItem.classname - The proper class to display in
 * the HTML.
 */
function verifyTypedKey(currentKey, typedKey) {
  let correct = typedKey === currentKey;
  let displayKey;
  switch (currentKey) {
    case ' ':
      displayKey = space;
      break;
    case '\n':
      displayKey = lineEnd;
      break;
  default:
    displayKey = currentKey;
  }

  let verifiedItem = {
    key: displayKey,
    correct: correct,
    classname: correct ? 'correct' : 'typo',
  };
  return verifiedItem;
}


/**
 * Popup component, bounded inside a div.
 *
 * Useful for indicating something in the main window display, like when it's
 * out of focus.
 */
Vue.component('popup', {
  template: '#popup-template',
  props: ['message', 'subtext'],
});


/**
 * Vue.Js View Model
 */
new Vue({
  el: '#app',

  created: function() {
    this.retrieveFilesFromGist();
  },

  data: {
    codeFiles: [],
    typedText: [],
    totalTyped: 0,
    remainingText: null,
    currentChar: null,
    active: false,
    showModal: true,
  },

  computed: {
    /**
     * Returns the remaining text as a joined string.
     *
     * @return {String} the remaining text ready for being displayed.
     */
    remainingTextDisplay: function() {
      if (!this.remainingText) {
        return 'loading...';
      }
      let text = this.remainingText.slice(0).reverse().join('');
      return replaceSpaces(text);
    },

    /**
     * The current char to be typed ready for display.
     *
     * @return {String} the current character to be typed, ready for
     * display;
     */
    displayCurrentChar: function() {
      if (!this.currentChar) return;
      return replaceSpaces(this.currentChar);
    },

    /**
     * The computed typing score.
     *
     * @return {(string|number)} score.correct - Number of correctly typed
     * chars;
     * @return {(string|number)} score.typed - Total typed chars;
     * @return {(string|number)} score.left - Chars left to be typed;
     * @return {(string|number)} score.typos - Uncorrected characters;
     * @return {(string|number)} score.rawWPM - Calculated Raw Words per
     * Minute;
     * @return {(string|number)} score.netWPM - Calculated Net Words per
     * Minute;
     */
    score: function() {
      if (!this.remainingText) {
        return {
          correct: '--',
          typed: '--',
          left: '--',
          typos: '--',
          rawWPM: '--',
          netWPM: '--',
        };
      }

      let left = this.remainingText.length + 1;
      let correct = this.typedText.filter((el) => el.correct).length;
      let typos = this.typedText.length - correct;
      return {
        correct: correct,
        typed: this.typedText.length,
        left: left,
        typos: typos,
        rawWPM: wpmCalc.getRawWPM(this.totalTyped, sw.elapsed()),
        netWPM: wpmCalc.getNetWPM(this.totalTyped, typos, sw.elapsed()),
      };
    },
  },

  methods: {
    /**
     * Populates an array with files with code taken from Gist.
     *
     * The Gist files will be available in the `codeFiles` array;
     *
     * @param {strings} json - JSON Retrieved from the Github API;
     */
    populateExcerptList: function(json) {
      let gists = JSON.parse(json);
      let files = extractFilesFromGists(gists);
      let filtered = files.filter(excludeTextFiles);
      let capped = filtered.filter(capFileSize);

      this.codeFiles = capped;

      let file = this.codeFiles.shift();
      this.retrieveExcerptFromURL(file.raw_url);
    },

    /**
     * Get a list of Gists through the GitHub API.
     */
    retrieveFilesFromGist: function() {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', gistURL + params);
      xhr.onload = () => {
        this.populateExcerptList(xhr.responseText);
      };
      xhr.send(null);
    },

    /**
     * Gets the Excerpts text and prepare it for rendering;
     *
     * @param {string} url - URL of file from Gist.
     */
    retrieveExcerptFromURL: function(url) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onload = () => {
        this.remainingText = xhr.responseText
                    .slice(1)
                    .split('')
                    .reverse();
        this.currentChar = xhr.responseText.charAt(0);
      };
      xhr.send(null);
    },

    /**
     * Handles input inside the text div.
     *
     * @param {Object} event - Event from the Browser
     */
    doInput: function(event) {
      let typedKey = event.key;
      switch (typedKey) {
        case 'Enter':
          typedKey = '\n';
          break;
        case 'Backspace':
          this.doBackspace();
          return;
        default:
          if (isMultipleChars(typedKey)) return;
      }
      this.totalTyped++;

      let verifyedItem = verifyTypedKey(this.currentChar, typedKey);
      this.typedText.push(verifyedItem);

      this.currentChar = this.remainingText.pop();

      // TODO: Handle the end of an excerpt
      // if (!this.currentChar) console.log('Fim?');
    },

    /**
     * Handles backspaces.
     */
    doBackspace: function() {
      let item = this.typedText.pop();
      if (!item) return;

      let backspacedChar = item.key;
      switch (backspacedChar) {
        case space:
          backspacedChar = ' ';
          break;
        case lineEnd:
          backspacedChar = '\n';
          break;
      }

      this.remainingText.push(this.currentChar);
      this.currentChar = backspacedChar;
    },

    /**
     * Run when the main text display gets focused;
     *
     * @param {Object} event - Event from the Browser
     */
    activate: function(event) {
      this.showModal = false;
      sw.start();
    },

    /**
     * Run when the main text display gets unfocused;
     *
     * @param {Object} event - Event from the Browser
     */
    deactivate: function(event) {
      this.showModal = true;
      sw.pause();
    },
  },
});

