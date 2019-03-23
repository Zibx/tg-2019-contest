(function(PCG){
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