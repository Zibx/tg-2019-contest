(function(PCG){


    function roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.arcTo(x, y + height, x + radius, y + height, radius);
        ctx.lineTo(x + width - radius, y + height);
        ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
        ctx.lineTo(x + width, y + radius);
        ctx.arcTo(x + width, y, x + width - radius, y, radius);
        ctx.lineTo(x + radius, y);
        ctx.arcTo(x, y, x, y + radius, radius);
    }

    var sqrt = Math.sqrt;
    var Point = function(x,y) {
        if(x instanceof Point){
            y = x.y;
            x = x.x;
        }
        this.x = x;
        this.y = y;
    };
    Point.prototype = {
        normalize: function() {
            return this.div(this.magnitude())
        },
        magnitude: function() {
            return sqrt(this.x*this.x+this.y*this.y);
        },
        clone: function(where) {
            where.x = this.x;
            where.y = this.y;
            return where;
        },
        borrow: function(from) {
            this.x = from.x;
            this.y = from.y;
            return this;
        },
        sub: function(o) {
            this.x-=o.x;
            this.y-=o.y;
            return this;
        },
        add: function(x,y) {
            this.x+=x;
            this.y+=y;
            return this;
        },
        div: function(o) {
            if(typeof o === 'number'){
                this.x /= o;
                this.y /= o;
            }else{
                this.x /= o.x;
                this.y /= o.y;
            }
            return this;
        },
        mul: function(o) {
            if(typeof o === 'number'){
                this.x *= o;
                this.y *= o;
            }else{
                this.x *= o.x;
                this.y *= o.y;
            }
            return this;
        }
    };
    PCG.Point = Point;
    PCG.Canvas2d = function(canvas, cfg) {
        this.c = canvas;
        this.tmp = {};


        this.createTmpCtx('shadow');

        this.createTmpCtx('graph');
        this.createTmpCtx('nav');
        this.createTmpCtx('navWrap');
        this.createTmpCtx('circularCorners', true);
        this.createTmpCtx('navWindow', true);
        this.createTmpCtx('x');


        this.ctxReal = this.c.getContext('2d', {alpha:false});
        this.ctxReal.imageSmoothingEnabled = false;
        this.parent = cfg;
        this.consts = cfg.constsDPR;
        this.init();


    };
    PCG.Canvas2d.prototype = {
        current: null,
        createTmpCtx: function(name, alpha) {
            var el = document.createElement("canvas");
            var ctx = el.getContext('2d', {alpha:alpha||false});
            ctx.imageSmoothingEnabled = false;
            this.tmp[name] = {el: el, ctx: ctx};
        },
        activate: function(name) {
            this.current = this.tmp[name];
            return this.ctx = this.tmp[name].ctx;
        },
        tmpHeight: function(name, height,width) {
            this.tmp[name].el.height = this.tmp[name].height = height;

            this.tmp[ name ].el.width = this.tmp[name].width = width || this.w;

            this.tmp[name].imageData = null;
        },
        scene: null,
        init: function() {
            //this.gl.clearColor(0, 0, 0, 0);
            this.resize();
            this.scene = [];
        },
        clear: function(color) {
            var current = this.current,
                h = current.height,
                w = current.width;
            this.ctx.fillStyle = color||PCG.color(this.scheme.background);//'transparent';
            this.ctx.fillRect(0,0,w,h);
            /*var current = this.current;
            var h = current.height;//(this.consts.graphicHeight+this.consts.graphicPadding)|0;
            if(!current.imageData){
                //this.ctx.clearRect(0,0,this.w,this.h);
                current.ctx.fillStyle = PCG.color(this.scheme.background);
                current.ctx.fillRect(0,0,this.w,h);
                current.imageData = current.ctx.getImageData(0,0,this.w,h);

            }else{
                current.ctx.putImageData( current.imageData,0,0,0,0,this.w,h);
            }*/
        },
        /*clear: function() {
            var h =(this.consts.graphicHeight+this.consts.graphicPadding)|0;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0,0,this.w,h);
        },*/
        resize: function() {
            this.scheme = this.parent.scheme;
            var c = this.c;
            this.w = c.width = c.clientWidth*PCG.DPR;
            this.h = c.height = c.clientHeight*PCG.DPR;

            this.tmpHeight('graph', this.consts.graphicHeight);
            this.tmpHeight('x', this.consts.axeX);
            this.tmpHeight('nav', this.consts.navigationHeight, this.w-this.consts.paddingLeft - this.consts.paddingRight);
            var pad = (this.consts.navigationWrapperHeight-this.consts.navigationHeight)/2;
            this.tmpHeight('navWrap', this.consts.navigationWrapperHeight,
                this.w-this.consts.paddingLeft - this.consts.paddingRight+pad*3);
            this.tmpHeight('circularCorners', this.consts.navigationRadius*2,this.consts.navigationRadius*2);
            this.tmpHeight('navWindow', this.consts.navigationWrapperHeight,this.consts.navWindowDraggerWidth*2);

            this.tmpHeight('shadow', c.height,c.width);/*this.consts.graphicHeight+
                this.consts.graphicPadding+
                this.consts.axeX+
                this.consts.navigationHeight+
                this.consts.navWindowOverlap);*/

            this.imageData = null;

            this.ctxReal.fillStyle = PCG.color(this.scheme.background);
            this.ctxReal.fillRect(0,0,this.w,this.h);

            this.updateCircle();
            this.updateNavWindowSprite();
        },
        graph: function(time, arr, from, to, width, color) {

            var ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                ctx.lineTo(time[i], arr[i])
            }
            ctx.stroke();
            //ctx.stroke(new Path2D('M'+arr.slice(from,to).join('L')));
            //new Path2D('M'+arr.join('L')));

        },
        area: function(time, arr, from, to, width, color) {

            var ctx = this.ctx;
            var h = this.consts.graphicHeight;

            ctx.beginPath();
            ctx.moveTo(time[from], h);
            ctx.lineTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                ctx.lineTo(time[i], arr[i])
            }
            ctx.lineTo(time[i-1], h);

            ctx.fill();

        },
        bar: function(time, arr, from, to, width, color) {
            var ctx = this.ctx;
            ctx.beginPath();
            var h = this.consts.graphicHeight;
            ctx.moveTo(time[from], h);
            ctx.lineTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                var last = i-1;

                ctx.lineTo(
                    time[i],
                    arr[last]
                );
                ctx.lineTo(
                    time[i],
                    arr[i]
                );

//                ctx.lineTo(time[i], arr[i])
            }
            //ctx.lineTo(time[i], arr[i-1]);
            ctx.lineTo(time[i-1]+(time[i-1]-time[i-2]), arr[i-1]);
            ctx.lineTo(time[i-1]+(time[i-1]-time[i-2]), h);

            ctx.fill();
        },
        axisY: function(text, pos, labelColor, axisColor) {
            pos = (pos|0)+this.consts.axisWidth/2;

            var ctx = this.ctx;
            ctx.fillStyle = labelColor;
            ctx.strokeStyle = axisColor;
            ctx.beginPath();
            ctx.moveTo(this.consts.paddingLeft, pos);
            ctx.lineTo(this.w-this.consts.paddingRight, pos);
            ctx.stroke();
            ctx.fillText(text, this.consts.paddingLeft, pos-this.consts.axisYLabelPaddingBottom);

        },
        axisYscaled: function(text1, text2, pos, labelColor1, labelColor2, axisColor) {
            pos = (pos|0)+this.consts.axisWidth/2;

            var ctx = this.ctx;

            ctx.strokeStyle = axisColor;
            ctx.beginPath();
            ctx.moveTo(this.consts.paddingLeft, pos);
            ctx.lineTo(this.w-this.consts.paddingRight, pos);
            ctx.stroke();
            ctx.textAlign = "left";
            ctx.fillStyle = labelColor1;
            ctx.fillText(text1, this.consts.paddingLeft, pos-this.consts.axisYLabelPaddingBottom);
            ctx.textAlign = "right";
            ctx.fillStyle = labelColor2;
            ctx.fillText(text2, this.w-this.consts.paddingRight, pos-this.consts.axisYLabelPaddingBottom);
        },
        render: function() {
            var ctx = this.activate('shadow');

            this.ctxReal.drawImage(this.tmp.graph.el,0,0);
            this.ctxReal.drawImage(this.tmp.x.el,0,this.consts.graphicHeight);

            var pad = (this.consts.navigationWrapperHeight-this.consts.navigationHeight)/2;

            this.updateNavWindow();

            this.ctxReal.drawImage(this.tmp.navWrap.el,
                this.consts.paddingLeft-pad,this.consts.graphicHeight+this.tmp.x.height-pad);

            //this.ctxReal.drawImage(this.tmp.shadow.el);
            //this.ctxReal.restore();
        },
        updateNavWindow: function() {

            this.activate('navWrap');
            this.clear();

            var wrap = this.tmp.navWrap,
                ctx = wrap.ctx,
                w = wrap.width,
                h = wrap.height,
                pad = (this.consts.navigationWrapperHeight-this.consts.navigationHeight)/2;

            ctx.drawImage(
                this.tmp.nav.el,
                pad,
                pad
            );

            var parent = this.parent;
            var resizeOffset = this.consts.resizeOffset;

            var minDate = parent.minDate;
            var maxDate = parent.maxDate;
            var momentumDelta = ( parent.maxDate - minDate );

            if(parent.frame.to === null){
                var lastDate = parent.timeline[parent.timeline.length-1][0];
                parent.frame = {to: lastDate, from: lastDate+parent.frame.from}
            }

            var left = (((parent.frame.from-minDate)/momentumDelta*(w-pad*2))|0),
                rightWidth = (((maxDate-parent.frame.to)/momentumDelta*(w-pad*2)+pad)|0);

            ctx.fillStyle =PCG.color(this.scheme.scrollBG);
            ctx.fillRect(pad,pad, left,h-pad*2);

            var right = w-pad;

            ctx.fillRect(right-rightWidth, pad, rightWidth,h-pad*2);
            this.circulize(ctx,w, h, pad)

            // draw ears
            ctx.drawImage(this.tmp.navWindow.el,0,0,
                this.consts.navWindowDraggerWidth, this.consts.navigationWrapperHeight,
                left, 0,
                this.consts.navWindowDraggerWidth, this.consts.navigationWrapperHeight);

            ctx.drawImage(this.tmp.navWindow.el,this.consts.navWindowDraggerWidth,0,
                this.consts.navWindowDraggerWidth, this.consts.navigationWrapperHeight,
                right-rightWidth-this.consts.navWindowDraggerWidth+pad*2, 0,
                this.consts.navWindowDraggerWidth, this.consts.navigationWrapperHeight);

            //draw top/bottom lines

            var lineLeft = left+this.consts.navWindowDraggerWidth,
                lineWidth = right-rightWidth-this.consts.navWindowDraggerWidth*2+pad*2-left;
            ctx.drawImage(this.tmp.navWindow.el,
                this.consts.navWindowDraggerWidth,pad*2,
                pad, pad,
                lineLeft, 0,
                lineWidth, pad);

            ctx.drawImage(this.tmp.navWindow.el,
                this.consts.navWindowDraggerWidth,pad*2,
                pad, pad,
                lineLeft, h-pad,
                lineWidth, pad);

        },
        circulize: function(ctx, w, h, pad) {
            pad = pad || 0;
            var r = this.consts.navigationRadius,
                circulEl = this.tmp.circularCorners.el;

            ctx.drawImage(
                circulEl,
                0,0,
                r,r,

                pad,
                pad,
                r,r
            );

            ctx.drawImage(
                circulEl,
                r,0,
                r,r,
                w-r-pad,
                pad,
                r,r
            );

            ctx.drawImage(
                circulEl,
                0,r,
                r,r,
                pad,
                h-r-pad,
                r,r
            );

            ctx.drawImage(
                circulEl,
                r,r,
                r,r,
                w-r-pad,
                h-r-pad,
                r,r
            );
        },
        updateCircle: function() {
            var ctx = this.activate('circularCorners'),
                r = this.consts.navigationRadius;
            this.clear();
            ctx.globalCompositeOperation = 'destination-out';

            ctx.arc(r,r,r,0,Math.PI*2);
            ctx.fill();
        },
        updateNavWindowSprite: function() {
            var ctx = this.activate('navWindow');
            this.clear(PCG.color(this.scheme.scrollSelector));

            ctx.globalCompositeOperation = 'destination-out';
            this.circulize(ctx,this.current.width,this.current.height);

            ctx.globalCompositeOperation = 'source-over';
            var pimpaW = this.consts.navWindowDragHandleWidth,
                pimpaH = this.consts.navWindowDragHandleHeight;
            ctx.fillStyle = PCG.color(this.scheme.scrollDragHandle);

            roundedRect(ctx, this.current.width/4-pimpaW/2,
                this.current.height/2-pimpaH/2,
                pimpaW, pimpaH, pimpaW/2
            );
            ctx.fill();

            roundedRect(ctx, this.current.width/4*3-pimpaW/2,
                this.current.height/2-pimpaH/2,
                pimpaW, pimpaH, pimpaW/2
            );
            ctx.fill();



        }
    };
})(window['PCG']);