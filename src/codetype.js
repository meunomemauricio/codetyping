import Vue from 'vue'

// Visual representation for spaces and line ends;
var space = '\u02FD'
var lineEnd = '\u23CE\n'

// Specify we're using the Version 3 of the API
var acceptHeader = 'application/vnd.github.v3+json';

// GitHub API URLs
var gistURL = 'https://api.github.com/gists/public';
var params = '?page=1&per_page=100';

// Max size of files to be used for typing
const maxFileSize = 512;

// Stopwatch to calculate WPM
var Stopwatch = require('./stopwatch.js');
var sw = new Stopwatch();

// WPM calculator
var wpmCalc = require('./wpmCalc.js');


/**
 * Extract files from each Gist and add to a list;
 *
 * Gists can contain multiple files. This function extracts them to a new
 * array;
 *
 * @params {Array} gists - Array of gists objects retrieved from the API;
 * @returns {Array} List of all files on all Gists;
 */
function extractFilesFromGists(gists) {
    var files = [];
    // TODO: Maybe this can be made clearer;
    gists.forEach((el) => {
        for (var file in el.files) {
            files.push(el.files[file])
        }
    })
    return files;
}


/**
 * Filter function to exclude Text files from the gists.
 *
 * @params {Object} file - File extracted from the Gists.
 * @returns {boolean} true if the file is NOT plain text.
 */
function excludeTextFiles(file) {
    return !/text\/plain/.test(file.type);
}


/**
 * Filter function to exclude files bigger than `maxFileSize`;
 *
 * @params {Object} file - File extracted from the Gists;
 * @returns {boolean} true if the file is smaller than `maxFileSize`;
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
 * @params {string} input - Input string to have the spaces substituted.
 * @returns {string} String with spaces substituted to visual characters.
 */
function replaceSpaces(input) {
    var output = input.replace(/ /g, space)
                  .replace(/\n/g, lineEnd);
    return output;
}


/**
 * Check if the string has multiple characters.
 *
 * @param {string} typedKey - String to be checked against.
 */
function isMultipleChars(typedKey) {
    return /^.$/.test(typedKey) ? false : true;
}


/**
 * Check if the used typed the correct key.
 *
 * @params {string} currentKey - The expected key to be typed.
 * @params {string} typedKey - The key typed by the user.
 * @returns {string} verifiedItem.key - Typed key, ready to be displayed.
 * @returns {boolean} verifiedItem.correct - If the typed key was correctly
 * typed or not;
 * @returns {string} verifiedItem.classname - The proper class to display in
 * the HTML.
 */
function verifyTypedKey(currentKey, typedKey) {
    var correct = typedKey === currentKey;
    var displayKey;
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

    var verifiedItem = {
        key: displayKey,
        correct: correct,
        classname: correct ? 'correct' : 'typo',
    }
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
})


/**
 * Vue.Js View Model
 */
var vm = new Vue({
    el: '#app',

    created: function () {
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
         */
        remainingTextDisplay: function () {
            if (!this.remainingText) {
                return "loading...";
            }
            var text = this.remainingText.slice(0).reverse().join('');
            return replaceSpaces(text)
        },

        /**
         * The current char to be typed ready for display.
         */
        displayCurrentChar: function () {
            if (!this.currentChar) {return;}
            return replaceSpaces(this.currentChar);
        },

        /**
         * The computed typing score.
         */
        score: function () {
            if (!this.remainingText) {
                return {
                    correct: '--',
                    typed: '--',
                    left: '--',
                    typos: '--',
                    rawWPM: '--',
                    netWPM: '--',
                }
            }

            var left = this.remainingText.length + 1;
            var correct = this.typedText.filter(function (el) {return el.correct;}).length;
            var typos = this.typedText.length - correct;
            return {
                correct: correct,
                typed: this.typedText.length,
                left: left,
                typos: typos,
                rawWPM: wpmCalc.getRawWPM(this.totalTyped, sw.elapsed()),
                netWPM: wpmCalc.getNetWPM(this.totalTyped, typos, sw.elapsed()),
            }
        }
    },

    methods: {
        /**
         * Populates an array with files with code taken from Gist.
         *
         * The Gist files will be available in the `codeFiles` array;
         *
         * @params {strings} json - JSON Retrieved from the Github API;
         */
        populateExcerptList: function (json) {
            var gists = JSON.parse(json);
            var files = extractFilesFromGists(gists);
            var filtered = files.filter(excludeTextFiles);
            var capped = filtered.filter(capFileSize);

            this.codeFiles = capped;

            var file = this.codeFiles.shift();
            this.retrieveExcerptFromURL(file.raw_url);
        },

        /**
         * Get a list of Gists through the GitHub API.
         */
        retrieveFilesFromGist: function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', gistURL + params);
            xhr.onload = () => {this.populateExcerptList(xhr.responseText);}
            xhr.send(null);
        },

        /**
         * Gets the Excerpts text and prepare it for rendering;
         *
         * @params {string} url - URL of file from Gist.
         */
        retrieveExcerptFromURL: function(url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = () => {
                this.remainingText = xhr.responseText.slice(1).split('').reverse();
                this.currentChar = xhr.responseText.charAt(0);
            }
            xhr.send(null);
        },

        /**
         * Handles input inside the text div.
         */
        doInput: function (event) {
            var typedKey = event.key;
            switch (typedKey) {
                case 'Enter':
                    typedKey = '\n';
                    break;
                case 'Backspace':
                    this.doBackspace();
                    return;
                default:
                    if (isMultipleChars(typedKey)) {return;}
            }
            this.totalTyped++;

            var verifyedItem = verifyTypedKey(this.currentChar, typedKey);
            this.typedText.push(verifyedItem);

            this.currentChar = this.remainingText.pop();
            if (!this.currentChar){console.log('Fim?');}
        },

        /**
         * Handles backspaces.
         */
        doBackspace: function () {
            var item = this.typedText.pop();
            if (!item) {return;}

            var backspacedChar = item.key;
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
         */
        activate: function (event) {
            this.showModal = false;
            sw.start();
        },

        /**
         * Run when the main text display gets unfocused;
         */
        deactivate: function (event) {
            this.showModal = true;
            sw.pause();
        },
    },
})

