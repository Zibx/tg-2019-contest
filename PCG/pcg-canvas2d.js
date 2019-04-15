(function(PCG){
    var animation = PCG.animation,
        DPRc;
    var D = PCG.D;
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

        this.createTmpCtx('graphBackup');
        this.createTmpCtx('graph');
        this.createTmpCtx('nav');
        this.createTmpCtx('navWrap');
        this.createTmpCtx('circularCorners', true);
        this.createTmpCtx('navWindow', true);
        this.createTmpCtx('x');


        this.ctxReal = this.c.getContext('2d', {alpha:false});
        this.ctxReal.imageSmoothingEnabled = false;
        this.parent = cfg;
        DPRc = cfg.constsDPR;
        this.init();


    };

    PCG.drawTooltip = function(dt) {
        var tooltip = this.tooltip,
            needUpdate = false;
        if(tooltip === null){
            return;
        }
        dt*=1000;
        if(tooltip.visible && tooltip.opacity<1){
            tooltip.opacity = Math.min(1, tooltip.opacity+dt/animation.tooltipOpacity);
            needUpdate = true;
        }
        if(!tooltip.visible && tooltip.opacity>0){
            tooltip.opacity = Math.max(0, tooltip.opacity-dt/animation.tooltipOpacity);
            if(tooltip.opacity === 0){
                this.tooltip = null;
            }else{
                needUpdate = true;
            }
        }

        /*var slice = this.data[ tooltip.sliceID ],
            time = slice[ 0 ],
            visible = this._getVisible();
*/
        if(needUpdate)
            this.update();


        if(this.tooltip && tooltip.opacity>0){
            var slice = this.data[ tooltip.slice ],
                time = slice[ 0 ],
                visible = this._getVisible();

            this.els.tooltip.style.display = 'block';
            var i, _i, val, name;

            D.removeChildren( this.els.tooltipInfo );

            var xPos = this.getX( time ) / PCG.DPR;
            // add new circles
            for( i = 0, _i = visible.length; i < _i; i++ ){
                val = slice[ visible[ i ] + 1 ];
                name = this.columns[ visible[ i ] ];

                this.els.tooltipInfo.appendChild(
                    D.div( {
                            cls: 'pcg-tooltip__info-item',
                            style: { color: this.getColor( name, 1 ) }
                        },
                        D.div( { cls: 'pcg-tooltip__info-item__count' }, PCG.numberFormat( val ) ),
                        D.div( {cls: 'pcg-tooltip__info-item__label'}, this.names[ name ])
                    )
                )
            }
            if(this.stacked && !this.percentage){
                this.els.tooltipInfo.appendChild(
                    D.div( {
                            cls: 'pcg-tooltip__info-item',
                            style: { color: PCG.color(this.scheme.yLabel) }
                        },
                        D.div( { cls: 'pcg-tooltip__info-item__count' }, PCG.numberFormat( val ) ),
                        D.div( {cls: 'pcg-tooltip__info-item__label'}, 'All')
                    )
                )

            }
            this.els.tooltipDate.innerText = this.formatters.weekDate( time );
            var tooltipStyle = this.els.tooltip.style,
                tooltipRect = this.els.tooltip.getClientRects()[ 0 ];



            var tooltipLeft = xPos - tooltipRect.width / PCG.DPR;
            if( tooltipLeft < 1 ){
                tooltipLeft = 1;
            }
            if( ( tooltipLeft + tooltipRect.width + 1 ) * PCG.DPR > this.world.graph.width ){
                tooltipLeft = this.world.graph.width / PCG.DPR - tooltipRect.width - 1;
            }
            tooltipStyle.left = tooltipLeft + 'px';

            tooltip.rect = {
                left: tooltipLeft*PCG.DPR,
                top: 0,
                height: tooltipRect.height*PCG.DPR,
                width: tooltipRect.width*PCG.DPR
            };

            tooltipStyle.opacity = tooltip.opacity;
        }else{
            var tooltipStyle = this.els.tooltip.style;
            tooltipStyle.display = 'none'
        }

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
            this.tmp[name].ctx.imageSmoothingEnabled = false;
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
            var h = current.height;//(DPRc.graphicHeight+DPRc.graphicPadding)|0;
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
            var h =(DPRc.graphicHeight+DPRc.graphicPadding)|0;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0,0,this.w,h);
        },*/
        resize: function() {
            this.scheme = this.parent.scheme;
            DPRc = this.parent.constsDPR;
            var c = this.c;
            this.w = c.width = c.clientWidth*PCG.DPR;
            this.h = c.height = c.clientHeight*PCG.DPR;

            this.tmpHeight('graph', DPRc.graphicHeight);
            this.tmpHeight('graphBackup', DPRc.graphicHeight);
            this.tmpHeight('x', DPRc.axeX);
            this.tmpHeight('nav', DPRc.navigationHeight, this.w-DPRc.paddingLeft - DPRc.paddingRight);
            var pad = (DPRc.navigationWrapperHeight-DPRc.navigationHeight)/2;
            this.tmpHeight('navWrap', DPRc.navigationWrapperHeight,
                this.w-DPRc.paddingLeft - DPRc.paddingRight+pad*3);
            this.tmpHeight('circularCorners', DPRc.navigationRadius*2,DPRc.navigationRadius*2);
            this.tmpHeight('navWindow', DPRc.navigationWrapperHeight,DPRc.navWindowDraggerWidth*2);

            this.tmpHeight('shadow', c.height,c.width);/*DPRc.graphicHeight+
                DPRc.graphicPadding+
                DPRc.axeX+
                DPRc.navigationHeight+
                DPRc.navWindowOverlap);*/

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
            ctx.closePath();
            //ctx.stroke(new Path2D('M'+arr.slice(from,to).join('L')));
            //new Path2D('M'+arr.join('L')));

        },
        area: function(time, arr, from, to, width, color) {

            var ctx = this.ctx;
            var h = DPRc.graphicHeight;

            ctx.beginPath();
            ctx.moveTo(time[from], h);
            ctx.lineTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                ctx.lineTo(time[i], arr[i])
            }
            ctx.lineTo(time[i-1], h);

            ctx.fill();
            ctx.closePath();
        },
        bar: function(time, arr, from, to, width, color) {
            var ctx = this.ctx;
            ctx.beginPath();
            var h = DPRc.graphicHeight;
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
            ctx.closePath();
        },
        axisY: function(text, pos, labelColor, axisColor) {
            pos = (pos|0)+DPRc.axisWidth/2;

            var ctx = this.ctx;
            ctx.fillStyle = labelColor;
            ctx.strokeStyle = axisColor;
            ctx.beginPath();
            ctx.moveTo(DPRc.paddingLeft, pos);
            ctx.lineTo(this.w-DPRc.paddingRight, pos);
            ctx.stroke();
            ctx.closePath();
            ctx.fillText(text, DPRc.paddingLeft, pos-DPRc.axisYLabelPaddingBottom);

        },
        circle: function(x,y,r,w,c) {
            var ctx = this.ctx;
            ctx.lineWidth = w;
            ctx.strokeStyle = c;
            ctx.fillStyle = PCG.color(this.scheme.background);
            ctx.beginPath();
            ctx.arc(x,y,r,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        },
        axisX: function(pos,opacity) {
            pos = (pos|0)+DPRc.axisWidth/2;
            var ctx = this.ctx;
            ctx.strokeStyle = PCG.color( this.scheme.axis, this.scheme.axis[ 3 ] * opacity );
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, DPRc.graphicHeight);
            ctx.stroke();
            ctx.closePath();

        },
        axisYscaled: function(text1, text2, pos, labelColor1, labelColor2, axisColor) {
            pos = (pos|0)+DPRc.axisWidth/2;

            var ctx = this.ctx;

            ctx.strokeStyle = axisColor;
            ctx.beginPath();
            ctx.moveTo(DPRc.paddingLeft, pos);
            ctx.lineTo(this.w-DPRc.paddingRight, pos);
            ctx.stroke();
            ctx.closePath();
            ctx.textAlign = "left";
            ctx.fillStyle = labelColor1;
            ctx.fillText(text1, DPRc.paddingLeft, pos-DPRc.axisYLabelPaddingBottom);
            ctx.textAlign = "right";
            ctx.fillStyle = labelColor2;
            ctx.fillText(text2, this.w-DPRc.paddingRight, pos-DPRc.axisYLabelPaddingBottom);
        },
        render: function() {
            var ctx = this.ctxReal;//activate('shadow');
            //this.clear();
            ctx.drawImage(this.tmp.graph.el,0,0);
            ctx.drawImage(this.tmp.x.el,0,DPRc.graphicHeight);

            var pad = (DPRc.navigationWrapperHeight-DPRc.navigationHeight)/2;

            this.updateNavWindow();

            ctx.drawImage(this.tmp.navWrap.el,
                DPRc.paddingLeft-pad,DPRc.graphicHeight+this.tmp.x.height-pad);

            //this.ctxReal.drawImage(this.tmp.shadow.el,0,0);


            //this.ctxReal.restore();
        },
        updateNavWindow: function() {

            this.activate('navWrap');
            this.clear();

            var wrap = this.tmp.navWrap,
                ctx = wrap.ctx,
                w = wrap.width,
                h = wrap.height,
                pad = (DPRc.navigationWrapperHeight-DPRc.navigationHeight)/2;

            ctx.drawImage(
                this.tmp.nav.el,
                pad,
                pad
            );

            var parent = this.parent;
            var resizeOffset = DPRc.resizeOffset;

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
                DPRc.navWindowDraggerWidth, DPRc.navigationWrapperHeight,
                left, 0,
                DPRc.navWindowDraggerWidth, DPRc.navigationWrapperHeight);

            ctx.drawImage(this.tmp.navWindow.el,DPRc.navWindowDraggerWidth,0,
                DPRc.navWindowDraggerWidth, DPRc.navigationWrapperHeight,
                right-rightWidth-DPRc.navWindowDraggerWidth+pad*2, 0,
                DPRc.navWindowDraggerWidth, DPRc.navigationWrapperHeight);

            //draw top/bottom lines

            var lineLeft = left+DPRc.navWindowDraggerWidth,
                lineWidth = right-rightWidth-DPRc.navWindowDraggerWidth*2+pad*2-left;
            ctx.drawImage(this.tmp.navWindow.el,
                DPRc.navWindowDraggerWidth,pad*2,
                pad, pad,
                lineLeft, 0,
                lineWidth, pad);

            ctx.drawImage(this.tmp.navWindow.el,
                DPRc.navWindowDraggerWidth,pad*2,
                pad, pad,
                lineLeft, h-pad,
                lineWidth, pad);

        },
        backup: function() {
            this.tmp.graphBackup.ctx.drawImage(this.tmp.graph.el,0,0);
        },
        barSelection: function(ctx, from, to, opacity) {
            ctx.fillStyle = PCG.color(this.scheme.background,0.5*opacity);

            ctx.fillRect(
                0,
                0,
                from,
                DPRc.graphicHeight
            );
            ctx.fillRect(
                to,
                0,
                this.w-to,
                DPRc.graphicHeight
            );
        },
        circulize: function(ctx, w, h, pad) {
            pad = pad || 0;
            var r = DPRc.navigationRadius,
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
                r = DPRc.navigationRadius;
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
            var pimpaW = DPRc.navWindowDragHandleWidth,
                pimpaH = DPRc.navWindowDragHandleHeight;
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