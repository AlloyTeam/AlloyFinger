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
            console.log(evt.zoom);
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

Otherwise, you can also include it with 'import', for example:

```javascript
import Vue from 'vue'
import AlloyFinger from 'alloyfinger'
import AlloyFingerPlugin from 'alloyfinger/vue/alloy_finger.vue'
Vue.use(AlloyFingerPlugin, {
    AlloyFinger
})
```

# Many thanks to 
[transformjs](http://alloyteam.github.io/AlloyTouch/transformjs/)

# Who is using AlloyFinger?

![preview](http://sqimg.qq.com/qq_product_operations/im/qqlogo/imlogo.png)

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.
