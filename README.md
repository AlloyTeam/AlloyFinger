# Preview

You can touch this → [http://alloyteam.github.io/AlloyFinger/](http://alloyteam.github.io/AlloyFinger/)

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

### Omi Version:


```js
import { render, tag, WeElement } from 'omi'
import 'omi-finger'

@tag('my-app')
class MyApp extends WeElement {
  install() {
    this.data.wording = 'Tap or Swipe Me!'
  }

  handleTap = (evt) => {
    this.data.wording += '\r\nTap'
    this.update()
  }

  handleSwipe = (evt) => {
    this.data.wording += '\r\nSwipe-' + evt.direction
    this.update()
  }

  render() {
    return (
      <div>
        <omi-finger onTap={this.handleTap} abc={{a:1}} onSwipe={this.handleSwipe}>
          <div class="touchArea" >
            {this.data.wording}
          </div>
        </omi-finger>
      </div>
    )
  }

  css() {
    return `.touchArea{
                  background-color: green;
                  width: 200px;
                  min-height: 200px;
                  text-align: center;
                  color:white;
                  height:auto;
                  white-space: pre-line;
              }`
  }
}

render(<my-app></my-app>, 'body')
```

* [omi-finger](https://github.com/Tencent/omi/tree/master/packages/omi-finger)
* [css3transform](https://github.com/Tencent/omi/tree/master/packages/omi-transform)

# Others

* [AlloyCrop](https://github.com/AlloyTeam/AlloyCrop)


# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.
