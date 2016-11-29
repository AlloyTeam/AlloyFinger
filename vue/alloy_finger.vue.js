/* AlloyFinger v0.1.0 for Vue
 * By dntzhang and june01
 * Github: https://github.com/AlloyTeam/AlloyFinger
 */

// definition
var AlloyFinger = Vue.extend({
	template: '<div v-on:touchstart="_handleTouchStart" v-on:touchmove="_handleTouchMove" v-on:touchcancel="_handleTouchCancel" v-on:touchend="_handleTouchEnd"><slot></slot></div>',
	data: function() {
		return {
			preV: { x: null, y: null },
      pinchStartLen: null,
      scale: 1,
      isDoubleTap: false,
      delta: null,
      last: null,
      now: null,
      tapTimeout: null,
      longTapTimeout: null,
      swipeTimeout: null,
      x1: null,
      x2: null,
      y1: null,
      y2: null,
      preTapPosition: { x: null, y: null },
		}
	},
	methods: {
		getLen: function(v) {
      return Math.sqrt(v.x * v.x + v.y * v.y);
    },

   	dot: function(v1, v2) {
      return v1.x * v2.x + v1.y * v2.y;
    },

    getAngle: function(v1, v2) {
      var mr = getLen(v1) * getLen(v2);
      if (mr === 0) return 0;
      var r = dot(v1, v2) / mr;
      if (r > 1) r = 1;
      return Math.acos(r);
    },

    cross: function(v1, v2) {
      return v1.x * v2.y - v2.x * v1.y;
    },

    getRotateAngle: function(v1, v2) {
      var angle = getAngle(v1, v2);
      if (cross(v1, v2) > 0) {
        angle *= -1;
      }

      return angle * 180 / Math.PI;
    },

    _handleTouchStart: function(evt) {
      var emit = this.$dispatch || this.$emit;

      emit.call(this, 'touch-start', evt);

			this.now = Date.now();
			this.x1 = evt.touches[0].pageX;
			this.y1 = evt.touches[0].pageY;
			this.delta = this.now - (this.last || this.now);
			if(this.preTapPosition.x!==null){
				this.isDoubleTap = (this.delta > 0 && this.delta <= 250&&Math.abs(this.preTapPosition.x-this.x1)<30&&Math.abs(this.preTapPosition.y-this.y1)<30);
			}
			this.preTapPosition.x=this.x1;
			this.preTapPosition.y=this.y1;
			this.last = this.now;
     	var preV = this.preV,
      		len = evt.touches.length;
     	if (len > 1) {
				var v = { x: evt.touches[1].pageX - this.x1, y: evt.touches[1].pageY - this.y1 };
				preV.x = v.x;
				preV.y = v.y;
				this.pinchStartLen = getLen(preV);
				emit.call(this, 'multipoint-start', evt);
     	}
     	this.longTapTimeout = setTimeout(function(){
        emit.call(this, 'long-tap', evt);
     	}.bind(this), 750);
    },

    _handleTouchMove: function(evt){
      var emit = this.$dispatch || this.$emit;

      emit.call(this, 'touch-move', evt);

      var preV = this.preV,
	        len = evt.touches.length,
	        currentX = evt.touches[0].pageX,
	        currentY = evt.touches[0].pageY;
      this.isDoubleTap=false;
      if (len > 1) {
        var v = { x: evt.touches[1].pageX - currentX, y: evt.touches[1].pageY - currentY };

        if (preV.x !== null) {
          if (this.pinchStartLen > 0) {
            evt.scale = getLen(v) / this.pinchStartLen;
            emit.call(this, 'pinch', evt);
          }

          evt.angle = getRotateAngle(v, preV);
          emit.call(this, 'rotate', evt);
        }
        preV.x = v.x;
        preV.y = v.y;
      } else {
        if (this.x2 !== null) {
          evt.deltaX = currentX - this.x2;
          evt.deltaY = currentY - this.y2;
        }else{
          evt.deltaX = 0;
          evt.deltaY = 0;
        }
        emit.call(this, 'press-move', evt);
      }
      this._cancelLongTap();
      this.x2 = currentX;
      this.y2 = currentY;
      if(len > 1) {
        evt.preventDefault();
      }
    },

    _handleTouchCancel: function(){
      emit.call(this, 'touch-cancel', evt);

      clearInterval(this.tapTimeout);
      clearInterval(this.longTapTimeout);
      clearInterval(this.swipeTimeout);
    },

    _handleTouchEnd: function(evt){
      var emit = this.$dispatch || this.$emit;

      emit.call(this, 'touch-end', evt);

      this._cancelLongTap();
      var self = this;
      if( evt.touches.length<2){
        emit.call(this, 'multipoint-end', evt);
      }

      if ((this.x2 && Math.abs(this.x1 - this.x2) > 30) ||
        (this.y2 && Math.abs(this.preV.y - this.y2) > 30)) {
        evt.direction = this._swipeDirection(this.x1, this.x2, this.y1, this.y2);
        this.swipeTimeout = setTimeout(function () {
            emit.call(self, 'swipe', evt);
        }, 0)
      } else {
        this.tapTimeout = setTimeout(function () {
          emit.call(self, 'tap', evt);
          if (self.isDoubleTap) {
            emit.call(self, 'double-tap', evt);
            self.isDoubleTap = false;
          }
        }, 0)
      }

      this.preV.x = 0;
      this.preV.y = 0;
      this.scale = 1;
      this.pinchStartLen = null;
      this.x1 = this.x2 = this.y1 = this.y2 = null;
    },

    _cancelLongTap: function() {
      clearTimeout(this.longTapTimeout);
    },

    _swipeDirection: function(x1, x2, y1, y2) {
      return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }
	}
});

// register
Vue.component('alloy-finger', AlloyFinger);

// export
if(typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = AlloyFinger;
} else {
  window.AlloyFinger = AlloyFinger;
}