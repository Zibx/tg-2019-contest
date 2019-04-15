(function(PCG){
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
        this.updateCameraY(minMaxesLocal, dt, globalCamera);
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

        if(this.frame.to === null){
            var lastDate = this.data[this.data.length-1][0];
            this.frame = {to: lastDate, from: lastDate+this.frame.from}
        }

    };

})(window['PCG']);