(function(PCG){
    const D = PCG.D;
    PCG.updateNav = function updateNav() {
        // On big input data - this update can take a while
        // So we would check updateNavID is equal to this.updateNavID.
        const updateNavID = this.updateNavID = Math.random().toString(36).substr(2);


        //const minMax = this._getMinMax( 0, this.data.length - 1 );

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





        let i = 1, _i = data.length, sliceSum = this._all.map(()=>0), sliceSumCount = 0;
        let minMaxes = [];
        for( let j = 0, _j = all.length; j < _j; j++ ){
            minMaxes[j] = {min:Infinity, max: -Infinity};
        }

        const svgData = this._all.map( ( id, i ) => [
            [ 0, data[ 0 ][ i + 1 ] ]
        ] );
        const next = ()=>{
            if(updateNavID !== this.updateNavID)
                return;
            for( let _i0 = Math.min(_i, i+10000); i < _i0; i++ ){
                const slice = data[ i ];

                // granular aggregate
                for( let j = 0, _j = all.length; j < _j; j++ ){
                    let mm = minMaxes[ j ],
                        valJ = slice[ j + 1 ];
                    if(valJ>mm.max){
                        mm.max = valJ;
                    }
                    if(valJ<mm.min){
                        mm.min = valJ;
                    }
                    sliceSum[ j ]+=valJ;
                }
                sliceSumCount++;

                if( slice[ 0 ] - lastDate >= momentumInGranule ){
                    const x = getX( slice[ 0 ] );
                    for( let j = 0, _j = all.length; j < _j; j++ ){

                        // draw median
                        svgData[ j ].push( [ x,  sliceSum[ j ]/sliceSumCount ] );
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
                //D.removeChildren(this.els.nav);
                while( ( graph = this.els.navGraphs.pop() ) ){
                    this.els.nav.removeChild( graph );
                }
                this.minMaxes = minMaxes;
                for( let j = 0, _j = svgData.length; j < _j; j++ ){
                    let minMax = minMaxes[j];
                    const getY = ( val ) => (previewHeight - ( val - 0 ) / minMax.max * previewHeight)|0;
                    graph = D.path({
                        renderTo: this.els.nav,
                        attr: {
                            stroke: this.colors[ this.columns[ all[ j ] ] ],
                            'stroke-width': navigationGraphStrokeWidth,
                            fill: 'none',
                            d: 'M ' + svgData[ j ].map( ( point ) => point[0]+' '+getY(point[1]) ).join( ' L ' )
                        }
                    });

                    this.els.navGraphs.push( graph );
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
        const visibleMinMax = {min: Infinity, max: -Infinity},
            minMaxes = this.minMaxes;
        this.els.navGraphs.forEach((el, i)=>{
            if(visible.indexOf(i)===-1){
                el.classList.add( 'hidden' );
            }else{
                el.classList.remove( 'hidden' );
                if(minMaxes[i].min<visibleMinMax.min){
                    visibleMinMax.min = minMaxes[i].min;
                }
                if(minMaxes[i].max>visibleMinMax.max){
                    visibleMinMax.max = minMaxes[i].max;
                }
            }
        });
        visibleMinMax.min = 0;
        visibleMinMax.delta = visibleMinMax.max;
        this.els.navGraphs.forEach((el, i)=>{
            if(visible.indexOf(i)!==-1){
                let percent = minMaxes[i].max/(visibleMinMax.max*1.1);
                el.style.transform = 'translateY('+ (this.world.nav.height*(1-percent))+'px) scaleY('+(percent)+')'
            }
        });
    }
})(window['PCG']);