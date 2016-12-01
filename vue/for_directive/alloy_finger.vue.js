/* AlloyFinger v0.1.0 for Vue
 * By june01
 * Github: https://github.com/AlloyTeam/AlloyFinger
 */

; (function() {

  var AlloyFingerPlugin = {
    install: function(Vue, options) {
      options = options || {};
      var AlloyFinger = window.AlloyFinger || options.AlloyFinger;

      if(!AlloyFinger) {
        throw new Error('you need include the AlloyFinger!');
      }

      var EVENTMAP = {
        'touch-start': 'touchStart',
        'touch-move': 'touchMove',
        'touch-end': 'touchEnd',
        'touch-cancel': 'touchCancel',
        'multipoint-start': 'multipointStart',
        'multipoint-end': 'multipointEnd',
        'tap': 'tap',
        'double-tap': 'doubleTap',
        'long-tap': 'longTap',
        'single-tap': 'singleTap',
        'rotate': 'rotate',
        'pinch': 'pinch',
        'press-move': 'pressMove',
        'swipe': 'swipe'
      };

      var CACHE = [];

      // definition
      Vue.directive('finger', function(elem, binding) {
        if(Vue.version.substr(0,1) <= 1) {
          // vue1.xx
          binding = {
            value: elem,
            arg: this.arg
          };

          elem = this.el;
        }

        var func = binding.value || function() {};
        var eventName = binding.arg;

        eventName = EVENTMAP[eventName];

        var cacheObj;
        for(var i=0,len=CACHE.length; i<len; i++) {
          if(CACHE[i].elem === elem) {
            cacheObj = CACHE[i];
            break;
          }
        }

        if(cacheObj && cacheObj.alloyFinger) {
          cacheObj.alloyFinger.on(eventName, func);
        } else {
          var options = {};
          options[eventName] = func;

          CACHE.push({
            elem: elem,
            alloyFinger: new AlloyFinger(elem, options)
          });
        }
      });
    }
  }

  // export
  if(typeof module !== 'undefined' && typeof exports === 'object') {
    module.exports = AlloyFingerPlugin;
  } else {
    window.AlloyFingerPlugin = AlloyFingerPlugin;
  }

})();