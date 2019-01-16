// Styling control codes
var BOLD = "\x02";
var COLOR = "\x03";
var HEX_COLOR = "\x04";
var RESET = "\x0f";
var REVERSE = "\x16";
var ITALIC = "\x1d";
var UNDERLINE = "\x1f";
var STRIKETHROUGH = "\x1e";
var MONOSPACE = "\x11";

// Color code matcher, with format `XX,YY` where both `XX` and `YY` are
// integers, `XX` is the text color and `YY` is an optional background color.
var colorRx = /^(\d{1,2})(?:,(\d{1,2}))?/;

// 6-char Hex color code matcher
var hexColorRx = /^([0-9a-f]{6})(?:,([0-9a-f]{6}))?/i;

// Represents all other control codes that to be ignored/filtered from the text
// This regex allows line feed character
var controlCodesRx = /[\u0000-\u0009\u000B-\u001F]/g;

// Converts a given text into an array of objects, each of them representing a
// similarly styled section of the text. Each object carries the `text`, style
// information (`bold`, `textColor`, `bgcolor`, `italic`,
// `underline`, `strikethrough`, `monospace`), and `start`/`end` cursors.
function parseStyle(text) {
	var result = [];
	var start = 0;
	var position = 0;

	// At any given time, these carry style information since last time a styling
	// control code was met.
	var colorCodes, bold, textColor, bgColor, hexColor, hexBgColor, italic, underline, strikethrough, monospace;

	var resetStyle = function() {
		bold = false;
		textColor = undefined;
		bgColor = undefined;
		hexColor = undefined;
		hexBgColor = undefined;
		italic = false;
		underline = false;
		strikethrough = false;
		monospace = false;
	};

	resetStyle();

	// When called, this "closes" the current fragment by adding an entry to the
	// `result` array using the styling information set last time a control code
	// was met.
	var emitFragment = function() {
		// Uses the text fragment starting from the last control code position up to
		// the current position
		var textPart = text.slice(start, position);

		// Filters out all non-style related control codes present in this text
		var processedText = textPart.replace(controlCodesRx, "&nbsp;");

		if (processedText.length) {
			// Current fragment starts where the previous one ends, or at 0 if none
			var fragmentStart = result.length ? result[result.length - 1].end : 0;

			result.push({
				bold,
				textColor,
				bgColor,
				hexColor,
				hexBgColor,
				italic,
				underline,
				strikethrough,
				monospace,
				text: processedText,
				start: fragmentStart,
				end: fragmentStart + processedText.length,
			});
		}

		// Now that a fragment has been "closed", the next one will start after that
		start = position + 1;
	};

	// This loop goes through each character of the given text one by one by
	// bumping the `position` cursor. Every time a new special "styling" character
	// is met, an object gets created (with `emitFragment()`)information on text
	// encountered since the previous styling character.
	while (position < text.length) {
		switch (text[position]) {
		case RESET:
			emitFragment();
			resetStyle();
			break;

		// Meeting a BOLD character means that the ongoing text is either going to
		// be in bold or that the previous one was in bold and the following one
		// must be reset.
		// This same behavior applies to COLOR, REVERSE, ITALIC, and UNDERLINE.
		case BOLD:
			emitFragment();
			bold = !bold;
			break;

		case COLOR:
			emitFragment();

			// Go one step further to find the corresponding color
			colorCodes = text.slice(position + 1).match(colorRx);

			if (colorCodes) {
				textColor = Number(colorCodes[1]);

				if (colorCodes[2]) {
					bgColor = Number(colorCodes[2]);
				}

				// Color code length is > 1, so bump the current position cursor by as
				// much (and reset the start cursor for the current text block as well)
				position += colorCodes[0].length;
				start = position + 1;
			} else {
				// If no color codes were found, toggles back to no colors (like BOLD).
				textColor = undefined;
				bgColor = undefined;
			}

			break;

		case HEX_COLOR:
			emitFragment();

			colorCodes = text.slice(position + 1).match(hexColorRx);

			if (colorCodes) {
				hexColor = colorCodes[1].toUpperCase();

				if (colorCodes[2]) {
					hexBgColor = colorCodes[2].toUpperCase();
				}

				// Color code length is > 1, so bump the current position cursor by as
				// much (and reset the start cursor for the current text block as well)
				position += colorCodes[0].length;
				start = position + 1;
			} else {
				// If no color codes were found, toggles back to no colors (like BOLD).
				hexColor = undefined;
				hexBgColor = undefined;
			}

			break;

		case REVERSE: {
			emitFragment();
			var tmp = bgColor;
			bgColor = textColor;
			textColor = tmp;
			break;
		}

		case ITALIC:
			emitFragment();
			italic = !italic;
			break;

		case UNDERLINE:
			emitFragment();
			underline = !underline;
			break;

		case STRIKETHROUGH:
			emitFragment();
			strikethrough = !strikethrough;
			break;

		case MONOSPACE:
			emitFragment();
			monospace = !monospace;
			break;
		}

		// Evaluate the next character at the next iteration
		position += 1;
	}

	// The entire text has been parsed, so we finalize the current text fragment[i].
	emitFragment();
	return result;
}

var properties = ["bold", "textColor", "bgColor", "hexColor", "hexBgColor", "italic", "underline", "strikethrough", "monospace"];



function createFragment(text) {
	var fragment = parseStyle(text);
	var x = '';
	for(var i = 0; i < fragment.length; i++){
		var classes = [];
		if (fragment[i].bold) {
			classes.push("irc-bold");
		}

		if (fragment[i].textColor !== undefined) {
			classes.push("irc-" + fragment[i].textColor);
		}

		if (fragment[i].bgColor !== undefined) {
			classes.push("irc-bg" + fragment[i].bgColor);
		}

		if (fragment[i].italic) {
			classes.push("irc-italic");
		}

		if (fragment[i].underline) {
			classes.push("irc-underline");
		}

		if (fragment[i].strikethrough) {
			classes.push("irc-strikethrough");
		}

		if (fragment[i].monospace) {
			classes.push("irc-monospace");
		}

		var attributes = classes.length ?  'class="'+classes.join(" ")+'"' : "";
		var escapedText = fragment[i].text;

		if (attributes.length) {
			x += '<span '+attributes+'>'+escapedText+'</span>';
		} else {
			x += escapedText;
		}

	}
	return x;
}
