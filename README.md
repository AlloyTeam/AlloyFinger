![preview](http://alloyteam.github.io/AlloyFinger/alloyfinger.png)

# Install

You can install it via npm:

```html
npm install alloyfinger
```

# Usage

### Omi Version:

* [omi-finger](https://github.com/AlloyTeam/omi/tree/master/plugins/omi-finger)

```js
    render() {
        return  `
        <div>
            <div omi-finger ref="touchArea" onTap="handleTap"  onSwipe="handleSwipe" >
                Tap or Swipe Me!
            </div>
        </div>
        `;
    }
```

### Pure JS:
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
        console.log(evt.zoom);
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

/**
 * this method can destroy the instance
 */
af = af.destroy();
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

# Thanks and Donate

* [transformjs](http://alloyteam.github.io/AlloyTouch/transformjs/)
* [Donate to AlloyFinger](http://alloyteam.github.io/donate.html)

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.
