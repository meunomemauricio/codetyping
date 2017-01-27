/*
 * WPM Calculation functions based on:
 *
 *     https://www.speedtypingonline.com/typing-equations;
 */

/*
 * Calculate the Raw WPM.
 *
 * The Raw WPM calculation includes every typed character, including the
 * uncorrected ones. By itself it's not much useful, but it will enable a
 * measurement of "wated effort" when compared with the Net WPM.
 *
 * @params {number} typed - Total ammount of typed characters;
 * @params {number} elapsed - Total elapsed time (in ms);
 */
function getRawWPM(typed, elapsed) {
    var value = (typed * 12000) / elapsed;
    if (!value) {return 0;}
    return value;
}


/*
 * Calculate the Net WPM.
 *
 * The effective typing speed, not accouting for uncorrected characters.
 *
 * @params {number} typed - Total ammount of typed characters;
 * @params {number} typos - Number of Uncorrected characters;
 * @params {number} elapsed - Total elapsed time (in ms);
 */
function getNetWPM(typed, typos, elapsed) {
    var value = ((typed / 5) - typos) * 60000 / elapsed;
    if (!value) {return 0;}
    else if (value < 0) {return 0;}
    return value;
}

