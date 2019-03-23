(function(PCG){
    const D = PCG.D;

    PCG.updateGraph = function updateGraph() {
        const limits = {
                from: this._binarySearch(this.frame.from)-1,
                to: this._binarySearch(this.frame.to)+1
            },
            minMax = this._getMinMax( limits.from, limits.to ),

            maxDotsCount = this.world.graph.width / this.consts.graphPxPerDot,
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


    };
})(window['PCG']);