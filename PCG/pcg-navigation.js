(function(PCG){
    const D = PCG.D;
    PCG.updateNav = function updateNav(dt){

        var ctx = this.ctx.activate('nav'),

            limits = {
                from: 0,
                to: this.data.length-1
            },
            visible = this._getVisible(),
            cache = this.graphCache,
            timeLine = this.timeline,

            i, _i, v, _v = visible.length,

            graphTimeLine = this.graphTimeLine,

            minDate = timeLine[0],
            maxDate = timeLine[timeLine.length-1],

            width = this.world.graph.width,

            momentumDelta = maxDate - minDate,
            momentumRatio = (width-this.constsDPR.paddingLeft-this.constsDPR.paddingRight)/momentumDelta;


        this.updatePreview = false;
        this.ctx.clear();

        var minMaxesLocal = this._getMinMax(limits.from, limits.to);
        var globalCamera = {};
        this.updateCameraY(minMaxesLocal, dt, globalCamera)
        for( i = limits.from, _i = limits.to; i <= _i; i++ ){


            graphTimeLine[ i ] = ( ( timeLine[i] - minDate ) * momentumRatio ) | 0;
        }

        this.updateGraphData(limits, true, globalCamera);

        var vStep;
        if(this.stacked) {
            v = _v - 1;
            vStep = -1;
        }else {
            v = 0;
            vStep = 1;
        }
        ctx.lineWidth = this.constsDPR.navigationGraphStrokeWidth;
        ctx.lineJoin = 'bevel';

        for( ;; v+=vStep ){
            if(this.stacked){
                if(v<0)break;
            }else{
                if(v>=_v)break;
            }
            var color = this.getColor( this.columns[ visible[ v ] ], this._all[visible[ v ]].opacity );
            var type = this.types[ this.columns[ visible[ v ] ] ];
            if( type === 'line' ){
                ctx.strokeStyle = color;
                this.ctx.graph( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
            }else if( type === 'bar' ){
                ctx.fillStyle = color;
                this.ctx.bar( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
            }else if( type === 'area'){
                ctx.fillStyle = color;
                this.ctx.area( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
            }
        }


    };

    PCG.updateNavWindow = function updateNavWindow() {



        const resizeOffset = this.consts.resizeOffset;

        const minDate = this.minDate;
        const momentumDelta = ( this.maxDate - minDate );

        if(this.frame.to === null){
            const lastDate = this.data[this.data.length-1][0];
            this.frame = {to: lastDate, from: lastDate+this.frame.from}
        }

        const left = PCG.DPR*(((this.frame.from-minDate)/momentumDelta*this.world.nav.width)|0),
            width = PCG.DPR*(((this.frame.to-this.frame.from)/momentumDelta*this.world.nav.width)|0);

        // return
        this.els.navWindow.style.left = left+'px';
        this.els.navWindow.style.width = width+'px';
        const ears = this.els.navEars;

        ears[0].style.width = left+'px';
        ears[1].style.width = this.world.nav.width-left-width+'px';

        this.els.navMoveControl.style.width = width-resizeOffset/2+'px';
        this.els.navMoveControl.style.left = left+resizeOffset/4+'px';

        this.els.navExpandControl.style.width = width+resizeOffset+'px';
        this.els.navExpandControl.style.left = left-resizeOffset/2+'px';
    };
    PCG.navGraphUpdateVisibility = function navGraphUpdateVisibility() {
        const visible = this._getVisible();
        const visibleMinMax = {min: Infinity, max: -Infinity},
            minMaxes = this.minMaxes;
        this.els.navGraphs.forEach((el, i)=>{
            if(visible.indexOf(i)===-1){
                el.classList.add( 'hidden' );
            }else{
                el.classList.remove( 'hidden' );
                if(minMaxes[i].min<visibleMinMax.min){
                    visibleMinMax.min = minMaxes[i].min;
                }
                if(minMaxes[i].max>visibleMinMax.max){
                    visibleMinMax.max = minMaxes[i].max;
                }
            }
        });
        visibleMinMax.min = 0;
        visibleMinMax.delta = visibleMinMax.max;
        this.els.navGraphs.forEach((el, i)=>{
            if(visible.indexOf(i)!==-1){
                let percent = minMaxes[i].max/(visibleMinMax.max*1.1);
                el.style.transform = 'translateY('+ (this.world.nav.height*(1-percent))+'px) scaleY('+(percent)+')'
            }
        });
    }
})(window['PCG']);