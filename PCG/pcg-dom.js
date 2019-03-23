(function(PCG){
    const D = PCG.D;
    PCG.initDOM = function initDOM() {
        const around = this.renderTo;

        this.els = {
            navWindow: D.div({cls: 'navWindow', renderTo: around.nav}),
            nav: D.svg({renderTo: around.nav}),
            navEars: [
                D.div({
                    renderTo: around.nav,
                    cls: 'navEar',
                    style: {left: 0}
                }),
                D.div({
                    renderTo: around.nav,
                    cls: 'navEar',
                    style: {right: 0}
                })
            ],
            navExpandControl: D.div({cls: 'pcg pcg-nav__expand-control', renderTo: around.nav}),
            navMoveControl: D.div({cls: 'pcg pcg-nav__move-control', renderTo: around.nav}),

            yAxisStorage: D.div({renderTo: around.graph}),
            verticalMouseSlice: D.div({cls: 'pcg-tooltip__vertical-slice', renderTo: around.graph}),
            graph: D.svg({renderTo: around.graph}),
            yAxisLabelsStorage: D.div({renderTo: around.graph}),
            xAxisLabelsStorage: D.div({renderTo: around.graph}),

            tooltip: D.div({cls: 'pcg-tooltip', renderTo: around.graph}),
            tooltipDate: D.div({cls: 'pcg-tooltip__date'}),
            tooltipInfo: D.div({cls: 'pcg-tooltip__info'}),


            highlightCircles: [],
            navGraphs: [],
            graphs: [],
            YAxisHash: {},/*
            YAxis: [],
            YAxisLabels: [],*/

            XAxis: []
        };
        this.els.tooltip.appendChild(this.els.tooltipDate);
        this.els.tooltip.appendChild(this.els.tooltipInfo);

        this.collectWorldInfo();
    };
    PCG.initListeners = function initListeners() {
        const resizeOffset = this.consts.resizeOffset;
        let start;
        let world;
        let frame;
        let frameWidth,
            startFrame,
            pxToTime;

        let toLeft = true;

        const move = (e)=>{
            console.log('move', e.type);
            let point = [e.clientX, e.clientY];
            let moved = pxToTime(point[0]-start[0]);
            if(toLeft){
                frame.from = startFrame+moved;
                if(frame.from>frame.to-pxToTime(resizeOffset*1.3)){
                    frame.from = frame.to - pxToTime( resizeOffset*1.3 );
                }
                if(frame.from< this.minDate){
                    frame.from = this.minDate;
                }
            }else{
                frame.to = startFrame+frameWidth+moved;
                if(frame.to<frame.from+pxToTime(resizeOffset*1.3)){
                    frame.to = frame.from + pxToTime( resizeOffset*1.3 );
                }
                if(frame.to > this.maxDate){
                    frame.to = this.maxDate;
                }
            }

            this.update();
        };
        const touchMove = (e)=>{
            if(e.touches && e.touches.length){
                move( e.touches[ 0 ] );
                //e.stopPropagation();
            }
        };
        const up = (e)=>{
            console.log('up', e && e.type);
            window.removeEventListener('mouseup', up);
            document.removeEventListener('mousemove', move);

            this.els.navExpandControl.removeEventListener('touchend', up);
            this.els.navExpandControl.removeEventListener('touchcancel', up);
            this.els.navExpandControl.removeEventListener('touchmove', touchMove);
            e && e.preventDefault();
        };

        const down = (e)=>{
            console.log('down', e.type);
            start = [e.clientX, e.clientY];
            world = this.world;
            frame = this.frame;
            frameWidth = frame.to - frame.from;
            startFrame = frame.from;

            toLeft = true;
            const rect = e.target.getBoundingClientRect();
            const offsetX = e.pageX - rect.left;

            if(offsetX>this.els.navExpandControl.clientWidth/2){
                toLeft = false;
            }
            pxToTime = (px)=>px/world.nav.width*(this.maxDate-this.minDate);

            up();
            window.addEventListener('mouseup', up);
            document.addEventListener('mousemove', move);

            this.els.navExpandControl.addEventListener('touchend', up);
            this.els.navExpandControl.addEventListener('touchcancel', up);
            this.els.navExpandControl.addEventListener('touchmove', touchMove);//, true);
            e.preventDefault && e.preventDefault();
            //e.stopPropagation && e.stopPropagation();
        };


        this.els.navExpandControl.addEventListener('mousedown', down);
        this.els.navExpandControl.addEventListener('touchstart', (e)=>{
            if(e.touches && e.touches.length){
                down( e.touches[ 0 ] );


            }
            e.preventDefault();
        }, true);
        this.els.navMoveControl.addEventListener('mousedown', (e)=> {
            let start = [ e.clientX, e.clientY ];

            const world = this.world;
            const frame = this.frame;
            const frameWidth = frame.to - frame.from,
                startFrame = frame.from;

            const move = ( e ) => {
                let point = [ e.clientX, e.clientY ];


                frame.from = startFrame +
                    ( point[ 0 ] - start[ 0 ] ) / world.nav.width * ( this.maxDate - this.minDate );
                if( frame.from < this.minDate ){
                    frame.from = this.minDate;
                }
                frame.to = frame.from + frameWidth;
                if( frame.to > this.maxDate ){
                    frame.to = this.maxDate;
                    frame.from = frame.to - frameWidth;
                }
                this.update();

            };
            const up = () => {
                window.removeEventListener( 'mouseup', up );
                window.removeEventListener( 'mousemove', move );
            };
            window.addEventListener( 'mouseup', up );
            window.addEventListener( 'mousemove', move );
            //e.preventDefault();
            //e.stopPropagation();
        });

        const _self = this;
        let lastNearest;
        this.renderTo.graph.addEventListener('mousemove', function(e){
            const x = e.offsetX;
            const time = _self.xToTime(x),
                sliceID = _self._binarySearch(time),
                getX = _self.getX,
                data = _self.data;

            let i, sliceXPos, min = Infinity, dx, nearest;

            for(i = -1; i < 2; i++){
                sliceXPos = getX(data[sliceID+i][0]);
                dx = Math.abs(sliceXPos-x);
                if(dx<min){
                    nearest = sliceID+i;
                    min = dx;
                }
            }
            if(lastNearest !== nearest){
                requestAnimationFrame(()=>{
                    _self.showTooltip(nearest);
                });
                lastNearest = nearest;
            }
        });
        this.renderTo.graph.addEventListener('mouseleave', function(e){
            _self.hideTooltip();
            lastNearest = null;
            e.stopPropagation();
        });

    };
})(window['PCG']);