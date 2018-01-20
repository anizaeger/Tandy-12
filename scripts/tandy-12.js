/**
*
* @source: https://github.com/anizaeger/Tandy-12
*
* @licstart  The following is the entire license notice for the 
* JavaScript code in this page.
*
* Copyright (C) 2017 Anakin-Marc Zaeger
*
*
* The JavaScript code in this page is free software: you can
* redistribute it and/or modify it under the terms of the GNU
* General Public License (GNU GPL) as published by the Free Software
* Foundation, either version 3 of the License, or (at your option)
* any later version.  The code is distributed WITHOUT ANY WARRANTY;
* without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*
* As additional permission under GNU GPL version 3 section 7, you
* may distribute non-source (e.g., minimized or compacted) forms of
* that code without the copy of the GNU GPL normally required by
* section 4, provided you include this license notice and a URL
* through which recipients can access the Corresponding Source.
*
*
* @licend The above is the entire license notice
* for the JavaScript code in this page.
*
*/

const PROGS = [
	'Organ',
	'Song_Writer',
	'Repeat',
	'Torpedo',
	'Tag_It',
	'Roulette',
	'Baseball',
	'Repeat_Plus',
	'Treasure_Hunt',
	'Compete',
	'Fire_Away',
	'Hide_N_Seek'
];

const HUES = [
	'Indigo',
	'Orange',
	'Magenta',
	'SpringGreen',
	'Blue',
	'Cyan',
	'Yellow',
	'Salmon',
	'Lime',
	'Red',
	'Violet',
	'Brown'
];

// Various constants for configuring user interface.
const NUM_BTNS = 12;
const NUM_ROWS = 4;
const NUM_COLS = 3;

var CONFIG;
var hw;
var clock;
var DEBUG;

/* -----------------------------------------------------------------------------
FUNCTION:		gplAlert
DESCRIPTION:		Print GPL license text to alert box
RETURNS:		Nothing (Void Function)
----------------------------------------------------------------------------- */

function gplAlert() {
	var copyTxt = "";
	copyTxt += "Copyright (C) 2017 Anakin-Marc Zaeger\n"
	copyTxt += "\n"
	copyTxt += "\n"
	copyTxt += "The JavaScript code in this page is free software: you can\n"
	copyTxt += "redistribute it and/or modify it under the terms of the GNU\n"
	copyTxt += "General Public License (GNU GPL) as published by the Free Software\n"
	copyTxt += "Foundation, either version 3 of the License, or (at your option)\n"
	copyTxt += "any later version.  The code is distributed WITHOUT ANY WARRANTY;\n"
	copyTxt += "without even the implied warranty of MERCHANTABILITY or FITNESS\n"
	copyTxt += "FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.\n"
	copyTxt += "\n"
	copyTxt += "As additional permission under GNU GPL version 3 section 7, you\n"
	copyTxt += "may distribute non-source (e.g., minimized or compacted) forms of\n"
	copyTxt += "that code without the copy of the GNU GPL normally required by\n"
	copyTxt += "section 4, provided you include this license notice and a URL\n"
	copyTxt += "through which recipients can access the Corresponding Source.\n"
	window.alert(copyTxt)
}

class Manpage {
	constructor() {
		this.manFrame = document.getElementById('manpage');
	}
	setManpage( app ) {
		this.manFrame.src = 'man/' + app + '.html';
	}
};

class Config {
	constructor() {
		this._clockHzMin = .5;
		this._clockHzMax = 8;
		this._clockHzDef = 2;
		this._clockPrec = 10000;
	}

	getClockHzMin() {
		return this._clockHzMin;
	}

	getClockHzMax() {
		return this._clockHzMax;
	}

	getClockHzDef() {
		return this._clockHzDef;
	}

	getClockPrec() {
		return this._clockPrec;
	}
}

/* -----------------------------------------------------------------------------
CLASS:			Tandy12
DESCRIPTION:		Simulates the hardware aspects of the Tandy-12
----------------------------------------------------------------------------- */

