# Install

You can install it via npm:

```html
npm install css3transform
```

##API

```js
Transform(domElement, [notPerspective]);
```

##Usage

```js
Transform(domElement);//or Transform(domElement, true);

//set "translateX", "translateY", "translateZ", "scaleX", "scaleY", "scaleZ", "rotateX", "rotateY", "rotateZ", "skewX", "skewY", "originX", "originY", "originZ"
domElement.translateX = 100;
domElement.scaleX = 0.5;
domElement.originX = 0.5;

//get "translateX", "translateY", "translateZ", "scaleX", "scaleY", "scaleZ", "rotateX", "rotateY", "rotateZ", "skewX", "skewY", "originX", "originY", "originZ"
//console.log(domElement.translateX )
```
