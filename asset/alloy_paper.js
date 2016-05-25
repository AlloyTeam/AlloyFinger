/* Alloy Game Engine
 * By AlloyTeam http://www.alloyteam.com/
 * Github: https://github.com/AlloyTeam/AlloyGameEngine
 * MIT Licensed.
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.AlloyPaper = factory();
    }
}(this, function () {
'use strict';

// The base Class implementation (does nothing)
var Class = function () { };

// Create a new Class that inherits from this class
Class.extend = function (prop) {
    var _super = this.prototype;
    var prototype = Object.create(_super);

    // Copy the properties over onto the new prototype
    for (var name in prop) {
        if (name != "statics") {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function"  ?
                (function (temp_name, fn) {
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[temp_name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
    }

    // The dummy class constructor
    function _Class() {
        // All construction is actually done in the init method

        this.ctor.apply(this, arguments);
    }

    //继承父类的静态属性
    for (var key in this) {
        if (this.hasOwnProperty(key) && key != "extend")
            _Class[key] = this[key];
    }

    // Populate our constructed prototype object
    _Class.prototype = prototype;

    _Class.prototype._super = Object.create(_super);
    //静态属性和方法
    if (prop.statics) {
        for (var key in prop.statics) {
            if (prop.statics.hasOwnProperty(key)) {
                _Class[key] = prop.statics[key];
                if (key == "ctor") {
                    //提前执行静态构造函数
                    _Class[key]();
                }
            }

        }
    }

    // Enforce the constructor to be what we expect
    _Class.prototype.constructor = _Class;

    // And make this class extendable
    _Class.extend = Class.extend;

    return _Class;
};

window.Class = Class;
//AlloyPaper
var AlloyPaper={};

AlloyPaper.DefaultCursor = "default";

AlloyPaper.Cache = {};
AlloyPaper.TWEEN = Class.extend({
    "statics": {
        "ctor": function() {
            if (Date.now === undefined) {
                Date.now = function() {
                    return new Date().valueOf();
                };
            }
            this._tweens = [];
        },
        "REVISION": "14",
        "getAll": function() {
            return this._tweens;
        },
        "removeAll": function() {
            this._tweens = [];
        },
        "add": function(tween) {
            this._tweens.push(tween);
        },
        "remove": function(tween) {
            var i = this._tweens.indexOf(tween);
            if (i !== -1) {
                this._tweens.splice(i, 1);
            }
        },
        "update": function(time) {
            if (this._tweens.length === 0) return false;
            var i = 0;
            time = time !== undefined ? time : typeof window !== "undefined" && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now();
            while (i < this._tweens.length) {
                if (this._tweens[i].update(time)) {
                    i++;
                } else {
                    this._tweens.splice(i, 1);
                }
            }
            return true;
        },
        "Tween": function(object) {
            var _object = object;
            var _valuesStart = {};
            var _valuesEnd = {};
            var _valuesStartRepeat = {};
            var _duration = 1e3;
            var _repeat = 0;
            var _yoyo = false;
            var _isPlaying = false;
            var _reversed = false;
            var _delayTime = 0;
            var _startTime = null;
            var _easingFunction = AlloyPaper.TWEEN.Easing.Linear.None;
            var _interpolationFunction = AlloyPaper.TWEEN.Interpolation.Linear;
            var _chainedTweens = [];
            var _onStartCallback = null;
            var _onStartCallbackFired = false;
            var _onUpdateCallback = null;
            var _onCompleteCallback = null;
            var _onStopCallback = null;
            var _paused = false,
                _passTime = null;
            for (var field in object) {
                _valuesStart[field] = parseFloat(object[field], 10);
            }
            this.toggle = function() {
                if (_paused) {
                    this.play();
                } else {
                    this.pause();
                }
            };
            this.pause = function() {
                _paused = true;
                var pauseTime = typeof window !== "undefined" && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now();
                _passTime = pauseTime - _startTime;
            };
            this.play = function() {
                _paused = false;
                var nowTime = typeof window !== "undefined" && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now();
                _startTime = nowTime - _passTime;
            };
            this.to = function(properties, duration) {
                if (duration !== undefined) {
                    _duration = duration;
                }
                _valuesEnd = properties;
                return this;
            };
            this.start = function(time) {
                AlloyPaper.TWEEN.add(this);
                _isPlaying = true;
                _onStartCallbackFired = false;
                _startTime = time !== undefined ? time : typeof window !== "undefined" && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now();
                _startTime += _delayTime;
                for (var property in _valuesEnd) {
                    if (_valuesEnd[property] instanceof Array) {
                        if (_valuesEnd[property].length === 0) {
                            continue;
                        }
                        _valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);
                    }
                    _valuesStart[property] = _object[property];
                    if (_valuesStart[property] instanceof Array === false) {
                        _valuesStart[property] *= 1;
                    }
                    _valuesStartRepeat[property] = _valuesStart[property] || 0;
                }
                return this;
            };
            this.stop = function() {
                if (!_isPlaying) {
                    return this;
                }
                AlloyPaper.TWEEN.remove(this);
                _isPlaying = false;
                if (_onStopCallback !== null) {
                    _onStopCallback.call(_object);
                }
                this.stopChainedTweens();
                return this;
            };
            this.stopChainedTweens = function() {
                for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
                    _chainedTweens[i].stop();
                }
            };
            this.delay = function(amount) {
                _delayTime = amount;
                return this;
            };
            this.repeat = function(times) {
                _repeat = times;
                return this;
            };
            this.yoyo = function(yoyo) {
                _yoyo = yoyo;
                return this;
            };
            this.easing = function(easing) {
                _easingFunction = easing;
                return this;
            };
            this.interpolation = function(interpolation) {
                _interpolationFunction = interpolation;
                return this;
            };
            this.chain = function() {
                _chainedTweens = arguments;
                return this;
            };
            this.onStart = function(callback) {
                _onStartCallback = callback;
                return this;
            };
            this.onUpdate = function(callback) {
                _onUpdateCallback = callback;
                return this;
            };
            this.onComplete = function(callback) {
                _onCompleteCallback = callback;
                return this;
            };
            this.onStop = function(callback) {
                _onStopCallback = callback;
                return this;
            };
            this.update = function(time) {
                if (_paused) return true;
                var property;
                if (time < _startTime) {
                    return true;
                }
                if (_onStartCallbackFired === false) {
                    if (_onStartCallback !== null) {
                        _onStartCallback.call(_object);
                    }
                    _onStartCallbackFired = true;
                }
                var elapsed = (time - _startTime) / _duration;
                elapsed = elapsed > 1 ? 1 : elapsed;
                var value = _easingFunction(elapsed);
                for (property in _valuesEnd) {
                    var start = _valuesStart[property] || 0;
                    var end = _valuesEnd[property];
                    if (end instanceof Array) {
                        _object[property] = _interpolationFunction(end, value);
                    } else {
                        if (typeof end === "string") {
                            end = start + parseFloat(end, 10);
                        }
                        if (typeof end === "number") {
                            _object[property] = start + (end - start) * value;
                        }
                    }
                }
                if (_onUpdateCallback !== null) {
                    _onUpdateCallback.call(_object, value);
                }
                if (elapsed == 1) {
                    if (_repeat > 0) {
                        if (isFinite(_repeat)) {
                            _repeat--;
                        }
                        for (property in _valuesStartRepeat) {
                            if (typeof _valuesEnd[property] === "string") {
                                _valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
                            }
                            if (_yoyo) {
                                var tmp = _valuesStartRepeat[property];
                                _valuesStartRepeat[property] = _valuesEnd[property];
                                _valuesEnd[property] = tmp;
                            }
                            _valuesStart[property] = _valuesStartRepeat[property];
                        }
                        if (_yoyo) {
                            _reversed = !_reversed;
                        }
                        _startTime = time + _delayTime;
                        return true;
                    } else {
                        if (_onCompleteCallback !== null) {
                            _onCompleteCallback.call(_object);
                        }
                        for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
                            _chainedTweens[i].start(time);
                        }
                        return false;
                    }
                }
                return true;
            };
        },
        "Easing": {
            "Linear": {
                "None": function(k) {
                    return k;
                }
            },
            "Quadratic": {
                "In": function(k) {
                    return k * k;
                },
                "Out": function(k) {
                    return k * (2 - k);
                },
                "InOut": function(k) {
                    if ((k *= 2) < 1) return.5 * k * k;
                    return -.5 * (--k * (k - 2) - 1);
                }
            },
            "Cubic": {
                "In": function(k) {
                    return k * k * k;
                },
                "Out": function(k) {
                    return --k * k * k + 1;
                },
                "InOut": function(k) {
                    if ((k *= 2) < 1) return.5 * k * k * k;
                    return.5 * ((k -= 2) * k * k + 2);
                }
            },
            "Quartic": {
                "In": function(k) {
                    return k * k * k * k;
                },
                "Out": function(k) {
                    return 1 - --k * k * k * k;
                },
                "InOut": function(k) {
                    if ((k *= 2) < 1) return.5 * k * k * k * k;
                    return -.5 * ((k -= 2) * k * k * k - 2);
                }
            },
            "Quintic": {
                "In": function(k) {
                    return k * k * k * k * k;
                },
                "Out": function(k) {
                    return --k * k * k * k * k + 1;
                },
                "InOut": function(k) {
                    if ((k *= 2) < 1) return.5 * k * k * k * k * k;
                    return.5 * ((k -= 2) * k * k * k * k + 2);
                }
            },
            "Sinusoidal": {
                "In": function(k) {
                    return 1 - Math.cos(k * Math.PI / 2);
                },
                "Out": function(k) {
                    return Math.sin(k * Math.PI / 2);
                },
                "InOut": function(k) {
                    return.5 * (1 - Math.cos(Math.PI * k));
                }
            },
            "Exponential": {
                "In": function(k) {
                    return k === 0 ? 0 : Math.pow(1024, k - 1);
                },
                "Out": function(k) {
                    return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
                },
                "InOut": function(k) {
                    if (k === 0) return 0;
                    if (k === 1) return 1;
                    if ((k *= 2) < 1) return.5 * Math.pow(1024, k - 1);
                    return.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
                }
            },
            "Circular": {
                "In": function(k) {
                    return 1 - Math.sqrt(1 - k * k);
                },
                "Out": function(k) {
                    return Math.sqrt(1 - --k * k);
                },
                "InOut": function(k) {
                    if ((k *= 2) < 1) return -.5 * (Math.sqrt(1 - k * k) - 1);
                    return.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
                }
            },
            "Elastic": {
                "In": function(k) {
                    var s, a = .1,
                        p = .4;
                    if (k === 0) return 0;
                    if (k === 1) return 1;
                    if (!a || a < 1) {
                        a = 1;
                        s = p / 4;
                    } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                    return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                },
                "Out": function(k) {
                    var s, a = .1,
                        p = .4;
                    if (k === 0) return 0;
                    if (k === 1) return 1;
                    if (!a || a < 1) {
                        a = 1;
                        s = p / 4;
                    } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                    return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1;
                },
                "InOut": function(k) {
                    var s, a = .1,
                        p = .4;
                    if (k === 0) return 0;
                    if (k === 1) return 1;
                    if (!a || a < 1) {
                        a = 1;
                        s = p / 4;
                    } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                    if ((k *= 2) < 1) return -.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                    return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * .5 + 1;
                }
            },
            "Back": {
                "In": function(k) {
                    var s = 1.70158;
                    return k * k * ((s + 1) * k - s);
                },
                "Out": function(k) {
                    var s = 1.70158;
                    return --k * k * ((s + 1) * k + s) + 1;
                },
                "InOut": function(k) {
                    var s = 1.70158 * 1.525;
                    if ((k *= 2) < 1) return.5 * (k * k * ((s + 1) * k - s));
                    return.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
                }
            },
            "Bounce": {
                "In": function(k) {
                    return 1 - AlloyPaper.TWEEN.Easing.Bounce.Out(1 - k);
                },
                "Out": function(k) {
                    if (k < 1 / 2.75) {
                        return 7.5625 * k * k;
                    } else if (k < 2 / 2.75) {
                        return 7.5625 * (k -= 1.5 / 2.75) * k + .75;
                    } else if (k < 2.5 / 2.75) {
                        return 7.5625 * (k -= 2.25 / 2.75) * k + .9375;
                    } else {
                        return 7.5625 * (k -= 2.625 / 2.75) * k + .984375;
                    }
                },
                "InOut": function(k) {
                    if (k < .5) return AlloyPaper.TWEEN.Easing.Bounce.In(k * 2) * .5;
                    return AlloyPaper.TWEEN.Easing.Bounce.Out(k * 2 - 1) * .5 + .5;
                }
            }
        },
        "Interpolation": {
            "Linear": function(v, k) {
                var m = v.length - 1,
                    f = m * k,
                    i = Math.floor(f),
                    fn = AlloyPaper.TWEEN.Interpolation.Utils.Linear;
                if (k < 0) return fn(v[0], v[1], f);
                if (k > 1) return fn(v[m], v[m - 1], m - f);
                return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
            },
            "Bezier": function(v, k) {
                var b = 0,
                    n = v.length - 1,
                    pw = Math.pow,
                    bn = AlloyPaper.TWEEN.Interpolation.Utils.Bernstein,
                    i;
                for (i = 0; i <= n; i++) {
                    b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
                }
                return b;
            },
            "CatmullRom": function(v, k) {
                var m = v.length - 1,
                    f = m * k,
                    i = Math.floor(f),
                    fn = AlloyPaper.TWEEN.Interpolation.Utils.CatmullRom;
                if (v[0] === v[m]) {
                    if (k < 0) i = Math.floor(f = m * (1 + k));
                    return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
                } else {
                    if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
                    if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
                    return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
                }
            },
            "Utils": {
                "Linear": function(p0, p1, t) {
                    return (p1 - p0) * t + p0;
                },
                "Bernstein": function(n, i) {
                    var fc = AlloyPaper.TWEEN.Interpolation.Utils.getFactorial();
                    return fc(n) / fc(i) / fc(n - i);
                },
                "getFactorial": function() {
                    return function() {
                        var a = [1];
                        return function(n) {
                            var s = 1,
                                i;
                            if (a[n]) return a[n];
                            for (i = n; i > 1; i--) s *= i;
                            return a[n] = s;
                        };
                    }();
                },
                "CatmullRom": function(p0, p1, p2, p3, t) {
                    var v0 = (p2 - p0) * .5,
                        v1 = (p3 - p1) * .5,
                        t2 = t * t,
                        t3 = t * t2;
                    return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
                }
            }
        }
    }
});


//begin-------------------AlloyPaper.Dom---------------------begin

AlloyPaper.Dom = Class.extend({
    "statics": {
        "get": function(selector) {
            this.element = document.querySelector(selector);
            return this;
        },
        "on": function(type, fn) {
            this.element.addEventListener(type, fn, false);
            return this;
        }
    }
});

//end-------------------AlloyPaper.Dom---------------------end


//begin-------------------AlloyPaper.FPS---------------------begin

AlloyPaper.FPS = Class.extend({
    "statics": {
        "get": function() {
            if (!this.instance) this.instance = new this();
            this.instance._computeFPS();
            return this.instance;
        }
    },
    "ctor": function() {
        this.last = new Date();
        this.current = null;
        this.lastMeasured=new Date();
        this.fpsList = [];
        this.totalValue = 0;
        this.value = 60;
      
    },
    "_computeFPS": function() {
        this.current = new Date();
        if (this.current - this.last > 0) {
            var fps = Math.ceil(1e3 / (this.current - this.last));
            this.fpsList.push(fps);
           
            this.totalValue += fps;
            this.last = this.current;
         
       
        }
        if (this.current - this.lastMeasured > 1000) {

            this.value =Math.ceil( this.totalValue / this.fpsList.length);
            this.totalValue = 0;
            this.fpsList.length = 0;
            this.lastMeasured = this.current;

        }
    }
});

//end-------------------AlloyPaper.FPS---------------------end

AlloyPaper.Keyboard = Class.extend({
    "statics": {
        "ctor": function() {
            var KeyboardJS = {},
                locales = {},
                locale, map, macros, activeKeys = [],
                bindings = [],
                activeBindings = [],
                activeMacros = [],
                aI, usLocale;
            usLocale = {
                map: {
                    "3": ["cancel"],
                    "8": ["backspace"],
                    "9": ["tab"],
                    "12": ["clear"],
                    "13": ["enter"],
                    "16": ["shift"],
                    "17": ["ctrl"],
                    "18": ["alt", "menu"],
                    "19": ["pause", "break"],
                    "20": ["capslock"],
                    "27": ["escape", "esc"],
                    "32": ["space", "spacebar"],
                    "33": ["pageup"],
                    "34": ["pagedown"],
                    "35": ["end"],
                    "36": ["home"],
                    "37": ["left"],
                    "38": ["up"],
                    "39": ["right"],
                    "40": ["down"],
                    "41": ["select"],
                    "42": ["printscreen"],
                    "43": ["execute"],
                    "44": ["snapshot"],
                    "45": ["insert", "ins"],
                    "46": ["delete", "del"],
                    "47": ["help"],
                    "91": ["command", "windows", "win", "super", "leftcommand", "leftwindows", "leftwin", "leftsuper"],
                    "92": ["command", "windows", "win", "super", "rightcommand", "rightwindows", "rightwin", "rightsuper"],
                    "145": ["scrolllock", "scroll"],
                    "186": ["semicolon", ";"],
                    "187": ["equal", "equalsign", "="],
                    "188": ["comma", ","],
                    "189": ["dash", "-"],
                    "190": ["period", "."],
                    "191": ["slash", "forwardslash", "/"],
                    "192": ["graveaccent", "`"],
                    "219": ["openbracket", "["],
                    "220": ["backslash", "\\"],
                    "221": ["closebracket", "]"],
                    "222": ["apostrophe", "'"],
                    "48": ["zero", "0"],
                    "49": ["one", "1"],
                    "50": ["two", "2"],
                    "51": ["three", "3"],
                    "52": ["four", "4"],
                    "53": ["five", "5"],
                    "54": ["six", "6"],
                    "55": ["seven", "7"],
                    "56": ["eight", "8"],
                    "57": ["nine", "9"],
                    "96": ["numzero", "num0"],
                    "97": ["numone", "num1"],
                    "98": ["numtwo", "num2"],
                    "99": ["numthree", "num3"],
                    "100": ["numfour", "num4"],
                    "101": ["numfive", "num5"],
                    "102": ["numsix", "num6"],
                    "103": ["numseven", "num7"],
                    "104": ["numeight", "num8"],
                    "105": ["numnine", "num9"],
                    "106": ["nummultiply", "num*"],
                    "107": ["numadd", "num+"],
                    "108": ["numenter"],
                    "109": ["numsubtract", "num-"],
                    "110": ["numdecimal", "num."],
                    "111": ["numdivide", "num/"],
                    "144": ["numlock", "num"],
                    "112": ["f1"],
                    "113": ["f2"],
                    "114": ["f3"],
                    "115": ["f4"],
                    "116": ["f5"],
                    "117": ["f6"],
                    "118": ["f7"],
                    "119": ["f8"],
                    "120": ["f9"],
                    "121": ["f10"],
                    "122": ["f11"],
                    "123": ["f12"]
                },
                macros: [["shift + `", ["tilde", "~"]], ["shift + 1", ["exclamation", "exclamationpoint", "!"]], ["shift + 2", ["at", "@"]], ["shift + 3", ["number", "#"]], ["shift + 4", ["dollar", "dollars", "dollarsign", "$"]], ["shift + 5", ["percent", "%"]], ["shift + 6", ["caret", "^"]], ["shift + 7", ["ampersand", "and", "&"]], ["shift + 8", ["asterisk", "*"]], ["shift + 9", ["openparen", "("]], ["shift + 0", ["closeparen", ")"]], ["shift + -", ["underscore", "_"]], ["shift + =", ["plus", "+"]], ["shift + (", ["opencurlybrace", "opencurlybracket", "{"]], ["shift + )", ["closecurlybrace", "closecurlybracket", "}"]], ["shift + \\", ["verticalbar", "|"]], ["shift + ;", ["colon", ":"]], ["shift + '", ["quotationmark", '"']], ["shift + !,", ["openanglebracket", "<"]], ["shift + .", ["closeanglebracket", ">"]], ["shift + /", ["questionmark", "?"]]]
            };
            for (aI = 65; aI <= 90; aI += 1) {
                usLocale.map[aI] = String.fromCharCode(aI + 32);
                usLocale.macros.push(["shift + " + String.fromCharCode(aI + 32) + ", capslock + " + String.fromCharCode(aI + 32), [String.fromCharCode(aI)]]);
            }
            registerLocale("us", usLocale);
            getSetLocale("us");
            enable();
            KeyboardJS.enable = enable;
            KeyboardJS.disable = disable;
            KeyboardJS.activeKeys = getActiveKeys;
            KeyboardJS.releaseKey = removeActiveKey;
            KeyboardJS.pressKey = addActiveKey;
            KeyboardJS.on = createBinding;
            KeyboardJS.clear = removeBindingByKeyCombo;
            KeyboardJS.clear.key = removeBindingByKeyName;
            KeyboardJS.locale = getSetLocale;
            KeyboardJS.locale.register = registerLocale;
            KeyboardJS.macro = createMacro;
            KeyboardJS.macro.remove = removeMacro;
            KeyboardJS.key = {};
            KeyboardJS.key.name = getKeyName;
            KeyboardJS.key.code = getKeyCode;
            KeyboardJS.combo = {};
            KeyboardJS.combo.active = isSatisfiedCombo;
            KeyboardJS.combo.parse = parseKeyCombo;
            KeyboardJS.combo.stringify = stringifyKeyCombo;

            function enable() {
                if (window.addEventListener) {
                    window.document.addEventListener("keydown", keydown, false);
                    window.document.addEventListener("keyup", keyup, false);
                    window.addEventListener("blur", reset, false);
                    window.addEventListener("webkitfullscreenchange", reset, false);
                    window.addEventListener("mozfullscreenchange", reset, false);
                } else if (window.attachEvent) {
                    window.document.attachEvent("onkeydown", keydown);
                    window.document.attachEvent("onkeyup", keyup);
                    window.attachEvent("onblur", reset);
                }
            }
            function disable() {
                reset();
                if (window.removeEventListener) {
                    window.document.removeEventListener("keydown", keydown, false);
                    window.document.removeEventListener("keyup", keyup, false);
                    window.removeEventListener("blur", reset, false);
                    window.removeEventListener("webkitfullscreenchange", reset, false);
                    window.removeEventListener("mozfullscreenchange", reset, false);
                } else if (window.detachEvent) {
                    window.document.detachEvent("onkeydown", keydown);
                    window.document.detachEvent("onkeyup", keyup);
                    window.detachEvent("onblur", reset);
                }
            }
            function reset(event) {
                activeKeys = [];
                pruneMacros();
                pruneBindings(event);
            }
            function keydown(event) {
                var keyNames, keyName, kI;
                keyNames = getKeyName(event.keyCode);
                if (keyNames.length < 1) {
                    return;
                }
                event.isRepeat = false;
                for (kI = 0; kI < keyNames.length; kI += 1) {
                    keyName = keyNames[kI];
                    if (getActiveKeys().indexOf(keyName) != -1) event.isRepeat = true;
                    addActiveKey(keyName);
                }
                executeMacros();
                executeBindings(event);
            }
            function keyup(event) {
                var keyNames, kI;
                keyNames = getKeyName(event.keyCode);
                if (keyNames.length < 1) {
                    return;
                }
                for (kI = 0; kI < keyNames.length; kI += 1) {
                    removeActiveKey(keyNames[kI]);
                }
                pruneMacros();
                pruneBindings(event);
            }
            function getKeyName(keyCode) {
                return map[keyCode] || [];
            }
            function getKeyCode(keyName) {
                var keyCode;
                for (keyCode in map) {
                    if (!map.hasOwnProperty(keyCode)) {
                        continue;
                    }
                    if (map[keyCode].indexOf(keyName) > -1) {
                        return keyCode;
                    }
                }
                return false;
            }
            function createMacro(combo, injectedKeys) {
                if (typeof combo !== "string" && (typeof combo !== "object" || typeof combo.push !== "function")) {
                    throw new Error("Cannot create macro. The combo must be a string or array.");
                }
                if (typeof injectedKeys !== "object" || typeof injectedKeys.push !== "function") {
                    throw new Error("Cannot create macro. The injectedKeys must be an array.");
                }
                macros.push([combo, injectedKeys]);
            }
            function removeMacro(combo) {
                var macro, mI;
                if (typeof combo !== "string" && (typeof combo !== "object" || typeof combo.push !== "function")) {
                    throw new Error("Cannot remove macro. The combo must be a string or array.");
                }
                for (mI = 0; mI < macros.length; mI += 1) {
                    macro = macros[mI];
                    if (compareCombos(combo, macro[0])) {
                        removeActiveKey(macro[1]);
                        macros.splice(mI, 1);
                        break;
                    }
                }
            }
            function executeMacros() {
                var mI, combo, kI;
                for (mI = 0; mI < macros.length; mI += 1) {
                    combo = parseKeyCombo(macros[mI][0]);
                    if (activeMacros.indexOf(macros[mI]) === -1 && isSatisfiedCombo(combo)) {
                        activeMacros.push(macros[mI]);
                        for (kI = 0; kI < macros[mI][1].length; kI += 1) {
                            addActiveKey(macros[mI][1][kI]);
                        }
                    }
                }
            }
            function pruneMacros() {
                var mI, combo, kI;
                for (mI = 0; mI < activeMacros.length; mI += 1) {
                    combo = parseKeyCombo(activeMacros[mI][0]);
                    if (isSatisfiedCombo(combo) === false) {
                        for (kI = 0; kI < activeMacros[mI][1].length; kI += 1) {
                            removeActiveKey(activeMacros[mI][1][kI]);
                        }
                        activeMacros.splice(mI, 1);
                        mI -= 1;
                    }
                }
            }
            function createBinding(keyCombo, keyDownCallback, keyUpCallback) {
                var api = {},
                    binding, subBindings = [],
                    bindingApi = {},
                    kI, subCombo;
                if (typeof keyCombo === "string") {
                    keyCombo = parseKeyCombo(keyCombo);
                }
                for (kI = 0; kI < keyCombo.length; kI += 1) {
                    binding = {};
                    subCombo = stringifyKeyCombo([keyCombo[kI]]);
                    if (typeof subCombo !== "string") {
                        throw new Error("Failed to bind key combo. The key combo must be string.");
                    }
                    binding.keyCombo = subCombo;
                    binding.keyDownCallback = [];
                    binding.keyUpCallback = [];
                    if (keyDownCallback) {
                        binding.keyDownCallback.push(keyDownCallback);
                    }
                    if (keyUpCallback) {
                        binding.keyUpCallback.push(keyUpCallback);
                    }
                    bindings.push(binding);
                    subBindings.push(binding);
                }
                api.clear = clear;
                api.on = on;
                return api;

                function clear() {
                    var bI;
                    for (bI = 0; bI < subBindings.length; bI += 1) {
                        bindings.splice(bindings.indexOf(subBindings[bI]), 1);
                    }
                }
                function on(eventName) {
                    var api = {},
                        callbacks, cI, bI;
                    if (typeof eventName !== "string") {
                        throw new Error("Cannot bind callback. The event name must be a string.");
                    }
                    if (eventName !== "keyup" && eventName !== "keydown") {
                        throw new Error('Cannot bind callback. The event name must be a "keyup" or "keydown".');
                    }
                    callbacks = Array.prototype.slice.apply(arguments, [1]);
                    for (cI = 0; cI < callbacks.length; cI += 1) {
                        if (typeof callbacks[cI] === "function") {
                            if (eventName === "keyup") {
                                for (bI = 0; bI < subBindings.length; bI += 1) {
                                    subBindings[bI].keyUpCallback.push(callbacks[cI]);
                                }
                            } else if (eventName === "keydown") {
                                for (bI = 0; bI < subBindings.length; bI += 1) {
                                    subBindings[bI].keyDownCallback.push(callbacks[cI]);
                                }
                            }
                        }
                    }
                    api.clear = clear;
                    return api;

                    function clear() {
                        var cI, bI;
                        for (cI = 0; cI < callbacks.length; cI += 1) {
                            if (typeof callbacks[cI] === "function") {
                                if (eventName === "keyup") {
                                    for (bI = 0; bI < subBindings.length; bI += 1) {
                                        subBindings[bI].keyUpCallback.splice(subBindings[bI].keyUpCallback.indexOf(callbacks[cI]), 1);
                                    }
                                } else {
                                    for (bI = 0; bI < subBindings.length; bI += 1) {
                                        subBindings[bI].keyDownCallback.splice(subBindings[bI].keyDownCallback.indexOf(callbacks[cI]), 1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            function removeBindingByKeyCombo(keyCombo) {
                var bI, binding, keyName;
                for (bI = 0; bI < bindings.length; bI += 1) {
                    binding = bindings[bI];
                    if (compareCombos(keyCombo, binding.keyCombo)) {
                        bindings.splice(bI, 1);
                        bI -= 1;
                    }
                }
            }
            function removeBindingByKeyName(keyName) {
                var bI, kI, binding;
                if (keyName) {
                    for (bI = 0; bI < bindings.length; bI += 1) {
                        binding = bindings[bI];
                        for (kI = 0; kI < binding.keyCombo.length; kI += 1) {
                            if (binding.keyCombo[kI].indexOf(keyName) > -1) {
                                bindings.splice(bI, 1);
                                bI -= 1;
                                break;
                            }
                        }
                    }
                } else {
                    bindings = [];
                }
            }
            function executeBindings(event) {
                var bI, sBI, binding, bindingKeys, remainingKeys, cI, killEventBubble, kI, bindingKeysSatisfied, index, sortedBindings = [],
                    bindingWeight;
                remainingKeys = [].concat(activeKeys);
                for (bI = 0; bI < bindings.length; bI += 1) {
                    bindingWeight = extractComboKeys(bindings[bI].keyCombo).length;
                    if (!sortedBindings[bindingWeight]) {
                        sortedBindings[bindingWeight] = [];
                    }
                    sortedBindings[bindingWeight].push(bindings[bI]);
                }
                for (sBI = sortedBindings.length - 1; sBI >= 0; sBI -= 1) {
                    if (!sortedBindings[sBI]) {
                        continue;
                    }
                    for (bI = 0; bI < sortedBindings[sBI].length; bI += 1) {
                        binding = sortedBindings[sBI][bI];
                        bindingKeys = extractComboKeys(binding.keyCombo);
                        bindingKeysSatisfied = true;
                        for (kI = 0; kI < bindingKeys.length; kI += 1) {
                            if (remainingKeys.indexOf(bindingKeys[kI]) === -1) {
                                bindingKeysSatisfied = false;
                                break;
                            }
                        }
                        if (bindingKeysSatisfied && isSatisfiedCombo(binding.keyCombo)) {
                            activeBindings.push(binding);
                            for (kI = 0; kI < bindingKeys.length; kI += 1) {
                                index = remainingKeys.indexOf(bindingKeys[kI]);
                                if (index > -1) {
                                    remainingKeys.splice(index, 1);
                                    kI -= 1;
                                }
                            }
                            for (cI = 0; cI < binding.keyDownCallback.length; cI += 1) {
                                if (binding.keyDownCallback[cI](event, getActiveKeys(), binding.keyCombo) === false) {
                                    killEventBubble = true;
                                }
                            }
                            if (killEventBubble === true) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    }
                }
            }
            function pruneBindings(event) {
                var bI, cI, binding, killEventBubble;
                for (bI = 0; bI < activeBindings.length; bI += 1) {
                    binding = activeBindings[bI];
                    if (isSatisfiedCombo(binding.keyCombo) === false) {
                        for (cI = 0; cI < binding.keyUpCallback.length; cI += 1) {
                            if (binding.keyUpCallback[cI](event, getActiveKeys(), binding.keyCombo) === false) {
                                killEventBubble = true;
                            }
                        }
                        if (killEventBubble === true) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        activeBindings.splice(bI, 1);
                        bI -= 1;
                    }
                }
            }
            function compareCombos(keyComboArrayA, keyComboArrayB) {
                var cI, sI, kI;
                keyComboArrayA = parseKeyCombo(keyComboArrayA);
                keyComboArrayB = parseKeyCombo(keyComboArrayB);
                if (keyComboArrayA.length !== keyComboArrayB.length) {
                    return false;
                }
                for (cI = 0; cI < keyComboArrayA.length; cI += 1) {
                    if (keyComboArrayA[cI].length !== keyComboArrayB[cI].length) {
                        return false;
                    }
                    for (sI = 0; sI < keyComboArrayA[cI].length; sI += 1) {
                        if (keyComboArrayA[cI][sI].length !== keyComboArrayB[cI][sI].length) {
                            return false;
                        }
                        for (kI = 0; kI < keyComboArrayA[cI][sI].length; kI += 1) {
                            if (keyComboArrayB[cI][sI].indexOf(keyComboArrayA[cI][sI][kI]) === -1) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            }
            function isSatisfiedCombo(keyCombo) {
                var cI, sI, stage, kI, stageOffset = 0,
                    index, comboMatches;
                keyCombo = parseKeyCombo(keyCombo);
                for (cI = 0; cI < keyCombo.length; cI += 1) {
                    comboMatches = true;
                    stageOffset = 0;
                    for (sI = 0; sI < keyCombo[cI].length; sI += 1) {
                        stage = [].concat(keyCombo[cI][sI]);
                        for (kI = stageOffset; kI < activeKeys.length; kI += 1) {
                            index = stage.indexOf(activeKeys[kI]);
                            if (index > -1) {
                                stage.splice(index, 1);
                                stageOffset = kI;
                            }
                        }
                        if (stage.length !== 0) {
                            comboMatches = false;
                            break;
                        }
                    }
                    if (comboMatches) {
                        return true;
                    }
                }
                return false;
            }
            function extractComboKeys(keyCombo) {
                var cI, sI, kI, keys = [];
                keyCombo = parseKeyCombo(keyCombo);
                for (cI = 0; cI < keyCombo.length; cI += 1) {
                    for (sI = 0; sI < keyCombo[cI].length; sI += 1) {
                        keys = keys.concat(keyCombo[cI][sI]);
                    }
                }
                return keys;
            }
            function parseKeyCombo(keyCombo) {
                var s = keyCombo,
                    i = 0,
                    op = 0,
                    ws = false,
                    nc = false,
                    combos = [],
                    combo = [],
                    stage = [],
                    key = "";
                if (typeof keyCombo === "object" && typeof keyCombo.push === "function") {
                    return keyCombo;
                }
                if (typeof keyCombo !== "string") {
                    throw new Error('Cannot parse "keyCombo" because its type is "' + typeof keyCombo + '". It must be a "string".');
                }
                while (s.charAt(i) === " ") {
                    i += 1;
                }
                while (true) {
                    if (s.charAt(i) === " ") {
                        while (s.charAt(i) === " ") {
                            i += 1;
                        }
                        ws = true;
                    } else if (s.charAt(i) === ",") {
                        if (op || nc) {
                            throw new Error("Failed to parse key combo. Unexpected , at character index " + i + ".");
                        }
                        nc = true;
                        i += 1;
                    } else if (s.charAt(i) === "+") {
                        if (key.length) {
                            stage.push(key);
                            key = "";
                        }
                        if (op || nc) {
                            throw new Error("Failed to parse key combo. Unexpected + at character index " + i + ".");
                        }
                        op = true;
                        i += 1;
                    } else if (s.charAt(i) === ">") {
                        if (key.length) {
                            stage.push(key);
                            key = "";
                        }
                        if (stage.length) {
                            combo.push(stage);
                            stage = [];
                        }
                        if (op || nc) {
                            throw new Error("Failed to parse key combo. Unexpected > at character index " + i + ".");
                        }
                        op = true;
                        i += 1;
                    } else if (i < s.length - 1 && s.charAt(i) === "!" && (s.charAt(i + 1) === ">" || s.charAt(i + 1) === "," || s.charAt(i + 1) === "+")) {
                        key += s.charAt(i + 1);
                        op = false;
                        ws = false;
                        nc = false;
                        i += 2;
                    } else if (i < s.length && s.charAt(i) !== "+" && s.charAt(i) !== ">" && s.charAt(i) !== "," && s.charAt(i) !== " ") {
                        if (op === false && ws === true || nc === true) {
                            if (key.length) {
                                stage.push(key);
                                key = "";
                            }
                            if (stage.length) {
                                combo.push(stage);
                                stage = [];
                            }
                            if (combo.length) {
                                combos.push(combo);
                                combo = [];
                            }
                        }
                        op = false;
                        ws = false;
                        nc = false;
                        while (i < s.length && s.charAt(i) !== "+" && s.charAt(i) !== ">" && s.charAt(i) !== "," && s.charAt(i) !== " ") {
                            key += s.charAt(i);
                            i += 1;
                        }
                    } else {
                        i += 1;
                        continue;
                    }
                    if (i >= s.length) {
                        if (key.length) {
                            stage.push(key);
                            key = "";
                        }
                        if (stage.length) {
                            combo.push(stage);
                            stage = [];
                        }
                        if (combo.length) {
                            combos.push(combo);
                            combo = [];
                        }
                        break;
                    }
                }
                return combos;
            }
            function stringifyKeyCombo(keyComboArray) {
                var cI, ccI, output = [];
                if (typeof keyComboArray === "string") {
                    return keyComboArray;
                }
                if (typeof keyComboArray !== "object" || typeof keyComboArray.push !== "function") {
                    throw new Error("Cannot stringify key combo.");
                }
                for (cI = 0; cI < keyComboArray.length; cI += 1) {
                    output[cI] = [];
                    for (ccI = 0; ccI < keyComboArray[cI].length; ccI += 1) {
                        output[cI][ccI] = keyComboArray[cI][ccI].join(" + ");
                    }
                    output[cI] = output[cI].join(" > ");
                }
                return output.join(" ");
            }
            function getActiveKeys() {
                return [].concat(activeKeys);
            }
            function addActiveKey(keyName) {
                if (keyName.match(/\s/)) {
                    throw new Error("Cannot add key name " + keyName + " to active keys because it contains whitespace.");
                }
                if (activeKeys.indexOf(keyName) > -1) {
                    return;
                }
                activeKeys.push(keyName);
            }
            function removeActiveKey(keyName) {
                var keyCode = getKeyCode(keyName);
                if (keyCode === "91" || keyCode === "92") {
                    activeKeys = [];
                } else {
                    activeKeys.splice(activeKeys.indexOf(keyName), 1);
                }
            }
            function registerLocale(localeName, localeMap) {
                if (typeof localeName !== "string") {
                    throw new Error("Cannot register new locale. The locale name must be a string.");
                }
                if (typeof localeMap !== "object") {
                    throw new Error("Cannot register " + localeName + " locale. The locale map must be an object.");
                }
                if (typeof localeMap.map !== "object") {
                    throw new Error("Cannot register " + localeName + " locale. The locale map is invalid.");
                }
                if (!localeMap.macros) {
                    localeMap.macros = [];
                }
                locales[localeName] = localeMap;
            }
            function getSetLocale(localeName) {
                if (localeName) {
                    if (typeof localeName !== "string") {
                        throw new Error("Cannot set locale. The locale name must be a string.");
                    }
                    if (!locales[localeName]) {
                        throw new Error("Cannot set locale to " + localeName + " because it does not exist. If you would like to submit a " + localeName + " locale map for KeyboardJS please submit it at https://github.com/RobertWHurst/KeyboardJS/issues.");
                    }
                    map = locales[localeName].map;
                    macros = locales[localeName].macros;
                    locale = localeName;
                }
                return locale;
            }
            this.Keyboard = KeyboardJS;
        },
        "on": function(keyCombo, onDownCallback, onUpCallback) {
            this.Keyboard.on(keyCombo, onDownCallback, onUpCallback);
        },
        "getActiveKeys": function() {
            return this.Keyboard.activeKeys();
        }
    }
});

//begin-------------------AlloyPaper.Loader---------------------begin

AlloyPaper.Loader = Class.extend({
    "ctor": function() {
        this.res = {};
        this.loadedCount = 0;
        this.resCount = -1;
        this.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%\.]+)(?:\.)(\w+)?(\?\S+)?/i;
        this.ns = 6;
        this.sounds = [];
        for (var i = 0; i < this.ns; i++) this.sounds.push([]);
        this.playing = [];
    },
    "get": function(id) {
        return this.res[id];
    },
    "loadRes": function(arr) {
        this.resCount = arr.length;
        for (var i = 0; i < arr.length; i++) {
            var type=this._getTypeByExtension(arr[i].src.match(this.FILE_PATTERN)[5]);
            if (type === "audio") {
                this.loadAudio(arr[i].id, arr[i].src);
            } else if (type === "js") {
                this.loadScript(arr[i].src);
            } else if (type === "img") {
                this.loadImage(arr[i].id, arr[i].src);
            }
        }
    },
    "loadImage": function(id, src) {
        var img = document.createElement("img");
        var self = this;
        img.onload = function() {
            self._handleLoad(this, id);
            img.onreadystatechange = null;
        };
        img.onreadystatechange = function() {
            if (img.readyState == "loaded" || img.readyState == "complete") {
                self._handleLoad(this, id);
                img.onload = null;
            }
        };
        img.onerror = function() {};
        img.src = src;
    },
    "loadAudio": function(id, src) {
        var tag = document.createElement("audio");
        tag.autoplay = false;
        this.res[id] = tag;
        tag.src = null;
        tag.preload = "auto";
        tag.onerror = function() {};
        tag.onstalled = function() {};
        var self = this;
        var _audioCanPlayHandler = function() {
            self.playing[id] = 0;
            for (var i = 0; i < self.ns; i++) {
                self.sounds[i][id] = new Audio(src);
            }
            self.loadedCount++;
            self.handleProgress&&self.handleProgress(self.loadedCount, self.resCount);
            self._clean(this);
            this.removeEventListener && this.removeEventListener("canplaythrough", _audioCanPlayHandler, false);
            self.checkComplete();
        };
        tag.addEventListener("canplaythrough", _audioCanPlayHandler, false);
        tag.src = src;
        if (tag.load != null) {
            tag.load();
        }
    },
    "loadScript": function (url) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        var self = this;
        if (script.readyState) {  //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                    script.onreadystatechange = null;
                    self._handleLoad();
                }
            };
        } else {  //Others
            script.onload = function () {
                self._handleLoad();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    },
    "checkComplete": function() {
        if (this.loadedCount === this.resCount) {
            this.handleComplete();
        }
    },
    "complete": function(fn) {
        this.handleComplete = fn;
    },
    "progress": function(fn) {
        this.handleProgress = fn;
    },
    "playSound": function (id, volume) {
        var sound = this.sounds[this.playing[id]][id];
        sound.volume = volume === undefined ? 1 : volume;
        sound.play();
        ++this.playing[id];
        if (this.playing[id] >= this.ns) this.playing[id] = 0;
    },
    "_handleLoad": function (currentImg, id) {
        if (currentImg) {
            this._clean(currentImg);
            this.res[id] = currentImg;        
        }
        this.loadedCount++;
        if (this.handleProgress) this.handleProgress(this.loadedCount, this.resCount);
        this.checkComplete();
    },
    "_getTypeByExtension": function(extension) {
        switch (extension) {
        case "jpeg":
        case "jpg":
        case "gif":
        case "png":
        case "webp":
        case "bmp":
            return "img";
        case "ogg":
        case "mp3":
        case "wav":
            return "audio";
        case "js":
            return "js";
        }
    },
    "_clean": function(tag) {
        tag.onload = null;
        tag.onstalled = null;
        tag.onprogress = null;
        tag.onerror = null;
    }
});

//end-------------------AlloyPaper.Loader---------------------end


//begin-------------------AlloyPaper.Matrix2D---------------------begin

AlloyPaper.Matrix2D = Class.extend({
    "statics": {
        "DEG_TO_RAD": 0.017453292519943295
    },
    "ctor": function(a, b, c, d, tx, ty) {
        this.a = a == null ? 1 : a;
        this.b = b || 0;
        this.c = c || 0;
        this.d = d == null ? 1 : d;
        this.tx = tx || 0;
        this.ty = ty || 0;
        return this;
    },
    "identity": function() {
        this.a = this.d = 1;
        this.b = this.c = this.tx = this.ty = 0;
        return this;
    },
    "appendTransform": function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
        if (rotation % 360) {
            var r = rotation * AlloyPaper.Matrix2D.DEG_TO_RAD;
            var cos = Math.cos(r);
            var sin = Math.sin(r);
        } else {
            cos = 1;
            sin = 0;
        }
        if (skewX || skewY) {
            skewX *= AlloyPaper.Matrix2D.DEG_TO_RAD;
            skewY *= AlloyPaper.Matrix2D.DEG_TO_RAD;
            this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
            this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
        } else {
            this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
        }
        if (regX || regY) {
            this.tx -= regX * this.a + regY * this.c;
            this.ty -= regX * this.b + regY * this.d;
        }
        return this;
    },
    "append": function(a, b, c, d, tx, ty) {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        this.a = a * a1 + b * c1;
        this.b = a * b1 + b * d1;
        this.c = c * a1 + d * c1;
        this.d = c * b1 + d * d1;
        this.tx = tx * a1 + ty * c1 + this.tx;
        this.ty = tx * b1 + ty * d1 + this.ty;
        return this;
    },
    "initialize": function(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
        return this;
    },
    "setValues": function(a, b, c, d, tx, ty) {
        this.a = a == null ? 1 : a;
        this.b = b || 0;
        this.c = c || 0;
        this.d = d == null ? 1 : d;
        this.tx = tx || 0;
        this.ty = ty || 0;
        return this;
    },
    "copy": function(matrix) {
        return this.setValues(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
    }
});

//end-------------------AlloyPaper.Matrix2D---------------------end

(function () {
    var observe = function (target, arr, callback) {
        var _observe = function (target, arr, callback) {
            if (!target.$observer) target.$observer = this;
            var $observer = target.$observer;
            var eventPropArr = [];
            if (observe.isArray(target)) {
                $observer.mock(target);
            }
            for (var prop in target) {
                if (target.hasOwnProperty(prop)) {
                    if (callback) {
                        if (observe.isArray(arr) && observe.isInArray(arr, prop)) {
                            eventPropArr.push(prop);
                            $observer.watch(target, prop);
                        } else if (observe.isString(arr) && prop == arr) {
                            eventPropArr.push(prop);
                            $observer.watch(target, prop);
                        }
                    } else {
                        eventPropArr.push(prop);
                        $observer.watch(target, prop);
                    }
                }
            }
            $observer.target = target;
            if (!$observer.propertyChangedHandler) $observer.propertyChangedHandler = [];
            var propChanged = callback ? callback : arr;
            $observer.propertyChangedHandler.push({ all: !callback, propChanged: propChanged, eventPropArr: eventPropArr });
        };
        _observe.prototype = {
            "onPropertyChanged": function (prop, value, oldValue, target, path) {
                if (value !== oldValue && this.propertyChangedHandler) {
                    var rootName = observe._getRootName(prop, path);
                    for (var i = 0, len = this.propertyChangedHandler.length; i < len; i++) {
                        var handler = this.propertyChangedHandler[i];
                        if (handler.all || observe.isInArray(handler.eventPropArr, rootName) || rootName.indexOf("Array-") === 0) {
                            handler.propChanged.call(this.target, prop, value, oldValue, path);
                        }
                    }
                }
                if (prop.indexOf("Array-") !== 0 && typeof value === "object") {
                    this.watch(target, prop, target.$observeProps.$observerPath);
                }
            },
            "mock": function (target) {
                var self = this;
                observe.methods.forEach(function (item) {
                    target[item] = function () {
                        var old = Array.prototype.slice.call(this, 0);
                        var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
                        if (new RegExp("\\b" + item + "\\b").test(observe.triggerStr)) {
                            for (var cprop in this) {
                                if (this.hasOwnProperty(cprop) && !observe.isFunction(this[cprop])) {
                                    self.watch(this, cprop, this.$observeProps.$observerPath);
                                }
                            }
                            //todo
                            self.onPropertyChanged("Array-" + item, this, old, this, this.$observeProps.$observerPath);
                        }
                        return result;
                    };
                });
            },
            "watch": function (target, prop, path) {
                if (prop === "$observeProps" || prop === "$observer") return;
                if (observe.isFunction(target[prop])) return;
                if (!target.$observeProps) target.$observeProps = {};
                if (path !== undefined) {
                    target.$observeProps.$observerPath = path;
                } else {
                    target.$observeProps.$observerPath = "#";
                }
                var self = this;
                var currentValue = target.$observeProps[prop] = target[prop];
                Object.defineProperty(target, prop, {
                    get: function () {
                        return this.$observeProps[prop];
                    },
                    set: function (value) {
                        var old = this.$observeProps[prop];
                        this.$observeProps[prop] = value;
                        self.onPropertyChanged(prop, value, old, this, target.$observeProps.$observerPath);
                    }
                });
                if (typeof currentValue == "object") {
                    if (observe.isArray(currentValue)) {
                        this.mock(currentValue);
                    }
                    for (var cprop in currentValue) {
                        if (currentValue.hasOwnProperty(cprop)) {
                            this.watch(currentValue, cprop, target.$observeProps.$observerPath + "-" + prop);
                        }
                    }
                }
            }
        };
        return new _observe(target, arr, callback)
    };
    observe.methods = ["concat", "every", "filter", "forEach", "indexOf", "join", "lastIndexOf", "map", "pop", "push", "reduce", "reduceRight", "reverse", "shift", "slice", "some", "sort", "splice", "unshift", "toLocaleString", "toString", "size"];
    observe.triggerStr = ["concat", "pop", "push", "reverse", "shift", "sort", "splice", "unshift", "size"].join(",");
    observe.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    observe.isString = function (obj) {
        return typeof obj === "string";
    };
    observe.isInArray = function (arr, item) {
        for (var i = arr.length; --i > -1;) {
            if (item === arr[i]) return true;
        }
        return false;
    };
    observe.isFunction = function (obj) {
        return Object.prototype.toString.call(obj) == '[object Function]';
    };
    observe.twoWay = function (objA, aProp, objB, bProp) {
        if (typeof objA[aProp] === "object" && typeof objB[bProp] === "object") {
            observe(objA, aProp, function (name, value) {
                objB[bProp] = this[aProp];
            })
            observe(objB, bProp, function (name, value) {
                objA[aProp] = this[bProp];
            })
        } else {
            observe(objA, aProp, function (name, value) {
                objB[bProp] = value;
            })
            observe(objB, bProp, function (name, value) {
                objA[aProp] = value;
            })
        }
    }
    observe._getRootName = function (prop, path) {
        if (path === "#") {
            return prop;
        }
        return path.split("-")[1];
    }

    observe.add = function (obj, prop, value) {
        obj[prop] = value;
        var $observer = obj.$observer;
        $observer.watch(obj, prop);
    }
    Array.prototype.size = function (length) {
        this.length = length;
    }

    AlloyPaper.Observe = observe;
})();

//begin-------------------AlloyPaper.RAF---------------------begin

AlloyPaper.RAF = Class.extend({
    "statics": {
        "ctor": function() {
            var requestAnimFrame = function() {
                return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function(callback, element) {
                    window.setTimeout(callback, 1e3 / 60);
                };
            }();
            var requestInterval = function(fn, delay) {
                if (!window.requestAnimationFrame && !window.webkitRequestAnimationFrame && !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && !window.oRequestAnimationFrame && !window.msRequestAnimationFrame) return window.setInterval(fn, delay);
                var start = new Date().getTime(),
                    handle = {};

                function loop() {
                    var current = new Date().getTime(),
                        delta = current - start;
                    if (delta >= delay) {
                        fn.call();
                        start = new Date().getTime();
                    }
                    handle.value = requestAnimFrame(loop);
                }
                handle.value = requestAnimFrame(loop);
                return handle;
            };
            var clearRequestInterval = function(handle) {
                if (handle) {
                    setTimeout(function() {
                        window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) : window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) : window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) : window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) : window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) : clearInterval(handle);
                    }, 0);
                }
            };
            this.requestInterval = requestInterval;
            this.clearRequestInterval = clearRequestInterval;
        }
    }
});

//end-------------------AlloyPaper.RAF---------------------end


//begin-------------------AlloyPaper.To---------------------begin

AlloyPaper.To = Class.extend({
    "statics": {
        "ctor": function () {
            this.bounceOut = AlloyPaper.TWEEN.Easing.Bounce.Out,
            this.linear = AlloyPaper.TWEEN.Easing.Linear.None,
            this.quadraticIn = AlloyPaper.TWEEN.Easing.Quadratic.In,
            this.quadraticOut = AlloyPaper.TWEEN.Easing.Quadratic.Out,
            this.quadraticInOut = AlloyPaper.TWEEN.Easing.Quadratic.InOut,
            this.cubicIn = AlloyPaper.TWEEN.Easing.Cubic.In,
            this.cubicOut = AlloyPaper.TWEEN.Easing.Cubic.Out,
            this.cubicInOut = AlloyPaper.TWEEN.Easing.Cubic.InOut,
            this.quarticIn = AlloyPaper.TWEEN.Easing.Quartic.In,
            this.quarticOut = AlloyPaper.TWEEN.Easing.Quartic.Out,
            this.quarticInOut = AlloyPaper.TWEEN.Easing.Quartic.InOut,
            this.quinticIn = AlloyPaper.TWEEN.Easing.Quintic.In,
            this.quinticOut = AlloyPaper.TWEEN.Easing.Quintic.Out,
            this.quinticInOut = AlloyPaper.TWEEN.Easing.Quintic.InOut,
            this.sinusoidalIn = AlloyPaper.TWEEN.Easing.Sinusoidal.In,
            this.sinusoidalOut = AlloyPaper.TWEEN.Easing.Sinusoidal.Out,
            this.sinusoidalInOut = AlloyPaper.TWEEN.Easing.Sinusoidal.InOut,
            this.exponentialIn = AlloyPaper.TWEEN.Easing.Exponential.In,
            this.exponentialOut = AlloyPaper.TWEEN.Easing.Exponential.Out,
            this.exponentialInOut = AlloyPaper.TWEEN.Easing.Exponential.InOut,
            this.circularIn = AlloyPaper.TWEEN.Easing.Circular.In,
            this.circularOut = AlloyPaper.TWEEN.Easing.Circular.Out,
            this.circularInOut = AlloyPaper.TWEEN.Easing.Circular.InOut,
            this.elasticIn = AlloyPaper.TWEEN.Easing.Elastic.In,
            this.elasticOut = AlloyPaper.TWEEN.Easing.Elastic.Out,
            this.elasticInOut = AlloyPaper.TWEEN.Easing.Elastic.InOut,
            this.backIn = AlloyPaper.TWEEN.Easing.Back.In,
            this.backOut = AlloyPaper.TWEEN.Easing.Back.Out,
            this.backInOut = AlloyPaper.TWEEN.Easing.Back.InOut,
            this.bounceIn = AlloyPaper.TWEEN.Easing.Bounce.In,
            this.bounceOut = AlloyPaper.TWEEN.Easing.Bounce.Out,
            this.bounceInOut = AlloyPaper.TWEEN.Easing.Bounce.InOut,
            this.interpolationLinear = AlloyPaper.TWEEN.Interpolation.Linear,
            this.interpolationBezier = AlloyPaper.TWEEN.Interpolation.Bezier,
            this.interpolationCatmullRom = AlloyPaper.TWEEN.Interpolation.CatmullRom;
        },
        "get": function (element) {
            var to = new this(element);
            var stage = this.getStage(element);
            stage && stage.toList.push(to);
            return to;
        },
        "getStage": function (element) {
            if (!element.parent) return;
            if (element.parent instanceof AlloyPaper.Stage) {
                return element.parent;
            } else {
                return this.getStage(element.parent);
            }
        }
    },
    "ctor": function(element) {
        this.element = element;
        this.cmds = [];
        this.index = 0;
        this.tweens = [];
        this._pause = false;
        this.loop = setInterval(function() {
            AlloyPaper.TWEEN.update();
        }, 15);
        this.cycleCount = 0;
    },
    "to": function() {
        this.cmds.push(["to"]);
        return this;
    },
    "set": function(prop, value, time, ease) {
        this.cmds[this.cmds.length - 1].push([prop, [value, time, ease]]);
        return this;
    },
    "x": function() {
        this.cmds[this.cmds.length - 1].push(["x", arguments]);
        return this;
    },
    "y": function() {
        this.cmds[this.cmds.length - 1].push(["y", arguments]);
        return this;
    },
    "z": function() {
        this.cmds[this.cmds.length - 1].push(["z", arguments]);
        return this;
    },
    "rotation": function() {
        this.cmds[this.cmds.length - 1].push(["rotation", arguments]);
        return this;
    },
    "scaleX": function() {
        this.cmds[this.cmds.length - 1].push(["scaleX", arguments]);
        return this;
    },
    "scaleY": function() {
        this.cmds[this.cmds.length - 1].push(["scaleY", arguments]);
        return this;
    },
    "skewX": function() {
        this.cmds[this.cmds.length - 1].push(["skewX", arguments]);
        return this;
    },
    "skewY": function() {
        this.cmds[this.cmds.length - 1].push(["skewY", arguments]);
        return this;
    },
    "originX": function() {
        this.cmds[this.cmds.length - 1].push(["originX", arguments]);
        return this;
    },
    "originY": function() {
        this.cmds[this.cmds.length - 1].push(["originY", arguments]);
        return this;
    },
    "alpha": function() {
        this.cmds[this.cmds.length - 1].push(["alpha", arguments]);
        return this;
    },
    "begin": function(fn) {
        this.cmds[this.cmds.length - 1].begin = fn;
        return this;
    },
    "progress": function(fn) {
        this.cmds[this.cmds.length - 1].progress = fn;
        return this;
    },
    "end": function(fn) {
        this.cmds[this.cmds.length - 1].end = fn;
        return this;
    },
    "wait": function() {
        this.cmds.push(["wait", arguments]);
        return this;
    },
    "then": function() {
        this.cmds.push(["then", arguments]);
        return this;
    },
    "cycle": function() {
        this.cmds.push(["cycle", arguments]);
        return this;
    },
    "rubber": function() {
        this.cmds = this.cmds.concat([["to", ["scaleX", {
            "0": 1.25,
            "1": 300}], ["scaleY", {
            "0": .75,
            "1": 300}]], ["to", ["scaleX", {
            "0": .75,
            "1": 100}], ["scaleY", {
            "0": 1.25,
            "1": 100}]], ["to", ["scaleX", {
            "0": 1.15,
            "1": 100}], ["scaleY", {
            "0": .85,
            "1": 100}]], ["to", ["scaleX", {
            "0": .95,
            "1": 150}], ["scaleY", {
            "0": 1.05,
            "1": 150}]], ["to", ["scaleX", {
            "0": 1.05,
            "1": 100}], ["scaleY", {
            "0": .95,
            "1": 100}]], ["to", ["scaleX", {
            "0": 1,
            "1": 250}], ["scaleY", {
            "0": 1,
            "1": 250}]]]);
        return this;
    },
    "bounceIn": function() {
        this.cmds = this.cmds.concat([["to", ["scaleX", {
            "0": 0,
            "1": 0}], ["scaleY", {
            "0": 0,
            "1": 0}]], ["to", ["scaleX", {
            "0": 1.35,
            "1": 200}], ["scaleY", {
            "0": 1.35,
            "1": 200}]], ["to", ["scaleX", {
            "0": .9,
            "1": 100}], ["scaleY", {
            "0": .9,
            "1": 100}]], ["to", ["scaleX", {
            "0": 1.1,
            "1": 100}], ["scaleY", {
            "0": 1.1,
            "1": 100}]], ["to", ["scaleX", {
            "0": .95,
            "1": 100}], ["scaleY", {
            "0": .95,
            "1": 100}]], ["to", ["scaleX", {
            "0": 1,
            "1": 100}], ["scaleY", {
            "0": 1,
            "1": 100}]]]);
        return this;
    },
    "flipInX": function() {
        this.cmds = this.cmds.concat([["to", ["rotateX", {
            "0": -90,
            "1": 0}]], ["to", ["rotateX", {
            "0": 20,
            "1": 300}]], ["to", ["rotateX", {
            "0": -20,
            "1": 300}]], ["to", ["rotateX", {
            "0": 10,
            "1": 300}]], ["to", ["rotateX", {
            "0": -5,
            "1": 300}]], ["to", ["rotateX", {
            "0": 0,
            "1": 300}]]]);
        return this;
    },
    "zoomOut": function() {
        this.cmds = this.cmds.concat([["to", ["scaleX", {
            "0": 0,
            "1": 400}], ["scaleY", {
            "0": 0,
            "1": 400}]]]);
        return this;
    },
    "start": function() {
        if (this._pause) return;
        var len = this.cmds.length;
        if (this.index < len) {
            this.exec(this.cmds[this.index], this.index == len - 1);
        } else {
            clearInterval(this.loop);
        }
        return this;
    },
    "pause": function() {
        this._pause = true;
        for (var i = 0, len = this.tweens.length; i < len; i++) {
            this.tweens[i].pause();
        }
        if (this.currentTask == "wait") {
            this.timeout -= new Date() - this.currentTaskBegin;
            this.currentTaskBegin = new Date();
        }
    },
    "toggle": function() {
        if (this._pause) {
            this.play();
        } else {
            this.pause();
        }
    },
    "play": function() {
        this._pause = false;
        for (var i = 0, len = this.tweens.length; i < len; i++) {
            this.tweens[i].play();
        }
        var self = this;
        if (this.currentTask == "wait") {
            setTimeout(function() {
                if (self._pause) return;
                self.index++;
                self.start();
                if (self.index == self.cmds.length && self.complete) self.complete();
            }, this.timeout);
        }
    },
    "stop": function () {
        for (var i = 0, len = this.tweens.length; i < len; i++) {
            this.tweens[i].pause();
            AlloyPaper.TWEEN.remove(this.tweens[i]);
        }
        this.cmds.length = 0;

    },
    "exec": function(cmd, last) {
        var len = cmd.length,
            self = this;
        this.currentTask = cmd[0];
        switch (this.currentTask) {
        case "to":
            self.stepCompleteCount = 0;
            for (var i = 1; i < len; i++) {
                var task = cmd[i];
                var ease = task[1][2];
                var target = {};
                var prop = task[0];
                target[prop] = task[1][0];
                var t = new AlloyPaper.TWEEN.Tween(this.element).to(target, task[1][1]).onStart(function() {
                    if (cmd.start) cmd.start();
                }).onUpdate(function() {
                    if (cmd.progress) cmd.progress.call(self.element);
                    self.element[prop] = this[prop];
                }).easing(ease ? ease : AlloyPaper.To.linear).onComplete(function() {
                    self.stepCompleteCount++;
                    if (self.stepCompleteCount == len - 1) {
                        if (cmd.end) cmd.end.call(self.element);
                        if (last && self.complete) self.complete();
                        self.index++;
                        self.start();
                    }
                }).start();
                this.tweens.push(t);
            }
            break;
        case "wait":
            this.currentTaskBegin = new Date();
            this.timeout = cmd[1][0];
            setTimeout(function() {
                if (self._pause) return;
                self.index++;
                self.start();
                if (cmd.end) cmd.end.call(self.element);
                if (last && self.complete) self.complete();
            }, cmd[1][0]);
            break;
        case "then":
            var arg = cmd[1][0];
            arg.index = 0;
            arg.complete = function() {
                self.index++;
                self.start();
                if (last && self.complete) self.complete();
            };
            arg.start();
            break;
        case "cycle":
            var count = cmd[1][1];
            if (count && self.cycleCount == count) {
                self.index++;
                self.start();
                if (last && self.complete) self.complete();
            } else {
                self.cycleCount++;
                self.index = cmd[1][0];
                self.start();
            }
            break;
        }
    }
});

//end-------------------AlloyPaper.To---------------------end


//begin-------------------AlloyPaper.UID---------------------begin

AlloyPaper.UID = Class.extend({
    "statics": {
        "_nextID": 0,
        "_nextCacheID": 1,
        "get": function() {
            return this._nextID++;
        },
        "getCacheID": function() {
            return this._nextCacheID++;
        }
    }
});

//end-------------------AlloyPaper.UID---------------------end


//begin-------------------AlloyPaper.Util---------------------begin

AlloyPaper.Util = Class.extend({
    "statics": {
        "random": function(min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        }
    }
});

//end-------------------AlloyPaper.Util---------------------end


//begin-------------------AlloyPaper.Vector2---------------------begin

AlloyPaper.Vector2 = Class.extend({
    "ctor": function(x, y) {
        this.x = x;
        this.y = y;
    },
    "copy": function() {
        return new AlloyPaper.Vector2(this.x, this.y);
    },
    "length": function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    "sqrLength": function() {
        return this.x * this.x + this.y * this.y;
    },
    "normalize": function() {
        var inv = 1 / this.length();
        return new AlloyPaper.Vector2(this.x * inv, this.y * inv);
    },
    "negate": function() {
        return new AlloyPaper.Vector2(-this.x, -this.y);
    },
    "add": function(v) {
        this.x += v.x;
        this.y += v.y;
    },
    "subtract": function(v) {
        return new AlloyPaper.Vector2(this.x - v.x, this.y - v.y);
    },
    "multiply": function(f) {
        return new AlloyPaper.Vector2(this.x * f, this.y * f);
    },
    "divide": function(f) {
        var invf = 1 / f;
        return new AlloyPaper.Vector2(this.x * invf, this.y * invf);
    },
    "dot": function(v) {
        return this.x * v.x + this.y * v.y;
    }
});

//end-------------------AlloyPaper.Vector2---------------------end


//begin-------------------AlloyPaper.Renderer---------------------begin

AlloyPaper.Renderer = Class.extend({
    "ctor": function (stage, openWebGL) {
        this.stage = stage;
        this.objs = [];
        this.width = this.stage.width;
        this.height = this.stage.height;
        this.mainCanvas = this.stage.canvas;
        var canvasSupport = !! window.CanvasRenderingContext2D,
            webglSupport = function() {
                try {
                    var canvas = document.createElement("canvas");
                    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
                } catch (e) {
                    return false;
                }
            }();
        if (webglSupport && openWebGL) {
            this.renderingEngine = new AlloyPaper.WebGLRenderer(this.stage.canvas);
        } else {
            if (canvasSupport) {
                this.renderingEngine = new AlloyPaper.CanvasRenderer(this.stage.canvas);
            } else {
                throw "your browser does not support canvas and webgl ";
            }
        }
        this.mainCtx = this.renderingEngine.ctx;
    },
    "update": function() {
        var objs = this.objs,
            ctx = this.mainCtx,
            engine = this.renderingEngine;
        objs.length = 0;
        this.computeMatrix();
        engine.clear();
        var l = objs.length;
        for (var m = 0; m < l; m++) {
            engine.renderObj(ctx, objs[m]);
        }
    },
    "computeMatrix": function() {
        for (var i = 0, len = this.stage.children.length; i < len; i++) {
            this._computeMatrix(this.stage.children[i]);
        }
    },
    "initComplex": function(o) {
        o.complexCompositeOperation = this._getCompositeOperation(o);
        o.complexAlpha = this._getAlpha(o, 1);
    },
    "_computeMatrix": function(o, mtx) {
        if (!o.isVisible()) {
            return;
        }
        if (mtx) {
            o._matrix.initialize(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
        } else {
            o._matrix.initialize(1, 0, 0, 1, 0, 0);
        }
        if (o instanceof AlloyPaper.Shape) {
            o._matrix.appendTransform(o.x, o.y, 1, 1, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
        } else {
            o._matrix.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
        }
        if (o instanceof AlloyPaper.Container) {
            var list = o.children,
                len = list.length,
                i = 0;
            for (; i < len; i++) {
                this._computeMatrix(list[i], o._matrix);
            }
        } else {
            if (o instanceof AlloyPaper.Graphics || o instanceof AlloyPaper.Text) {
                this.objs.push(o);
                this.initComplex(o);
            } else {
                o.initAABB();
                if (this.isInStage(o)) {
                    this.objs.push(o);
                    this.initComplex(o);
                }
            }
        }
    },
    "_getCompositeOperation": function(o) {
        if (o.compositeOperation) return o.compositeOperation;
        if (o.parent) return this._getCompositeOperation(o.parent);
    },
    "_getAlpha": function(o, alpha) {
        var result = o.alpha * alpha;
        if (o.parent) {
            return this._getAlpha(o.parent, result);
        }
        return result;
    },
    "isInStage": function(o) {
        return this.collisionBetweenAABB(o.AABB, this.stage.AABB);
    },
    "collisionBetweenAABB": function(AABB1, AABB2) {
        var maxX = AABB1[0] + AABB1[2];
        if (maxX < AABB2[0]) return false;
        var minX = AABB1[0];
        if (minX > AABB2[0] + AABB2[2]) return false;
        var maxY = AABB1[1] + AABB1[3];
        if (maxY < AABB2[1]) return false;
        var minY = AABB1[1];
        if (minY > AABB2[1] + AABB2[3]) return false;
        return true;
    }
});

//end-------------------AlloyPaper.Renderer---------------------end


//begin-------------------AlloyPaper.CanvasRenderer---------------------begin

AlloyPaper.CanvasRenderer = Class.extend({
    "ctor": function(canvas) {
        if (canvas) {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext("2d");
            this.height = this.canvas.height;
            this.width = this.canvas.width;
        }
    },
    "hitAABB": function(ctx, o, evt, type) {
        var list = o.children.slice(0),
            l = list.length;
        for (var i = l - 1; i >= 0; i--) {
            var child = list[i];
            if (!this.isbindingEvent(child)) continue;
            var target = this._hitAABB(ctx, child, evt, type);
            if (target) return target;
        }
    },
    "_hitAABB": function(ctx, o, evt, type) {
        if (!o.isVisible()) {
            return;
        }
        if (o instanceof AlloyPaper.Container) {
            var list = o.children.slice(0),
                l = list.length;
            for (var i = l - 1; i >= 0; i--) {
                var child = list[i];
                var target = this._hitAABB(ctx, child, evt, type);
                if (target) return target;
            }
        } else {
            if (o.AABB && this.checkPointInAABB(evt.stageX, evt.stageY, o.AABB)) {
                this._bubbleEvent(o, type, evt);
                return o;
            }
        }
    },
    "hitRender": function(ctx, o, evt, type) {
        var mtx = o._hitMatrix;
        var list = o.children.slice(0),
            l = list.length;
        for (var i = l - 1; i >= 0; i--) {
            var child = list[i];
            mtx.initialize(1, 0, 0, 1, 0, 0);
            mtx.appendTransform(o.x - evt.stageX, o.y - evt.stageY, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
            if (!this.isbindingEvent(child)) continue;
            ctx.save();
            var target = this._hitRender(ctx, child, mtx, evt, type);
            ctx.restore();
            if (target) return target;
        }
    },
    "_hitRender": function(ctx, o, mtx, evt, type) {
        ctx.clearRect(0, 0, 2, 2);
        if (!o.isVisible()) {
            return;
        }
        if (mtx) {
            o._hitMatrix.initialize(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
        } else {
            o._hitMatrix.initialize(1, 0, 0, 1, 0, 0);
        }
        mtx = o._hitMatrix;
        if (o instanceof AlloyPaper.Shape) {
            mtx.appendTransform(o.x, o.y, 1, 1, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
        } else {
            mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
        }
        var mmyCanvas = o.cacheCanvas || o.txtCanvas || o.shapeCanvas;
        if (mmyCanvas) {
            ctx.globalAlpha = o.complexAlpha;
            ctx.globalCompositeOperation = o.complexCompositeOperation;
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            ctx.drawImage(mmyCanvas, 0, 0);
        } else if (o instanceof AlloyPaper.Container) {
            var list = o.children.slice(0),
                l = list.length;
            for (var i = l - 1; i >= 0; i--) {
                ctx.save();
                var target = this._hitRender(ctx, list[i], mtx, evt, type);
                if (target) return target;
                ctx.restore();
            }
        } else if (o instanceof AlloyPaper.Bitmap || o instanceof AlloyPaper.Sprite) {
            ctx.globalAlpha = o.complexAlpha;
            ctx.globalCompositeOperation = o.complexCompositeOperation;
            var rect = o.rect;
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            ctx.drawImage(o.img, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
        } else if (o instanceof AlloyPaper.Graphics) {
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            o.draw(ctx);
        }
        if (ctx.getImageData(0, 0, 1, 1).data[3] > 1 && !(o instanceof AlloyPaper.Container)) {
            this._bubbleEvent(o, type, evt);
            return o;
        }
    },
    "_bubbleEvent": function(o, type, event) {
        var result = o.execEvent(type, event);
        if (result !== false) {
            if (o.parent && o.parent.events && o.parent.events[type] && o.parent.events[type].length > 0 && o.parent.baseInstanceof !== "Stage") {
                this._bubbleEvent(o.parent, type, event);
            }
        }
    },
    "isbindingEvent": function(obj) {
        if (Object.keys(obj.events).length !== 0) return true;
        if (obj instanceof AlloyPaper.Container) {
            for (var i = 0, len = obj.children.length; i < len; i++) {
                var child = obj.children[i];
                if (child instanceof AlloyPaper.Container) {
                    return this.isbindingEvent(child);
                } else {
                    if (Object.keys(child.events).length !== 0) return true;
                }
            }
        }
        return false;
    },
    "clear": function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    "renderObj": function(ctx, o) {
        var mtx = o._matrix;
        ctx.save();
        ctx.globalAlpha = o.complexAlpha;
        ctx.globalCompositeOperation = o.complexCompositeOperation;
        o.shadow && this._applyShadow(ctx, o.shadow);
        var mmyCanvas = o.cacheCanvas || o.txtCanvas || o.shapeCanvas;
        if (mmyCanvas) {
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            ctx.drawImage(mmyCanvas, 0, 0);
        } else if (o instanceof AlloyPaper.Bitmap || o instanceof AlloyPaper.Sprite) {
            if (o._clipFn) {
                ctx.beginPath();
                o._clipFn.call(ctx);
                ctx.closePath();
                ctx.clip();
            } 
            var rect = o.rect;
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            ctx.drawImage(o.img, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
        } else if (o instanceof AlloyPaper.Graphics || o instanceof AlloyPaper.Text) {
            ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            o.draw(ctx);
        }
        ctx.restore();
    },
    "_applyShadow" : function(ctx, shadow) {
        ctx.shadowColor = shadow.color || "transparent";
        ctx.shadowOffsetX = shadow.offsetX||0;
        ctx.shadowOffsetY = shadow.offsetY||0;
        ctx.shadowBlur = shadow.blur||0;
    },
    "clearBackUpCanvasCache": function() {},
    "checkPointInAABB": function(x, y, AABB) {
        var minX = AABB[0];
        if (x < minX) return false;
        var minY = AABB[1];
        if (y < minY) return false;
        var maxX = minX + AABB[2];
        if (x > maxX) return false;
        var maxY = minY + AABB[3];
        if (y > maxY) return false;
        return true;
    }
});

//end-------------------AlloyPaper.CanvasRenderer---------------------end

AlloyPaper.WebGLRenderer = Class.extend({
    "ctor": function(canvas) {
        this.surface = canvas;
        this.snapToPixel = true;
        this.canvasRenderer = new AlloyPaper.CanvasRenderer();
        this.textureCache = {};
        this.textureCanvasCache = {};
        this.initSurface(this.surface);
    },
    "initSurface": function(surface) {
        var options = {
            depth: false,
            alpha: true,
            preserveDrawingBuffer: true,
            antialias: false,
            premultipliedAlpha: true
        };
        var ctx = undefined;
        try {
            ctx = surface.ctx = surface.getContext("webgl", options) || surface.getContext("experimental-webgl", options);
            ctx.viewportWidth = surface.width;
            ctx.viewportHeight = surface.height;
        } catch (e) {}
        if (!ctx) {
            alert("Could not initialise WebGL. Make sure you've updated your browser, or try a different one like Google Chrome.");
        }
        var textureShader = ctx.createShader(ctx.FRAGMENT_SHADER);
        ctx.shaderSource(textureShader, "" + "precision mediump float;\n" + "varying vec3 vTextureCoord;\n" + "varying float vAlpha;\n" + "uniform float uAlpha;\n" + "uniform sampler2D uSampler0;\n" + "void main(void) { \n" + "vec4 color = texture2D(uSampler0, vTextureCoord.st);  \n" + "gl_FragColor = vec4(color.rgb, color.a * vAlpha);\n" + "}");
        ctx.compileShader(textureShader);
        if (!ctx.getShaderParameter(textureShader, ctx.COMPILE_STATUS)) {
            alert(ctx.getShaderInfoLog(textureShader));
        }
        var vertexShader = ctx.createShader(ctx.VERTEX_SHADER);
        ctx.shaderSource(vertexShader, "" + "attribute vec2 aVertexPosition;\n" + "attribute vec3 aTextureCoord;\n" + "attribute float aAlpha;\n" + "uniform bool uSnapToPixel;\n" + "const mat4 pMatrix = mat4(" + 2 / ctx.viewportWidth + ",0,0,0, 0," + -2 / ctx.viewportHeight + ",0,0, 0,0,-2,   0, -1,1,-1,1); \n" + "varying vec3 vTextureCoord;\n" + "varying float vAlpha;\n" + "void main(void) { \n" + "vTextureCoord = aTextureCoord; \n" + "vAlpha = aAlpha; \n" + "gl_Position = pMatrix * vec4(aVertexPosition.x,aVertexPosition.y,0.0, 1.0);\n" + "}");
        ctx.compileShader(vertexShader);
        if (!ctx.getShaderParameter(vertexShader, ctx.COMPILE_STATUS)) {
            alert(ctx.getShaderInfoLog(vertexShader));
        }
        var program = surface.shader = ctx.createProgram();
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, textureShader);
        ctx.linkProgram(program);
        if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }
        ctx.enableVertexAttribArray(program.vertexPositionAttribute = ctx.getAttribLocation(program, "aVertexPosition"));
        ctx.enableVertexAttribArray(program.uvCoordAttribute = ctx.getAttribLocation(program, "aTextureCoord"));
        ctx.enableVertexAttribArray(program.colorAttribute = ctx.getAttribLocation(program, "aAlpha"));
        program.alphaUniform = ctx.getUniformLocation(program, "uAlpha");
        program.snapToUniform = ctx.getUniformLocation(program, "uSnapToPixel");
        ctx.useProgram(program);
        this._vertexDataCount = 5;
        this._degToRad = Math.PI / 180;
        if (window.Float32Array) {
            this.vertices = new window.Float32Array(this._vertexDataCount * 4);
        } else {
            this.vertices = new Array(this._vertexDataCount * 4);
        }
        this.arrayBuffer = ctx.createBuffer();
        this.indexBuffer = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, this.arrayBuffer);
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        var byteCount = this._vertexDataCount * 4;
        ctx.vertexAttribPointer(program.vertexPositionAttribute, 2, ctx.FLOAT, 0, byteCount, 0);
        ctx.vertexAttribPointer(program.uvCoordAttribute, 2, ctx.FLOAT, 0, byteCount, 2 * 4);
        ctx.vertexAttribPointer(program.colorAttribute, 1, ctx.FLOAT, 0, byteCount, 4 * 4);
        if (window.Uint16Array) {
            this.indices = new window.Uint16Array(6);
        } else {
            this.indices = new Array(6);
        }
        for (var i = 0, l = this.indices.length; i < l; i += 6) {
            var j = i * 4 / 6;
            this.indices.set([j, j + 1, j + 2, j, j + 2, j + 3], i);
        }
        ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STREAM_DRAW);
        ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, this.indices, ctx.STATIC_DRAW);
        ctx.viewport(0, 0, ctx.viewportWidth, ctx.viewportHeight);
        ctx.colorMask(true, true, true, true);
        ctx.blendFuncSeparate(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA, ctx.SRC_ALPHA, ctx.ONE);
        ctx.enable(ctx.BLEND);
        ctx.disable(ctx.DEPTH_TEST);
        surface.init = true;
        this.ctx = ctx;
    },
    "_initTexture": function(src, ctx) {
        if (!this.textureCache[src.src]) {
            src.glTexture = ctx.createTexture();
            src.glTexture.image = src;
            ctx.activeTexture(ctx.TEXTURE0);
            ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
            ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src.glTexture.image);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
            this.textureCache[src.src] = src.glTexture;
            ctx.uniform1i(ctx.getUniformLocation(ctx.canvas.shader, "uSampler0"), 0);
        } else {
            src.glTexture = this.textureCache[src.src];
            ctx.activeTexture(ctx.TEXTURE0);
            ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
        }
    },
    "_initCache": function(o, src, ctx) {
        if (!this.textureCanvasCache[o.cacheID]) {
            this.textureCanvasCache[this._preCacheId] = null;
            src.glTexture = ctx.createTexture();
            src.glTexture.image = src;
            ctx.activeTexture(ctx.TEXTURE0);
            ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
            ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src.glTexture.image);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
            ctx.uniform1i(ctx.getUniformLocation(ctx.canvas.shader, "uSampler0"), 0);
            this.textureCanvasCache[o.cacheID] = src.glTexture;
        } else {
            src.glTexture = this.textureCanvasCache[o.cacheID];
            ctx.activeTexture(ctx.TEXTURE0);
            ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
        }
    },
    "updateCache": function(ctx, o, w, h) {
        ctx.clearRect(0, 0, w + 1, h + 1);
        this.renderCache(ctx, o);
    },
    "renderCache": function(ctx, o) {
        if (!o.isVisible()) {
            return;
        }
        if (o instanceof AlloyPaper.Container || o instanceof AlloyPaper.Stage) {
            var list = o.children.slice(0);
            for (var i = 0, l = list.length; i < l; i++) {
                ctx.save();
                this.canvasRenderer.render(ctx, list[i]);
                ctx.restore();
            }
        } else if (o instanceof AlloyPaper.Bitmap || o instanceof AlloyPaper.Sprite) {
            var rect = o.rect;
            ctx.drawImage(o.img, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
        } else if (o.txtCanvas) {
            ctx.drawImage(o.txtCanvas, 0, 0);
        } else if (o.shapeCanvas) {
            ctx.drawImage(o.shapeCanvas, 0, 0);
        }
    },
    "clear": function() {
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
    },
    "renderObj": function(ctx, o) {
        var mtx = o._matrix,
            leftSide = 0,
            topSide = 0,
            rightSide = 0,
            bottomSide = 0;
        var uFrame = 0,
            vFrame = 0,
            u = 1,
            v = 1,
            img = 0;
        if (o.complexCompositeOperation === "lighter") {
            ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE);
        } else {
            ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
        }
        var mmyCanvas = o.cacheCanvas || o.txtCanvas || o.shapeCanvas;
        if (mmyCanvas) {
            this._initCache(o, mmyCanvas, ctx);
            rightSide = leftSide + mmyCanvas.width;
            bottomSide = topSide + mmyCanvas.height;
        } else if (o instanceof AlloyPaper.Bitmap || o instanceof AlloyPaper.Sprite) {
            var rect = o.rect;
            img = o.img;
            this._initTexture(img, ctx);
            rightSide = leftSide + rect[2];
            bottomSide = topSide + rect[3];
            u = rect[2] / img.width;
            v = rect[3] / img.height;
            uFrame = rect[0] / img.width;
            vFrame = rect[1] / img.height;
        }
        var a = mtx.a,
            b = mtx.b,
            c = mtx.c,
            d = mtx.d,
            tx = mtx.tx,
            ty = mtx.ty,
            lma = leftSide * a,
            lmb = leftSide * b,
            tmc = topSide * c,
            tmd = topSide * d,
            rma = rightSide * a,
            rmb = rightSide * b,
            bmc = bottomSide * c,
            bmd = bottomSide * d;
        var alpha = o.complexAlpha;
        this.vertices.set([lma + tmc + tx, lmb + tmd + ty, uFrame, vFrame, alpha, lma + bmc + tx, lmb + bmd + ty, uFrame, vFrame + v, alpha, rma + bmc + tx, rmb + bmd + ty, uFrame + u, vFrame + v, alpha, rma + tmc + tx, rmb + tmd + ty, uFrame + u, vFrame, alpha], 0);
        ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.vertices);
        ctx.drawElements(ctx.TRIANGLES, 6, ctx.UNSIGNED_SHORT, 0);
    },
    "clearBackUpCanvasCache": function() {
        this.textureCanvasCache[1] = null;
    }
});

//begin-------------------AlloyPaper.DisplayObject---------------------begin

AlloyPaper.DisplayObject = Class.extend({
    "ctor": function() {
        this.alpha = this.scaleX = this.scaleY = this.scale = 1;
        this.x = this.y = this.rotation = this.originX = this.originY = this.skewX = this.skewY = this.width = this.height = this.regX = this.regY = 0;
        this.textureReady = true;
        this.visible = true;
        this._matrix = new AlloyPaper.Matrix2D();
        this._hitMatrix = new AlloyPaper.Matrix2D();
        this.events = {};
        this.id = AlloyPaper.UID.get();
        this.cacheID = 0;
        this.baseInstanceof = "DisplayObject";
        this.tickFPS = 60;
        var self = this;
        this._watch(this, "originX", function(prop, value) {
            if (typeof value === "string") {
                self.regX = parseInt(value);
            } else {
                self.regX = self.width * value;
            }
        });
        this._watch(this, "originY", function(prop, value) {
            if (typeof value === "string") {
                self.regY = parseInt(value);
            } else {
                self.regY = self.height * value;
            }
        });
        this._watch(this, "filter", function(prop, value) {
            self.setFilter.apply(self, value);
        });
        this._watch(this, "scale", function(prop, value) {
            this.scaleX = this.scaleY = this.scale;
        });
        this.cursor = "default";
        this.onHover(function () {
            //this._setCursor(this, this.cursor);
        }, function () {
            this._setCursor(this, AlloyPaper.DefaultCursor);
        });
    },
    "_watch": function(target, prop, onPropertyChanged) {
        if (typeof prop === "string") {
            target["__" + prop] = this[prop];
            Object.defineProperty(target, prop, {
                get: function() {
                    return this["__" + prop];
                },
                set: function(value) {
                    this["__" + prop] = value;
                    onPropertyChanged.apply(target, [prop, value]);
                }
            });
        } else {
            for (var i = 0, len = prop.length; i < len; i++) {
                var propName = prop[i];
                target["__" + propName] = this[propName];
                (function(propName) {
                    Object.defineProperty(target, propName, {
                        get: function() {
                            return this["__" + propName];
                        },
                        set: function(value) {
                            this["__" + propName] = value;
                            onPropertyChanged.apply(target, [propName, value]);
                        }
                    });
                })(propName);
            }
        }
    },
    "isVisible": function() {
        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && this.textureReady);
    },
    "on": function(type, fn) {
        this.events[type] || (this.events[type] = []);
        this.events[type].push(fn);
    },
    "off": function (type, fn) {
        var fns=this.events[type];
        if (fns) {
            var i = 0, len = fns.length;
            for (; i < len; i++) {
                if (fns[i] === fn) {
                    fns.splice(i, 1);
                    break;
                }
            }
        }

    },
    "execEvent": function (type, event) {
        if (this.events) {
            var fns = this.events[type],
                result = true;
            if (fns) {
                for (var i = 0, len = fns.length; i < len; i++) {
                    result = fns[i].call(this, event);
                }
            }
            return result;
        }
    },
    "_setCursor": function (obj, type) {
        if (obj) {
            if (obj.parent instanceof AlloyPaper.Stage) {
                obj.parent.setCursor(type);
            } else {
                this._setCursor(obj.parent, type);
            }
        }
    },
    "clone": function() {
        var o = new AlloyPaper.DisplayObject();
        this.cloneProps(o);
        return o;
    },
    "cloneProps": function(o) {
        o.visible = this.visible;
        o.alpha = this.alpha;
        o.originX = this.originX;
        o.originY = this.originY;
        o.rotation = this.rotation;
        o.scaleX = this.scaleX;
        o.scaleY = this.scaleY;
        o.skewX = this.skewX;
        o.skewY = this.skewY;
        o.x = this.x;
        o.y = this.y;
        o.regX = this.regX;
        o.regY = this.regY;
    },
    "cache": function() {
        if (!this.cacheCanvas) {
            this.cacheCanvas = document.createElement("canvas");
            var bound = this.getBound();
            this.cacheCanvas.width = bound.width;
            this.cacheCanvas.height = bound.height;
            this.cacheCtx = this.cacheCanvas.getContext("2d");
        }
        this.cacheID = AlloyPaper.UID.getCacheID();
        this.updateCache(this.cacheCtx, this, bound.width, bound.width);
    },
    "uncache": function() {
        this.cacheCanvas = null;
        this.cacheCtx = null;
        this.cacheID = null;
    },
    "setFilter": function(r, g, b, a) {
        if (this.width === 0 || this.height === 0) return;
        this.uncache();
        this.cache();
        var imageData = this.cacheCtx.getImageData(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);
        var pix = imageData.data;
        for (var i = 0, n = pix.length; i < n; i += 4) {
            if (pix[i + 3] > 0) {
                pix[i] *= r;
                pix[i + 1] *= g;
                pix[i + 2] *= b;
                pix[i + 3] *= a;
            }
        }
        this.cacheCtx.putImageData(imageData, 0, 0);
    },
    "getBound": function() {
        return {
            width: this.width,
            height: this.height
        };
    },
    "toCenter": function() {
        this.originX = .5;
        this.originY = .5;
        this.x = this.parent.width / 2;
        this.y = this.parent.height / 2;
    },
    "destroy": function() {
        this.cacheCanvas = null;
        this.cacheCtx = null;
        this.cacheID = null;
        this._matrix = null;
        this.events = null;
        if (this.parent) {
            this.parent.remove(this);
        }
    },
    "initAABB": function() {
        var x,
            y,
            width = this.width,
            height = this.height,
            mtx = this._matrix;
        var x_a = width * mtx.a,
            x_b = width * mtx.b;
        var y_c = height * mtx.c,
            y_d = height * mtx.d;
        var tx = mtx.tx,
            ty = mtx.ty;
        var minX = tx,
            maxX = tx,
            minY = ty,
            maxY = ty;
        if ((x = x_a + tx) < minX) {
            minX = x;
        } else if (x > maxX) {
            maxX = x;
        }
        if ((x = x_a + y_c + tx) < minX) {
            minX = x;
        } else if (x > maxX) {
            maxX = x;
        }
        if ((x = y_c + tx) < minX) {
            minX = x;
        } else if (x > maxX) {
            maxX = x;
        }
        if ((y = x_b + ty) < minY) {
            minY = y;
        } else if (y > maxY) {
            maxY = y;
        }
        if ((y = x_b + y_d + ty) < minY) {
            minY = y;
        } else if (y > maxY) {
            maxY = y;
        }
        if ((y = y_d + ty) < minY) {
            minY = y;
        } else if (y > maxY) {
            maxY = y;
        }
        this.AABB = [minX, minY, maxX - minX, maxY - minY];
        this.rectPoints = [{
            x: tx,
            y: ty},{
            x: x_a + tx,
            y: x_b + ty},{
            x: x_a + y_c + tx,
            y: x_b + y_d + ty},{
            x: y_c + tx,
            y: y_d + ty}];
    },
    "updateCache": function(ctx, o, w, h) {
        ctx.clearRect(0, 0, w + 1, h + 1);
        this.renderCache(ctx, o);
    },
    "renderCache": function(ctx, o) {
        if (!o.isVisible()) {
            return;
        }
        if (o instanceof AlloyPaper.Container || o instanceof AlloyPaper.Stage) {
            var list = o.children.slice(0);
            for (var i = 0, l = list.length; i < l; i++) {
                ctx.save();
                this.render(ctx, list[i]);
                ctx.restore();
            }
        } else if (o instanceof AlloyPaper.Bitmap || o instanceof AlloyPaper.Sprite) {
            var rect = o.rect;
            ctx.drawImage(o.img, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
        } else if (o.txtCanvas) {
            ctx.drawImage(o.txtCanvas, 0, 0);
        } else if (o.shapeCanvas) {
            ctx.drawImage(o.shapeCanvas, 0, 0);
        }
    },
    "onClick": function(fn) {
        this.on("click", fn);
    },
    "onMouseDown": function(fn) {
        this.on("pressdown", fn);
    },
    "onMouseMove": function(fn) {
        this.on("mousemove", fn);
    },
    "onMouseUp": function(fn) {
        this.on("pressup", fn);
    },
    "onMouseOver": function(fn) {
        this.on("mouseover", fn);
    },
    "onMouseOut": function(fn) {
        this.on("mouseout", fn);
    },
    "onHover": function(over, out) {
        this.on("mouseover", over);
        this.on("mouseout", out);
    },
    "onPressDown": function(fn) {
        this.on("pressdown", fn);
    },
    "onPressMove": function(fn) {
        this.on("pressmove", fn);
    },
    "onPressUp": function(fn) {
        this.on("pressup", fn);
    },
    "onMouseWheel": function(fn) {
        this.on("mousewheel", fn);
    },
    "onTouchStart": function(fn) {
        this.on("pressdown", fn);
    },
    "onTouchMove": function(fn) {
        this.on("pressmove", fn);
    },
    "onTouchEnd": function(fn) {
        this.on("pressup", fn);
    },
    "onTouchCancel": function () {
        this.on("touchcancel", fn);
    },
    "onDbClick": function(fn) {
        this.on("dblclick", fn);
    },
    "addEventListener": function (type, handler) {
        this.on(this._normalizeEventType(type), handler);
    },
    "removeEventListener": function (type, handler) {
        this.off(this._normalizeEventType(type), handler);
    },
    "_normalizeEventType": function (type) {
        var newType = { "touchstart": "pressdown", "touchmove": "pressmove", "touchend": "pressup" }[type];
        if (newType) return newType;
        return type;
    }
});

//end-------------------AlloyPaper.DisplayObject---------------------end

AlloyPaper.Bitmap = AlloyPaper.DisplayObject.extend({
    "ctor": function(img) {
        this._super();
        Object.defineProperty(this, "rect", {
            get: function () {
                return this["__rect"];
            },
            set: function (value) {
                this["__rect"] = value;
                this.width = value[2];
                this.height = value[3];
                this.regX = value[2] * this.originX;
                this.regY = value[3] * this.originY;
            }
        });
        if (arguments.length === 0) return;
        if (typeof img == "string") {
            this._initWithSrc(img);
            this.imgSrc = img;
        } else {
            this._init(img);
            this.imgSrc = img.src;
        }
    },
    "_initWithSrc": function(img) {
        var cacheImg = AlloyPaper.Cache[img];
        if (cacheImg) {
            this._init(cacheImg);
        } else {
            var self = this;
            this.textureReady = false;
            this.img = document.createElement("img");
            this.img.crossOrigin = "Anonymous";
            this.img.onload = function () {
                if (!self.rect) self.rect = [0, 0, self.img.width, self.img.height];
                AlloyPaper.Cache[img] = self.img;
                self.textureReady = true;
                self.imageLoadHandle && self.imageLoadHandle();
                if (self.filter) self.filter = self.filter;
            };
            this.img.src = img;
        }
    },
    "_init": function(img) {
        if (!img) return;
        this.img = img;
        this.img.crossOrigin = "Anonymous";
        this.width = img.width;
        this.height = img.height;
        this.rect = [0, 0, img.width, img.height];
    },
    "useImage": function(img) {
        if (typeof img == "string") {
            this._initWithSrc(img);
        } else {
            this._init(img);
            this.imageLoadHandle && this.imageLoadHandle();
        }
    },
    "onImageLoad": function(fn) {
        this.imageLoadHandle = fn;
    },
    "clone": function () {
        if (this.textureReady) {
            var o = new AlloyPaper.Bitmap(this.img);
            o.rect = this.rect.slice(0);
            this.cloneProps(o);
            return o;
        } else {
            var o = new AlloyPaper.Bitmap(this.imgSrc);
            this.rect&&(o.rect = this.rect.slice(0));
            this.cloneProps(o);
            return o;
        }
    },
    "clip": function (fn) {
        this._clipFn = fn;
    },
    "flipX": function() {},
    "flipY": function() {}
});

//begin-------------------AlloyPaper.Container---------------------begin

AlloyPaper.Container = AlloyPaper.DisplayObject.extend({
    "ctor": function() {
        this._super();
        this.children = [];
        this.baseInstanceof = "Container";
    },
    "add": function(obj) {
        var len = arguments.length;
        if (len > 1) {
            for (var i = 0; i < len; i++) {
                var item = arguments[i];
                if (item) {
                    this.children.push(item);
                    item.parent = this;
                }
            }
        } else {
            if (obj) {
                this.children.push(obj);
                obj.parent = this;
            }
        }
    },
    "remove": function(obj) {
        var len = arguments.length,
            childLen = this.children.length;
        if (len > 1) {
            for (var j = 0; j < len; j++) {
                var currentObj = arguments[j];
                for (var k = childLen; --k >= 0;) {
                    if (currentObj&&this.children[k].id == currentObj.id) {
                        currentObj.parent = null;
                        this.children.splice(k, 1);
                        break;
                    }
                }
            }
        } else {
            for (var i = childLen; --i >= 0;) {
                if (obj&&this.children[i].id == obj.id) {
                    obj.parent = null;
                    this.children.splice(i, 1);
                    break;
                }
            }
        }
    },
    "clone": function() {
        var o = new AlloyPaper.Container();
        this.cloneProps(o);
        var arr = o.children = [];
        for (var i = this.children.length - 1; i > -1; i--) {
            var clone = this.children[i].clone();
            arr.unshift(clone);
        }
        return o;
    },
    "removeAll": function() {
        var kids = this.children;
        while (kids.length) {
            kids.pop().parent = null;
        }
    },
    "destroy": function() {
        this._super();
        var kids = this.children;
        while (kids.length) {
            var kid = kids.pop();
            kid.destroy();
            kid = null;
        }
    },
    "swapChildrenAt": function(index1, index2) {
        var kids = this.children;
        var o1 = kids[index1];
        var o2 = kids[index2];
        if (!o1 || !o2) {
            return;
        }
        kids[index1] = o2;
        kids[index2] = o1;
    },
    "swapChildren": function(child1, child2) {
        var kids = this.children;
        var index1, index2;
        for (var i = 0, l = kids.length; i < l; i++) {
            if (kids[i] == child1) {
                index1 = i;
            }
            if (kids[i] == child2) {
                index2 = i;
            }
            if (index1 != null && index2 != null) {
                break;
            }
        }
        if (i == l) {
            return;
        }
        kids[index1] = child2;
        kids[index2] = child1;
    },
    "swapToTop": function(child) {
        this.swapChildren(child, this.children[this.children.length - 1]);
    }
});

//end-------------------AlloyPaper.Container---------------------end


//begin-------------------AlloyPaper.Graphics---------------------begin

AlloyPaper.Graphics = AlloyPaper.DisplayObject.extend({
    "ctor": function() {
        this._super();
        this.cmds = [];
        this.assMethod = ["fillStyle", "strokeStyle", "lineWidth"];
    },
    "draw": function(ctx) {
        for (var i = 0, len = this.cmds.length; i < len; i++) {
            var cmd = this.cmds[i];
            if (this.assMethod.join("-").match(new RegExp("\\b" + cmd[0] + "\\b", "g"))) {
                ctx[cmd[0]] = cmd[1][0];
            } else {
                ctx[cmd[0]].apply(ctx, Array.prototype.slice.call(cmd[1]));
            }
        }
    },
    "clearRect": function(x, y, width, height) {
        this.cmds.push(["clearRect", arguments]);
        return this;
    },
    "clear": function() {
        this.cmds.length = 0;
        return this;
    },
    "strokeRect": function() {
        this.cmds.push(["strokeRect", arguments]);
        return this;
    },
    "fillRect": function() {
        this.cmds.push(["fillRect", arguments]);
        return this;
    },
    "beginPath": function() {
        this.cmds.push(["beginPath", arguments]);
        return this;
    },
    "arc": function() {
        this.cmds.push(["arc", arguments]);
        return this;
    },
    "closePath": function() {
        this.cmds.push(["closePath", arguments]);
        return this;
    },
    "fillStyle": function() {
        this.cmds.push(["fillStyle", arguments]);
        return this;
    },
    "fill": function() {
        this.cmds.push(["fill", arguments]);
        return this;
    },
    "strokeStyle": function() {
        this.cmds.push(["strokeStyle", arguments]);
        return this;
    },
    "lineWidth": function() {
        this.cmds.push(["lineWidth", arguments]);
        return this;
    },
    "stroke": function() {
        this.cmds.push(["stroke", arguments]);
        return this;
    },
    "moveTo": function() {
        this.cmds.push(["moveTo", arguments]);
        return this;
    },
    "lineTo": function() {
        this.cmds.push(["lineTo", arguments]);
        return this;
    },
    "bezierCurveTo": function() {
        this.cmds.push(["bezierCurveTo", arguments]);
        return this;
    },
    "clone": function() {}
});

//end-------------------AlloyPaper.Graphics---------------------end


//begin-------------------AlloyPaper.Label---------------------begin

AlloyPaper.Label = AlloyPaper.DisplayObject.extend({
    "ctor": function(option) {
        this._super();
        this.value = option.value;
        this.fontSize = option.fontSize;
        this.fontFamily = option.fontFamily;
        this.color = option.color;
        this.textAlign = "center";
        this.textBaseline = "top";
        this.fontWeight = option.fontWeight || "";
        this.maxWidth = option.maxWidth || 2e3;
        this.square = option.square || false;
        this.txtCanvas = document.createElement("canvas");
        this.txtCtx = this.txtCanvas.getContext("2d");
        this.setDrawOption();
        this.shadow = option.shadow;
        this._watch(this, ["value", "fontSize", "color", "fontFamily"], function() {
            this.setDrawOption();
        });
    },
    "setDrawOption": function() {
        var drawOption = this.getDrawOption({
            txt: this.value,
            maxWidth: this.maxWidth,
            square: this.square,
            size: this.fontSize,
            alignment: this.textAlign,
            color: this.color || "black",
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            shadow: this.shadow
        });
        this.cacheID = AlloyPaper.UID.getCacheID();
        this.width = drawOption.calculatedWidth;
        this.height = drawOption.calculatedHeight;
    },
    "getDrawOption": function(option) {
        var canvas = this.txtCanvas;
        var ctx = this.txtCtx;
        var canvasX, canvasY;
        var textX, textY;
        var text = [];
        var textToWrite = option.txt;
        var maxWidth = option.maxWidth;
        var squareTexture = option.square;
        var textHeight = option.size;
        var textAlignment = option.alignment;
        var textColour = option.color;
        var fontFamily = option.fontFamily;
        var fontWeight = option.fontWeight;
        ctx.font = textHeight + "px " + fontFamily;
        if (maxWidth && this.measureText(ctx, textToWrite) > maxWidth) {
            maxWidth = this.createMultilineText(ctx, textToWrite, maxWidth, text);
            canvasX = this.getPowerOfTwo(maxWidth);
        } else {
            text.push(textToWrite);
            canvasX = this.getPowerOfTwo(ctx.measureText(textToWrite).width);
        }
        canvasY = this.getPowerOfTwo(textHeight * (text.length + 1));
        if (squareTexture) {
            canvasX > canvasY ? canvasY = canvasX : canvasX = canvasY;
        }
        option.calculatedWidth = canvasX;
        option.calculatedHeight = canvasY;
        canvas.width = canvasX;
        canvas.height = canvasY;
        switch (textAlignment) {
        case "left":
            textX = 0;
            break;
        case "center":
            textX = canvasX / 2;
            break;
        case "right":
            textX = canvasX;
            break;
        }
        textY = canvasY / 2;
        ctx.fillStyle = textColour;
        ctx.textAlign = textAlignment;
        ctx.textBaseline = "middle";
        ctx.font = fontWeight + " " + textHeight + "px " + fontFamily;
        if (option.shadow) {
            ctx.shadowColor = option.shadow.color || "transparent";
            ctx.shadowOffsetX = option.shadow.offsetX || 0;
            ctx.shadowOffsetY = option.shadow.offsetY || 0;
            ctx.shadowBlur = option.shadow.blur || 0;
        } 
        var offset = (canvasY - textHeight * (text.length + 1)) * .5;
        option.cmd = [];
        for (var i = 0; i < text.length; i++) {
            if (text.length > 1) {
                textY = (i + 1) * textHeight + offset;
            }
            option.cmd.push({
                text: text[i],
                x: textX,
                y: textY
            });
            ctx.fillText(text[i], textX, textY);
        }
        return option;
    },
    "getPowerOfTwo": function(value, pow) {
        var temp_pow = pow || 1;
        while (temp_pow < value) {
            temp_pow *= 2;
        }
        return temp_pow;
    },
    "measureText": function(ctx, textToMeasure) {
        return ctx.measureText(textToMeasure).width;
    },
    "createMultilineText": function(ctx, textToWrite, maxWidth, text) {
        textToWrite = textToWrite.replace("\n", " ");
        var currentText = textToWrite;
        var futureText;
        var subWidth = 0;
        var maxLineWidth;
        var wordArray = textToWrite.split(" ");
        var wordsInCurrent, wordArrayLength;
        wordsInCurrent = wordArrayLength = wordArray.length;
        while (this.measureText(ctx, currentText) > maxWidth && wordsInCurrent > 1) {
            wordsInCurrent--;
            currentText = futureText = "";
            for (var i = 0; i < wordArrayLength; i++) {
                if (i < wordsInCurrent) {
                    currentText += wordArray[i];
                    if (i + 1 < wordsInCurrent) {
                        currentText += " ";
                    }
                } else {
                    futureText += wordArray[i];
                    if (i + 1 < wordArrayLength) {
                        futureText += " ";
                    }
                }
            }
        }
        text.push(currentText);
        maxLineWidth = this.measureText(ctx, currentText);
        if (futureText) {
            subWidth = this.createMultilineText(ctx, futureText, maxWidth, text);
            if (subWidth > maxLineWidth) {
                maxLineWidth = subWidth;
            }
        }
        return maxLineWidth;
    },
    "draw": function(ctx) {
        ctx.fillStyle = this.color;
        ctx.font = this.font;
        ctx.textAlign = this.textAlign || "left";
        ctx.textBaseline = this.textBaseline || "top";
        ctx.fillText(this.text, 0, 0);
    }
});

//end-------------------AlloyPaper.Label---------------------end


//begin-------------------AlloyPaper.Particle---------------------begin

AlloyPaper.Particle = AlloyPaper.Bitmap.extend({
    "ctor": function(option) {
        this._super(option.texture);
        this.originX = .5;
        this.originY = .5;
        this.position = option.position;
        this.x = this.position.x;
        this.y = this.position.y;
        this.rotation = option.rotation || 0;
        this.velocity = option.velocity;
        this.acceleration = option.acceleration || new AlloyPaper.Vector2(0, 0);
        this.rotatingSpeed = option.rotatingSpeed || 0;
        this.rotatingAcceleration = option.rotatingAcceleration || 0;
        this.hideSpeed = option.hideSpeed || .01;
        this.zoomSpeed = option.hideSpeed || .01;
        this.isAlive = true;
        this.img = option.texture;
        this.img.src = "";
    },
    "tick": function() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity.multiply(.1));
        this.rotatingSpeed += this.rotatingAcceleration;
        this.rotation += this.rotatingSpeed;
        this.alpha -= this.hideSpeed;
        this.x = this.position.x;
        this.y = this.position.y;
    }
});

//end-------------------AlloyPaper.Particle---------------------end


//begin-------------------AlloyPaper.ParticleSystem---------------------begin

AlloyPaper.ParticleSystem = AlloyPaper.Container.extend({
    "ctor": function(option) {
        this._super();
        this.speed = option.speed;
        this.angle = option.angle;
        this.angleRange = option.angleRange;
        this.emitArea = option.emitArea;
        this.gravity = option.gravity || {
            x: 0,
            y: 0
        };
        this.filter = option.filter;
        this.compositeOperation = "lighter";
        this.emitCount = option.emitCount;
        this.maxCount = option.maxCount || 1e3;
        this.emitX = option.emitX;
        this.emitY = option.emitY;
        if (typeof option.texture === "string") {
            if (AlloyPaper.Cache[option.texture]) {
                this.texture = AlloyPaper.Cache[option.texture];
                this.generateFilterTexture(this.texture);
            } else {
                this.bitmap = new AlloyPaper.Bitmap();
                this.bitmap._parent = this;
                this.bitmap.onImageLoad(function() {
                    this._parent.texture = this.img;
                    this._parent.generateFilterTexture(this.img);
                    delete this._parent;
                });
                this.bitmap.useImage(option.texture);
            }
        } else {
            this.texture = option.texture;
            this.generateFilterTexture(option.texture);
        }
        this.totalCount = option.totalCount;
        this.emittedCount = 0;
        this.tickFPS = 60;
        this.hideSpeed = option.hideSpeed || .01;
    },
    "generateFilterTexture": function(texture) {
        var bitmap = new AlloyPaper.Bitmap(texture);
        bitmap.filter = this.filter;
        this.filterTexture = bitmap.cacheCanvas;
    },
    "changeFilter": function (filter) {
        var bitmap = new AlloyPaper.Bitmap(this.texture);
        bitmap.filter = filter;
        this.filterTexture = bitmap.cacheCanvas;
    },
    "emit": function() {
        var angle = (this.angle + AlloyPaper.Util.random(-this.angleRange / 2, this.angleRange / 2)) * Math.PI / 180;
        var halfX = this.emitArea[0] / 2,
            harfY = this.emitArea[1] / 2;
        var particle = new AlloyPaper.Particle({
    position: new AlloyPaper.Vector2(this.emitX + AlloyPaper.Util.random(-halfX, halfX), this.emitY + AlloyPaper.Util.random(-harfY, harfY)),
    velocity: new AlloyPaper.Vector2(this.speed * Math.cos(angle), this.speed * Math.sin(angle)),
    texture: this.filterTexture,
    acceleration: this.gravity,
    hideSpeed: this.hideSpeed
});
        this.add(particle);
        this.emittedCount++;
    },
    "tick": function() {
        if (this.filterTexture) {
            var len = this.children.length;
            if (this.totalCount && this.emittedCount > this.totalCount) {
                if (len === 0) this.destroy();
            } else {
                if (len < this.maxCount) {
                    for (var k = 0; k < this.emitCount; k++) {
                        this.emit();
                    }
                }
            }
            for (var i = 0; i < len; i++) {
                var item = this.children[i];
                if (item.isVisible()) {
                    item.tick();
                } else {
                    this.remove(item);
                    i--;
                    len--;
                }
            }
        }
    }
});

//end-------------------AlloyPaper.ParticleSystem---------------------end

//begin----------------- AlloyPaper.ParticleExplosion -------------------begin
AlloyPaper.ParticleExplosion = AlloyPaper.Container.extend({
    ctor: function (ps, callback) {
        this._super();
        this.ps = ps;
        this.add(ps);
        this.callback = callback;
        this.tickFPS = 0;

        setTimeout(function () {
            this.ps.maxCount = 0;
            this.tickFPS = 60;
        }.bind(this), 1000);
    },
    tick: function () {
        if (this.ps.children.length === 0) {
            this.tickFPS = 0;
            this.parent.remove(this);
            this.callback();

        }
    }
});



//end-----------------AlloyPaper.ParticleExplosion-------------------end

//begin-------------------AlloyPaper.Shape---------------------begin

AlloyPaper.Shape = AlloyPaper.DisplayObject.extend({
    "ctor": function(width, height, debug) {
        this._super();
        this.cmds = [];
        this.assMethod = ["fillStyle", "strokeStyle", "lineWidth"];
        this.width = width;
        this.height = height;
        this._width = width;
        this._height = height;
        this.shapeCanvas = document.createElement("canvas");
        this.shapeCanvas.width = this.width;
        this.shapeCanvas.height = this.height;
        this.shapeCtx = this.shapeCanvas.getContext("2d");
        if (debug) {
            this.fillStyle("red");
            this.fillRect(0, 0, width, height);
        }
        this._watch(this, "scaleX", function(prop, value) {
            this.width = this._width * value;
            this.height = this._height * this.scaleY;
            this.shapeCanvas.width = this.width;
            this.shapeCanvas.height = this.height;
            this.shapeCtx.scale(value, this.scaleY);
            this.end();
        });
        this._watch(this, "scaleY", function(prop, value) {
            this.width = this._width * this.scaleX;
            this.height = this._height * value;
            this.shapeCanvas.width = this.width;
            this.shapeCanvas.height = this.height;
            this.shapeCtx.scale(this.scaleX, value);
            this.end();
        });
    },
    "end": function() {
        this._preCacheId = this.cacheID;
        this.cacheID = AlloyPaper.UID.getCacheID();
        var ctx = this.shapeCtx;
        for (var i = 0, len = this.cmds.length; i < len; i++) {
            var cmd = this.cmds[i];
            if (this.assMethod.join("-").match(new RegExp("\\b" + cmd[0] + "\\b", "g"))) {
                ctx[cmd[0]] = cmd[1][0];
            } else {
                ctx[cmd[0]].apply(ctx, Array.prototype.slice.call(cmd[1]));
            }
        }
    },
    "clearRect": function(x, y, width, height) {
        this.cacheID = AlloyPaper.UID.getCacheID();
        this.shapeCtx.clearRect(x, y, width, height);
    },
    "clear": function() {
        this.cacheID = AlloyPaper.UID.getCacheID();
        this.cmds.length = 0;
        this.shapeCtx.clearRect(0, 0, this.width, this.height);
    },
    "strokeRect": function() {
        this.cmds.push(["strokeRect", arguments]);
        return this;
    },
    "fillRect": function() {
        this.cmds.push(["fillRect", arguments]);
        return this;
    },
    "beginPath": function() {
        this.cmds.push(["beginPath", arguments]);
        return this;
    },
    "arc": function() {
        this.cmds.push(["arc", arguments]);
        return this;
    },
    "closePath": function() {
        this.cmds.push(["closePath", arguments]);
        return this;
    },
    "fillStyle": function() {
        this.cmds.push(["fillStyle", arguments]);
        return this;
    },
    "fill": function() {
        this.cmds.push(["fill", arguments]);
        return this;
    },
    "strokeStyle": function() {
        this.cmds.push(["strokeStyle", arguments]);
        return this;
    },
    "lineWidth": function() {
        this.cmds.push(["lineWidth", arguments]);
        return this;
    },
    "stroke": function() {
        this.cmds.push(["stroke", arguments]);
        return this;
    },
    "moveTo": function() {
        this.cmds.push(["moveTo", arguments]);
        return this;
    },
    "lineTo": function() {
        this.cmds.push(["lineTo", arguments]);
        return this;
    },
    "bezierCurveTo": function() {
        this.cmds.push(["bezierCurveTo", arguments]);
        return this;
    },
    "clone": function() {}
});

//end-------------------AlloyPaper.Shape---------------------end


//begin-------------------AlloyPaper.Sprite---------------------begin

AlloyPaper.Sprite = AlloyPaper.DisplayObject.extend({
    "ctor": function(option) {
        this._super();
        this.option = option;
        this.x = option.x || 0;
        this.y = option.y || 0;
        this.currentFrameIndex = 0;
        this.animationFrameIndex = 0;
        this.currentAnimation = option.currentAnimation || null;
        this.rect = [0, 0, 10, 10];
        this.visible = false;
        this.bitmaps = [];
        this._loadedCount = 0;
        var len = this.option.imgs.length;
        for (var i = 0; i < len; i++) {
            var urlOrImg = this.option.imgs[i];
            if (typeof urlOrImg === "string") {
                if (AlloyPaper.Cache[urlOrImg]) {
                    this.bitmaps.push(new AlloyPaper.Bitmap(AlloyPaper.Cache[urlOrImg]));
                    this._loadedCount++;
                } else {
                    (function(){
                        var bmp = new AlloyPaper.Bitmap();
                        bmp._sprite = this;
                        bmp.onImageLoad(function() {
                            bmp._sprite._loadedCount++;
                            if (bmp._sprite._loadedCount === len) {
                                bmp._sprite.visible = true;
                                delete bmp._sprite;
                            }
                        });
                        bmp.useImage(this.option.imgs[i]);
                        this.bitmaps.push(bmp);
                    })();
                }
            } else {
                this._loadedCount++;
                this.bitmaps.push(new AlloyPaper.Bitmap(urlOrImg));
            }
        }
        if (this._loadedCount === len) {
            this.visible = true;
        }
        this.img = this.bitmaps[0].img;
        this.interval = 1e3 / option.framerate;
        this.loop = null;
        this.paused = false;
        this.animationEnd = option.animationEnd || null;
        if (this.currentAnimation) {
            this.gotoAndPlay(this.currentAnimation);
        }
        this.tickAnimationEnd = option.tickAnimationEnd || null;
    },
    "play": function() {
        this.paused = false;
    },
    "pause": function () {
        this.paused = true;
    },
    "reset": function() {
        this.currentFrameIndex = 0;
        this.animationFrameIndex = 0;
    },
    "gotoAndPlay": function(animation, times) {
        this.paused = false;
        this.reset();
        clearInterval(this.loop);
        this.currentAnimation = animation;
        var self = this;
        var playTimes = 0;
        this.loop = setInterval(function() {
            if (!self.paused) {
                var opt = self.option;
                var frames = opt.animations[self.currentAnimation].frames,
                    len = frames.length;
                self.animationFrameIndex++;
                if (self.animationFrameIndex > len - 1) {
                    playTimes++;
                    self.animationFrameIndex = 0;
                    if (self.tickAnimationEnd) {
                        self.tickAnimationEnd();
                    }
                    if (times && playTimes == times) {
                        if (self.animationEnd) self.animationEnd();
                        self.paused = true;
                        clearInterval(self.loop);
                        self.parent.remove(self);
                    }
                }
                self.rect = opt.frames[frames[self.animationFrameIndex]];
                self.width = self.rect[2];
                self.height = self.rect[3];
                var rect = self.rect,
                    rectLen = rect.length;
                rectLen > 4 && (self.regX = rect[2] * rect[4]);
                rectLen > 5 && (self.regY = rect[3] * rect[5]);
                rectLen > 6 && (self.img = self.bitmaps[rect[6]].img);
            }
        }, this.interval);
    },
    "gotoAndStop": function(animation) {
        this.reset();
        clearInterval(this.loop);
        var self = this;
        self.currentAnimation = animation;
        var opt = self.option;
        var frames = opt.animations[self.currentAnimation].frames;
        self.rect = opt.frames[frames[self.animationFrameIndex]];
        self.width = self.rect[2];
        self.height = self.rect[3];
        var rect = self.rect,
            rectLen = rect.length;
        rectLen > 4 && (self.regX = rect[2] * rect[4]);
        rectLen > 5 && (self.regY = rect[3] * rect[5]);
        rectLen > 6 && (self.img = self.bitmaps[rect[6]].img);
    }
});

//end-------------------AlloyPaper.Sprite---------------------end

AlloyPaper.Stage = AlloyPaper.Container.extend({
    "ctor": function(canvas, openWebGL) {
        this._super();
        this.canvas = typeof canvas == "string" ? document.querySelector(canvas) : canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.AABB = [0, 0, this.width, this.height];
        this.hitAABB = true;
        this.hitRenderer = new AlloyPaper.CanvasRenderer();
        this.hitCanvas = document.createElement("canvas");
        this.hitCanvas.width = 1;
        this.hitCanvas.height = 1;
        this.stageRenderer = new AlloyPaper.Renderer(this, openWebGL);
        this.hitCtx = this.hitCanvas.getContext("2d");
        this._scaleX = this._scaleY = null;
        this.offset = this._getXY(this.canvas);
        this.overObj = null;
        this._paused = false;
        this.fps = 63;
        this.interval = Math.floor(1e3 / this.fps);
        this.toList = [];
        this.tickFns = [];
        this.beginTick = null;
        this.endTick = null;
        var self = this;
        self.loop = setInterval(function() {
            if (self._paused) return;
            self.beginTick && self.beginTick();
            self._tick(self);
            self.endTick && self.endTick();
        }, self.interval);
        Object.defineProperty(this, "useRequestAnimFrame", {
            set: function(value) {
                this._useRequestAnimFrame = value;
                if (value) {
                    clearInterval(self.loop);
                    self.loop = AlloyPaper.RAF.requestInterval(function() {
                        self._tick(self);
                    }, self.interval);
                } else {
                    AlloyPaper.RAF.clearRequestInterval(self.loop);
                    self.loop = setInterval(function() {
                        self._tick(self);
                    }, self.interval);
                }
            },
            get: function() {
                return this._useRequestAnimFrame;
            }
        });
        this._watch(this, "fps", function(prop, value) {
            this.interval = Math.floor(1e3 / value);
            var self = this;
            if (this.useRequestAnimFrame) {
                clearInterval(this.loop);
                try {
                    AlloyPaper.RAF.clearRequestInterval(this.loop);
                } catch (e) {}
                this.loop = AlloyPaper.RAF.requestInterval(function() {
                    self._tick(self);
                }, this.interval);
            } else {
                AlloyPaper.RAF.clearRequestInterval(this.loop);
                try {
                    clearInterval(this.loop);
                } catch (e) {}
                this.loop = setInterval(function() {
                    self._tick(self);
                }, this.interval);
            }
        });
        this._initDebug();
        this._pressmoveObjs = null;
        this.baseInstanceof = "Stage";
        this.overObj = null;
        this._moveInterval = 16;
        this._preMoveTime = new Date();
        this._currentMoveTime = new Date();
        Object.defineProperty(this, "moveFPS", {
            set: function(value) {
                this._moveFPS = value;
                this._moveInterval = 1e3 / value;
            },
            get: function() {
                return this._moveFPS;
            }
        });
        this.canvas.addEventListener("mousemove", this._handleMouseMove.bind(this), false);
        this.canvas.addEventListener("click", this._handleClick.bind(this), false);
        this.canvas.addEventListener("mousedown", this._handleMouseDown.bind(this), false);
        this.canvas.addEventListener("mouseup", this._handleMouseUp.bind(this), false);
        this.canvas.addEventListener("dblclick", this._handleDblClick.bind(this), false);
        this.addEvent(this.canvas, "mousewheel", this._handleMouseWheel.bind(this));
        this.canvas.addEventListener("touchmove", this._handleMouseMove.bind(this), false);
        this.canvas.addEventListener("touchstart", this._handleMouseDown.bind(this), false);
        this.canvas.addEventListener("touchend", this._handleMouseUp.bind(this), false);
        this.canvas.addEventListener("touchcancel", this._handleTouchCancel.bind(this), false);
        document.addEventListener("DOMContentLoaded", this.adjustLayout.bind(this), false);
        window.addEventListener("load", this.adjustLayout.bind(this), false);
        window.addEventListener("resize", this.adjustLayout.bind(this), false);
        this.autoUpdate = true;
        this.scaleType = "normal";

        this.setCursor(AlloyPaper.DefaultCursor);
    },
    "adjustLayout": function() {
        this.offset = this._getXY(this.canvas);
        this.style=this._getStyle();
        if (this._scaleX) {
            this.scaleToScreen(this._scaleX, this._scaleY);
        }
    },
    "pause": function () {
        this._paused = true;
        this._pauseSprite(this);
        this._pauseTween();

    },
    "play": function () {
        this._paused = false;
        this._playSprite(this);
        this._playTween();
    },
    "_pauseSprite": function (obj) {
        for (var i = 0, len = obj.children.length; i < len; i++) {
            var child = obj.children[i];
            if (child instanceof AlloyPaper.Container) {
                this._pauseSprite(child);
            } else if (child instanceof AlloyPaper.Sprite) {
                child.pause();
            }
        }
    },
    "_pauseTween": function () {
        for (var i = 0, len = this.toList.length; i < len; i++) {
            this.toList[i].pause();
        }
    },
    "_playSprite": function (obj) {
        for (var i = 0, len = obj.children.length; i < len; i++) {
            var child = obj.children[i];
            if (child instanceof AlloyPaper.Container) {
                this._playSprite(child);
            } else if (child instanceof AlloyPaper.Sprite) {
                child.play();
            }
        }
    },
    "_playTween": function () {
        for (var i = 0, len = this.toList.length; i < len; i++) {
            this.toList[i].play();
        }
    },
    "toggle": function () {
        if (this._paused) {
            this.play();
        } else {
            this.pause();
        }
    },
    "openDebug": function() {},
    "closeDebug": function() {},
    "_initDebug": function() {
        this.debugDiv = document.createElement("div");
        this.debugDiv.style.cssText = "display:none;position:absolute;z-index:2000;left:0;bottom:0;background-color:yellow;font-size:16px;";
        document.body.appendChild(this.debugDiv);
        Object.defineProperty(this, "debug", {
            set: function(value) {
                this._debug = value;
                if (this._debug) {
                    this.debugDiv.style.display = "block";
                } else {
                    this.debugDiv.style.display = "none";
                }
            },
            get: function() {
                return this._debug;
            }
        });
    },
    "_handleMouseWheel": function(event) {
        this._correctionEvent(event, event.type);
        var callbacks = this.events["mousewheel"];
        if (callbacks) {
            for (var i = 0, len = callbacks.length; i < len; i++) {
                var callback = callbacks[i];
                callback(event);
            }
        }
        if (this.overObj) {
            this.hitRenderer._bubbleEvent(this.overObj, "mousewheel", event);
        }
    },
    "update": function() {
        this.stageRenderer.update();
    },
    "_correctionEvent": function (evt, type) {
        //this.adjustLayout();
        if (evt.touches||evt.changedTouches) {
            var firstTouch = evt.touches[0] || evt.changedTouches[0];
            if (firstTouch) {
                evt.stageX = firstTouch.pageX;
                evt.stageY = firstTouch.pageY;
            }
        } else {
            evt.stageX = evt.pageX;
            evt.stageY = evt.pageY;
        }
        //if (this.scaleType !== "normal") {
            var p = this._correction(evt.stageX, evt.stageY);
            evt.stageX = Math.round(p.x);
            evt.stageY = Math.round(p.y);
        //}
        var callbacks = this.events[type];
        if (callbacks) {
            for (var i = 0, len = callbacks.length; i < len; i++) {
                var callback = callbacks[i];
                callback(evt);
            }
        }
    },
    "_handleClick": function(evt) {
        this._correctionEvent(evt, evt.type);
        this._getObjectUnderPoint(evt, evt.type);
    },
    "_handleMouseMove": function(evt) {
        this._currentMoveTime = new Date();
        if (this._currentMoveTime - this._preMoveTime > this._moveInterval / 2) {
            this._correctionEvent(evt, evt.type);
            if (this._pressmoveObjs) {
                var pressmoveHandle = this._pressmoveObjs.events["pressmove"];
                pressmoveHandle && this._pressmoveObjs.execEvent("pressmove", evt);
            }
            var child = this._getObjectUnderPoint(evt, "mousemove");
            if (child) {
                if (this.overObj) {
                    if (child.id != this.overObj.id) {
                        this.hitRenderer._bubbleEvent(this.overObj, "mouseout", evt);
                        this.hitRenderer._bubbleEvent(child, "mouseover", evt);
                        this.overObj = child;
                    } else {
                        this.hitRenderer._bubbleEvent(child, "mousemove", evt);
                    }
                    this._setCursorByOverObject(child);
                } else {
                    this.overObj = child;
                    this.hitRenderer._bubbleEvent(child, "mouseover", evt);
                }
            } else {
                if (this.overObj) {
                    this.hitRenderer._bubbleEvent(this.overObj, "mouseout", evt);
                    this.overObj = null;
                }
            }
            this._preMoveTime = this._currentMoveTime;
        }
    },
    "_getPressmoveTarget": function(o) {
        if (o.events["pressmove"]) {
            this._pressmoveObjs = o;
        }
        if (o.parent) this._getPressmoveTarget(o.parent);
    },
    "_handleMouseDown": function(evt) {
        this._correctionEvent(evt, "pressdown");
        var child = this._getObjectUnderPoint(evt, "pressdown");
        if (child) {
            this._getPressmoveTarget(child);
        }
    },
    "_handleMouseUp": function(evt) {
        this._pressmoveObjs = null;
        this._correctionEvent(evt, "pressup");
        this._getObjectUnderPoint(evt, "pressup");
    },
    "_handleTouchCancel": function (evt) {
        this._pressmoveObjs = null;
        this._correctionEvent(evt, "touchcancel");
        this._getObjectUnderPoint(evt, "touchcancel");
    },
    "_handleDblClick": function(evt) {
        this._correctionEvent(evt, evt.type);
        this._getObjectUnderPoint(evt, evt.type);
    },
    "_getObjectUnderPoint": function(evt, type) {
        if (this.hitAABB) {
            return this.hitRenderer.hitAABB(this.hitCtx, this, evt, type);
        } else {
            return this.hitRenderer.hitRender(this.hitCtx, this, evt, type);
        }
    },
    "_getXY": function(el) {
        var _t = 0,
            _l = 0;
        if (document.documentElement.getBoundingClientRect && el.getBoundingClientRect) {
            var box = el.getBoundingClientRect();
            _l = box.left;
            _t = box.top;
        } else {
            while (el.offsetParent) {
                _t += el.offsetTop;
                _l += el.offsetLeft;
                el = el.offsetParent;
            }
            return [_l, _t];
        }
        return [_l + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft), _t + Math.max(document.documentElement.scrollTop, document.body.scrollTop)];
    },
    "_tick": function(container) {
        if (container && container.tick && container.tickFPS > 0) {
            this._initInterval(container);
            if (!container.hasOwnProperty("_tickInterval")) {
                container.tick();
            } else {
                container._tickIntervalCurrent = new Date();
                if (!container._tickIntervalLast) {
                    container._tickIntervalLast = new Date();
                    container._tickIntervalPrev = new Date();
                }

                var itv = (container._tickIntervalCurrent - container._tickIntervalLast) +( container._tickIntervalCurrent - container._tickIntervalPrev);
                if (itv > container._tickInterval) {
                    container.tick();
                    container._tickIntervalLast = container._tickIntervalCurrent;
                }
                container._tickIntervalPrev= new Date();

            }
        }
        var children = container.children,
            len = children.length;
        for (var i = 0; i < len; i++) {
            var child = children[i];
            if (child) {
                if (child.tick && child.tickFPS > 0) {
                    this._initInterval(child);
                    if (!child.hasOwnProperty("_tickInterval")) {
                        child.tick();
                    } else {
                        child._tickIntervalCurrent = new Date();
                        if (!child._tickIntervalLast){
                            child._tickIntervalLast = new Date();
                            child._tickIntervalPrev = new Date();
                        }
                        var itv =( child._tickIntervalCurrent - child._tickIntervalLast)+(child._tickIntervalCurrent-child._tickIntervalPrev);
                        if (itv > child._tickInterval) {
                            child.tick();
                            child._tickIntervalLast = child._tickIntervalCurrent;
                        }
                        child._tickIntervalPrev= new Date();

                    }
                }
                if (child.baseInstanceof == "Container") {
                    this._tick(child);
                }
            }
        }
    },
    "_initInterval": function(obj) {
        if (obj.hasOwnProperty("tickFPS")) {
            obj._tickInterval = 1e3 / obj.tickFPS;
        }
    },
    "tick": function () {
        for (var i = 0, len = this.tickFns.length; i < len; i++) {
            var fn = this.tickFns[i];
            if (!fn.hasOwnProperty("_ARE_PrevDate")) {
                fn();
                continue;
            }
            fn._ARE_CurrentDate = new Date();
            var interval = (fn._ARE_CurrentDate - fn._ARE_PrevDate) + (fn._ARE_CurrentDate - fn._ARE_LastDate);

            if (interval > fn._ARE_Interval) {
                fn();
                fn._ARE_PrevDate = fn._ARE_CurrentDate;
            }
            fn._ARE_LastDate = fn._ARE_CurrentDate;
        }

        if(this.autoUpdate)this.update();
        if (this.debug) {
            this.getFPS();
            this.debugDiv.innerHTML = "fps : " + this.fpsValue +  " <br/>object count : " + this.getTotalCount() + " <br/>rendering mode : " + this.getRenderingMode() + " <br/>inner object count  : " + this.stageRenderer.objs.length;
        }
    },
    "onTick": function(fn,interval) {
        this.tickFns.push(fn);
        if (interval !== undefined) {
            fn._ARE_PrevDate = new Date();
            fn._ARE_CurrentDate = new Date();
            fn._ARE_LastDate = new Date();
            fn._ARE_Interval = interval;
        }
    },
    "setFPS": function(fps) {
        this.interval = Math.floor(1e3 / fps);
    },
    "onKeyboard": function(keyCombo, onDownCallback, onUpCallback) {
        AlloyPaper.Keyboard.on(keyCombo, onDownCallback, onUpCallback);
    },
    "getActiveKeys": function() {
        return AlloyPaper.Keyboard.getActiveKeys();
    },
    "scaleToScreen": function (scaleX, scaleY) {
        this.scaleType = "screen";
        if (scaleX === 1 && scaleY === 1) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        }
        document.body.style.margin = 0;
        document.documentElement.style.margin = 0;
        document.body.style.border = 0;
        document.documentElement.style.border = 0;
        document.body.style.padding = 0;
        document.documentElement.style.padding = 0;
        document.body.style.width = "100%";
        document.documentElement.style.width = "100%";
        document.body.style.height = "100%";
        document.documentElement.style.height = "100%";
        this._scaleX = scaleX;
        this._scaleY = scaleY;
        var canvas = this.canvas;
        canvas.style.position = "absolute";
        canvas.style.width = scaleX * 100 + "%";
        canvas.style.height = scaleY * 100 + "%";
        canvas.style.left = 100 * (1 - scaleX) / 2 + "%";
        canvas.style.top = 100 * (1 - scaleY) / 2 + "%";
        canvas.style.border = "0px solid #ccc";
        this.offset = this._getXY(this.canvas);
        this.style=this._getStyle();
    },
    "scaleToBox": function (w, h) {
        this.scaleType = "box";
        if (w === window.innerWidth && h === window.innerHeight) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        }
        var canvas = this.canvas;
        canvas.style.position = "absolute";
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        canvas.style.left = (window.innerWidth - w) / 2 + "px";
        canvas.style.top = (window.innerHeight - h) / 2 + "px";
        canvas.style.border = "0px solid #ccc";
        this.offset = this._getXY(this.canvas);
        this.style=this._getStyle();
    },
    "correctingXY": function (x, y) {
        if (this.scaleType === "box") {
            return {
                x: x * this.width / parseInt( this.canvas.style.width),
                y: y * this.height / parseInt(this.canvas.style.height)
            };
        } else {
            return {
                x: x * this.width / (window.innerWidth * this._scaleX),
                y: y * this.height / (window.innerHeight * this._scaleY)
            };
        }
    },
    "getTotalCount": function() {
        var count = 0;
        var self = this;

        function getCount(child) {
            if (child.baseInstanceof == "Container" || child.baseInstanceof == "Stage") {
                for (var i = 0, len = child.children.length; i < len; i++) {
                    var subChild = child.children[i];
                    if (subChild instanceof AlloyPaper.Container) {
                        getCount(subChild);
                    } else {
                        count++;
                    }
                }
            } else {
                count++;
            }
        }
        getCount(this);
        return count;
    },
    "getRenderingMode": function() {
        if (this.stageRenderer.renderingEngine instanceof AlloyPaper.CanvasRenderer) {
            return "Canvas";
        }
        return "WebGL";
    },
    "getFPS": function() {
        var fps = AlloyPaper.FPS.get();
        this.fpsValue = fps.value;
    },
    "addEvent": function(el, type, fn, capture) {
        if (type === "mousewheel" && document.mozHidden !== undefined) {
            type = "DOMMouseScroll";
        }
        el.addEventListener(type, function(event) {
            var type = event.type;
            if (type == "DOMMouseScroll" || type == "mousewheel") {
                event.delta = event.wheelDelta ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
            }
            fn.call(this, event);
        }, capture || false);
    },
    "setCursor": function(type) {
        this.canvas.style.cursor = type;
    },
    "_setCursorByOverObject": function (obj) {
        if (obj.cursor !== "default") {
            this.setCursor(obj.cursor);
        } else {
            if (obj.parent) {
                this._setCursorByOverObject(obj.parent);
            }
        }
    },
    "destroy": function () {
        this._super();
        this.canvas.parentNode.removeChild(this.canvas);
        if (this.useRequestAnimFrame) {
            AlloyPaper.RAF.clearRequestInterval(this.loop);
        } else {
            clearInterval(this.loop);
        }
    },
    "_getStyle":function() {
        var style = window.getComputedStyle(this.canvas, null);
        return {
            boxSizing: style.boxSizing,
            borderTopWidth: parseInt(style.borderTopWidth),
            borderLeftWidth: parseInt(style.borderLeftWidth),
            width:parseInt(style.width),
            height:parseInt(style.height)
        };
    },
    "_correction":function(pageX,pageY){
        var x=pageX-this.offset[0]-this.style.borderLeftWidth,
            y=pageY-this.offset[1]-this.style.borderTopWidth,
            canvasWidth=this.style.width,
            canvasHeight=this.style.height;
        if(this.style.boxSizing==="border-box"){
            canvasWidth-=this.style.borderLeftWidth;
            canvasHeight-=this.style.borderTopWidth;
        }
        return {x: this.width*x/canvasWidth,y:this.height*y/canvasHeight};
    }
});


//begin-------------------AlloyPaper.Text---------------------begin

AlloyPaper.Text = AlloyPaper.DisplayObject.extend({
    "ctor": function(value, font, color) {
        this._super();
        this.value = value;
        this.font = font;
        this.color = color;
        this.textAlign = "left";
        this.textBaseline = "top";
    },
    "draw": function(ctx) {
        ctx.fillStyle = this.color;
        ctx.font = this.font;
        ctx.textAlign = this.textAlign || "left";
        ctx.textBaseline = this.textBaseline || "top";
        ctx.fillText(this.value, 0, 0);
    },
    "clone": function() {
        var t = new AlloyPaper.Text(this.text, this.font, this.color);
        this.cloneProps(t);
        return t;
    },
    "getWidth": function () {
        var measureCtx = document.createElement("canvas").getContext("2d");
        measureCtx.font = this.font;
        var width = measureCtx.measureText(this.value).width;
        measureCtx = null;
        return width;
    }
});

//end-------------------AlloyPaper.Text---------------------end


return AlloyPaper;
}));