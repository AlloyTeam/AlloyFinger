/* AlloyCrop v0.1.3
 * By dntzhang
 * Github: https://github.com/AlloyTeam/AlloyFinger/tree/master/alloy_crop
 */
;(function(){
    var AlloyCrop = function (option) {
        this.renderTo = document.body;
        this.canvas = document.createElement("canvas");
        this.canvas.width = option.width;
        this.canvas.height = option.height;
        this.circle = option.circle;
        if (option.width !== option.height && option.circle) {
            throw "can't set circle to ture when width is not equal to height"
        }
        this.ctx = this.canvas.getContext("2d");
        this.croppingBox = document.createElement("div");
        this.croppingBox.style.visibility = "hidden";
        this.cover = document.createElement("canvas");
        this.type = option.type || "png";
        this.cover.width = window.innerWidth;
        this.cover.height = window.innerHeight;
        this.cover_ctx = this.cover.getContext("2d");
        this.img = document.createElement("img");
        this.img.crossOrigin = "Anonymous";
        this.cancel = option.cancel;
        this.ok = option.ok;

        this.ok_text = option.ok_text || "ok";
        this.cancel_text = option.cancel_text || "cancel";

        this.croppingBox.appendChild(this.img);
        this.croppingBox.appendChild(this.cover);
        this.renderTo.appendChild(this.croppingBox);
        this.img.onload = this.init.bind(this);
        this.img.src = option.image_src;

        this.cancel_btn = document.createElement('a');
        this.cancel_btn.innerHTML = this.cancel_text;
        this.ok_btn = document.createElement('a');
        this.ok_btn.innerHTML = this.ok_text;

        this.croppingBox.appendChild(this.ok_btn);
        this.croppingBox.appendChild(this.cancel_btn);
    };

    AlloyCrop.prototype = {
        init: function () {

            this.img_width = this.img.width;
            this.img_height = this.img.height;
            Transform(this.img);
            var scaling_x = window.innerWidth / this.img_width,
                scaling_y = window.innerHeight / this.img_height;
            var scaling = scaling_x > scaling_y ? scaling_y : scaling_x;
            this.initScale = scaling;
            this.img.scaleX = this.img.scaleY = scaling;
            var self = this;
            new AlloyFinger(this.croppingBox, {
                multipointStart: function () {
                    self.initScale = self.img.scaleX;
                },
                pinch: function (evt) {
                    self.img.scaleX = self.img.scaleY = self.initScale * evt.scale;
                },
                pressMove: function (evt) {

                    self.img.translateX += evt.deltaX;
                    self.img.translateY += evt.deltaY;
                    evt.preventDefault();
                }
            });

            new AlloyFinger(this.cancel_btn, {
                tap: this._cancel.bind(this)
            });

            new AlloyFinger(this.ok_btn, {
                tap: this._ok.bind(this)
            });

            this.renderCover();
            this.setStyle();

        },
        _cancel: function () {
            this._css(this.croppingBox, {
                display: "none"
            });
            this.cancel();
        },
        _ok: function () {
            this.crop();
            this._css(this.croppingBox, {
                display: "none"
            });
            this.ok(this.canvas.toDataURL("image/" + this.type), this.canvas);
        },
        renderCover: function () {
            var ctx = this.cover_ctx,
                w = this.cover.width,
                h = this.cover.height,
                cw = this.canvas.width,
                ch = this.canvas.height;
            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = 0.7;
            ctx.fillRect(0, 0, this.cover.width, this.cover.height);
            ctx.restore();
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            if (this.circle) {
                ctx.arc(w / 2, h / 2, cw / 2 - 4, 0, Math.PI * 2, false);
            } else {
                ctx.rect(w / 2 - cw / 2, h / 2 - ch / 2, cw, ch)
            }
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = "white";
            if (this.circle) {
                ctx.arc(w / 2, h / 2, cw / 2 - 4, 0, Math.PI * 2, false);
            } else {
                ctx.rect(w / 2 - cw / 2, h / 2 - ch / 2, cw, ch)
            }
            ctx.stroke();
        },
        setStyle: function () {
            this._css(this.cover, {
                position: "absolute",
                zIndex: "100",
                left: "0px",
                top: "0px"
            });

            this._css(this.croppingBox, {
                color: "white",
                textAlign: "center",
                fontSize: "18px",
                textDecoration: "none",
                visibility: "visible"
            });

            this._css(this.img, {
                position: "absolute",
                zIndex: "99",
                left: "50%",
                // error position in meizu when set the top  50%
                top: window.innerHeight / 2 + "px",
                marginLeft: this.img_width / -2 + "px",
                marginTop: this.img_height / -2 + "px"
            });


            this._css(this.ok_btn, {
                position: "fixed",
                zIndex: "101",
                width: "100px",
                right: "50px",
                lineHeight: "40px",
                height: "40px",
                bottom: "20px",
                borderRadius: "2px",
                backgroundColor: "#836FFF"

            });

            this._css(this.cancel_btn, {
                position: "fixed",
                zIndex: "101",
                width: "100px",
                height: "40px",
                lineHeight: "40px",
                left: "50px",
                bottom: "20px",
                borderRadius: "2px",
                backgroundColor: "#836FFF"

            });
        },
        crop: function () {
            this.calculateRect();
            this.ctx.drawImage(this.img, this.crop_rect[0], this.crop_rect[1], this.crop_rect[2], this.crop_rect[3], 0, 0, this.canvas.width, this.canvas.height);

        },
        calculateRect: function () {
            var cr = this.img.getBoundingClientRect();
            var c_left = window.innerWidth / 2 - this.canvas.width / 2;
            var c_top = window.innerHeight / 2 - this.canvas.height / 2;
            var cover_rect = [c_left, c_top, this.canvas.width + c_left, this.canvas.height + c_top];
            var img_rect = [cr.left, cr.top, cr.width + cr.left, cr.height + cr.top];
            var intersect_rect = this.getOverlap.apply(this, cover_rect.concat(img_rect));
            var left = (intersect_rect[0] - img_rect[0]) / this.img.scaleX;
            var top = (intersect_rect[1] - img_rect[1]) / this.img.scaleY;
            var width = intersect_rect[2] / this.img.scaleX;
            var height = intersect_rect[3] / this.img.scaleY;

            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left + width > this.img_width) width = this.img_width - left;
            if (top + height > this.img_height) height = this.img_height - top;

            this.crop_rect = [left, top, width, height];
        },
        // top left (x1,y1) and bottom right (x2,y2) coordination
        getOverlap: function (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
            if (ax2 < bx1 || ay2 < by1 || ax1 > bx2 || ay1 > by2) return [0, 0, 0, 0];

            var left = Math.max(ax1, bx1);
            var top = Math.max(ay1, by1);
            var right = Math.min(ax2, bx2);
            var bottom = Math.min(ay2, by2);
            return [left, top, right - left, bottom - top]
        },
        _css: function (el, obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    el.style[key] = obj[key];
                }
            }
        }
    };

    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = AlloyCrop;
    }else {
        window.AlloyCrop = AlloyCrop;
    }
})();