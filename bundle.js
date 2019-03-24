// Pico pico graph!
window['PCG'] = function(cfg) {
    Object.assign(this, cfg);
    this._update = this._update.bind(this);
    this.resize = this.resize.bind(this);
    this.init();
};(function(PCG){
    const svgNS = 'http://www.w3.org/2000/svg';

// I am too lazy to do DOM manually / anyway this solution is optimal enough

// ~jsx h function
    const domEl = function( type, cfg = {} ){
        const cls = cfg.cls,
            style = cfg.style,
            attr = cfg.attr,
            prop = cfg.prop,
            on = cfg.on,
            renderTo = cfg.renderTo,
            el = cfg.el || document.createElement( type ),
            classList = el.classList;

        let i, _i;

        if( cls ){
            cls.split( ' ' ).forEach( ( clsItem ) => classList.add( clsItem ) );
        }

        if( style ){
            Object.assign( el.style, style );
        }

        for( i in attr ){
            attr.hasOwnProperty( i ) && el.setAttribute( i, attr[ i ] );
        }

        for( i in prop ){
            prop.hasOwnProperty( i ) && ( el[ i ] = prop[ i ] );
        }

        for( i in on ){
            on.hasOwnProperty( i ) && el.addEventListener( i, on[ i ] );
        }

        for( i = 2, _i = arguments.length; i < _i; i++ ){
            let child = arguments[ i ],
                type = typeof child;
            if( type !== 'object' ){
                child = D.Text( child );
            }
            el.appendChild( child );
        }

        if( renderTo ){
            renderTo.appendChild( el );
        }

        return el;
    };

    const D = PCG.D = {
        svg: null,
        label: null,
        div: null,
        path: null,
        Text: ( val ) => document.createTextNode( val )
    };
    'div,input,label'.split( ',' ).forEach( ( name ) => {
        D[ name ] = ( ...args ) => {
            return domEl.apply( null, [ name, ...args ] )
        };
    } );

    'svg,path,circle'.split( ',' ).forEach( ( name ) => {
        D[ name ] = ( cfg, ...args ) => {
            if( !cfg ){
                cfg = {};
            }
            cfg.el = document.createElementNS( svgNS, name );
            cfg.el.setAttribute( 'xmlns', svgNS );
            return domEl.apply( null, [ null, cfg, ...args ] )
        };
    } );

    D.removeChildren = (el)=>{
        let subEl;
        while((subEl = el.lastChild)){
            el.removeChild(subEl);
        }
    };
})(window['PCG']);(function(PCG){
    const D = PCG.D;
    PCG.updateYAxis = function updateYAxis(minMax, getY) {
        const hash = this.els.YAxisHash;
        const delta = Math.ceil(minMax.max)-Math.floor(minMax.min),
            from = minMax.min;
        const yAxisStorage = this.els.yAxisStorage;
        const yAxisLabelsStorage = this.els.yAxisLabelsStorage;
        let label;

        const count = 7;

        const basic = delta/(count-1),
            scale = Math.pow(10, Math.ceil(Math.log(basic)/Math.log(10)-1)),
            rounded = Math.round(basic/scale)*scale,
            roundedFrom = Math.ceil(from/scale*10)*scale/10;

        const out = [roundedFrom];
        let i, val;

        for(i = 1; i < count; i++){
            out.push(Math.round((roundedFrom+ rounded*i)/scale)*scale)
        }
        const now = +new Date();

        const graphHeight = this.world.graph.height;
        const offset = graphHeight + this.consts.XAxisHeight + this.consts.YAxisLabelPaddingBottom;
        const usedHash = {};
        for(i = 0; i < count; i++){

            const pos = getY(out[i]);
            if(pos<graphHeight*1.01 && pos>0.05){
                val = out[i];
                usedHash[val] = true;
                if(val in hash){
                    if(hash[val].destroy !== false){
                        hash[val].destroy = false;
                        hash[val].line.classList.remove('hide');
                        hash[val].label.classList.remove('hide');
                        hash[val].line.classList.add('visible');
                        hash[val].label.classList.add('visible');
                    }
                    if(hash[val].visible === false){
                        hash[val].visible = true;
                        hash[val].line.classList.add('visible');
                        hash[val].label.classList.add('visible');
                    }
                    hash[val].line.style.top = pos + 'px';
                    hash[val].label.style.bottom = offset - pos  +'px';
                }else{
                    hash[val] = {
                        val: val,
                        visible: false,
                        destroy: false,
                        line: D.div( {
                            cls: 'pcg-y-axis',
                            renderTo: yAxisStorage,
                            style: {
                                top: pos + 'px'
                            }
                        }),
                        label: D.div( {
                            cls: 'pcg-y-axis-label',
                            renderTo: yAxisLabelsStorage,
                            style: {bottom: offset - pos  +'px'}
                        }, PCG.numberFormat(out[ i ]) )
                    };
                    requestAnimationFrame(()=>{})
                }
            }
        }
        for( val in hash ){
            if(!(val in usedHash)){
                let pos = getY(hash[val].val);
                hash[val].line.style.top = pos + 'px';
                hash[val].label.style.bottom = offset - pos  +'px';
                if(hash[val].destroy === false){
                    hash[val].destroy = now + 700;
                    hash[val].line.classList.add('hide');
                    hash[val].label.classList.add('hide');
                    hash[val].line.classList.remove('visible');
                    hash[val].label.classList.remove('visible');
                } else {
                    if(hash[val].destroy<now){
                        yAxisLabelsStorage.removeChild(hash[val].label);
                        yAxisStorage.removeChild(hash[val].line);
                        delete hash[val];
                    }
                }
            }
        }
    };
    PCG.updateXAxis = function updateYAxis() {
        D.removeChildren(this.els.xAxisLabelsStorage);
        const from = this.frame.from,
            to = this.frame.to,
            delta = to - from,
            granule = delta / 6,
            bigBang = this.data[0][0],
            initialTimeOffset = bigBang % granule,
            spinOffTime = (from % granule) - initialTimeOffset;
        let i, val, left, date;
        for(i = 0; i < 7; i++){
            val = from-spinOffTime+granule*i;
            left = this.getX(val);
            date = PCG.dateFormatter(val);
            this.els.xAxisLabelsStorage.appendChild(

                D.div({
                    cls: 'pcg-x-axis-label',
                    style: {
                        left: left+'px'
                    }
                }, date)
            );
        }

        console.log(bigBang)
    };
})(window['PCG']);(function(PCG){
    const D = PCG.D;
    PCG.initCheckboxes = function initCheckboxes(){
        const switchesEl = this.renderTo.switches,
            updateVisible = () => {
                this._visible = list
                    .filter( el => el.show )
                    .map( el => el.i );
                this.update();
                this.updateNav();
            };

        while( switchesEl.childNodes.length ){
            switchesEl.removeChild( switchesEl.lastChild );
        }
        let list = [];
        this.columns.forEach( ( name, i ) => {
            const dataRow = { name: name, show: true, i: i };
            list.push( dataRow );
            D.label( {
                    cls: 'pcg-checkbox-wrapper',
                    renderTo: switchesEl
                },
                // children
                D.input( {
                    cls: 'pcg-checkbox__input',
                    attr: { type: 'checkbox', checked: true },
                    on: {
                        change: ( e ) => {
                            list[ i ].show = e.target.checked;
                            updateVisible();
                            e.preventDefault();
                        }
                    }
                } ),
                D.div( { cls: 'pcg-checkbox__img-wrapper' },
                    D.svg( {
                            cls: 'pcg-checkbox__img',
                            attr: {
                                viewBox: "0 0 30 30",
                            },
                            style: { fill: this.colors[ name ] }
                        },
                        D.path( {

                            attr: {
                                // circle
                                d: 'M15,15m-13,0a13,13,0,1,0,26,0a13,13,0,1,0,-26,0 ' +
                                    // check
                                    'M21.707,11.707l-7.56,7.56c-0.188,0.188-0.442,0.293-0.707,0.293s-0.52-0.105-0.707-0.293' +
                                    'l-3.453-3.453c-0.391-0.391-0.391-1.023,0-1.414  s1.023-0.391,1.414,0l2.746,2.746' +
                                    'l6.853-6.853c0.391-0.391,1.023-0.391,1.414,0S22.098,11.316,21.707,11.707z'
                            }
                        } )
                    )
                ),
                this.names[ name ]
            );

        } );
        this._all = list.map( el => el.i );
        updateVisible();
    };
})(window['PCG']);(function(PCG){
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
})(window['PCG']);(function(PCG){

    const weekDays = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',');
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'Jule',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    const shortMonths = months.map(function(name) {
        return name.substr(0,3);
    });
    shortMonths[8] = 'Sept';

    PCG.dateFormatter = (date)=>{
        if(!(date instanceof Date)){
            date = new Date(date);
        }
        return shortMonths[date.getMonth()] +' '+ date.getDate();
    };
    PCG.weekDateFormatter = (date)=>{
        if(!(date instanceof Date)){
            date = new Date(date);
        }
        return weekDays[date.getDay()]+', '+PCG.dateFormatter(date);
    };
    PCG.numberFormat = function(num) {
        const strNum = num+'';
        let i,
            out = [],
            _i = strNum.length,
            count = (_i%3)||3,
            last = count;

        out.push(strNum.substr(0, count));
        count = 3;
        for(i = last; i < _i; i+=3){
            out.push(strNum.substr(i, count))
        }
        return out.join(' ');
    };

})(window['PCG']);(function(PCG){
    const D = PCG.D;

    PCG.updateGraph = function updateGraph() {
        const limits = {
                from: this._binarySearch(this.frame.from)-1,
                to: this._binarySearch(this.frame.to)+1
            };

        let minMax = this._getMinMax( limits.from, limits.to );
        if(this.camera === null){
            this.camera = {minMax: minMax};
        }else{
            if(Math.abs(this.camera.minMax.max - minMax.max)>0.01) {
                this.update();
            }

            minMax.max = (this.camera.minMax.max*5 + minMax.max)/6;
            minMax.delta = minMax.max - minMax.min;
            this.camera.minMax = minMax;
        }


        const maxDotsCount = this.world.graph.width / this.consts.graphPxPerDot,
            minDate = this.frame.from,
            momentumDelta = ( this.frame.to - minDate ),
            momentumInGranule = momentumDelta / maxDotsCount,
            data = this.data,
            visible = this._getVisible(),

            width = this.world.graph.width,
            height = this.world.graph.height,

            getX = this.getX = ( time ) => (( time - minDate ) / momentumDelta * width)|0,
            getY = this.getY = ( val ) => (height - ( val - minMax.min ) / minMax.delta * height)|0,
            xToTime = this.xToTime = (x)=>x/width*momentumDelta+minDate,
            svgData = visible.map( ( id, i ) => [
                [ getX(data[limits.from][0]), getY( data[ limits.from ][ visible[ i ] + 1 ] ) ]
            ] );

        this.updateYAxis(minMax, getY);


        let lastDate = data[ limits.from ][ 0 ],
            lastSlice = data[limits.from],
            graph,
            i, _i, j, _j, k, _k, slice;

        while( ( graph = this.els.graphs.pop() ) ){
            this.els.graph.removeChild( graph );
        }
        let drawedDots = 0;
        // how can we see a tiny spike on the graph?
        // Usually graphs are used to visualize collected data and to investigate anomalies, so I have to follow rule:
        // - give priority to odd points
        // oddList is redundant. TODO: optimize
        let oddList = [];
        let lastDot = visible.map(()=>-Infinity);
        for( i = limits.from+1, _i = limits.to; i <= _i; i++ ){
            slice = data[ i ];
            oddList.push(slice);
            if( slice[ 0 ] - lastDate >= momentumInGranule){
                _j = oddList.length;
                let tDiff = oddList[_j-1][0] - oddList[0][0]-0.01,
                    centerTime = (oddList[_j-1][0] + oddList[0][0])/2,
                    startTime = oddList[0][0],
                    midValue,
                    dataRow,
                    dt, dv, dt2dv2, maxDt2dv2, maxSlice;
                for( k = 0, _k = visible.length; k < _k; k++ ){
                    midValue = 0;
                    dataRow = visible[ k ] + 1;
                    for( j = 0; j < _j; j++ ){
                        midValue += oddList[j][dataRow];
                    }
                    midValue /= _j;
                    maxDt2dv2 = -1;
                    for( j = 0; j < _j; j++ ){
                        dt = (oddList[j][0]-startTime)/(tDiff);
                        dv = midValue - oddList[j][dataRow];
                        dt2dv2 = Math.abs(dt)*Math.abs(dv);
                        if(dt2dv2>maxDt2dv2){
                            maxDt2dv2 = dt2dv2;
                            maxSlice = oddList[j];
                        }
                    }
                    const x = getX( maxSlice[ 0 ] );
                    drawedDots++;
                    if(lastDot[k]<x){
                        lastDot[ k ] = x;
                        svgData[ k ].push( [ x, getY( maxSlice[ dataRow ] ) ] );
                    }
                }

                lastDate = slice[ 0 ];
                lastSlice = slice;
                i-=(oddList.length/3)|0;
                oddList.length = 0;
            }
        }
        console.log('Dots:', drawedDots);
        const graphStrokeWidth = this.consts.graphStrokeWidth;
        for( j = 0, _j = svgData.length; j < _j; j++ ){
            const graph = D.path({
                attr: {
                    stroke: this.colors[ this.columns[ visible[ j ] ] ],
                    'stroke-width': graphStrokeWidth,
                    'stroke-linejoin': 'round',
                    fill: 'none',
                    d: 'M ' + svgData[ j ].map( ( point ) => point.join( ' ' ) ).join( ' L ' )
                }
            });

            this.els.graphs.push( graph );
            this.els.graph.appendChild( graph );
        }

        this.updateXAxis();

    };
})(window['PCG']);(function(PCG){
    const D = PCG.D;
    PCG.updateNav = function updateNav() {
        // On big input data - this update can take a while
        // So we would check updateNavID is equal to this.updateNavID.
        const updateNavID = this.updateNavID = Math.random().toString(36).substr(2);


        const minMax = this._getMinMax( 0, this.data.length - 1 );

        if( !this.world ){
            this.collectWorldInfo();
        }

        const maxDotsCount = this.world.nav.width / this.consts.previewPxPerDot,
            navigationGraphStrokeWidth = this.consts.navigationGraphStrokeWidth;

        const minDate = this.minDate;
        const momentumDelta = ( this.maxDate - minDate );
        const momentumInGranule = momentumDelta / maxDotsCount;

        const data = this.data;

        let lastDate = data[ 0 ][ 0 ];

        const all = this._all;

        const previewWidth = this.world.nav.width;
        const previewHeight = this.world.nav.height;


        const getX = ( time ) => (( time - minDate ) / momentumDelta * previewWidth)|0;
        const getY = ( val ) => (previewHeight - ( val - minMax.min ) / minMax.delta * previewHeight)|0;


        const svgData = this._all.map( ( id, i ) => [
            [ 0, getY( data[ 0 ][ i + 1 ] ) ]
        ] );

        let i = 1, _i = data.length, sliceSum = this._all.map(()=>0), sliceSumCount = 0;
        const next = ()=>{
            if(updateNavID !== this.updateNavID)
                return;
            for( let _i0 = Math.min(_i, i+10000); i < _i0; i++ ){
                const slice = data[ i ];

                // granular aggregate
                for( let j = 0, _j = all.length; j < _j; j++ ){
                    sliceSum[ j ]+=slice[ j + 1 ];
                }
                sliceSumCount++;

                if( slice[ 0 ] - lastDate >= momentumInGranule ){
                    const x = getX( slice[ 0 ] );
                    for( let j = 0, _j = all.length; j < _j; j++ ){
                        // draw median
                        svgData[ j ].push( [ x, getY( sliceSum[ j ]/sliceSumCount ) ] );
                    }
                    lastDate = slice[ 0 ];
                    sliceSum = this._all.map(()=>0);
                    sliceSumCount = 0;
                }
            }

            if(i < _i){
                setTimeout( next, 1 );
            }else{
                let graph;
                while( ( graph = this.els.navGraphs.pop() ) ){
                    this.els.nav.removeChild( graph );
                }
                for( let j = 0, _j = svgData.length; j < _j; j++ ){
                    graph = D.path({
                        attr: {
                            stroke: this.colors[ this.columns[ all[ j ] ] ],
                            'stroke-width': navigationGraphStrokeWidth,
                            fill: 'none',
                            d: 'M ' + svgData[ j ].map( ( point ) => point.join( ' ' ) ).join( ' L ' )
                        }
                    });

                    this.els.navGraphs.push( graph );
                    this.els.nav.appendChild( graph );
                }
                this.navGraphUpdateVisibility();
            }
        };
        next();
    };
    PCG.updateNavWindow = function updateNavWindow() {

        const resizeOffset = this.consts.resizeOffset;

        const minDate = this.minDate;
        const momentumDelta = ( this.maxDate - minDate );

        if(this.frame.to === null){
            const lastDate = this.data[this.data.length-1][0];
            this.frame = {to: lastDate, from: lastDate+this.frame.from}
        }

        const left = ((this.frame.from-minDate)/momentumDelta*this.world.nav.width)|0,
            width = ((this.frame.to-this.frame.from)/momentumDelta*this.world.nav.width)|0;

        this.els.navWindow.style.left = left+'px';
        this.els.navWindow.style.width = width+'px';
        const ears = this.els.navEars;

        ears[0].style.width = left+'px';
        ears[1].style.width = this.world.nav.width-left-width+'px';

        this.els.navMoveControl.style.width = width-resizeOffset+'px';
        this.els.navMoveControl.style.left = left+resizeOffset/2+'px';

        this.els.navExpandControl.style.width = width+resizeOffset+'px';
        this.els.navExpandControl.style.left = left-resizeOffset/2+'px';
    };
    PCG.navGraphUpdateVisibility = function navGraphUpdateVisibility() {
        const visible = this._getVisible();
        this.els.navGraphs.forEach((el, i)=>{
            el.style.visibility = visible.indexOf(i)===-1? 'hidden':'visible';
        });
    }
})(window['PCG']);(function(PCG){
    const D = PCG.D;


    PCG.prototype = {

        xToTime: () => 0,
        getX: () => 0,
        getY: () => 0,

        consts: {
            XAxisHeight: 40,
            YAxisLabelPaddingBottom: 6,
            previewPxPerDot: 3,
            graphPxPerDot: 3,
            navigationGraphStrokeWidth: 1.5,
            graphStrokeWidth: 3,
            LOG2: Math.log( 2 ),
            resizeOffset: 60
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
        _forceUpdate: true,
        init: function(){
            this.clear();
            this.initDOM();
            this.initListeners();
        },
        initCheckboxes: PCG.initCheckboxes,
        initDOM: PCG.initDOM,
        initListeners: PCG.initListeners,
        clear: function(){
            this.camera = null;
            this.colors = {};
            this.data = [];
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
        load: function( data ){

            this.colors = data.colors;
            const columns = data.columns;
            const myData = this.data;
            this.names = data.names;
            console.log( 'Dots count:', columns[ 0 ].length );

            for( let i = 0, _i = columns.length; i < _i; i++ ){
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
            this.minDate = myData[ 0 ][ 0 ];
            this.maxDate = myData[ myData.length - 1 ][ 0 ];
            this.initCheckboxes();
            this._forceUpdate = true;
            this.update();
        },
        _getMinMax: function( from, to ){
            const data = this.data;
            let min = Infinity,
                max = -Infinity,

                i, j,

                slice, point;

            const visible = this._getVisible();
            const visibleCount = visible.length;

            for( i = from; i <= to; i++ ){
                slice = data[ i ];
                for( j = 0; j < visibleCount; j++ ){

                    point = slice[ visible[ j ] + 1 ];
                    if( point < min ){
                        min = point;
                    }
                    if( point > max ){
                        max = point;
                    }
                }
            }

            min = 0;
            max *= 1.05;
            const delta = ( max - min );
            return { min, max, delta: delta };
        },
        _getVisible: function(){
            return this._visible;
        },
        updateNav: PCG.updateNav,
        navGraphUpdateVisibility: PCG.navGraphUpdateVisibility,
        updateNavWindow: PCG.updateNavWindow,
        _binarySearch: function( time ){
            const data = this.data;
            let min = 0, max = data.length - 1, current;

            let steps = Math.log( data.length ) / this.consts.LOG2;

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
            if( this._forceUpdate ){
                this.updateNav();
            }
            this.updateNavWindow();
            this.updateGraph();
            this._forceUpdate = false;
        },
        _removeTooltipCircles: function() {
            let circle;
            while( ( circle = this.els.highlightCircles.pop() ) ){
                this.els.graph.removeChild( circle );
            }
        },
        showTooltip: function( sliceID ){
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
                        fill: '#fff',
                        stroke: this.colors[ name ],
                        cx: xPos,
                        cy: this.getY( val ),
                        r: 6,
                        'stroke-width': 3
                    },
                    renderTo: this.els.graph
                } ) );

                this.els.tooltipInfo.appendChild(
                    D.div( {
                            cls: 'pcg-tooltip__info-item',
                            style: { color: this.colors[ name ] }
                        },
                        D.div( { cls: 'pcg-tooltip__info-item__count' }, PCG.numberFormat(val) ),
                        this.names[ name ]
                    )
                )
            }
            this.els.tooltipDate.innerText = this.formatters.weekDate( time );
            const tooltipStyle = this.els.tooltip.style;
            const tooltipRect = this.els.tooltip.getClientRects()[0];

            this.els.verticalMouseSlice.style.left = xPos+'px';
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
        collectWorldInfo: function(){
            const navRect = this.renderTo.nav.getClientRects()[ 0 ];
            const graphRect = this.renderTo.graph.getClientRects()[ 0 ];
            this.world = {
                nav: {
                    width: navRect.width,
                    height: navRect.height
                },
                graph: {
                    width: graphRect.width,
                    height: graphRect.height - this.consts.XAxisHeight
                }
            };
        },
        resize: function(){
            requestAnimationFrame( () => {
                this.collectWorldInfo();
                this._forceUpdate = true;
                this.update();
            } );
        }
    };
})(window['PCG']);