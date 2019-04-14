(function(PCG){
    const D = PCG.D;



    PCG.updateGraph = function updateGraph(){


        var now = +new Date(),
            dt = ((now - this.lastUpdate)|0)/1000;
        this.lastUpdate = now;

        if(this.skipNextFrame){
            this.skipNextFrame = false;
            return this.update();
        }

        if(dt>0.2)
            dt = 0;
        this.updateVisible(dt);





        var minDate = this.frame.from,
            maxDate = this.frame.to,
            momentumDelta = ( maxDate - minDate ),
            data = this.data,
            visible = this._getVisible(),

            width = this.world.graph.width,
            momentumPaddingLeft = momentumDelta/width*this.constsDPR.paddingLeft,
            momentumPaddingRight = momentumDelta/width*this.constsDPR.paddingRight;

        minDate -= momentumPaddingLeft;
        maxDate += momentumPaddingRight;

        var raw = this.rawData,
            timeLine = this.timeline;

        if(this.types[ this.columns[ visible[ 0 ] ] ] === 'bar'){
            var tl = timeLine.length-1;
            momentumDelta += timeLine[tl]-timeLine[tl-1];
        }


        var momentumRatio = (width-this.constsDPR.paddingLeft-this.constsDPR.paddingRight)/momentumDelta;


        var getX = this.getX = function( time ){return (( time - minDate ) *momentumRatio)|0;};

        this.xToTime = function(x){return x/momentumRatio+minDate;}
        var minMaxes = this.minMaxes;


        var i, _i, j, _j, k, _k,v,_v, slice;

        _v = visible.length;
        _k = this.columns.length;


        const limits = {
            from: Math.max(this._binarySearch(minDate)-1,0),
            to: Math.min(this._binarySearch(maxDate)+3,data.length-1),
        };

        var minMaxesLocal = this._getMinMax(limits.from, limits.to);
        this.updateCameraY(minMaxesLocal, dt);

        var minMaxesLocal = this._getMinMax(limits.from, limits.to);



            /*xToTime = this.xToTime = (x)=>x/width*momentumDelta+minDate,*/
            var cache = this.graphCache;






        var graphTimeLine = this.graphTimeLine;

        for( i = limits.from, _i = limits.to; i <= _i; i++ ){
            graphTimeLine[ i ] = ( ( timeLine[i] - minDate ) * momentumRatio ) | 0;
        }

        this.updateGraphData(limits);




        const graphStrokeWidth = this.constsDPR.graphStrokeWidth;



        var ctx = this.ctx.activate('graph');

        this.ctx.clear();

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

        this.updateYAxis(minMaxesLocal, dt);

        this.updateXAxis(dt, minDate, maxDate);

        if(this.updatePreview){
            this.updateNav(dt);
        }
        this.updateNavWindow();


        this.ctx.render();
        this.updatePreview = false;
        var endDate = +new Date();
        if(endDate-now>1000/62){
            this.skipNextFrame = true;//endDate-now-(1000/60);
        }
       // requestAnimationFrame(()=>{this.updateGraph()})


    };
})(window['PCG']);