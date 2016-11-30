/* AlloyFinger v0.1.0 for Vue
 * By dntzhang
 * Github: https://github.com/AlloyTeam/AlloyFinger
 */

var _EVENTMAP = {
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

// definition
Vue.directive('finger', function(elem, binding) {
  if(!binding) {
    // vue1.xx
    binding = {
      value: elem,
      arg: this.arg
    };

    elem = this.el;
  }

  var func = binding.value || function() {};
  var eventName = binding.arg;

  var options = {};

  options[_EVENTMAP[eventName]] = func;

  new AlloyFinger(elem, options);
});