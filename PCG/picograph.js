(function(PCG){
    var D = PCG.D;
    var animation = PCG.animation;
    var DPR = PCG.DPR = window.devicePixelRatio;
    PCG.LOG2 = Math.log( 2 );
    PCG.zeroFn = function(){return 0};

    var opacityGetter = function(el) { return el.opacity;};
    var shouldDraw = function(el) { return el.opacity > 0;};
    var getI = function(el) { return el.i;};
    var abs = Math.abs,
        min = Math.min,
        max = Math.max,
        log = Math.log,
        DPRc;

    PCG.prototype = {

        xToTime: PCG.zeroFn,
        getX: PCG.zeroFn,
        getY1: function( val ){return (DPRc.graphicHeight - ( val - this._y1MMIN ) * this._y1PXINDATA);},
        getY2: function( val ){return (DPRc.graphicHeight - ( val - this._y2MMIN ) * this._y2PXINDATA);},
        getPercentY: function( val ){
            var h = DPRc.graphicHeight,
                top = DPRc.labelFont+DPRc.graphicPadding*2;

            return top+(h-top) * (1- val/100);
        },
        _y1MMIN: 0,
        _y1PXINDATA: 1,

        _y2MMIN: 0,
        _y2PXINDATA: 1,

        consts: {
            graphicHeight: 330,
            graphicPadding: 4,
            axeX: 31,
            navigationHeight: 50,
            navigationWrapperHeight: 54,

            navigationRadius: 6,
            bottom: 50,
            navWindowOverlap: 2,
            navWindowDraggerWidth: 13,

            navWindowDragHandleWidth: 2.5,
            navWindowDragHandleHeight: 13,

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

            selectionCircleRadius: 3.5,
            selectionCircleBorder: 2,
            day: {
                background: PCG.h2f('#FFFFFF'),
                xLabel: PCG.h2f('#252529', 50), // CHECKED
                yLabel: PCG.h2f('#252529', 50), // CHECKED
                axis: PCG.h2f('#182D3B20'), // CHECKED
                scrollBG: PCG.h2f('#E2EEF9', 60),
                scrollSelector: PCG.h2f('#C0D1E1'),
                scrollDragHandle: PCG.h2f('#ffffff')
            },
            night: {
                background: PCG.h2f('#242F3E'),
                xLabel: PCG.h2f('#A3B1C2', 60), // CHECKED
                yLabel: PCG.h2f('#ECF2F8', 50), // CHECKED
                axis: PCG.h2f('#FFFFFF', 10), // CHECKED
                scrollBG: PCG.h2f('#304259',60),
                scrollSelector: PCG.h2f('#56626D'),
                scrollDragHandle: PCG.h2f('#ffffff')
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
            this.constsDPR = DPRc = {};
            this.updateConsts();
            this.initDOM();


            this.ctx = new PCG.Canvas2d(this.els.graph, this);

            this.initListeners();
            if(this.dataSource){
                this.loadData();
            }

        },
        loadData: function(fileName, zoom, cb) {
            var me = this;
            /*me.load(window.data[this.dataSource.substr(-1)-1])
            return;*/

            PCG.GET(PCG.path.join(this.dataSource, fileName||'overview.json'), cb || function(err, data) {
                me.clear();
                me.load( data, zoom );
            });

        },
        initCheckboxes: PCG.initCheckboxes,
        initDOM: PCG.initDOM,
        initListeners: PCG.initListeners,

        move: PCG.move,
        down: PCG.down,
        longTap: PCG.longTap,
        up: PCG.up,
        camera: null,
        clear: function(){
            //this.camera = null;
            this.colors = {};
            this.data = [];

            this.yAxis = {
                hash: {},
                step: 0,
                inited: false
            };

            this.columns = [];
            /*for( var i in this.els ){
                if( this.els.hasOwnProperty( i ) ){
                    var el = this.els[ i ];
                    el.parentNode.removeChild( el )
                }
            }
            this.els = null;*/
            this.world = null;
            this._visible = [];
        },
        getColor: function(name, opacity) {
            return PCG.color(this.colors[ name ], opacity);
        },
        load: function( data, zoom ){
            this.data = [];
            this.columns = [];
            this.zoomed = !!zoom;
            this.updateZoomCls();
            this._visible = [];
            this.colors = {};
            //this.camera = null;

            for(var rowID in data.colors){
                this.colors[rowID] = PCG.h2f(data.colors[rowID].substr(1));
            }
            var columns = data.columns,
                myData = this.data,
                wholeData = columns.map(function(list){return list.slice(1);});
            this.rawData = wholeData.splice(1);
            var timeline = this.timeline = wholeData[0];
            this.names = data.names;
            this.types = data.types;
            this.percentage = !!data.percentage;// – true for percentage based values.
            this.stacked = !!data.stacked;// – true for values stacking on top of each other.
            this.y_scaled = !!data.y_scaled;// – true for charts with 2 Y axes

            if(zoom){
                this.frame.from = timeline[(timeline.length/7*2)|0];
                this.frame.to = timeline[(timeline.length/7*5)|0];
                if(this.tooltip){
                    this.tooltip.opacity = 0;
                    this.tooltip.visible = false;
                }
            }



            console.log( 'Dots count:', columns[ 0 ].length );

            var i, _i;
            for( i = 0, _i = columns.length; i < _i; i++ ){
                var column = columns[ i ];
                if( i > 0 ){
                    this.columns.push( column[ 0 ] );
                }
                if( i === 0 ){
                    for( var j = 1, _j = column.length; j < _j; j++ ){
                        myData.push( [ column[ j ] ] );
                    }
                }else{
                    for( var j = 1, _j = column.length; j < _j; j++ ){
                        myData[ j - 1 ].push( column[ j ] );
                    }
                }
            }



            this.calculateMinMax();



            this.minDate = myData[ 0 ][ 0 ];
            this.maxDate = myData[ myData.length - 1 ][ 0 ];




            this.initCheckboxes();
            this.updatePreview = true;
            this.collectWorldInfo();

            if(zoom){
                this.camera = null;
                this.warTime = true;
                this.warDuration = 0;
                this.ctx.backup();
            }

            this.update();
            var _self = this;
            setTimeout(function() {
                _self.onZoom && _self.onZoom(_self.zoomed);
                _self.updateXGranule(_self.camera, _self.frame);
                _self.update();
            }, 100);
        },
        warTime: false,
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
            var data = this.data,
                min = Infinity,
                max = -Infinity,

                i, j,

                slice, point,

                visible = this._getVisible(),
                visibleCount = visible.length;

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
            var delta = ( max - min );
            if(max===-Infinity){
                return this.camera.minMax;
            }
            return { min: min, max: max, delta: delta };
        },
        _getMinMax: function( from, to ){
            var l, _l, k, _k, i, _i, DPRlc = DPRc;
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
                    max = 0, min = data[ 1 ][1],
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

                    cacheSum2[i] = cacheSum[i] = sum;

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
                var delta = minMaxesLocal[k].delta/DPRlc.graphicHeight*(DPRlc.graphicPadding);// TODO: why graphicPadding?
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


                var justCalc = !!camera;
                camera = camera || {};
                camera.minMax1 = minMax1;
                camera.minMax2 = minMax2;
                camera.offset = this.data[0][0];
                this.updateXGranule(camera, this.frame);


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
                DPRlc = DPRc,
                height = preview ? DPRlc.navigationHeight : DPRlc.graphicHeight,
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

                    var topPadding = preview?0:DPRlc.labelFont+DPRlc.graphicPadding*2;
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
                dt = 0.001;
            dt *=1000;

            var all = this._all, row,
                visibleChanged = false,
                needMoreAnimation = false,
                rowOpacity, i;

            for(var a = 0, _a = all.length; a<_a;a++){
                row = all[a];
                rowOpacity = row.opacity;
                if(row.show === false && rowOpacity>0){
                    needMoreAnimation = true;
                    if(rowOpacity === 1){
                        visibleChanged = true;
                    }
                    rowOpacity = row.opacity = max(0, rowOpacity - dt / animation.hide);
                    if(rowOpacity === 0){
                        visibleChanged = true;
                    }
                }
                if(row.show === true && rowOpacity<1){
                    needMoreAnimation = true;
                    if(rowOpacity === 0){
                        visibleChanged = true;
                    }
                    rowOpacity = row.opacity = min(1, rowOpacity + dt / animation.show);
                    if(rowOpacity === 1){
                        visibleChanged = true;
                    }
                }
            }
            if(visibleChanged || !this._visible.length){
                var _vis = this._visible;

                i=0;
                for(a = 0; a<_a;a++){
                    if((row = all[a]).opacity>0){
                        _vis[i++] = row.i;
                    }
                }
                _vis.length = i;

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
            var data = this.data,
                min = 0, max = data.length - 1, current,

                steps = log( data.length ) / PCG.LOG2,
                i;

            for( i = 0; i < steps; i++ ){
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
        drawTooltip: PCG.drawTooltip,
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
        lastHash: '',
        nextNavUpdate: 0,
        showTooltip: function( sliceID ){
            if(this.tooltip){
                this.tooltip.visible = true;
                this.tooltip.slice = sliceID;
            }else{
                this.tooltip = {
                    opacity: 0,
                    visible: true,
                    slice: sliceID
                };
            }
            this.update();
        },
        tooltip: null,
        hideTooltip: function(){
            if(this.tooltip){
                this.tooltip.visible = false;
                this.update();
            }
            /*this.els.tooltip.style.display = 'none';
            this.els.verticalMouseSlice.style.display = 'none';
            this._removeTooltipCircles();*/
        },
        updateConsts: function(w) {
            // TODO microbench and decrease DPR
            var real = window.devicePixelRatio;

            if(real>2)real/=2;
            if(real>2)real/=2;

            DPR = PCG.DPR = real;
            var constsDPR = this.constsDPR;
            for(var key in this.consts) if(this.consts.hasOwnProperty(key)){
                if(typeof this.consts[key] === 'number'){
                    constsDPR[ key ] = Math.round(this.consts[ key ] * DPR);
                }else{
                    constsDPR[ key ] = this.consts[ key ];
                }
            }
            DPRc = constsDPR;
        },
        collectWorldInfo: function(){



            var graphRect = this.renderTo.graph.getClientRects()[ 0 ];

            var canvasRect = this.els.graph.getBoundingClientRect();
            this.updateConsts(canvasRect.width);
            var top = this.renderTo.graph.offsetTop+this.renderTo.graph.parentNode.offsetTop;
            var w = canvasRect.width*PCG.DPR;

            this.scheme = this.consts[this.day?'day':'night'];

            this.world = {
                nav: {
                    width: w - this.constsDPR.paddingLeft - this.constsDPR.paddingRight,
                    height: this.constsDPR.navigationHeight
                },
                graph: {
                    left: canvasRect.left*PCG.DPR,
                    top: top*PCG.DPR,
                    width: w,
                    height: canvasRect.height*PCG.DPR - this.consts.XAxisHeight*PCG.DPR
                }
            };

        },
        zoomIn: function(slice) {
            this.animationPercent = (this.timeline[slice]-this.frame.from)/(this.frame.to-this.frame.from);
            this.unwar = false;
            var date = new Date(this.timeline[slice]);
            if(this.zoomType === PCG.ZOOM.LOAD){
                var fileName = PCG.path.join(
                    [date.getFullYear(), PCG.pad(date.getMonth()+1)].join('-'),
                    [PCG.pad(date.getDate()), 'json'].join('.')
                );
                this.createBackup();
                this.loadData( fileName, true );
            }else if(this.zoomType === PCG.ZOOM.CUSTOM){
                this.createBackup();
                this.customZoom(date);
            }
        },
        zoomOut: function() {
            this.warTime = true;
            this.unwar = true;
            this.warDuration = 0.5;
            for(var i in this.backup){
                this[ i ] = this.backup[ i ];
            }
            this.updateZoomCls();
            this.calculateMinMax();
            this.initCheckboxes();
            this.updatePreview = true;
            var _self = this;
            this.els.XAxisHash = {};
            _self._update();
            _self.updateXGranule(_self.camera, _self.frame);
            this.els.XAxisHash = {};
            this.onZoom && this.onZoom(this.zoomed);
            _self._update();
            _self.updateXGranule(_self.camera, _self.frame);

        },
        updateZoomCls: function() {
            this.renderTo.header.className = ['title-row', this.zoomed? 'zoomed':'unzoomed'].join(' ');
        },
        updateXGranule: function(camera, frame) {
            var dt = this.maxDate-this.minDate;
            var minDelta = this.minDelta = dt<PCG.DAY*4?PCG.HOUR:PCG.DAY;
            camera.AxisXGranule = minDelta * Math.pow(2,Math.round(Math.log(Math.ceil((frame.to-frame.from)/4/minDelta))/Math.log(2)));
        },
        joinAndLoadData: function(data, dates, names, colors) {

            var rColors = {},
                rNames = {},
                rTypes = {x:'x'},
                rColumns = [],

            timeline = [];

            var i = 0, baseDate;

            var minute = PCG.MINUTE;
            var timeLineHash = {};
            data.forEach(function(el, n) {
                if(el){
                    var dates = el.columns.filter(function(row) {
                        return row[0] === 'x';
                    })[0].slice(1);
                    var diff = 0;
                    if(i === 0){
                        baseDate = dates[n]
                    }else{
                        diff = baseDate - dates[n] // time ago
                    }

                    dates.forEach(function(time) {
                        var val = Math.round((time+diff)/minute)*minute;
                        timeLineHash[val] = true;
                    });

                    i++;
                }
            });

            for(i in timeLineHash){
                timeline.push( parseInt( i, 10 ) );
            }
            timeline.sort(function(a,b) {
                return a-b;
            });
            rColumns.push(['x'].concat(timeline));
            i=0;
            data.forEach(function(el, n) {
                if(el){

                    var id = 'y'+i;
                    rColors[id] = colors[n];
                    rNames[id] = names[n];


                    var newColumn = [id];
                    for( var j = 0, _j = el.columns.length; j < _j; j++ ){
                        var column = el.columns[ j ];
                        if(column[0] !== 'x'){
                            var notX = j;
                        }else{
                            var isX = j;
                        }
                    }

                    var diff = baseDate === dates[n] ? 0 : baseDate - dates[n];
                    var chartTimeline = el.columns[isX].slice(1),
                        chartData = el.columns[notX].slice(1);
                    rTypes[id] = el.types[el.columns[notX][0]];
                    var cursor = 0,
                        dL = chartData.length;

                    for( var k = 0, _k = timeline.length; k < _k; k++ ){
                        var timelineElement = timeline[ k ];
                        var time = chartTimeline[cursor],
                            rounded = Math.round((time+diff)/minute)*minute;

                        if(rounded === timelineElement){
                            newColumn.push(chartData[cursor]);
                            cursor++;
                        }else{
                            var dD = chartData[cursor+1]-chartData[cursor],
                                dT = chartTimeline[cursor+1]-chartTimeline[cursor];

                            newColumn.push(chartData[cursor]);//-dD/dT*(timelineElement-time));
                        }
                    }
                    rColumns.push(newColumn);
                    i++;
                }
            });

            var result = {
                colors: rColors,
                columns: rColumns,
                types: rTypes,
                names: rNames
            };

            this.load(result, true);

        },
        createBackup: function() {
            this.backup = {
                colors: this.colors,
                rawData: this.rawData,
                timeline: this.timeline,
                names: this.names,
                types: this.types,
                percentage: this.percentage,
                stacked: this.stacked,
                y_scaled: this.y_scaled,
                data: this.data,
                columns: this.columns,
                _visible: this._visible,
                frame: {from: this.frame.from, to: this.frame.to},
                minDate: this.minDate,
                maxDate: this.maxDate,
                zoomed: this.zoomed,
                camera: {
                    offset: this.camera.offset,
                    AxisXGranule: this.camera.AxisXGranule,
                    minMax1: new PCG.MinMax(),
                    minMax2: new PCG.MinMax()
                }
            };
            this.backup.camera.minMax1.update(this.camera.minMax1);
            this.backup.camera.minMax2.update(this.camera.minMax2);
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
                this.nextNavUpdate = 0;
                mnu.ctx.resize();
                mnu._update();
            } );
        }
    };
})(window['PCG']);