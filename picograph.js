const previewPxPerDot = 4;
const graphPxPerDot = 4;
const navigationGraphStrokeWidth = 2;
const graphStrokeWidth = 6;
const LOG2 = Math.log(2);
const resizeOffset = 20;
const svgNS = 'http://www.w3.org/2000/svg';

// I am too lazy to do DOM manually / anyway this solution is optimal enough

const domEl = function(type, cfg = {}) {
    const cls = cfg.cls,
        style = cfg.style,
        attr = cfg.attr,
        prop = cfg.prop,
        on = cfg.on,
        renderTo = cfg.renderTo,
        el = cfg.el || document.createElement(type);

    let i, _i;

    if(cls){
        el.className = cls;
    }

    if(style){
        Object.assign(el.style, style);
    }

    for(i in attr){
        attr.hasOwnProperty(i) && el.setAttribute(i, attr[i]);
    }

    for(i in prop){
        prop.hasOwnProperty(i) && (el[i] = prop[i]);
    }

    for(i in on){
        on.hasOwnProperty(i) && el.addEventListener(i, on[i]);
    }

    for(i = 2, _i = arguments.length; i < _i; i++){
        let child = arguments[i],
            type = typeof child;
        if(type !== 'object'){
            child = D.Text(child);
        }
        el.appendChild(child);
    }

    if(renderTo){
        renderTo.appendChild( el );
    }

    return el;
};

const D = {
    svg: null,
    Text: (val)=>document.createTextNode(val)
};
'div,input,label'.split(',').forEach((name)=>{
    D[name] = (...args)=>{
        return domEl.apply(null, [name, ...args])
    };
});

'svg,path'.split(',').forEach((name)=>{
    D[name] = (cfg, ...args)=>{
        if(!cfg){
            cfg = {};
        }
        cfg.el = document.createElementNS(svgNS,name);
        cfg.el.setAttribute('xmlns', svgNS);
        return domEl.apply(null, [null, cfg, ...args])
    };
});

const PG = function(cfg) {
    Object.assign(this, cfg);
    this._update = this._update.bind(this);
    this.resize = this.resize.bind(this);
    this.init();
};

