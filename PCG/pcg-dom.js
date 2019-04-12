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
                    cls: 'navEar navEar-left',
                    style: {left: 0}
                }),
                D.div({
                    renderTo: around.nav,
                    cls: 'navEar navEar-right',
                    style: {right: 0}
                })
            ],
            navExpandControl: D.div({cls: 'pcg pcg-nav__expand-control', renderTo: around.nav}),
            navMoveControl: D.div({cls: 'pcg pcg-nav__move-control', renderTo: around.nav}),

            graph: D.canvas({renderTo: around.graph}),
            yAxisStorage: D.div({cls: 'pcg-yAxisStorage', renderTo: around.graph}),
            verticalMouseSlice: D.div({cls: 'pcg-tooltip__vertical-slice', renderTo: around.graph}),

            yAxisLabelsStorage: D.div({cls: 'pcg-yAxisLabelsStorage', renderTo: around.graph}),
            xAxisLabelsStorage: D.div({cls: 'pcg-xAxisLabelsStorage', renderTo: around.graph}),

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
        this.ctx = new PCG.Canvas2d(this.els.graph, this);

        this.XAxisLabelCount = 0;
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

        const resizeMove = (e)=>{
            console.log('move', e.type);
            let point = e.clientX;
            let moved = pxToTime(point-start);
            if(toLeft){
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
            }
            this.camera.action = 'resize';
            this.camera.toLeft = toLeft;


            let day = 1000*60*60*24;


            this.camera.AxisXGranule = day * Math.pow(2, Math.round(Math.log(Math.ceil((this.frame.to-this.frame.from)/6/day))/Math.log(2)));
            this.update();
        };
        const touchResizeMove = (e)=>{
            if(e.touches && e.touches.length){
                resizeMove( e.touches[ 0 ] );
                //e.stopPropagation();
            }
        };
        const resizeUp = (e)=>{
            console.log('up', e && e.type);
            window.removeEventListener('mouseup', resizeUp);
            document.removeEventListener('mousemove', resizeMove);

            this.els.navExpandControl.removeEventListener('touchend', resizeUp);
            this.els.navExpandControl.removeEventListener('touchcancel', resizeUp);
            this.els.navExpandControl.removeEventListener('touchmove', touchResizeMove);
            e && e.cancelable && e.preventDefault();
            document.body.style.overflow = 'auto';
        };

        const resizeDown = (e)=>{
            this.hideTooltip();
            console.log('down', e.type);
            start = e.clientX;
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

            resizeUp();
            window.addEventListener('mouseup', resizeUp);
            document.addEventListener('mousemove', resizeMove);

            this.els.navExpandControl.addEventListener('touchend', resizeUp);
            this.els.navExpandControl.addEventListener('touchcancel', resizeUp);
            this.els.navExpandControl.addEventListener('touchmove', touchResizeMove);//, true);
            e.preventDefault && e.preventDefault();
        };


        this.els.navExpandControl.addEventListener('mousedown', resizeDown);
        document.addEventListener('touchstart', (e)=>{
            //console.log(e.path)
        });
        this.els.navExpandControl.addEventListener('touchstart', (e)=>{
            if(e.touches && e.touches.length){
                resizeDown( e.touches[ 0 ] );
            }
            document.body.style.overflow = 'hidden';

            if(e.cancelable){
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);


        const touchMoveMove = (e)=>{
            if(e.touches && e.touches.length){
                moveMove( e.touches[ 0 ] );
            }
        };
        const moveMove = ( e ) => {
            let point = e.clientX;

            this.camera.action = 'move';
            frame.from = startFrame +
                ( point - start ) / world.nav.width * ( this.maxDate - this.minDate );
            if( frame.from < this.minDate ){
                frame.from = this.minDate;
            }
            frame.to = frame.from + frameWidth;
            if( frame.to > this.maxDate ){
                frame.to = this.maxDate;
                frame.from = frame.to - frameWidth;
            }
            this.update();
            if(e.cancelable){
                e.preventDefault();
                e.stopPropagation();
            }
        };
        const moveUp = (e) => {
            window.removeEventListener( 'mouseup', moveUp );
            document.removeEventListener( 'mousemove', moveMove );

            this.els.navMoveControl.removeEventListener('touchend', moveUp);
            this.els.navMoveControl.removeEventListener('touchcancel', moveUp);
            this.els.navMoveControl.removeEventListener('touchmove', touchMoveMove);

            e && e.cancelable && e.preventDefault();
            document.body.style.overflow = 'auto';
        };
        const moveDown = (e)=> {
            start = e.clientX;

            world = this.world;
            frame = this.frame;
            frameWidth = frame.to - frame.from;
            startFrame = frame.from;

            moveUp();

            window.addEventListener( 'mouseup', moveUp );
            document.addEventListener( 'mousemove', moveMove );

            this.els.navMoveControl.addEventListener('touchend', moveUp);
            this.els.navMoveControl.addEventListener('touchcancel', moveUp);
            this.els.navMoveControl.addEventListener('touchmove', touchMoveMove);//, true);

            //e.preventDefault && e.preventDefault();
        };
        this.els.navMoveControl.addEventListener('mousedown', moveDown);

        this.els.navMoveControl.addEventListener('touchstart', (e)=>{
            if(e.touches && e.touches.length){

                moveDown( e.touches[ 0 ] );
            }
            document.body.style.overflow = 'hidden';

            //e.cancelable && e.preventDefault();
        }, true);

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