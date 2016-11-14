##API

```js
 new AlloyCrop({
        image_src: "test2.png",
        circle:true,
        width: 200,
        height: 200,
        ok: function ( base64,canvas) {
            crop_result.appendChild(canvas);
            crop_result.querySelector("canvas").style.borderRadius="50%";
            showToolPanel();
        },
        cancel: function () {
            showToolPanel();
        }


    });
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
