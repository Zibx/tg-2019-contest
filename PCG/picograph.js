(function(PCG){
    const D = PCG.D;

    var DPR = PCG.DPR = window.devicePixelRatio;
    PCG.LOG2 = Math.log( 2 );
    PCG.zeroFn = function(){return 0};

    var opacityGetter = function(el) { return el.opacity;};

    PCG.prototype = {

        xToTime: PCG.zeroFn,
        getX: PCG.zeroFn,
        getY1: function( val ){return (this.constsDPR.graphicHeight - ( val - this._y1MMIN ) * this._y1PXINDATA);},
        getY2: function( val ){return (this.constsDPR.graphicHeight - ( val - this._y2MMIN ) * this._y2PXINDATA);},
        getPercentY: function( val ){
            var h = this.constsDPR.graphicHeight,
                top = this.constsDPR.labelFont+this.constsDPR.graphicPadding*2;

            return top+(h-top) * (1- val/100);
        },
        _y1MMIN: 0,
        _y1PXINDATA: 1,

        _y2MMIN: 0,
        _y2PXINDATA: 1,

        animation: { // in milliseconds
            lastCheckboxShake: 500,
            show: 500,
            hide: 300,

            labelHide: 200,
            labelShow: 300,

        },

        consts: {
            graphicHeight: 280,
            graphicPadding: 4,
            axeX: 31,
            navigationHeight: 50,
            navigationWrapperHeight: 54,

            navigationRadius: 6,
            bottom: 50,
            navWindowOverlap: 2,
            navWindowDraggerWidth: 13,

            navWindowDraggerHandleWidth: 2.5,
            navWindowDraggerHandleheight: 13,

            axisWidth: 1,
            labelFont: 12,

            XAxisHeight: 40,
            YAxisLabelPaddingBottom: 6,
            previewPxPerDot: 3,
            graphPxPerDot: 1,
            navigationGraphStrokeWidth: 1,
            graphStrokeWidth: 2,
            resizeOffset: 40,
            paddingLeft: 20,
            paddingRight: 20,
            axisYLabelPaddingBottom: 5,

            day: {
                background: PCG.h2f('#FFFFFF'),
                xLabel: PCG.h2f('#252529', 50), // CHECKED
                yLabel: PCG.h2f('#252529', 50), // CHECKED
                axis: PCG.h2f('#182D3B20'), // CHECKED
                scrollBG: PCG.h2f('#E2EEF9', 60),
                scrollSelector: PCG.h2f('#C0D1E1'),
                scrollResizers: PCG.h2f('#ffffff')
            },
            night: {
                background: PCG.h2f('#242F3E'),
                xLabel: PCG.h2f('#A3B1C2', 60), // CHECKED
                yLabel: PCG.h2f('#ECF2F8', 50), // CHECKED
                axis: PCG.h2f('#FFFFFF', 10), // CHECKED
                scrollBG: PCG.h2f('#304259',60),
                scrollSelector: PCG.h2f('#56626D'),
                scrollResizers: PCG.h2f('#ffffff')
            }
        },
        formatters: {
            date: PCG.dateFormatter,
            weekDate: PCG.weekDateFormatter,
        },
        els: null,
        minDate: null,
        maxDate: null,
        world: null,
        _visible: null,
        _all: null,
        skipNextFrame: false,
        updatePreview: true,
        init: function(){
            this.day = true;
            this.clear();
            this.constsDPR = {};
            this.updateConsts();
            this.initDOM();


            this.ctx = new PCG.Canvas2d(this.els.graph, this);

            this.initListeners();
            if(this.dataSource){
                this.loadData();
            }

        },
        loadData: function() {
            var me = this;
            /*me.load(window.data[this.dataSource.substr(-1)-1])
            return;*/

            PCG.GET(PCG.path.join(this.dataSource, 'overview.json'), function(err, data) {
                me.load( data );
            });

        },
        initCheckboxes: PCG.initCheckboxes,
        initDOM: PCG.initDOM,
        initListeners: PCG.initListeners,
        clear: function(){
            this.camera = null;
            this.colors = {};
            this.data = [];

            this.yAxis = {
                hash: {},
                step: 0,
                inited: false
            };

            this.columns = [];
            for( let i in this.els ){
                if( this.els.hasOwnProperty( i ) ){
                    const el = this.els[ i ];
                    el.parentNode.removeChild( el )
                }
            }
            this.els = null;
            this.world = null;
            this._visible = [];
        },
        getColor: function(name, opacity) {
            return PCG.color(this.colors[ name ], opacity);
        },
        load: function( data ){

            this.colors = {};
            for(var rowID in data.colors){
                this.colors[rowID] = PCG.h2f(data.colors[rowID].substr(1));
            }
            const columns = data.columns;
            const myData = this.data;
            var wholeData = columns.map((list)=>list.slice(1));
            this.rawData = wholeData.splice(1);
            this.timeline = wholeData[0];
            this.names = data.names;
            this.types = data.types;
            this.percentage = !!data.percentage;// – true for percentage based values.
            this.stacked = !!data.stacked;// – true for values stacking on top of each other.
            this.y_scaled = !!data.y_scaled;// – true for charts with 2 Y axes


            console.log( 'Dots count:', columns[ 0 ].length );

            var i, _i;
            for( i = 0, _i = columns.length; i < _i; i++ ){
                const column = columns[ i ];
                if( i > 0 ){
                    this.columns.push( column[ 0 ] );
                }
                if( i === 0 ){
                    for( let j = 1, _j = column.length; j < _j; j++ ){
                        myData.push( [ column[ j ] ] );
                    }
                }else{
                    for( let j = 1, _j = column.length; j < _j; j++ ){
                        myData[ j - 1 ].push( column[ j ] );
                    }
                }
            }



            this.calculateMinMax();



            this.minDate = myData[ 0 ][ 0 ];
            this.maxDate = myData[ myData.length - 1 ][ 0 ];


            this.initCheckboxes();
            this.updatePreview = true;

            this.update();
            setTimeout(this._update, 100);
        },
        // GLOBAL minmaxes
        calculateMinMax: function() {
            var minMaxes = this.minMaxes = [],
                i, _i, k, _k,
                val, slice,
                data = this.data,

                cacheRow;

            _k = this.columns.length;
            _i = data.length;

            this.graphCache = [];

            for( k = 0; k < _k+2; k++ ){
                minMaxes[k] = new PCG.MinMax();
                // make gc happy, do not reallocate on each frame
                cacheRow = this.graphCache[k] = new Array(_i);
            }
            var graphTimeLine = this.graphTimeLine = new Array(_i);

            for(i = 0; i < _i; i++){
                graphTimeLine[i] = i;
                slice = data[ i ];
                for( k = 0; k < _k; k++ ){
                    val = slice[k+1];
                    if(val>minMaxes[k].max){
                        minMaxes[k].max = val;
                    }
                    if(val<minMaxes[k].min){
                        minMaxes[k].min = val;
                    }

                }
            }
        },
        _getMinMaxRow: function( from, to, row ){
            const data = this.data;
            let min = Infinity,
                max = -Infinity,

                i, j,

                slice, point;

            const visible = this._getVisible();
            const visibleCount = visible.length;

            for( i = from; i <= to; i++ ){
                slice = data[ i ];
                point = slice[ row + 1 ];
                if( point < min ){
                    min = point;
                }
                if( point > max ){
                    max = point;
                }
            }

            min = 0;
            max *= 1.05;
            const delta = ( max - min );
            if(max===-Infinity){
                return this.camera.minMax;
            }
            return { min, max, delta: delta };
        },
        _getMinMax: function( from, to ){
            var l, _l, k, _k, i, _i;
            var minMaxesLocal = [],
                raw = this.rawData;

            for( l = 0, _l = this.columns.length; l < _l; l++ ){
                minMaxesLocal[l] = new PCG.MinMax();
            }
            /*if(this.percentage){
                for( l = 0, _l = this.columns.length; l < _l; l++ ){
                    minMaxesLocal[l].min = 0;
                    minMaxesLocal[l].max = 1;
                }
                return minMaxesLocal;
            }*/
            _k = this.columns.length;
            var zeroStarted = true;
            if(this.stacked){
                zeroStarted = false;
                var data = this.data;
                var opac = this._getOpacity(),
                    cacheSum = this.graphCache[_k],
                    cacheSum2 = this.graphCache[_k+1],
                    max = 0, min = Infinity,
                    firstVisible,
                    maxOpacity = 0, visiblest;
                for(k=0; k < _k; k++){
                    if(opac[k]>0.7){
                        firstVisible = k+1;
                        break;
                    }
                    if(maxOpacity<opac[k]){
                        maxOpacity = opac[k];
                        visiblest = k+1;
                    }

                }
                if(!firstVisible){
                    firstVisible = visiblest;
                }
                for( i = from, _i = to; i <= _i; i++ ){
                    var stack = data[ i ];
                    var sum = 0;
                    if( stack[firstVisible] < min ){
                        min = stack[firstVisible];
                    }
                    for( k=0; k < _k; k++ ){
                        sum+=stack[k+1]*opac[k];
                    }

                    if( sum > max ){
                        max = sum;
                    }

                    cacheSum[i] = sum;
                    cacheSum2[i] = sum;
                }
                for( k=0; k < _k; k++ ){
                    minMaxesLocal[k].max = max;
                    minMaxesLocal[k].min = min;
                }
            }else{
                if( _k === 1 || this.y_scaled ){
                    zeroStarted = false;
                    // start not from zero
                    for( k = 0; k < _k; k++ ){
                        var dataRow = raw[ k ];
                        for( i = from, _i = to; i < _i; i++ ){
                            var val = dataRow[ i ];
                            if( val > minMaxesLocal[ k ].max ){
                                minMaxesLocal[ k ].max = val;
                            }
                            if( val < minMaxesLocal[ k ].min ){
                                minMaxesLocal[ k ].min = val;
                            }
                        }
                    }
                }else{

                    for( k = 0; k < _k; k++ ){
                        var dataRow = raw[ k ];
                        minMaxesLocal[ k ].min = 0;
                        for( i = from, _i = to; i < _i; i++ ){
                            var val = dataRow[ i ];
                            if( val > minMaxesLocal[ k ].max ){
                                minMaxesLocal[ k ].max = val;
                            }
                        }
                    }
                }
            }
            for( k = 0; k < _k; k++ ){
                minMaxesLocal[k].updateDelta();
                var delta = minMaxesLocal[k].delta/this.constsDPR.graphicHeight*(this.constsDPR.graphicPadding);// TODO: why graphicPadding?
                if(!zeroStarted){
                    minMaxesLocal[k].min -= delta;
                }
                minMaxesLocal[k].max += delta;
                minMaxesLocal[k].updateDelta();
            }
            return minMaxesLocal;
        },
        updateCameraY: function(minMaxesLocal, dt, camera) {
            var minMax1, minMax2;
            if(this.y_scaled){
                minMax1 = minMaxesLocal[0];
                minMax2 = minMaxesLocal[1];
            }else{
                var minMax = new PCG.MinMax(),
                    visible = this._getVisible(),
                    _v = visible.length, v,
                    opac = this._getOpacity();
                for(v = 0; v<_v; v++){
                    if(opac[visible[v]]===1){
                        minMax.update(minMaxesLocal[visible[v]]);
                        break;
                    }
                }
                for(v = 0; v<_v; v++){
                    minMax.update(minMaxesLocal[visible[v]], opac[visible[v]]);
                }
                minMax1 = minMax;
                minMax2 = new PCG.MinMax();
                minMax2.update(minMax1);
            }

            minMax1.updateDelta();
            minMax2.updateDelta();
            if(this.camera === null || camera){
                let day = 1000*60*60*24;
                var justCalc = !!camera;
                camera = camera || {};
                camera.minMax1 = minMax1;
                camera.minMax2 = minMax2;
                camera.offset = this.data[0][0];
                camera.AxisXGranule = day * Math.pow(2,Math.round(Math.log(Math.ceil((this.frame.to-this.frame.from)/6/day))/Math.log(2)));

                if(!justCalc){
                    this.camera = camera;
                }
            }else{
                camera = this.camera;
                if(
                    Math.abs(camera.minMax1.max - minMax1.max)>0.01 ||
                    Math.abs(camera.minMax2.max - minMax2.max)>0.01
                ) {
                    this.update();
                }
                var dAnimation = Math.min(dt,1)*3;
                minMax1.max = PCG.lerp(
                    camera.minMax1.max,
                    minMax1.max,
                    dAnimation,
                    2
                );
                minMax1.min = PCG.lerp(
                    camera.minMax1.min,
                    minMax1.min,
                    dAnimation,
                    2
                );
                minMax1.updateDelta();
                camera.minMax1 = minMax1;

                minMax2.max = PCG.lerp(
                    camera.minMax2.max,
                    minMax2.max,
                    dAnimation,
                    2
                );
                minMax2.min = PCG.lerp(
                    camera.minMax2.min,
                    minMax2.min,
                    dAnimation,
                    2
                );
                minMax2.updateDelta();
                camera.minMax2 = minMax2;
            }
        },
        updateGraphData: function(limits, preview, inCamera) {
            var camera = inCamera || this.camera,
                height = preview ? this.constsDPR.navigationHeight : this.constsDPR.graphicHeight,
                raw = this.rawData,
                cache = this.graphCache,
                visible = this._getVisible(),

                v, _v = visible.length,
                i,_i,

                pxInData = this._y1PXINDATA = height/camera.minMax1.delta,
                mmmin = this._y1MMIN = camera.minMax1.min,
                dataRow, cacheRow;



            if(this.stacked){
                var sumCache = cache[this.columns.length],
                    sumCache2 = cache[this.columns.length+1],
                    opac = this._getOpacity(),
                    opacity;
                if(this.percentage){

                    var topPadding = preview?0:this.constsDPR.labelFont+this.constsDPR.graphicPadding*2;
                    height-=topPadding;
                }
                for( v = this.columns.length-1; v >=0; v-- ){
                    dataRow = raw[ v ];
                    cacheRow = cache[ v ];
                    opacity = opac[v];
                    if(this.percentage){

                        for( i = limits.from, _i = limits.to; i <= _i; i++ ){
                            pxInData = height/sumCache2[i];
                            cacheRow[ i ] = ( topPadding+ height - ( sumCache[i] ) * pxInData ) | 0;
                            sumCache[i] -= dataRow[ i ]*opacity;
                        }
                    }else{
                        for( i = limits.from, _i = limits.to; i <= _i; i++ ){
                            cacheRow[ i ] = ( height - ( sumCache[i] - mmmin ) * pxInData ) | 0;
                            sumCache[i] -= dataRow[ i ]*opacity;
                        }
                    }

                }
            }else{
                for( v = 0; v < _v; v++ ){
                    if( this.y_scaled && visible[ v ] ){
                        pxInData = this._y2PXINDATA = height / camera.minMax2.delta;
                        mmmin = this._y2MMIN = camera.minMax2.min;
                    }
                    dataRow = raw[ visible[ v ] ];
                    cacheRow = cache[ visible[ v ] ];
                    for( i = limits.from, _i = limits.to; i <= _i; i++ ){
                        cacheRow[ i ] = ( height - ( dataRow[ i ] - mmmin ) * pxInData ) | 0;//getY( slice[ dataRow ] );
                    }
                }
            }


        },
        _getVisible: function(){
            return this._visible;
        },
        _getOpacity: function() {
            return this._all.map(opacityGetter);
        },
        updateVisible: function(dt) {
            if(dt === void 0)
                dt = 0.001
            dt *=1000;

            var all = this._all, row,
                visibleChanged = false,
                needMoreAnimation = false;

            for(var a = 0, _a = all.length; a<_a;a++){
                row = all[a];
                if(row.show === false && row.opacity>0){
                    needMoreAnimation = true;
                    if(row.opacity === 1){
                        visibleChanged = true;
                    }
                    row.opacity = Math.max(0, row.opacity - dt / this.animation.hide);
                    if(row.opacity === 0){
                        visibleChanged = true;
                    }
                }
                if(row.show === true && row.opacity<1){
                    needMoreAnimation = true;
                    if(row.opacity === 0){
                        visibleChanged = true;
                    }
                    row.opacity = Math.min(1, row.opacity + dt / this.animation.show);
                    if(row.opacity === 1){
                        visibleChanged = true;
                    }
                }
            }
            if(visibleChanged || !this._visible.length){
                this._visible = this._all
                    .filter( el => el.opacity > 0 )
                    .map( el => el.i );
            }
            if(needMoreAnimation){
                this.updatePreview = true;
                this.update();
            }
        },
        updateNav: PCG.updateNav,
        navGraphUpdateVisibility: PCG.navGraphUpdateVisibility,
        updateNavWindow: PCG.updateNavWindow,
        _binarySearch: function( time ){
            const data = this.data;
            let min = 0, max = data.length - 1, current;

            let steps = Math.log( data.length ) / PCG.LOG2;

            for( let i = 0; i < steps; i++ ){
                current = ( min + ( max - min ) / 2 ) | 0;
                if( data[ current ][ 0 ] < time ){
                    min = current;
                }else if( data[ current ][ 0 ] > time ){
                    max = current;
                }
            }
            if( current < 1 ){
                current = 1;
            }
            return current;
        },
        updateYAxis: PCG.updateYAxis,
        updateXAxis: PCG.updateXAxis,
        updateGraph: PCG.updateGraph,
        update: function(){
            if( !this.shouldUpdate ){
                this.shouldUpdate = true;
                requestAnimationFrame( this._update );
            }
        },
        _update: function(){
            this.shouldUpdate = false;

            this.updateGraph();
        },
        _removeTooltipCircles: function() {
            let circle;
            while( ( circle = this.els.highlightCircles.pop() ) ){
                this.els.graph.removeChild( circle );
            }
        },
        showTooltip: function( sliceID ){
            console.log(sliceID)
            const slice = this.data[ sliceID ],
                time = slice[ 0 ];
            const visible = this._getVisible();
            this.els.tooltip.style.display = 'block';
            let i, _i, val, name;

            // remove old circles
            this._removeTooltipCircles();
            D.removeChildren( this.els.tooltipInfo );

            const xPos = this.getX( time );
            // add new circles
            for( i = 0, _i = visible.length; i < _i; i++ ){
                val = slice[ visible[ i ] + 1 ];
                name = this.columns[ visible[ i ] ];
                this.els.highlightCircles.push( D.circle( {
                    attr: {
                        stroke: this.getColor( name,1),
                        cx: xPos,
                        cy: this.getY1( val ),
                        r: 6,
                        'stroke-width': 3
                    },
                    renderTo: this.els.graph
                } ) );

                this.els.tooltipInfo.appendChild(
                    D.div( {
                            cls: 'pcg-tooltip__info-item',
                            style: { color: this.getColor(name,1) }
                        },
                        D.div( { cls: 'pcg-tooltip__info-item__count' }, PCG.numberFormat(val) ),
                        this.names[ name ]
                    )
                )
            }
            this.els.tooltipDate.innerText = this.formatters.weekDate( time );
            const tooltipStyle = this.els.tooltip.style;
            const tooltipRect = this.els.tooltip.getClientRects()[0];

            this.els.verticalMouseSlice.style.left = xPos-1+'px';
            this.els.verticalMouseSlice.style.display = 'block';

            let tooltipLeft = xPos - tooltipRect.width/3.5;
            if(tooltipLeft<1){
                tooltipLeft = 1;
            }
            if(tooltipLeft+tooltipRect.width+1>this.world.graph.width){
                tooltipLeft = this.world.graph.width - tooltipRect.width - 1;
            }
            tooltipStyle.left = tooltipLeft+'px';
        },
        hideTooltip: function(){
            this.els.tooltip.style.display = 'none';
            this.els.verticalMouseSlice.style.display = 'none';
            this._removeTooltipCircles();
        },
        updateConsts: function() {
            DPR = PCG.DPR = window.devicePixelRatio;
            var constsDPR = this.constsDPR;
            for(var key in this.consts) if(this.consts.hasOwnProperty(key)){
                if(typeof this.consts[key] === 'number'){
                    constsDPR[ key ] = Math.round(this.consts[ key ] * DPR);
                }else{
                    constsDPR[ key ] = this.consts[ key ];
                }
            }
        },
        collectWorldInfo: function(){


            this.updateConsts();
            const navRect = this.renderTo.nav.getClientRects()[ 0 ];
            const graphRect = this.renderTo.graph.getClientRects()[ 0 ];
            this.scheme = this.consts[this.day?'day':'night'];
            const canvasRect = this.els.graph.getBoundingClientRect();
            this.world = {
                nav: {
                    width: navRect.width*PCG.DPR,
                    height: navRect.height*PCG.DPR
                },
                graph: {
                    width: canvasRect.width*PCG.DPR,
                    height: canvasRect.height*PCG.DPR - this.consts.XAxisHeight*PCG.DPR
                }
            };

        },
        scheme: {},
        setNightMode: function(val) {
            this.day = !val;
            this.resize();
        },
        resize: function(){
            var mnu = this;
            requestAnimationFrame( function(){
                mnu.collectWorldInfo();
                mnu.updatePreview = true;
                mnu.ctx.resize();
                mnu._update();
            } );
        }
    };
})(window['PCG']);