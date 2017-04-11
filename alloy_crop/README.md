# Install

You can install it via npm:

```html
npm install alloycrop
```

## API

```js
new AlloyCrop({
    image_src: "img src",
    circle: true, // optional parameters , the default value is false
    width: 200,
    height: 200,
    ok: function (base64, canvas) { },
    cancel: function () { },
    ok_text: "yes", // optional parameters , the default value is ok
    cancel_text: "no" // optional parameters , the default value is cancel
});
```

## Demo

![alloy_crop.png](alloy_crop.png)
