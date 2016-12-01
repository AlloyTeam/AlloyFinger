![preview](http://alloyteam.github.io/AlloyFinger/alloyfinger.png)

# Install

You can install it via npm:

```html
npm install alloyfinger
```

# Usage

```js
var af = new AlloyFinger(element, {
    touchStart: function () { },
    touchMove: function () { },
    touchEnd:  function () { },
    touchCancel: function () { },
    multipointStart: function () { },
    multipointEnd: function () { },
    tap: function () { },
    doubleTap: function () { },
    longTap: function () { },
    singleTap: function () { },
    rotate: function (evt) {
        console.log(evt.angle);
    },
    pinch: function (evt) {
        console.log(evt.scale);
    },
    pressMove: function (evt) {
        console.log(evt.deltaX);
        console.log(evt.deltaY);
    },
    swipe: function (evt) {
        console.log("swipe" + evt.direction);
    }
});

/**
 * this method can also add or remove the event handler
 */
var onTap = function() {};

af.on('tap', onTap);
af.on('touchStart', function() {});

af.off('tap', onTap);
```

### React Version:

```js
render() {
    return (
        <AlloyFinger
            onTap={this.onTap.bind(this)}
            onMultipointStart={this.onMultipointStart.bind(this)}
            onLongTap={this.onLongTap.bind(this)}
            onSwipe={this.onSwipe.bind(this)}
            onPinch={this.onPinch.bind(this)}
            onRotate={this.onRotate.bind(this)}
            onPressMove={this.onPressMove.bind(this)}
            onMultipointEnd={this.onMultipointEnd.bind(this)}
            onDoubleTap={this.onDoubleTap.bind(this)}>
            <div className="test">the element that you want to bind event</div>
        </AlloyFinger>
    );
}
```

### Vue1 & Vue2 Version:

```html
<div id="cnt">
    <div
        v-finger:tap="tap"
        v-finger:multipoint-start="multipointStart"
        v-finger:long-tap="longTap"
        v-finger:swipe="swipe"
        v-finger:pinch="pinch"
        v-finger:rotate="rotate"
        v-finger:press-move="pressMove"
        v-finger:multipoint-end="multipointEnd"
        v-finger:double-tap="doubleTap"
        v-finger:single-tap="singleTap"

        v-finger:touch-start="touchStart"
        v-finger:touch-move="touchMove"
        v-finger:touch-end="touchEnd"
        v-finger:touch-cancel="touchCancel"
    >
        <div>the element that you want to bind event</div>
    </div>
</div>

<!-- vue.js -->
<script type="text/javascript" src="./vue.min.js"></script>
<!-- need include the original alloy_finger.js -->
<script type="text/javascript" src="./alloy_finger.js"></script>
<!-- AlloyFinger's plugin -->
<script type="text/javascript" src="./alloy_finger.vue.js"></script>
```

```js
Vue.use(AlloyFingerVue); // use AlloyFinger's plugin

var h = new Vue({
    el: '#cnt',
    methods: {
        tap: function() { console.log('onTap'); },
        multipointStart: function() { console.log('onMultipointStart'); },
        longTap: function() { console.log('onLongTap'); },
        swipe: function(evt) {
            console.log("swipe" + evt.direction);
            console.log('onSwipe');
        },
        pinch: function(evt) { 
            console.log(evt.scale);
            console.log('onPinch'); 
        },
        rotate: function(evt) {
            console.log(evt.angle);
            console.log('onRotate'); 
        },
        pressMove: function(evt) { 
            console.log(evt.deltaX);
            console.log(evt.deltaY);
            console.log('onPressMove'); 
        },
        multipointEnd: function() { console.log('onMultipointEnd'); },
        doubleTap: function() { console.log('onDoubleTap'); },
        singleTap: function () { console.log('onSingleTap'); },

        touchStart: function() { console.log('onTouchStart'); },
        touchMove: function() { console.log('onTouchMove'); },
        touchEnd: function() { console.log('onTouchEnd'); },
        touchCancel: function() { console.log('onTouchCancel'); }
    }
});
```

# Many thanks to 
[transformjs](http://alloyteam.github.io/AlloyTouch/transformjs/)

# Who is using AlloyFinger?

![preview](http://sqimg.qq.com/qq_product_operations/im/qqlogo/imlogo.png)

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.
