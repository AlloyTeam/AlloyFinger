![preview](http://alloyteam.github.io/AlloyFinger/alloyfinger.png)

# Usage

```js
new AlloyFinger(element, {
    touchStart: function () {
    },
    touchMove: function () {
    },
    touchEnd: function () {
    },
    touchCancel: function () {
    },
    multipointStart: function () {
    },
    rotate: function (evt) {
        console.log(evt.angle);
    },
    pinch: function (evt) {
        console.log(evt.scale);
    },
    multipointEnd: function () {
    },
    pressMove: function (evt) {
        console.log(evt.deltaX);
        console.log(evt.deltaY);
    },
    tap: function (evt) {
    },
    doubleTap: function (evt) {
    },
    longTap: function (evt) {
    },
    swipe: function (evt) {
        console.log("swipe" + evt.direction);
    },
    singleTap: function (evt) {
    }
});
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


# Install

You can install it via npm:

```html
npm install alloyfinger
```

# Who is using AlloyFinger?

![preview](http://sqimg.qq.com/qq_product_operations/im/qqlogo/imlogo.png)

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.