PG.prototype = {
    els: null,
    minDate: null,
    maxDate: null,
    world: null,
    _visible: null,
    _forceUpdate: true,
    init: function() {
        this.clear();
        this.initDOM();
        this.initListeners();
    },
    initCheckboxes: function() {
        const switchesEl = this.renderTo.switches,
            updateVisible = ()=> {
                this._visible = list
                    .filter( el => el.show )
                    .map( el => el.i );
                this.update();
            };

        while(switchesEl.childNodes.length){
            switchesEl.removeChild(switchesEl.lastChild);
        }
        let list = [];
        this.columns.forEach((name, i)=>{
            list.push({name: name, show: true, i: i});

            domEl('label', {
                    cls: 'pcg-checkbox-wrapper',
                    renderTo: switchesEl
                },

                // children
                D.input({
                    attr: {type: 'checkbox', checked: true},
                    on: {
                        change: (e)=>{
                            list[i].show = e.target.checked;
                            updateVisible();
                            e.preventDefault();
                        }
                    }
                }),
                name
            );

        });
        updateVisible();

    },
    initDOM: function() {
        const around = this.renderTo;

        this.els = {
            navWindow: D.div({cls: 'navWindow', renderTo: around.nav}),
            nav: D.svg({renderTo: around.nav}),
            navEars: [
                D.div({
                    renderTo: around.nav,
                    cls: 'navEar',
                    style: {top: 0,
                    bottom: 0,
                    left: 0}
                }),
                D.div({
                    renderTo: around.nav,
                    cls: 'navEar',
                    style: {top: 0,
                    bottom: 0,
                    right: 0}
                })
            ],
            navExpandControl: D.div({cls: 'pcg pcg-nav__expand-control', renderTo: around.nav}),
            navMoveControl: D.div({cls: 'pcg pcg-nav__move-control', renderTo: around.nav}),

            graph: D.svg({renderTo: around.graph}),

            navGraphs: [],
            graphs: []
        };

        this.collectWorldInfo();
    },
    initListeners: function() {

        this.els.navExpandControl.addEventListener('mousedown', (e)=>{
            let start = [e.clientX, e.clientY];
            const world = this.world;
            const frame = this.frame;
            const frameWidth = frame.to - frame.from,
                  startFrame = frame.from;

            let toLeft = true;
            if(e.offsetX>this.els.navExpandControl.clientWidth/2){
                toLeft = false;
            }
            const pxToTime = (px)=>px/world.nav.width*(this.maxDate-this.minDate);
            const move = (e)=>{
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
            const up = ()=>{
                window.removeEventListener('mouseup', up);
                window.removeEventListener('mousemove', move);
            };
            window.addEventListener('mouseup', up);
            window.addEventListener('mousemove', move);
            e.preventDefault();
            e.stopPropagation();
        });

        this.els.navMoveControl.addEventListener('mousedown', (e)=>{
            let start = [e.clientX, e.clientY];

            const world = this.world;
            const frame = this.frame;
            const frameWidth = frame.to - frame.from,
                startFrame = frame.from;

            const move = (e)=>{
                let point = [e.clientX, e.clientY];

                const delta = startFrame+(point[0]-start[0])/world.nav.width*(this.maxDate-this.minDate);
                frame.from = delta;
                if(frame.from< this.minDate){
                    frame.from = this.minDate;
                }
                frame.to = frame.from + frameWidth;
                if(frame.to> this.maxDate){
                    frame.to = this.maxDate;
                    frame.from = frame.to - frameWidth;
                }
                this.update();

            };
            const up = ()=>{
                window.removeEventListener('mouseup', up);
                window.removeEventListener('mousemove', move);
            };
            window.addEventListener('mouseup', up);
            window.addEventListener('mousemove', move);
            e.preventDefault();
            e.stopPropagation();
        });


    },
    clear: function() {
        this.colors = {};
        this.data = [];
        this.columns = [];
        for(let i in this.els){
            if( this.els.hasOwnProperty( i ) ){
                const el = this.els[ i ];
                el.parentNode.removeChild( el )
            }
        }
        this.els = null;
        this.world = null;
        this._visible = [];
    },
    load: function(data) {

        this.colors = data.colors;
        const columns = data.columns;
        const myData = this.data;

        console.log('Dots count:', columns[0].length);

        for (let i = 0, _i = columns.length; i < _i; i++) {
            const column = columns[i];
            if(i > 0) {
                this.columns.push( column[0] );
            }
            if(i===0) {
                for (let j = 1, _j = column.length; j < _j; j++) {
                    myData.push([ column[j] ]);
                }
            }else{
                for (let j = 1, _j = column.length; j < _j; j++) {
                    myData[j-1].push( column[j] );
                }
            }
        }
        this.minDate = myData[0][0];
        this.maxDate = myData[myData.length-1][0];
        this.initCheckboxes();
        this._forceUpdate = true;
        this.update();
    },
    _getMinMax: function(from, to){
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

                point = slice[ visible[j]+1 ];
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
        const delta = (max-min);
        return {min, max, delta: delta};
    },
    _getVisible: function() {
        return this._visible;
    },
    updateNav: function() {
        const minMax = this._getMinMax( 0, this.data.length - 1 );

        if( !this.world ){
            this.collectWorldInfo();
        }

        const maxDotsCount = this.world.nav.width / previewPxPerDot;
        const minDate = this.minDate;
        const momentumDelta = ( this.maxDate - minDate );
        const momentumInGranule = momentumDelta / maxDotsCount;

        const data = this.data;

        let lastDate = data[ 0 ][ 0 ];

        const visible = this._getVisible();

        const previewWidth = this.world.nav.width;
        const previewHeight = this.world.nav.height;

        let graph;
        while( ( graph = this.els.navGraphs.pop() ) ){
            this.els.nav.removeChild( graph );
        }

        const getX = ( time ) => (( time - minDate ) / momentumDelta * previewWidth)|0;
        const getY = ( val ) => (previewHeight - ( val - minMax.min ) / minMax.delta * previewHeight)|0;

        const svgData = visible.map( ( id, i ) => [
            [ 0, getY( data[ 0 ][ visible[ i ] + 1 ] ) ]
        ] );


        for( let i = 1, _i = data.length; i < _i; i++ ){
            const slice = data[ i ];
            // TODO analyze bending
            if( slice[ 0 ] - lastDate >= momentumInGranule ){
                const x = getX( slice[ 0 ] );
                for( let j = 0, _j = visible.length; j < _j; j++ ){
                    svgData[ j ].push( [ x, getY( slice[ visible[ j ] + 1 ] ) ] );
                }
                lastDate = slice[ 0 ];
            }
        }



        for( let j = 0, _j = svgData.length; j < _j; j++ ){
            graph = document.createElementNS( svgNS, 'path' );
            graph.setAttribute( 'stroke', this.colors[ this.columns[ visible[ j ] ] ] );
            graph.setAttribute( 'stroke-width', navigationGraphStrokeWidth+'' );
            graph.setAttribute( 'fill', 'none' );

            graph.setAttribute(
                'd',
                'M ' + svgData[ j ].map( ( point ) => point.join( ' ' ) ).join( ' L ' )
            );

            this.els.navGraphs.push( graph );
            this.els.nav.appendChild( graph );
        }
    },
    updateNavWindow: function() {
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

        this.els.navMoveControl.style.width = width-resizeOffset*2+'px';
        this.els.navMoveControl.style.left = left+resizeOffset+'px';

        this.els.navExpandControl.style.width = width+resizeOffset+'px';
        this.els.navExpandControl.style.left = left-resizeOffset/2+'px';

    },
    _binarySearch: function(time) {
        const data = this.data;
        let min = 0, max = data.length - 1, current;

        let steps = Math.log(data.length)/LOG2;

        for(let i = 0; i < steps; i++){
            current = ( min + ( max - min ) / 2 ) | 0;
            if( data[ current ][ 0 ] < time ){
                min = current;
            }else if( data[ current ][ 0 ] > time ){
                max = current;
            }
        }
        if(current < 1){
            current = 1;
        }
        return current;
    },
    updateGraph: function() {
        const limits = {
                from: this._binarySearch(this.frame.from)-1,
                to: this._binarySearch(this.frame.to)+1
            },
            minMax = this._getMinMax( limits.from, limits.to ),

            maxDotsCount = this.world.graph.width / graphPxPerDot,
            minDate = this.frame.from,
            momentumDelta = ( this.frame.to - minDate ),
            momentumInGranule = momentumDelta / maxDotsCount,
            data = this.data,
            visible = this._getVisible(),

            width = this.world.graph.width,
            height = this.world.graph.height,

            getX = ( time ) => (( time - minDate ) / momentumDelta * width)|0,
            getY = ( val ) => (height - ( val - minMax.min ) / minMax.delta * height)|0,

            svgData = visible.map( ( id, i ) => [
                [ getX(data[limits.from][0]), getY( data[ limits.from ][ visible[ i ] + 1 ] ) ]
            ] );

        let lastDate = data[ limits.from ][ 0 ],
            lastSlice = data[limits.from],
            graph,
            i, _i, j, _j, slice;

        while( ( graph = this.els.graphs.pop() ) ){
            this.els.graph.removeChild( graph );
        }
        let shouldDraw = false;
        let drawedDots = 0;
        // how can we see a tiny spike on the graph?
        // Usually graphs are used to visualize collected data and to investigate anomalies, so I have to follow rule:
        // - give priority to odd points
        let oddList = []
        for( i = limits.from+1, _i = limits.to; i <= _i; i++ ){
            slice = data[ i ];
            if(!shouldDraw){
                if( slice[ 0 ] - lastDate >= momentumInGranule){
                    shouldDraw = true;

                }else{
                    oddList.push(slice);
                    /*
                    for( j = 0, _j = visible.length; j < _j; j++ ){
                        if( Math.abs( slice[ visible[ j ] + 1 ] - lastSlice[ visible[ j ] + 1 ] ) > minMax.delta / Math.PI ){
                            shouldDraw = true;
                            break;
                        }
                    }*/
                }

            }
            if(shouldDraw){
                const x = getX( slice[ 0 ] );
                drawedDots++;
                for( j = 0, _j = visible.length; j < _j; j++ ){
                    svgData[ j ].push( [ x, getY( slice[ visible[ j ] + 1 ] ) ] );

                }
                lastDate = slice[ 0 ];
                lastSlice = slice;
                shouldDraw = false;
            }

        }
        console.log('Dots:', drawedDots);

        for( j = 0, _j = svgData.length; j < _j; j++ ){
            graph = document.createElementNS( svgNS, 'path' );
            graph.setAttribute( 'stroke', this.colors[ this.columns[ visible[ j ] ] ] );
            graph.setAttribute( 'stroke-width', graphStrokeWidth+'' );
            graph.setAttribute( 'stroke-linejoin', 'round' );
            graph.setAttribute( 'fill', 'none' );

            graph.setAttribute(
                'd',
                'M ' + svgData[ j ].map( ( point ) => point.join( ' ' ) ).join( ' L ' )
            );

            this.els.graphs.push( graph );
            this.els.graph.appendChild( graph );
        }


    },
    update: function(){
        if(!this.shouldUpdate){
            this.shouldUpdate = true;
            requestAnimationFrame(this._update);
        }
    },
    _update: function() {
        this.shouldUpdate = false;
        if(this._forceUpdate){
            this.updateNav();
        }
        this.updateNavWindow();
        this.updateGraph();
        this._forceUpdate = false;
    },
    collectWorldInfo: function(){
        const navRect = this.renderTo.nav.getClientRects()[0];
        const graphRect = this.renderTo.graph.getClientRects()[0];
        this.world = {
            nav: {
                width: navRect.width,
                height: navRect.height
            },
            graph: {
                width: graphRect.width,
                height: graphRect.height
            }
        };
    },
    resize: function() {
        requestAnimationFrame(()=>{
            this.collectWorldInfo();
            this._forceUpdate = true;
            this.update();
        });
    }
};