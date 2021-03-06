(function(PCG){



    PCG.updateGraph = function updateGraph(){


        var now = +new Date(),
            dt = ( ( now - this.lastUpdate ) | 0 ) / 1000;
        this.lastUpdate = now;

        if( this.skipNextFrame ){
            this.skipNextFrame = false;
            return this.update();
        }

        if( dt > 0.2 )
            dt = 0;
        this.updateVisible( dt );

        var minDate = this.frame.from,
            maxDate = this.frame.to,
            momentumDelta = ( maxDate - minDate ),
            data = this.data,
            visible = this._getVisible(),

            width = this.world.graph.width,
            height = this.constsDPR.graphicHeight,
            momentumPaddingLeft = momentumDelta / width * this.constsDPR.paddingLeft,
            momentumPaddingRight = momentumDelta / width * this.constsDPR.paddingRight;

        minDate -= momentumPaddingLeft;
        maxDate += momentumPaddingRight;

        var timeLine = this.timeline;

        var firstType = this.types[ this.columns[ visible[ 0 ] ] ];
        var isBar = firstType === 'bar';
        var isLine = firstType === 'line';
        if( isBar ){
            var tl = timeLine.length - 1;
            momentumDelta += timeLine[ tl ] - timeLine[ tl - 1 ];
        }


        var momentumRatio = ( width - this.constsDPR.paddingLeft - this.constsDPR.paddingRight ) / momentumDelta;


        this.getX = function( time ){
            return ( ( time - minDate ) * momentumRatio ) | 0;
        };

        this.xToTime = function( x ){
            return x / momentumRatio + minDate;
        };
        //var minMaxes = this.minMaxes;


        var i, _i, v, _v;

        _v = visible.length;

        var limits = {
            from: Math.max( this._binarySearch( minDate ) - 1, 0 ),
            to: Math.min( this._binarySearch( maxDate ) + 3, data.length - 1 )
        };

        var minMaxesLocal = this._getMinMax( limits.from, limits.to );


            this.updateCameraY( minMaxesLocal, dt );
        if(!this.thisIsAPIE){
            /*var hash = [minDate, maxDate,
                this.camera.minMax1.min,this.camera.minMax1.max,
                this.camera.minMax2.min,this.camera.minMax2.max,
                this._getOpacity().join('.')
            ].join('.');

            if(hash !== this.lastHash){*/
            //var minMaxesLocal = this._getMinMax(limits.from, limits.to);


            /*xToTime = this.xToTime = (x)=>x/width*momentumDelta+minDate,*/
            var cache = this.graphCache;


            var graphTimeLine = this.graphTimeLine;

            for( i = limits.from, _i = limits.to; i <= _i; i++ ){
                graphTimeLine[ i ] = ( ( timeLine[ i ] - minDate ) * momentumRatio ) | 0;
            }

            this.updateGraphData( limits );
        }

        var graphStrokeWidth = this.constsDPR.graphStrokeWidth;


        var ctx = this.ctx.activate( 'graph' );

        this.ctx.clear();

        var unscale = false;
        if(this.warTime){
            if(this.unwar){
                this.warDuration-=dt;
            }else{
                this.warDuration+=dt;
            }

            var outPerc = this.warDuration*2;
            console.log(outPerc)
            if((outPerc>1 && !this.unwar)|| outPerc<0){
                this.warTime = false;
                ctx.globalAlpha = 1;
            }else{
                ctx.globalAlpha = 1-outPerc;
                var aP = this.animationPercent
                outPerc*=outPerc;
                var dx = width*outPerc*outPerc;
                var leftSide = width*aP,
                    rightSide = width-leftSide;
                var left0 = leftSide-leftSide*(1-outPerc);
                var right0 = leftSide+width*(1-aP)*(1-outPerc);
                ctx.drawImage( this.ctx.tmp.graphBackup.el,
                    left0, 0,
                    right0-left0, height,

                    0,0,width,height );
                ctx.globalAlpha = outPerc;


                var dl = limits.to - limits.from;
                var left1 = dl*aP;

                limits.from = (limits.from+left1-left1*(outPerc))|0;
                limits.to = (limits.to-dl*(1-aP)+dl*(1-aP)*(outPerc))|0
            }
            this.update();
        }

        ctx.lineWidth = graphStrokeWidth;
        ctx.lineJoin = 'bevel';

        if(!this.thisIsAPIE){

            var vStep;
            if( this.stacked ){
                v = _v - 1;
                vStep = -1;
            }else{
                v = 0;
                vStep = 1;
            }


            for( ; ; v += vStep ){
                if( this.stacked ){
                    if( v < 0 ) break;
                }else{
                    if( v >= _v ) break;
                }
                var color = this.getColor( this.columns[ visible[ v ] ], this._all[ visible[ v ] ].opacity );
                var type = this.types[ this.columns[ visible[ v ] ] ];
                if( type === 'line' ){
                    ctx.strokeStyle = color;
                    this.ctx.graph( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
                }else if( type === 'bar' ){
                    ctx.fillStyle = color;
                    this.ctx.bar( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
                }else if( type === 'area' ){
                    ctx.fillStyle = color;
                    this.ctx.area( graphTimeLine, cache[ visible[ v ] ], limits.from, limits.to );
                }
            }
        }else{
            var SUM = 0;
            for(v = 0; v < _v; v++){
                var opac = this._all[ visible[ v ] ].opacity;
                SUM += minMaxesLocal[visible[v]].max*opac;
            }

            var min = Math.min(width, height);
            var r =(min/2-this.constsDPR.paddingRight)|0;
            var start = 0;
            for(v = 0; v < _v; v++){
                opac = this._all[ visible[ v ] ].opacity;
                var part = (minMaxesLocal[visible[v]].max*opac)/SUM;
                ctx.fillStyle = this.getColor( this.columns[ visible[ v ] ], opac );
                ctx.beginPath();
                ctx.moveTo(width/2, height/2)
                ctx.arc(width/2, height/2,r,start*Math.PI*2,(start+part)*Math.PI*2);
                ctx.fill();
                start+=part;
            }

        }


        var showSelection = false;
        var tooltipSlice = -1;
        if( this.tooltip ){


            tooltipSlice = this.tooltip.slice;
            if( tooltipSlice >= limits.from &&
                tooltipSlice <= limits.to ){
                showSelection = true;
                if( isBar ){
                    var from = graphTimeLine[ tooltipSlice ], to;
                    if( tooltipSlice - 1 < graphTimeLine.length ){
                        to = graphTimeLine[ tooltipSlice + 1 ];
                    }else{
                        to = from + ( graphTimeLine[ tooltipSlice ] - graphTimeLine[ tooltipSlice - 1 ] );
                    }
                    this.ctx.barSelection( ctx, from, to, this.tooltip.opacity )
                }
            }
        }
        //}
        if(!this.thisIsAPIE){

            this.updateYAxis( minMaxesLocal, dt );


            if( showSelection ){
                if( isBar === false ){
                    this.ctx.axisX( graphTimeLine[ tooltipSlice ], this.tooltip.opacity );
                }
                if( isLine ){


                    for( v = 0; v < _v; v++ ){
                        var color = this.getColor( this.columns[ visible[ v ] ], this._all[ visible[ v ] ].opacity );
                        this.ctx.circle(
                            graphTimeLine[ tooltipSlice ],
                            cache[ visible[ v ] ][ tooltipSlice ],
                            this.constsDPR.selectionCircleRadius,
                            this.constsDPR.selectionCircleBorder,
                            color
                        )

                    }
                }
            }

            this.updateXAxis( dt, minDate, maxDate );
        }

        if( this.nextNavUpdate > 0 ){
            this.update();
        }else{
            this.updatePreview = true;
        }


        if( this.nextNavUpdate === 0 ){
            this.nextNavUpdate = 4;
            this.updateNav( dt );
        }
        this.nextNavUpdate--;

        this.updateNavWindow();

        if( this.tooltip ){
            this.drawTooltip( dt );
        }

        this.ctx.render();
        this.updatePreview = false;
        var endDate = +new Date();
        if( endDate - now > 1000 / 62 ){
            this.skipNextFrame = true;//endDate-now-(1000/60);
        }

        // requestAnimationFrame(()=>{this.updateGraph()})


    };
})(window['PCG']);