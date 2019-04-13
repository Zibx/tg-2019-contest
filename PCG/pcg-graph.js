(function(PCG){
    const D = PCG.D;



    PCG.updateGraph = function updateGraph(){


        var now = +new Date(),
            dt = ((now - this.lastUpdate)|0)/1000;
        if(dt>0.2)
            dt = 0;
        this.updateVisible(dt);

        this.lastUpdate = now;

        /*const limits = {
                from: this._binarySearch(this.frame.from)-1,
                to: this._binarySearch(this.frame.to)+1
            };

        let minMax = this._getMinMax( limits.from, limits.to );*/



        var minDate = this.frame.from,
            momentumDelta = ( this.frame.to - minDate ),
            data = this.data,
            visible = this._getVisible(),

            width = this.world.graph.width,


            momentumRatio = (width-this.constsDPR.paddingLeft-this.constsDPR.paddingRight)/momentumDelta,
            momentumPaddingLeft = momentumDelta/width*this.constsDPR.paddingLeft,
            momentumPaddingRight = momentumDelta/width*this.constsDPR.paddingRight;

        minDate -= momentumPaddingLeft;
        var getX = this.getX = function( time ){return (( time - minDate ) *momentumRatio)|0;};


        var minMaxes = this.minMaxes;


        var i, _i, j, _j, k, _k,v,_v, slice;

        _v = visible.length;
        _k = this.columns.length;
        var raw = this.rawData,
            timeLine = this.timeline;

        const limits = {
            from: Math.max(this._binarySearch(minDate)-1,0),
            to: Math.min(this._binarySearch(this.frame.to+momentumPaddingLeft+momentumPaddingRight)+1,data.length-1),
        };

        var minMaxesLocal = this._getMinMax(limits.from, limits.to);
        this.updateCameraY(minMaxesLocal, dt);


        var /*getY = this.getY = function( val ){return (height - ( val - minMax.min ) / minMax.delta * height);},
            xToTime = this.xToTime = (x)=>x/width*momentumDelta+minDate,*/
            cache = this.graphCache;



        this.ctx.clear();


        var graphTimeLine = this.graphTimeLine;

        for( i = limits.from, _i = limits.to; i <= _i; i++ ){
            graphTimeLine[ i ] = ( ( timeLine[i] - minDate ) * momentumRatio ) | 0;
        }

        this.updateGraphData(limits);




        const graphStrokeWidth = this.constsDPR.graphStrokeWidth;

        var ctx = this.ctx.ctx;

        ctx.lineWidth = graphStrokeWidth;
        ctx.lineJoin = 'bevel';


        var vStep;
        if(this.stacked) {
            v = _v - 1;
            vStep = -1;
        }else {
            v = 0;
            vStep = 1;
        }

        for( ;; v+=vStep ){
            if(this.stacked){
                if(v<0)break;
            }else{
                if(v>=_v)break;
            }
            var color = this.getColor( this.columns[ visible[ v ] ], this._all[visible[ v ]].opacity )
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

        this.updateYAxis();
        this.updateXAxis();
        this.ctx.render();
       // requestAnimationFrame(()=>{this.updateGraph()})


    };
})(window['PCG']);