class Tandy12 {
	constructor() {
		this.clock = new Clock( this );
		this.osc = new Osc();
		this.power = false;
		this.os = null;
		this.doc = new Manpage();

		this.lights = new Array( NUM_BTNS );
		for ( var btn = 0; btn < NUM_BTNS; btn++ ) {
			this.lights[ btn ] = new Light( this, btn );
			this.lights[ btn ].lit( false );

			var btnMain = document.getElementById( 'btnMain' + btn );

			// Workaround for dynamically-created elements with mouse events provided by Stack Overflow user 'posit labs':
			// https://stackoverflow.com/questions/28573631/dynamically-creating-elements-and-adding-onclick-event-not-working
			(function() {
				var _btn = btn;
				btnMain.onmousedown = function() { hw.button( _btn, true )};
				btnMain.onmouseup = function() { hw.button( _btn, false )};
				btnMain.ontouchstart = function( event ) { hw.touch( event, _btn, true )};
				btnMain.ontouchend = function( event ) { hw.touch( event, _btn, false )};
			})();
		}

		this.flasher = new Flasher( this );

		this.setPower();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::setPower
	DESCRIPTION:		Generates HTML code for Tandy-12 buttons and adds them
				to the main page.
	----------------------------------------------------------------------------- */
	setPower() {
		this.power = document.getElementById('switch').checked;
		if ( this.power ) {
			this.getInput = true;
			this.os = new OpSys( this, this.doc );
			DEBUG.genTable();
		} else {
			this.osc.play( false );
			this.clock.stop();
			this.os = null;
			this.darken();
			this.doc.setManpage('main');
			DEBUG.clear();
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::button
	DESCRIPTION:		Process presses and releases of main game buttons.
	----------------------------------------------------------------------------- */
	button( btn, state ) {
		// Only accept 
		if ( this.getInput == state ) {
			this.getInput = !state;
			if ( this.power && this.os != null ) {
				this.os.button( btn, state );
			}
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::touch
	DESCRIPTION:		Handle touchscreen events for main buttons.
	----------------------------------------------------------------------------- */
	touch( event, btn, state ) {
		event.preventDefault();
		this.button( btn, state );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::light
	DESCRIPTION:		Manipulate individual and groups of lights.
	----------------------------------------------------------------------------- */
	light( num, state ) {
		if ( this.power ) {
			if ( Array.isArray( num )) {	// Perform action on group of lights
				for ( var idx = 0; idx < num.length; idx++ ) {
					if ( num[ idx ] >= 0 && num[ idx ] < NUM_BTNS )
						this.lights[ num[ idx ]].lit( state );
				}
			} else {	// Perform action on individual light.
				if ( num >= 0 && num < NUM_BTNS )
					this.lights[ num ].lit( state );
			}
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::tone
	DESCRIPTION:		Pass audio commands to Oscillator.
	----------------------------------------------------------------------------- */
	tone( tone, state ) {
		if ( this.power ) {
			if ( !Array.isArray( tone )) {
				this.osc.play( tone, state );
			}
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::blast
	DESCRIPTION:		Active light and tone associated with particular button.
	----------------------------------------------------------------------------- */
	blast( btn, state ) {
		this.light( btn, state );
		this.tone( btn, state );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::darken
	DESCRIPTION:		Turn off all lights.
	----------------------------------------------------------------------------- */
	darken() {
		for ( var num = 0; num < NUM_BTNS; num++ ) {
			this.lights[ num ].lit( false );
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::clockTick
	DESCRIPTION:		Receive ticks from Clock and pass on to Flasher and OpSys.
	----------------------------------------------------------------------------- */
	clockTick( timeStamp ){
		if ( this.power && this.os != null ) {
			this.osc.wake();
			this.flasher.clockTick();
			this.os.clockTick( timeStamp );
		}
		DEBUG.print();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::seqEnd
	DESCRIPTION:		Notify OpSys that Flasher has completed cycle count.
	----------------------------------------------------------------------------- */
	seqEnd( label ) {
		this.os.seqEnd( label )
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::click
	DESCRIPTION:		Process auxiliary buttons.
	----------------------------------------------------------------------------- */
	click( type ) {
		if ( this.power && this.os != null ) {
			this.os.btnClick( type );
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Tandy12::shadeBlend
	DESCRIPTION:		Calculate new value for color after applying shading.
	ATTRIBUTION:		https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
	----------------------------------------------------------------------------- */
	shadeBlend(p, from, to) {
		if ( typeof( p ) !="number" || p < -1 || p > 1 || typeof( from ) != "string" || (from[0] != 'r' && from[0] != '#' ) || ( typeof( to ) != "string" && typeof( to ) != "undefined" )) {	//ErrorCheck
			return null;
		}
		
		if ( !this.sbcRip )this.sbcRip = ( d ) => {
			let l = d.length, RGB = new Object();
			if ( l > 9 ) {
				d = d.split( "," );
				if( d.length < 3 || d.length > 4 ) {	//ErrorCheck
					return null;
				}
				RGB[0] = i( d[0].slice( 4 )),
				RGB[1] = i( d[1]),
				RGB[2] = i( d[2]),
				RGB[3] = d[3] ? parseFloat( d[3]) : -1;
			} else {
				if( l == 8 || l == 6 || l < 4 ){	//ErrorCheck
					return null;
				}

				if( l < 6) {	//3 digit
					d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + ( l > 4 ? d[4] + "" + d[4] : "");
				} 

				d = i( d.slice(1) , 16 ),
				RGB[0] = d >> 16 & 255,
				RGB[1] = d >> 8 & 255,
				RGB[2] = d & 255,
				RGB[3] = l == 9 || l == 5 ? r((( d >> 24 & 255 ) / 255 ) * 10000 ) / 10000 : -1;
			}

			return RGB;
		}
		var i = parseInt,
		r = Math.round,
		h = from.length > 9,
		h = typeof( to ) == "string" ? to.length > 9 ? true : to == "c" ? !h : false : h,
		b = p < 0,
		p = b ? p * -1 : p,
		to = to && to != "c" ? to : b ? "#000000" : "#FFFFFF",
		f = this.sbcRip( from ),
		t = this.sbcRip( to );
		if ( !f || !t ) {	//ErrorCheck
			return null;
		}

		if ( h ) {
			return "rgb(" + r(( t[0] - f[0] ) * p + f[0]) + "," + r(( t[1] - f[1] ) * p + f[1]) + "," + r(( t[2] - f[2]) * p + f[2]) + ( f[3] < 0 && t [3] < 0 ? ")" : "," + (f[3] > -1 && t[3]> -1 ? r((( t[3] - f[3]) * p + f[3]) * 10000 ) / 10000 : t[3] < 0 ? f[3] : t[3]) + ")" );
		} else {
			return "#" + ( 0x100000000 + ( f[3] > -1 && t[3] > -1? r((( t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r( t[3] * 255 ) : f[3] > -1 ? r( f[3] * 255 ) : 255 ) * 0x1000000 + r(( t[0] - f[0]) * p + f[0]) * 0x10000 + r(( t[1] - f[1]) * p + f[1]) * 0x100 + r(( t[2] - f[2]) * p + f[2])).toString(16).slice( f[3] > -1 || t[3]> -1 ? 1 : 3);
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Light
DESCRIPTION:		Simulates Tandy-12 lights.
----------------------------------------------------------------------------- */
class Light {
	constructor( hw, num ) {
		this.hw = hw;
		this.num = num;
		this.id = 'btnMain'+this.num
		this.light = document.getElementById(this.id);
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Light::hue
	DESCRIPTION:		Store list of colors for individual lights.
	RETURNS:		Color of associated light number
	----------------------------------------------------------------------------- */
	hue( num ) {
		return HUES[ num ];
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Light::lit
	DESCRIPTION:		Sets state of light by dynamically altering background
				color:
					true - on
					false - off
	----------------------------------------------------------------------------- */
	lit( state ) {
		var brightness;

		if ( state ) {
			brightness = 0.25;
		} else {
			brightness = -0.75;
		}

		this.light.style.backgroundColor = this.hue( this.num );
		var origBgColor = window.getComputedStyle( this.light ).getPropertyValue( 'background-color' );
		var newBgColor = this.hw.shadeBlend( brightness ,origBgColor );
		this.light.style.backgroundColor = newBgColor;
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Osc
DESCRIPTION:		Simulates Tandy-12 tone generator.
----------------------------------------------------------------------------- */

class Osc {
	/* -----------------------------------------------------------------------------
	FUNCTION:		constructor
	DESCRIPTION:		Initialize web audio oscillator.
	ATTRIBUTION:		https://gist.github.com/laziel/7aefabe99ee57b16081c
	----------------------------------------------------------------------------- */
	constructor() {
		this.context = null;
		this.usingWebAudio = true;
		this.listener = false;
		this.playing = false;

		try {
			if ( typeof AudioContext !== 'undefined' ) {
				this.context = new AudioContext();
			} else if ( typeof webkitAudioContext !== 'undefined' ) {
				this.context = new webkitAudioContext();
			} else {
				this.usingWebAudio = false;
			}
		} catch( e ) {
			alert( "*** BUG - Osc::constructor()\n" + "Error - " + e );
			this.usingWebAudio = false;
		}

		this.wake();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Osc::tone
	DESCRIPTION:		Store list of tones for individual buttons.
	RETURNS:		Frequency of associated button number
	----------------------------------------------------------------------------- */
	freq( tone ) {	
		var freqs = [ 293, 330, 370, 392, 440, 494, 554, 587, 659, 740, 247, 277 ];
		return freqs[ tone ];
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Osc::play
	DESCRIPTION:		Start/stop tone generator for specied tone.
	RETURNS:		Frequency of associated button number
	----------------------------------------------------------------------------- */
	play( tone, state ) {
		if ( this.usingWebAudio ) {
			try {
				if (!( typeof this.osc === 'undefined' || this.osc === null ) && this.playing == true ) {
					this.osc.stop();
					this.playing = false;
				}
				if ( state ) {
					this.osc = this.context.createOscillator();
					this.osc.type = 'square';
					this.osc.frequency.value = this.freq( tone );
					this.osc.connect( this.context.destination );
					this.osc.start();
					this.playing = true;
				}
			} catch( e ) {
				alert( "*** BUG - Osc::play( " + tone + ", " + state + " )\n" + "Error - " + e );
				this.usingWebAudio = false;
			}
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Osc::wake
	DESCRIPTION:		Resumes web audio in the event that it gets suspended.
	ATTRIBUTION:		https://gist.github.com/laziel/7aefabe99ee57b16081c
	----------------------------------------------------------------------------- */
	wake() {
		if ( this.usingWebAudio && this.context.state === 'suspended' ) {
			var resume = function() {
				hw.osc.context.resume();

				setTimeout( function() {
					if ( hw.osc.context.state === 'running' ) {
						document.body.removeEventListener( 'touchend', resume, false );
					}
				}, 0 );
			};

			document.body.addEventListener('touchend', resume, false);
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Clock
DESCRIPTION:		Simulates Tandy-12 clock pulse generator.
----------------------------------------------------------------------------- */
class Clock {
	constructor( hw ) {
		this.hw = hw;
		this.timer = null;

		this.clockRgbMin = '#ff0000';
		this.clockRgbMax = '#00ff00';

		this.clockHz = document.getElementById("clockHz");
		this.clockMs = document.getElementById("clockMs");
		this.clockslide = document.getElementById("clockSlider");

		// Set minimum Hz / maximum Ms
		this.clockHzMin = CONFIG.getClockHzMin();
		if ( this.clockHzMin < 0.1 ) {
			this.clockHzMin = 0.1;
		}
		this.clockMsMax = this.hzToMs( this.clockHzMin );
		this.clockMs.max = this.clockMsMax;

		// Set maximum Hz / minimum Ms
		this.clockHzMax = CONFIG.getClockHzMax();
		if ( this.clockHzMax > 10 ) {
			this.clockHzMax = 10;
		}
		this.clockMsMin = this.hzToMs( this.clockHzMax );
		this.clockMs.min = this.clockMsMin;

		// Represent slider as percentages.
		this.clockPrcn = CONFIG.getClockPrec();
		var minPcnt = Math.round(( this.clockHzMin / this.clockHzMax ) * this.clockPrcn );
		this.clockslide.min = minPcnt;
		this.clockslide.max = 10000;

		document.getElementById("clockHzMin").innerHTML = this.clockHzMin + 'hz';
		document.getElementById("clockHzMax").innerHTML = this.clockHzMax + 'hz';

		this.default();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::ratioToHz
	DESCRIPTION:		Convert ratio to pulses-per-second based on allowable
				min/max clock Hz.
	----------------------------------------------------------------------------- */
	ratioToHz( ratio ) {
		return ( this.clockHzMax  * ratio );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::msToHz
	DESCRIPTION:		Convert clock pulse delay in ms to frequency in Hz.
	----------------------------------------------------------------------------- */
	msToHz( ms ) {
		return 1000 / ms;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::hzToMs
	DESCRIPTION:		Convert clock frequency in Hz to pulse delay in ms.
	----------------------------------------------------------------------------- */
	hzToMs( hz ) {
		return Math.round( 1000 / hz );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::msToRatio
	DESCRIPTION:		Convert clock pulse delay in ms to decimal ratio.
	----------------------------------------------------------------------------- */
	msToRatio( ms ) {
		return ( ms / this.clockMsMax ) * 10000;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::hzToRatio
	DESCRIPTION:		Convert clock frequency in Hz to decimal ratio.
	----------------------------------------------------------------------------- */
	hzToRatio( hz ) {
		return ( hz / this.clockHzMax ) * 10000;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::reset
	DESCRIPTION:		Reset clock by stopping and restarting.
	----------------------------------------------------------------------------- */
	reset() {
		if ( this.hw.power ) {
			this.stop();
			this.run();
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::tick
	DESCRIPTION:		Generate clock pulse.  After pulsing, set timer to
				generate another pulse.
	----------------------------------------------------------------------------- */
	tick() {
		this.hw.clockTick( this.timeStamp++ );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::start
	DESCRIPTION:		Initialize and seqStart clock.
	----------------------------------------------------------------------------- */
	start() {
		if ( this.hw.power && this.timer == null ) {
			this.timeStamp = 0;
			this.run();
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::stop
	DESCRIPTION:		Pause clock.
	----------------------------------------------------------------------------- */
	stop() {
		if ( typeof this.timer !== 'undefined' ) {
			clearTimeout( this.timer );
			this.timer = null;
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::advance
	DESCRIPTION:		Manually-tick clock, stopping automatic timer if
				necessary.
	----------------------------------------------------------------------------- */
	advance() {
		if ( this.hw.power ) {
			this.stop();
			this.tick();
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::run
	DESCRIPTION:		Resume the clock.
	----------------------------------------------------------------------------- */
	run() {
		this.tick();
		var tmpThis = this;
		this.timer = setTimeout( function() {
			tmpThis.run();
		}, this.clockRate );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::set
	DESCRIPTION:		Set clock rate to new value based on clock control
				settings.
	----------------------------------------------------------------------------- */
	set() {
		var ms = this.clockMs.value;
		if ( ms >= this.clockMsMin && ms <= this.clockMsMax ) {
			var hz = this.msToHz( ms );
			var ratio = this.hzToRatio( hz );
			this.clockslide.value = ratio;
			this.adjust();
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::Adjust
	DESCRIPTION:		Accepts percentage from slider, and converts it to
				milliseconds.
	----------------------------------------------------------------------------- */
	adjust() {
		// Value of slider as a decimal.
		var ratio = this.clockslide.value / 10000;
		var dispPcnt = Math.round( ratio * 10000 ) / 100;

		var newHz = Math.round( this.ratioToHz( ratio ) * 100 ) / 100;
		var newMs = Math.round( this.hzToMs( newHz ));

		this.clockslide.style.backgroundColor = this.hw.shadeBlend( ratio, this.clockRgbMin,this.clockRgbMax );

		this.clockHz.innerHTML = newHz + 'hz';
		this.clockMs.value = newMs;

		document.getElementById("clockPcnt").innerHTML = dispPcnt + '%';
		this.clockRate = newMs;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Clock::default
	DESCRIPTION:		Reset clock rate to default value.
	----------------------------------------------------------------------------- */
	default() {
		var ms = this.hzToMs( CONFIG.getClockHzDef());
		var ratio = this.msToRatio( ms )
		this.clockslide.value = ratio;
		this.adjust();
		this.reset();
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Flasher
DESCRIPTION:		Flash light(s) off and on.
----------------------------------------------------------------------------- */
class Flasher {
	constructor( hw ) {
		this.hw = hw;
		this.reset();
		this.btn = null;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::clockTick
	DESCRIPTION:		Receive hardware clock pulses and flash lights
				accordingly.
	----------------------------------------------------------------------------- */
	clockTick() {
		if ( this.flashing ) {
			if ( this.state ) {
				if ( this.cycles )
					++this.count;
				this.on();
			} else {
				this.off();
				if ( this.cycles && this.count >= this.cycles ) {
					this.stop();
					this.hw.seqEnd( this.label );
				}
			}
		}
		this.state = !this.state;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::start
	DESCRIPTION:		Set flasher mode, cycle count, and label, then start
				cycling.
	----------------------------------------------------------------------------- */
	start( btn, label, cycles, light, tone ) {
		this.reset();
		this.light = light;
		this.tone = tone ;
		this.btn = btn;

		this.label = label;
		this.cycles = cycles;

		this.count = 0;
		this.run();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Begin cycling flasher.
	----------------------------------------------------------------------------- */
	run() {
		this.flashing = true;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::stop
	DESCRIPTION:		Stop flasher and reinitialize settings.
	----------------------------------------------------------------------------- */
	stop() {
		this.off();
		this.flashing = false;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::reset
	DESCRIPTION:		Initialize settings
	----------------------------------------------------------------------------- */
	reset() {
		this.light = false;
		this.tone = false;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::on
	DESCRIPTION:		Turn on specified lights and tone.
	----------------------------------------------------------------------------- */
	on() {
		if ( this.light ) {
			this.hw.light( this.btn, true );
		}
		if ( this.tone ) {
			this.hw.tone( this.btn, true );
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Flasher::off
	DESCRIPTION:		Turn off lights and tone.
	----------------------------------------------------------------------------- */
	off() {
		for ( var btn = 0; btn < NUM_BTNS; btn++ ) {
			this.hw.blast( btn, false );
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Sequencer
DESCRIPTION:		Handles outputting light and tone sequences.
----------------------------------------------------------------------------- */
class Sequencer{
	constructor( os ) {
		this.os = os;
		this.seq = [];
		this.len = this.seq.length;
		this.MAXLEN = 44;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::load
	DESCRIPTION:		Load desired sequence into memory, and set output mode.
	----------------------------------------------------------------------------- */
	load( tones ) {
		this.clear();

		for ( var idx = 0; idx < tones.length; idx++ ) {
			this.add( tones[ idx ]);
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::clockTick
	DESCRIPTION:		Step through sequence one element at a time per clock
				tick.
	----------------------------------------------------------------------------- */
	clockTick() {
		if ( this.run ) {
			this.os.clear();
			if ( this.pos == this.len ) {
				if ( this.repeat ) {
					this.pos = 0;
				} else {
					this.stop();
				}
			} else {
				var note = this.seq[ this.pos++ ];
				if ( note >= 0 && note < NUM_BTNS ) {
					this.os.blast( note, true, this.light, this.note );
				}
			}
			return true;
		} else {
			return false;
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::add
	DESCRIPTION:		Appends single note to sequence.
	----------------------------------------------------------------------------- */
	add( note ) {
		this.seq.push( note );
		this.len = this.seq.length;
		var overflow = this.len - this.MAXLEN;
		if ( overflow > 0 ) {
			for ( var over = 0; over < overflow; over++ ) {
				this.seq.shift();
			}
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::clear
	DESCRIPTION:		Clears the sequence.
	----------------------------------------------------------------------------- */
	clear() {
		this.seq.length = 0;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::start
	DESCRIPTION:		Begin playback of sequence.
	----------------------------------------------------------------------------- */
	start( label, light, note ) {
		this.label = label;
		this.light = light;
		this.note = note;
		this.pos = 0;
		this.run = true;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Sequencer::stop
	DESCRIPTION:		Stops a running sequence.
	----------------------------------------------------------------------------- */
	stop() {
		this.run = false;
		var tmpThis = this;
		setTimeout( function() {
			tmpThis.os.seqEnd( tmpThis.label );
		}, 125);
	}
};

/* -----------------------------------------------------------------------------
CLASS:			OpSys
DESCRIPTION:		Interface between hardware emulator and program logic
			execution.
----------------------------------------------------------------------------- */
class OpSys {
	constructor( hw, doc ) {
		this.hw = hw;
		this.doc = doc;
		this.timeStamp = null;
		this.hw.clock.start();
		this.seq = new Sequencer( this );
		this.sysMem = new ( eval( this.getBootProg()))( this );
		this.debug();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::clockTick
	DESCRIPTION:		Logic triggered by hardware clock emulator.  Passes
				clock pulses on to program held in sysMem.
	----------------------------------------------------------------------------- */
	clockTick( timeStamp ) {
		this.timeStamp = timeStamp;

		if ( !this.seq.clockTick()) {
			if ( typeof this.sysMem.clockTick === "function" ) {
				this.sysMem.clockTick( this.timeStamp );
			}
		}

		this.debug();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::clockReset
	DESCRIPTION:		Resets clock pulses to ensure full pulse when clock is
				restarted.
	----------------------------------------------------------------------------- */
	clkReset() {
		this.hw.clock.reset();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::debug
	DESCRIPTION:		Update information in debug pane.
	----------------------------------------------------------------------------- */
	debug() {
		DEBUG.clear();
		DEBUG.update( this.constructor.name, this );
		DEBUG.update( this.sysMem.constructor.name, this.sysMem );
		DEBUG.update( this.seq.constructor.name, this.seq );
		DEBUG.genTable();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::getBootProg
	DESCRIPTION:		Initialize bootup program selected by dropdown menu in
				debugging pane.
	RETURNS			Identifier of program to boot into.
	----------------------------------------------------------------------------- */
	getBootProg() {
		var bootProg = document.getElementById('STARTUP_PROG');
		var progName = bootProg.options[bootProg.selectedIndex].value;
		return progName;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::selectPgm
	DESCRIPTION:		Load 'Picker' into sysMem.
	----------------------------------------------------------------------------- */
	selectPgm( id = 0 ) {
		this.clear();
		this.sysMem = null;
		this.sysMem = new Picker( this, id );
		this.debug();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::randRange
	DESCRIPTION:		Randomly selects a number between min and max,
				inclusive.
	RETURNS:		Random integer.
	----------------------------------------------------------------------------- */
	randRange( min, max ) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * ( max - min + 1 )) + min;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::randBtn
	DESCRIPTION:		Selects a random button.
	RETURNS:		ID of random button.
	----------------------------------------------------------------------------- */
	randBtn() {
		var btn = this.randRange( 0, NUM_BTNS - 1 );
		return btn;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::button
	DESCRIPTION:		Triggered by pressing/releasing a main button as
				registered by Tandy12 class.
	----------------------------------------------------------------------------- */
	button( btn, state ) {
		if ( typeof this.sysMem.button == "function" ) {
			this.sysMem.button( btn, state );
		}
		this.debug();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::btnCol
	DESCRIPTION:		Determines the column where button in question is
				located.
	RETURNS:		Integer identifying button col.
	----------------------------------------------------------------------------- */
	btnCol( btn ) {
		var col = Math.floor(( btn / NUM_BTNS ) * NUM_COLS );
		return col;
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::btnRow
	DESCRIPTION:		Determines the row where button in question is located.
	RETURNS:		Integer identifying button row.
	----------------------------------------------------------------------------- */
	btnRow( btn ) {
		var row = btn - ( this.btnCol( btn ) * NUM_ROWS );
		return row
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::seqLoad
	DESCRIPTION:		Loads a sequence into memory, then begins playback.
	----------------------------------------------------------------------------- */
	seqLoad( tones, label, light = true, tone = true ) {
		this.seq.load( tones );
		this.seq.start( label, light, tone );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::seqClear
	DESCRIPTION:		Clear sequence from memory.
	----------------------------------------------------------------------------- */
	seqClear() {
		this.seq.clear();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::seqAdd
	DESCRIPTION:		Appends a single note to sequencer.
	----------------------------------------------------------------------------- */
	seqAdd( btn ) {
		this.seq.add( btn )
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::seqStart
	DESCRIPTION:		Begin playback of sequence in memory.
	----------------------------------------------------------------------------- */
	seqStart( label, light = true, tone = true ) {
		this.seq.start( label, light, tone );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::seqEnd
	DESCRIPTION:		Triggered upon sequence completion.
	----------------------------------------------------------------------------- */
	seqEnd( label ) {
		if ( typeof this.sysMem.seqEnd === "function" ) {
			this.sysMem.seqEnd( label );
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::playBip
	DESCRIPTION:		Plays a short 'bip' with light, sound, or both.
	----------------------------------------------------------------------------- */
	playBip( btn = 7, label, light = false, tone = true ) {
		var tmpThis = this;
		setTimeout( function() {
			tmpThis.blast( btn, true, light, tone );
			setTimeout( function() {
				tmpThis.blast( btn, false );
				setTimeout( function() {
					if ( typeof tmpThis.sysMem.endBip === "function" ) {
						tmpThis.sysMem.endBip( label )
					}
				}, 500);
			}, 250);
		}, 125);
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::blast
	DESCRIPTION:		Turns on/off a button's associated light/tone.
	----------------------------------------------------------------------------- */
	blast( btn, state = true, light = true, tone = true ) {
		if ( light )
			this.hw.light( btn, state );
		if ( tone )
			this.hw.tone( btn, state );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::flash
	DESCRIPTION:		Flashes a button's light/tone.
	----------------------------------------------------------------------------- */
	flash( btn, label, cycles = 0, light = true, tone = true ) {
		this.hw.flasher.start( btn, label, cycles, light, tone );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::clear
	DESCRIPTION:		Turns off all lights/tones.
	----------------------------------------------------------------------------- */
	clear() {
		this.hw.flasher.stop();
		for ( var num = 0; num < NUM_BTNS; num++ ) {
			this.hw.light( num, false );
			this.hw.tone( num, false );
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		OpSys::btnClick
	DESCRIPTION:		Processes presses of auxiliary buttons (start, select,
				repeat, play, and space).
	----------------------------------------------------------------------------- */
	btnClick( btnName ) {
		if ( typeof this.sysMem.btnClick == "function") {
			this.sysMem.btnClick( btnName );
		}
		this.debug();
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Boot
DESCRIPTION:		Main startup program.  Plays an ascending sequence of
			lights/tones, and loads picker.
----------------------------------------------------------------------------- */
class Boot {
	constructor( os ) {
		this.os = os;
		this.os.clkReset();
		for ( var btn = 0; btn < 12; btn++ ) {
			this.os.seqAdd( btn );
		}
		this.os.seqStart();
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Boot::seqEnd
	DESCRIPTION:		Upon completion of startup 'animation', loads Picker
				into memory.
	----------------------------------------------------------------------------- */
	seqEnd() {
		this.os.selectPgm();
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Picker
DESCRIPTION:		Logic for game selection interface
----------------------------------------------------------------------------- */
class Picker {
	constructor( os, id = 0 ) {
		this.os = os;
		this.os.sysMem = this;
		this.btnNum = id;
		this.select = false;
		this.doPick = true;
		this.manpages = [
			'organ',
			'song-writer',
			'repeat',
			'torpedo',
			'tag-it',
			'roulette',
			'baseball',
			'repeat-plus',
			'treasure-hunt',
			'compete',
			'fire-away',
			'hide-n-seek'
		]
		this.os.flash( this.btnNum, '', 0, true, false );
		this.os.doc.setManpage( 'picker' );
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Picker::clockTick
	DESCRIPTION:		Logic triggered by OpSys clock.  Passes clock pulses on
				to program held in sysMem.
	----------------------------------------------------------------------------- */
	clockTick() {
		if ( !this.select && !hw.flasher.state ) {
			this.select = true;
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Picker::button
	DESCRIPTION:		Processes presses of main game buttons.
	----------------------------------------------------------------------------- */
	button( btn, state ) {
		if ( this.doPick && state ) {
			this.btnNum = btn;
			this.os.flash( this.btnNum, '', 0, true, false );
			this.select = false;
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Picker::btnClick
	DESCRIPTION:		Processes presses of auxiliary buttons (start, select,
				repeat, play, and space).
	----------------------------------------------------------------------------- */
	btnClick( btnName ) {
		switch ( btnName ) {
		case 'start':
			this.doPick = false;
			this.os.clear();
			this.os.playBip( this.btnNum, 'loadPgm', true );
			this.os.doc.setManpage( this.manpages[ this.btnNum ]);
			break;
		case 'select':
			if ( this.select ){
				if ( ++this.btnNum >= NUM_BTNS ) {
					this.btnNum = 0;
				}
				this.os.flash( this.btnNum, '', 0, true, false );
				this.select = false;
			}
			break;
		}
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Picker::endBip
	DESCRIPTION:		Triggered by the end of a 'bip'; used trigger program
				loading into os.sysMem.
	----------------------------------------------------------------------------- */
	endBip( label ) {
		switch( label ) {
		case 'loadPgm':
			this.os.sysMem = null;
			this.os.sysMem = new ( eval( PROGS[ this.btnNum ]))( this.os, this.btnNum );
			break;
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Organ
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Organ {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		this.os.blast( btn, state );
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Song_Writer
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Song_Writer {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.song = [];
		this.playing = false;
		this.os.seqClear();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.os.seqClear();
			this.newSong = true;
			this.playing = false;
			break;
		case 'select':
			if ( !this.playing ) {
				this.os.selectPgm( this.id );
			} else {
				this.os.seq.repeat = false;
			}
			break;
		case 'space':
			if ( !this.playing ){
				this.os.seqAdd( '-' );
			}
			break;
		case 'playhit':
			if ( !( this.playing || this.newSong )) {
				this.playing = true;
				this.os.seqStart();
			}
			break;
		case 'repeat':
			this.os.seq.repeat = true;
			break;
		}
	}

	button( btn, state ) {
		if ( !this.playing ) {
			this.newSong = false;
			this.os.blast( btn, state );
			if ( state ) {
				this.os.seqAdd( btn );
			}
		}
	}

	seqEnd() {
		this.playing = false;
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Repeat
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Repeat {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.seq = [];
		this.gameOver = true;
		this.startGame();
	}

	startGame() {
		this.gameOver = false;
		this.seq.length = 0;
		this.genSeq();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.startGame();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.getInput ) {
			this.os.blast( btn, state );
			if ( state ) {
				if ( btn == this.seq[ this.count ]) {
					this.count++
				} else {
					this.gameOver = true;
				}
			} else {
				if ( this.gameOver ) {
					this.loss();
				} else if ( this.count >= this.seq.length ) {
					this.os.playBip( 7, 'success' );
				}
			}
		}
	}

	endBip( label ) {
		switch( label ) {
		case 'success':
			this.genSeq();
			break;
		}
	}

	genSeq() {
		this.count = 0;
		this.seq.push( this.os.randBtn());
		this.os.clkReset();
		this.os.seqLoad( this.seq, 'genSeq' );
	}

	loss() {
		this.getInput = false;
		this.os.seqLoad([0,0,0,0,7,0,7,0,7,0], 'loss');
	}

	seqEnd( type ) {
		switch( type ) {
		case 'genSeq':
			this.getInput = true;
			break;
		case 'loss':
			this.flashScore();
			break;
		case 'gameOver':

			break;
		}
	}

	flashScore() {
		if (( this.seq.len - 1 ) < 12 ) {
			this.seqEnd( 'gameOver' );
		} else if (( this.seq.len - 1 ) >= 12 && ( this.seq.len - 1 ) <= 22 ) {
			this.os.flash( 0, 'gameOver', 3 );
		} else if (( this.seq.len - 1 ) >= 23 && ( this.seq.len - 1 ) <= 33 ) {
			this.os.flash( 1, 'gameOver', 3 );
		} else if (( this.seq.len - 1 ) >= 34 ) {
			this.os.flash( 2, 'gameOver', 3 );
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Torpedo
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Torpedo {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.startGame();
	}

	startGame() {
		this.gameOver = false;
		this.sub = this.os.randBtn();
		this.subRow = this.os.btnRow( this.sub );
		this.subCol = this.os.btnCol( this.sub );
		this.lastHit = null;
		this.tries = 0;
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.startGame();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.gameOver )
			return;
		this.os.blast( btn, state );

		if ( !state ) {
			this.tries++
			if ( btn == this.sub ) {
				this.win()
			} else if ( this.tries == 3) {
				this.loss();
			} else {
				var btnRow = this.os.btnRow( btn );
				var btnCol = this.os.btnCol( btn );

				if ( btnRow == this.subRow || btnCol == this.subCol ) {
					this.os.playBip();
				}
			}
		}
	}

	win() {
		this.gameOver = true;
		this.os.seqLoad([0,0,2,4,5,2,5,'-',7,7,8,4,7,7,7,'-'], 'win');
	}

	loss() {
		this.gameOver = true;
		this.os.flash( this.sub, 'loss', 3 );
	}

	seqEnd( label ) {
		this.startGame();
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Tag-It
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Tag_It {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.start();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.inPlay && this.getInput && state ) {
			this.getInput = false;
			if ( this.btnNum == btn ) {
				this.os.playBip( btn );
				this.score++;
			}
		}
	}

	clockTick() {
		if ( this.inPlay ) {	// A game is in progress
			if ( this.newBtn ) {	// Advance light only every other second.
				if ( ++this.count <= 110 ) {
					this.newBtn = false;
					this.btnNum = this.os.randBtn();
					this.os.playBip( this.btnNum, '', true, false );
					this.getInput = true;
				} else {
					this.endGame();
				}
			} else {
				this.newBtn = true;
			}
		}
	}

	start() {
		this.count = 0;
		this.score = 0;
		this.inPlay = true;
	}

	endGame() {
		this.inPlay = false;
		this.os.seqLoad([ 8, 8, 8, 5, 5, 7, 6, 6, 6, 4, 4, 4 ], 'endGame', false, true)
	}

	showScore() {
		if ( this.score < 10 ) {
			this.seqEnd( 'score' );
		} else if ( this.score < 20 ) {
			this.os.flash( 0, 'score', 3 );
		} else if ( this.score < 30 ) {
			this.os.flash( 1, 'score', 3 );
		} else if ( this.score < 40 ) {
			this.os.flash( 2, 'score', 3 );
		} else if ( this.score < 50 ) {
			this.os.flash( 3, 'score', 3 );
		} else if ( this.score < 60 ) {
			this.os.flash( 4, 'score', 3 );
		} else if ( this.score < 70 ) {
			this.os.flash( 5, 'score', 3 );
		} else if ( this.score < 80 ) {
			this.os.flash( 6, 'score', 3 );
		} else if ( this.score < 90 ) {
			this.os.flash( 7, 'score', 3 );
		} else if ( this.score < 100 ) {
			this.os.flash( 8, 'score', 3 );
		} else if ( this.score < 110 ) {
			this.os.flash( 9, 'score', 3 );
		} else {
			this.os.flash( 10, 'score', 3 );
		}
	}

	seqEnd( label ) {
		switch( label ) {
		case 'endGame':
			this.showScore();
			break;
		case 'score':
			this.os.selectPgm( this.id );
			break;
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Roulette
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Roulette {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.wheel = [4,8,9,10,11,7,3,2,1,0];
		this.btnEnable = true;
		this.spin(); 
	}

	btnClick( btnName ) {
		if ( this.btnEnable ) {
			switch( btnName ) {
			case 'start':
				this.spin();
				break;
			case 'select':
				this.os.selectPgm( this.id );
				break;
			}
		}
	}

	clockTick() {
		if ( !this.btnEnable ) {
			if ( this.count++ < this.ticks ) {
				if ( ++this.idx >= 10 ) {
					this.idx = 0;
				}
				this.os.flasher = true;
				this.os.clear();
				this.os.blast( this.wheel[ this.idx ], true, true, false );
			} else {
				this.os.flash( this.wheel[ this.idx ], 'gameOver', 3 );
				this.btnEnable = true;
			}
		}
	}

	spin() {
		this.btnEnable = false;
		this.ticks = this.os.randRange( 11, 40 );
		this.count = 0;
		this.idx = this.wheel.length;
		this.os.clkReset();
	}

	seqEnd( label ) {
		switch( label ) {
		case 'gameOver':
			this.os.blast( this.wheel[ this.idx ], true, true, false );
			break;
		}
		this.btnEnable = true;
	}

};


/* -----------------------------------------------------------------------------
CLASS:			Baseball
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Baseball {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.scoreboard = new Scoreboard( this );
		this.os.sysMem = this;
		this.pitchBall = false;
		this.hit = false;
		this.run = false;
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'select':
			this.os.selectPgm( this.id );
			break;
		case 'start':
			this.pitchBall = true;
			this.hit = false;
			this.run = false;
			this.scoreboard.windup();
			break;
		case 'playhit':
			this.hitBall();
			break;
		}
	}

	clockTick() {
		this.scoreboard.update();
		if ( this.pitchBall ) {
			this.os.flasher = true;
			this.btnNum = this.os.randBtn();
			this.os.clear();
			this.os.blast( this.btnNum, true, true, false );
			this.scoreboard.pitch( this.btnNum );
		} else if ( this.hit ) {
			this.hit = false;
			this.os.flash( this.btnNum, 'hit', 3 );
		} else if ( this.run ) {
			this.run = this.scoreboard.run();
		}
	}

	hitBall() {
		this.pitchBall = false;
		this.hit = true;
	}

	seqEnd( label ) {
		switch( label ) {
		case 'hit':
			this.scoreboard.hit( this.btnNum );
			this.os.flash( this.btnNum, '', 0, true, false );
			this.run = true;
			break;
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Scoreboard
DESCRIPTION:		Monitors and displays progress for Baseball.
----------------------------------------------------------------------------- */
class Scoreboard{
	constructor( game ) {
		this.game = game;
		this.outcome = [
			'Triple',
			'Out',
			'Out',
			'Single',
			'Out',
			'Home Run',
			'Out',
			'Out',
			'Single',
			'Out',
			'Double',
			'Out'
		];
		this.manpage = document.getElementById('manpage');
		this.scoreboard = this.manpage.contentDocument? this.manpage.contentDocument: this.manpage.contentWindow.document;
		this.outs = null;

		var hitHtml = '';

		for ( var row = 0; row < NUM_ROWS; row++ ) {
			hitHtml += '<tr>';
			for ( var col = 0; col < NUM_COLS; col++ ) {
				var h = col * NUM_ROWS + row;
				hitHtml += '<td>';
				hitHtml += "<div class='hittype' id='outcome" + h + "'>";
				hitHtml += "<div class='hitcaption'>";
				hitHtml += "<span class='hittext'>" + this.outcome[ h ] + '</span>';
				hitHtml += '</div>';
				hitHtml += '</div></td>';
			}
			hitHtml += '</tr>';
		}

		this.scoreboard.getElementById( 'hitType' ).innerHTML = hitHtml;

		for ( var b = 0; b < 4; b++ ) {
			var plateId = 'plate' + b
			var plate = this.scoreboard.getElementById( plateId );
			if ( plate.getContext ) {
				var context = plate.getContext('2d');
				context.beginPath();
				context.moveTo( 0, 30 );
				context.lineTo( 30, 60 );
				context.lineTo( 60, 30 );
				if ( b == 0 ) {
					context.lineTo( 60, 0 );
					context.lineTo( 0, 0 );
				} else {
					context.lineTo( 30, 0 );
				}
				context.closePath();
				context.stroke();
			}
		}

		this.start()
	}

	start() {
		this.gameOver = false;
		this.inning = 1;
		this.outs = 0;
		this.half = false;
		this.score = [[ 'Away' ], [ 'Home' ]];
		this.rhe = [];
		for ( var i = 0; i <= 1; i++ ) {
			this.rhe[ i ] = [];
			this.rhe[ i ][ 'r' ] = 0;
			this.rhe[ i ][ 'h' ] = 0;
			this.rhe[ i ][ 'e' ] = 0;
		}
		this.bases = [ false, false, false, false ];
	}
	
	windup() {
		if ( this.gameOver ) {
			this.start()
		}
		this.bases[0] = true;
	}

	pitch( btn ) {
		for ( var b = 0; b < NUM_BTNS; b++ ) {
			var cell = this.scoreboard.getElementById( 'outcome' + b )
			cell.style.backgroundColor = '';
		}
		
		var cell = this.scoreboard.getElementById( 'outcome' + btn );
		cell.style.backgroundColor = HUES[ btn ];
	}

	hit( btn ) {
		this.advance = 0;
		switch (this.outcome[ btn ]) {
		case 'Home Run':	// Single
			this.advance += 1;
		case 'Triple':		// Double
			this.advance += 1;
		case 'Double':		// Triple
			this.advance += 1;
		case 'Single':		// Home Run
			this.advance += 1;
			this.rhe[ this.half ? 1 : 0 ][ 'h' ] != null ? this.rhe[ this.half ? 1 : 0 ][ 'h' ]++ : this.rhe[ this.half ? 1 : 0 ][ 'h' ] = 1;
			break;
		case 'Out':		// Out
			this.outs++
			this.advance = 0;
		}
	}

	run() {
		if ( this.advance-- > 0 ) {
			if ( this.bases.pop()) {
				var half = this.half ? 1 : 0;
				this.rhe[ half ][ 'r' ]++;
				if ( isNaN( this.score[ half ][ this.inning ])) {
					this.score[ half ][ this.inning ] = 1;
				} else {
					this.score[ half ][ this.inning ]++;
				}
			}
			this.bases.unshift( false );
			return true;
		} else {
			this.endPlay();
			return false;
		}
	}

	endPlay() {
		if ( this.outs == 3 ) {
			this.retire();
		}
		this.update();
	}

	retire() {
		this.bases = [ false, false, false, false ];
		this.outs = 0;
		this.half = !this.half;
		if ( !this.half ) {
			this.endInning();
		}
	}

	endInning() {
		if ( this.inning >= 9 && ( this.rhe[ 0 ][ 'r' ] != this.rhe[ 1 ][ 'r' ])) {
			this.gameOver = true;
		} else {
			this.inning++;
		}
	}

	update() {
		const AWAY_TEAM = 0;
		const HOME_TEAM = 1;

		var lineScore = function( game ) {
			var scorebox = '<table width=100%>';
			scorebox += '<tr>';
			for ( var inning = 0; inning <= ( game.inning <= 9 ? 9 : game.inning ); inning++ ) {
				scorebox += '<td>' + ( inning == 0 ? 'Team' : inning ) + '</td>'
			}
			scorebox += '<td>&nbsp;</td><td>R</td><td>H</td><td>E</td>'
			scorebox += '</tr>';
			for ( var half = 0; half <= 1; half++ ) {
				scorebox += '<tr id=team' + half + '>';
				for ( var inning = 0; inning <= ( game.inning <= 9 ? 9 : game.inning ); inning++ ) {
					scorebox += '<td>' + ( game.score[ half ][ inning ] != null ? game.score[ half ][ inning ] : 0 ) + '</td>'
				}
				scorebox += '<td>&nbsp;</td><td>' + game.rhe[ half ][ 'r' ] + '</td><td>' + game.rhe[ half ][ 'h' ] + '</td><td>' + game.rhe[ half ][ 'e' ] + '</td>'
				scorebox += '</tr>';
			}
			scorebox += '</table>';
			return scorebox;
		};

		var halfTxt;
		if ( this.half ) {
			halfTxt = "Bottom";
		} else {
			halfTxt = "Top";
		}

		for ( var base = 0; base < 4; base++ ) {
			if ( this.bases[base] ) {
				this.scoreboard.getElementById( 'base'+base ).innerHTML='&#x26be;';
			} else {
				this.scoreboard.getElementById( 'base'+base ).innerHTML=null;
			}
		}

		this.scoreboard.getElementById( 'lineScore' ).innerHTML=lineScore( this );
		if ( this.gameOver ) {
			if ( this.rhe[ 0 ][ 'r' ] > this.rhe[ 1 ][ 'r' ]) {
				this.scoreboard.getElementById( 'team0' ).style = "font-weight: bold;";
			} else {
				this.scoreboard.getElementById( 'team1' ).style = "font-weight: bold;";
			}
			this.scoreboard.getElementById( 'half' ).innerHTML='Final';
			this.scoreboard.getElementById( 'outs' ).innerHTML=3;
		} else {
			this.scoreboard.getElementById( 'outs' ).innerHTML=this.outs;
			this.scoreboard.getElementById( 'half' ).innerHTML=halfTxt;
			this.scoreboard.getElementById( 'inning' ).innerHTML=this.inning;
		}
	}
};

/*
Repeat Plus
*/

class Repeat_Plus {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.seq = [];
		this.gameOver = true;
		this.start();
	}

	start() {
		this.gameOver = false;
		this.seq.length = 0;
		var randBtn = this.os.randBtn();
		this.seq.push( randBtn );
		this.os.seqLoad( this.seq, 'genSeq' )
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.getInput ) {
			this.os.blast( btn, state );
			if ( state ) {
				if ( this.count >= this.seq.length ) {
					this.seq.push( btn );
					this.newTurn = true
				} else if ( btn == this.seq[ this.count ]) {
					this.count++
				} else {
					this.gameOver = true;
				}
			} else {
				if ( this.gameOver ) {
					this.loss();
				} else if ( this.newTurn ) {
					this.getInput = false;
					this.os.playBip( 7, 'success' );
				}
			}
		}
	}

	loss() {
		this.getInput = false;
		this.os.seqLoad([0,0,0,0,7,0,7,0,7,0], 'loss');
	}

	endBip( label ) {
		switch( label ) {
		case 'success':
			this.seqEnd('genSeq');
			break;
		}
	}

	seqEnd( type ) {
		switch( type ) {
		case 'genSeq':
			this.count = 0;
			this.newTurn = false;
			this.getInput = true;
			break;
		case 'loss':
			this.flashScore();
			break;
		case 'gameOver':

			break;
		}
	}

	flashScore() {
		if (( this.seq.len - 1 ) < 12 ) {
			this.seqEnd( 'gameOver' );
		} else if (( this.seq.len - 1 ) >= 12 && ( this.seq.len - 1 ) <= 22 ) {
			this.os.flash( 0, 'gameOver', 3 );
		} else if (( this.seq.len - 1 ) >= 23 && ( this.seq.len - 1 ) <= 33 ) {
			this.os.flash( 1, 'gameOver', 3 );
		} else if (( this.seq.len - 1 ) >= 34 ) {
			this.os.flash( 2, 'gameOver', 3 );
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Treasure_Hunt
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Treasure_Hunt {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.seq = [];
		this.presses = [];
		this.gameOver = true;
		this.start();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.gameOver )
			return;
		if ( this.getInput || !state ) {
			this.os.blast( btn, state );
		}
		if ( state ) {
			this.presses[ this.tries++ ] = btn;
		} else {
			if ( this.tries == 3) {
				this.getInput = false;
				this.score();
			}
		}
	}

	start() {
		for ( var idx = 0; idx < 3; idx++ ) {
			this.seq[ idx ] = this.os.randBtn();
		}
		this.gameOver = false;
		this.getInput = true;
		this.tries = 0;
	}

	score() {
		var matches = 0;
		for ( var idx = 0; idx < 3; idx++ ) {
			if ( this.seq[ idx ] == this.presses[ idx ]) {
				matches++;
			}
		}
		switch( matches ) {
		case 0:
			this.loss();
			break;
		case 1:
			this.os.flash( 0, 'score', 3, true, false );
			break;
		case 2:
			this.os.flash([ 0, 1 ], 'score', 3, true, false );
			break;
		case 3:
			this.win();
			break;
		}
	}

	seqEnd( label ) {
		switch ( label ) {
		case 'score':
			if ( !this.gameOver ) {
				this.tries = 0;
				this.getInput = true;
			}
			break;
		case 'gameOver':
			this.gameOver = true;
			this.start();
			break;	
		}
	}

	win() {
		this.os.seqLoad([ 5, 5, 5, '-', 1, 2, 1, 2 ], 'gameOver' );
	}

	loss() {
		this.os.seqLoad( this.seq, 'gameOver', true, false );
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Compete
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Compete {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.start();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.inPlay ) {
			this.inPlay = false;
			if ( state ) {

				// Determine player who hit their button first
				if ( !( btn >= 4 && btn <= 7 )) {
					this.os.clear();
					this.os.blast( btn, true );
					if ( btn <= 3 ) {
						this.player = 0;
					} else if ( btn >= 8 ) {
						this.player = 1;
					}
				}

				// Determine if button pressed is correct, and if not, award the opposite player.
				if ( btn == this.target[ this.player ]) {
					this.winner = this.player;
				} else {
					this.winner = !this.player * 1;
				}
				this.hit = btn;
			}
		} else if ( !state && btn == this.hit ) {
			this.os.clear();
			if ( ++this.points[ this.winner ] >= 5 ) {
				this.score();
			} else {
				this.run();
			}
		}
	}

	score() {
		if ( this.winner ) {
			this.os.seqLoad([ 8, 9, 10, 11, 10, 9, 8 ], 'win', true, false );
		} else {
			this.os.seqLoad([ 0, 1, 2, 3, 2, 1, 0 ], 'win', true, false );
		}
	}

	clockTick() {
		if ( this.sweep ) {
			this.os.playBip( this.curBtn, '', true, false );
			this.randBtn = this.os.randBtn();

			if ( this.ascend ) {
				this.curBtn++;
			} else {
				this.curBtn--;
			}

			if ( this.curBtn <= 4 || this.curBtn >= 7 ) {
				this.ascend = !this.ascend;
			}

			if ( this.curBtn == this.randBtn && this.steps > 3 ) {
				this.sweep = false;
				this.inPlay = true;
				this.os.flash( this.curBtn, 'inPlay', 3, true, false );
				this.target = [ this.curBtn - 4, this.curBtn + 4 ];
			} else {
				this.steps++;
			}
		}
	}

	seqEnd( label ) {
		switch ( label ) {
		case 'inPlay':
			this.inPlay = false;
			this.run();
		}
	}

	advanceBtn() {
		if ( this.ascend ) {
			this.curBtn++;
		} else {
			this.curBtn--;
		}
		if ( this.curBtn <= 4 || this.curBtn >= 7 ) {
			this.ascend = !this.ascend;
		}
	}

	start() {
		this.gameOver = !this.gameOver;
		this.points = [ 0, 0 ];
		this.run();
	}

	run() {
		this.ascend = true;
		this.curBtn = 4;
		this.steps = 0;
		this.sweep = true;
		this.player = null;
		this.hit = null;
		this.winner = null;
	}

	randBtn() {
		var randBtn = os.randRange(4,7);
		alert(randBtn);
	}

};

/* -----------------------------------------------------------------------------
CLASS:			Fire_Away
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Fire_Away {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.start();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		if ( this.sweep ) {
			if ( this.os.btnCol( btn ) == 2 ) {
				if ( !state ) {
					if ( this.target == btn ) {
						this.hit( btn );
					} else {
						var possDir = this.minMaxDir( btn );
						var dir = this.os.randRange( possDir[0], possDir[1] );
						var shot = btn - 4 + dir;
						if ( this.target == shot ) {
							this.hit( btn );
						} else {
							this.miss( btn );
						}
					}
				}
			}
		}
	}

	clockTick() {
		if ( this.sweep ) {
			this.advance = !this.advance;
			if ( this.advance ) {
				if ( ++this.possFire > 1 ) {
					this.missile = null;
					this.target = null;
				}
				if ( this.ascend ) {
					this.curBtn++;
				} else {
					this.curBtn--;
				}

				if ( this.curBtn <= 0 || this.curBtn >= 3 ) {
					this.ascend = !this.ascend;
				}
				this.os.playBip( this.curBtn, '', true, false );
			} else {
				if ( this.possFire > 1 && this.os.randRange( 0, 3 ) == this.curBtn ) {
					this.shots++
					this.possFire = 0;
					var possDir = this.minMaxDir( this.curBtn );
					var dir = this.os.randRange( possDir[0], possDir[1] );
					this.missile = this.curBtn + 4 + dir;
					this.target = this.missile + 4 + dir;
					this.os.playBip( this.missile, '', true, false );
				}
			}
			if ( this.shots >= 13 ) {
				this.sweep = false;
				this.score();
			}
		}
	}

	start() {
		this.gameOver = false;
		this.shots = 0;
		this.hits = 0;

		this.curBtn = 1;
		this.advance = true;
		this.ascend = false;
		this.possFire = 0;

		this.sweep = true;
	}

	minMaxDir( btn ) {
		var min = -1;
		var max = 1;

		var btnRow = this.os.btnRow( btn );
		var btnCol = this.os.btnCol( btn );

		if ( btnCol == 0 ) {
			if ( btnRow <= 1 ) {
				min = 0;
			} else {
				max = 0;
			}
		} else if ( btnCol == 2 ) {
			if ( btnRow == 0 ) {
				min = 0;
			} else if ( btnRow == 3 ) {
				max = 0;
			}
		}
		return [ min, max ];
	}

	hit( btn ) {
		this.os.playBip( btn, '', true, false );
		this.hits++
	}

	miss( btn ) {
		this.os.playBip( btn, '', true, true );
	}

	score() {
		if ( this.hits == 0 ) {
			
		} else if ( this.hits == 13 ) {
			
		} else {
			this.os.flash( this.hits - 1, 'score', 3, true, false );
		}
	}

	seqEnd( label ) {
		switch( label ) {
		case 'score':
			this.os.selectPgm( this.id );
			break;
		}
	}
};

/* -----------------------------------------------------------------------------
CLASS:			Hide_N_Seek
DESCRIPTION:		Game logic
----------------------------------------------------------------------------- */
class Hide_N_Seek {
	constructor( os, id ) {
		this.os = os;
		this.id = id;
		this.os.sysMem = this;
		this.seq = [];
		this.presses = [];
		this.gameOver = true;
		this.start();
	}

	btnClick( btnName ) {
		switch( btnName ) {
		case 'start':
			this.start();
			break;
		case 'select':
			this.os.selectPgm( this.id );
			break;
		}
	}

	button( btn, state ) {
		// Only process button press if game isn't over
		if ( this.gameOver || btn < 8 || btn > 11)
			return;
		// Are we accepting presses at this time?
		if ( this.getInput || !state ) {
			this.os.blast( btn, state );
		}
		// Was the button pressed, or released?
		if ( state ) {
			this.presses[ this.tries++ ] = btn;
		} else {
			if ( this.tries == 3) {
				this.getInput = false;
				this.score();
			}
		}
	}

	start() {
		// Generate new sequence
		this.seq.length = 0;
		for ( var idx = 0; idx < 3; idx++ ) {
			var randBtn = this.os.randRange( 8, 11 )
			this.seq[ idx ] = randBtn;
		}

		this.rndCount = this.symCount( this.seq );

		// Begin new game
		this.gameOver = false;
		this.getInput = true;
		this.tries = 0;
	}

	score() {
		var matches = 0;
		var numbers = 0;

		// Count number of matches
		for ( var idx = 0; idx < 3; idx++ ) {
			if ( this.seq[ idx ] == this.presses[ idx ]) {
				matches++;
			}
		}

		if ( matches == 0 ) {
			// No matches
			this.loss();
		} else if ( matches == 3 ) {
			// All matches
			this.win();
		} else {
			// Some matches - count number of correct numbers in wrong position
			var btnCount = this.symCount( this.presses );

			var rndTxt = '';
			var btnTxt = '';

			for ( var idx = 0; idx < 12; idx++ ) {
				var rnd = this.rndCount[ idx ];
				var btn = btnCount[ idx ];


				rndTxt += ' ' + rnd;
				btnTxt += ' ' + btn;

				if ( rnd > 0 && btn > 0 ) {
					if ( rnd > btn ) {
						numbers += btn;
					} else {
						numbers += rnd;
					}
				}
			}

			var matchLights = [];
			switch ( matches ) {
			case 1:
				matchLights = [ 4 ];
				break;
			case 2:
				matchLights = [ 4, 5 ];
				break;
			}

			var numberLights = [];
			switch ( numbers ) {
			case 1:
				numberLights = [ 0 ];
				break;
			case 2:
				numberLights = [ 0, 1 ];
				break;
			case 3:
				numberLights = [ 0, 1, 2 ];
				break;
			}

			var scoreLights = numberLights.concat( matchLights );
			this.os.flash( scoreLights, 'score', 3 );
		}
	}

	symCount( symArray ) {
		var result = [];
		for ( var btn = 0; btn < NUM_BTNS; btn++ ) {
			result[ btn ] = 0;
		}

		for  ( var idx = 0; idx < 3; idx++ ) {
			++result[ symArray[ idx ]]
		}

		return result;
	}

	seqEnd( label ) {
		switch ( label ) {
		case 'score':
			if ( !this.gameOver ) {
				this.tries = 0;
				this.getInput = true;
			}
			break;
		case 'gameOver':
			this.gameOver = true;
			this.start();
			break;	
		}
	}

	win() {
		this.os.seqLoad([ 5, 5, 5, '-', 1, 2, 1, 2 ], 'gameOver' );
	}

	loss() {
		this.os.seqLoad( this.seq, 'gameOver' );
	}
};

class Debug {
	constructor() {
		this.registers = {};
		this.doDebug = false;
	}

	clear() {
		delete this.registers;
		this.registers = {};
		document.getElementById('registers').innerHTML = '';
	}

	/* -----------------------------------------------------------------------------
	FUNCTION:		Debug::bug
	CALL:			DEBUG.bug( error, this, this.function.name, arguments );
	DESCRIPTION:		Print exception report in alert box
	RETURNS:		Nothing (Void Function)
	----------------------------------------------------------------------------- */

	bug( err, obj, func, args ) {
		var alertTxt = '*** BUG - ';
		alertTxt += obj.constructor.name + '::' + func + '( ';

		var first = true;
		for ( var arg of args ) {
			if ( first ) {
				first = false;
			} else {
				alertTxt += ', ';
			}
			alertTxt += arg
		}

		alertTxt += ' )\n';

		alertTxt += 'Error - ' + err;

		alert( alertTxt );
	}

	genTable() {
		if ( this.doDebug ) {
			var dbgHtml = 'Registers:<br />';
			dbgHtml += '<table width=100%>';
			for ( var label in this.registers ) {
				dbgHtml += '<tr><th colspan=2 align=left>' + label + '</th></tr>';
				for ( var key in this.registers[ label ]) {
					dbgHtml += '<tr><td align=right>' + key + ':</td><td width=100% id=' + key + '>' +'</td></tr>'
				}
			}
			dbgHtml += '</table>';
			document.getElementById('registers').innerHTML = dbgHtml;
		}
	}

	update( label, memory ) {
		this.registers[ label ] = {};
		for ( var key in memory ) {
			if ( typeof memory[ key ] !== 'function' && memory[ key ] != '[object Object]' ){
				this.registers[ label ][ key ] = memory[ key ];
			}
		}
	}

	print() {
		if ( this.doDebug ) {
			for ( var label in this.registers ) {
				for ( var key in this.registers[ label ]) {
					if ( hw.power ) {
						document.getElementById( key ).innerHTML = this.registers[ label ][ key ];
					}
				}
			}
		}
	}

	toggle() {
		this.doDebug = !this.doDebug;
		var dbgBtn = document.getElementById('dbgBtn');
		if ( this.doDebug ) {
			dbgBtn.innerHTML = 'Enabled';
			this.genTable();
			this.update();
			this.print();
		} else {
			dbgBtn.innerHTML = 'Disabled'
			this.clear();
		}
	}
};

/* -----------------------------------------------------------------------------
FUNCTION:		IIFE
DESCRIPTION:		Generates HTML code for Tandy-12 buttons and adds them
			to the main page.
----------------------------------------------------------------------------- */

(function() {
	var btnTxt = [
		"Organ",
		"Song Writer",
		"Repeat",
		"Torpedo",
		"Tag-It",
		"Roulette",
		"Baseball",
		"Repeat Plus",
		"Treasure Hunt",
		"Compete",
		"Fire Away",
		"Hide'N Seek"
	];
	var boardHtml = ""

	/*
	 * Generate Boot Selector
	 */
	var progs = [
		'Boot',
		'Picker'
	]

	var dbgBootprog = document.getElementById('STARTUP_PROG');

	for ( var progIdx = 0; progIdx < progs.length; progIdx++ ) {
		var opt = document.createElement("option");
		opt.text = progs[ progIdx ];
		dbgBootprog.add( opt );
	}

	/*
	 * Generate Main Console
	 */
	var playfield = document.getElementById("playfield");

	for ( var r = 0; r < NUM_ROWS; r++ ) {
		var row = playfield.insertRow( r );
		for ( var c = 0; c < NUM_COLS; c++ ) {

			// Retrieve elements
			var cell = row.insertCell( c );
			var btnNum = ( c * NUM_ROWS ) + r;
			var btnMain = document.createElement('div');
			var btnCaption = document.createElement('div');
			var btnCaptionTxt = document.createTextNode( btnTxt [ btnNum ] );

			btnMain.className = 'btnMain';
			btnMain.id = 'btnMain' + btnNum;
			btnMain.innerHTML = btnNum + 1;

			btnCaption.className = 'btnCaption';
			btnCaption.appendChild( btnCaptionTxt );

			cell.appendChild( btnMain );
			cell.appendChild( btnCaption );
		}
	}

	CONFIG = new Config();
	DEBUG = new Debug();
	hw = new Tandy12();
})();
