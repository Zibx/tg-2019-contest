(function(PCG){
    var D = PCG.D;
    var doc = document,
        b;
    PCG.initDOM = function initDOM() {
        b = doc.body;
        var around = this.renderTo;

        this.els = {

            graph: D.canvas({renderTo: around.graph}),
         //   verticalMouseSlice: D.div({cls: 'pcg-tooltip__vertical-slice', renderTo: around.graph}),


            tooltip: D.div({cls: 'pcg-tooltip', renderTo: around.graph}),
            tooltipDate: D.div({cls: 'pcg-tooltip__date'}),
            tooltipInfo: D.div({cls: 'pcg-tooltip__info'}),


            highlightCircles: [],
            navGraphs: [],
            graphs: [],
            YAxisHash: {},
            XAxisHash: {}
        };

        //this.GL = new PCG.GL(this.els.graph);
        this.XAxisLabelCount = 0;
        this.els.tooltip.appendChild(this.els.tooltipDate);
        this.els.tooltip.appendChild(this.els.tooltipInfo);
        this.els.graph.PCG = this;
        this.collectWorldInfo();
    };


    var current = null;
    var point = new PCG.Point();
    var startPoint = new PCG.Point(0,0);
    var lastPoint = new PCG.Point(0,0);

    var GRAPHIC = 1,
        LEFT = 2,
        MIDIR = 3,
        RIGHT = 4,
        NONE = 0;

    var state = NONE;

    var toLocalPoint = function(e, graph) {
        point.x = e.pageX*PCG.DPR-graph.left;
        point.y = e.pageY*PCG.DPR-graph.top;
    };
    var last = null;
    var context = {};

    PCG.down = function(e) {
        if(last && last !== this){
            last.hideTooltip();
        }
        toLocalPoint(e, this.world.graph);
        current = this;
        startPoint.borrow(point);
        var y = point.y;
        if(y<=this.constsDPR.graphicHeight+this.constsDPR.axeX/2){
            state = GRAPHIC;
            this.move(e);
        }else{
            var x = point.x;
            var minDate = this.minDate;
            var momentumDelta = ( this.maxDate - minDate );
            var left = ((this.frame.from-minDate)/momentumDelta*this.world.nav.width)|0,
                width = ((this.frame.to-this.frame.from)/momentumDelta*this.world.nav.width)|0;

            var handleWidth = this.constsDPR.navWindowDraggerWidth;
            var leftHandleRight = left+this.constsDPR.paddingLeft+handleWidth*1.5;

            if(x<leftHandleRight){
                if(x>leftHandleRight-handleWidth*2.5){
                    state = LEFT;
                }else{
                    state = NONE;
                }
            }else{
                var maxDate = this.maxDate;
                var right = ((maxDate-this.frame.to)/momentumDelta*this.world.nav.width)|0
                var rightHandleLeft = this.world.graph.width-this.constsDPR.paddingRight-right-handleWidth*1.5;
                if(x>rightHandleLeft){
                    if(x< rightHandleLeft+handleWidth*2.5){
                        state = RIGHT;
                    }else{
                        state = NONE;
                    }
                }else{
                    state = MIDIR;
                }
            }
            if(state !== NONE){
                b.style.overflow = 'hidden';
            }
        }
        if(state !== GRAPHIC && state !== NONE){
            var frame = context.frame = this.frame;
            context.startFrame = frame.from;
            context.frameWidth = frame.to - frame.from;
            context.width = this.world.graph.width - this.constsDPR.paddingLeft - this.constsDPR.paddingRight;
            context.timeDelta = this.maxDate - this.minDate;

        }

        if(state !== GRAPHIC){
            this.hideTooltip();
        }
    };
    var lastNearest;
    PCG.move = function(e) {
        toLocalPoint(e, this.world.graph);

        if(state === GRAPHIC){
            var x = point.x;
            var time = this.xToTime(x),
                sliceID = this._binarySearch(time),
                getX = this.getX,
                data = this.data;

            var i, sliceXPos, min = Infinity, dx, nearest;

            for(i = -1; i < 2; i++){
                sliceXPos = getX(data[sliceID+i][0]);
                dx = Math.abs(sliceXPos-x);
                if(dx<min){
                    nearest = sliceID+i;
                    min = dx;
                }
            }
            if(lastNearest !== nearest){
                this.showTooltip(nearest);
                lastNearest = nearest;
            }
        }else if(state === MIDIR){
            var x = point.x,
                frame = context.frame,
                startFrame = context.startFrame,
                frameWidth = context.frameWidth;

            frame.from = startFrame +
                ( x - startPoint.x ) / this.world.nav.width * ( this.maxDate - this.minDate );
            if( frame.from <= this.minDate ){
                frame.from = this.minDate;
            }
            frame.to = frame.from + frameWidth;
            if( frame.to >= this.maxDate ){
                frame.to = this.maxDate;
                frame.from = frame.to - frameWidth;
            }

            this.update();
        }else if(state === LEFT || state === RIGHT){
            var frame = context.frame,
                moved = context.timeDelta/context.width*(point.x-startPoint.x);
            if(state === LEFT){
                frame.from = context.startFrame + moved;
            }else{
                frame.to = context.startFrame + context.frameWidth + moved;
            }
            /*if(toLeft){
                frame.from = startFrame+moved;
                if(frame.from>frame.to-pxToTime(resizeOffset*1.3)){
                    frame.from = frame.to - pxToTime( resizeOffset*1.3 );
                }
                if(frame.from< this.minDate){
                    frame.from = this.minDate;
                }

                this.camera.offset = frame.to;
            }else{
                frame.to = startFrame+frameWidth+moved;
                if(frame.to<frame.from+pxToTime(resizeOffset*1.3)){
                    frame.to = frame.from + pxToTime( resizeOffset*1.3 );
                }
                if(frame.to > this.maxDate){
                    frame.to = this.maxDate;
                }

                this.camera.offset = frame.from;//unLeft;
            }*/
            var day = 1000*60*60*24;
            this.camera.AxisXGranule = day * Math.pow(2, Math.round(Math.log(Math.ceil((this.frame.to-this.frame.from)/6/day))/Math.log(2)));
            this.camera.offset = frame.to;
            this.update();
        }

        if(last !== this && last){
            last.hideTooltip();
        }
        lastPoint.borrow(point);
    };
    PCG.longTap = function(e) {

    };
    PCG.up = function(e) {
        toLocalPoint(e, this.world.graph);
        last = current;
        lastNearest = null;

        state = null;
        b.style.overflow = 'auto';
    };
    
    PCG.initListeners = function initListeners() {

        if(PCG.listen)
            return false;
        PCG.listen = true;
        var fn = {};
        'move,down,up'.split(',').forEach(function(name) {
            fn[name] = function(e) {
                var target = e.target;
                if(target.tagName === 'CANVAS'){
                    if('PCG' in target){
                        target.PCG[name](e);
                    }
                }else{
                    current = null;
                    if(last){
                        last.hideTooltip();
                    }
                    last = null;
                }
            }
        });

        var touchDown = function (e) {
            fn.down(e.touches[0])
        };

        var touchMove = function (e) {
            fn.move(e.touches[0]);
        };



        doc.addEventListener('mousedown', fn.down, false);
        doc.addEventListener('touchstart', touchDown, false);
        doc.addEventListener('mousemove', fn.move, false);
        doc.addEventListener('touchmove', touchMove, false);
        doc.addEventListener('mouseup', fn.up, false);
        doc.addEventListener('touchend', fn.up, false);
        doc.addEventListener('touchcancel', fn.up, false);
        window.addEventListener('mouseup', fn.up, false);

        window.oncontextmenu = function(event) {
            last && last.longTap(event)
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
    };
})(window['PCG']);