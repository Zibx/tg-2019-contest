(function(PCG){
    const D = PCG.D;
    PCG.updateYAxis = function updateYAxis(minMax, getY) {
        const delta = Math.ceil(minMax.max)-Math.floor(minMax.min),
            from = minMax.min;
        const yAxisStorage = this.els.yAxisStorage;
        const yAxisLabelsStorage = this.els.yAxisLabelsStorage;
        let label;
        while( ( label = this.els.YAxis.pop() ) ){
            yAxisStorage.removeChild( label );
        }
        while( ( label = this.els.YAxisLabels.pop() ) ){
            yAxisLabelsStorage.removeChild( label );
        }
        const count = 7;

        const basic = delta/(count-1),
            scale = Math.pow(10, Math.ceil(Math.log(basic)/Math.log(10)-1)),
            rounded = Math.round(basic/scale)*scale,
            roundedFrom = Math.ceil(from/scale*10)*scale/10;

        const out = [roundedFrom];
        let i;

        for(i = 1; i < count; i++){
            out.push(Math.round((roundedFrom+ rounded*i)/scale)*scale)
        }
        const graphHeight = this.world.graph.height;
        const offset = graphHeight + this.consts.XAxisHeight + this.consts.YAxisLabelPaddingBottom;
        for(i = 0; i < count; i++){
            const pos = getY(out[i]);
            if(pos<graphHeight*1.01 && pos>0.05){
                this.els.YAxis.push(
                    D.div( {
                        cls: 'pcg-y-axis',
                        renderTo: yAxisStorage,
                        style: {
                            top: pos + 'px'
                        }
                    })
                );

                this.els.YAxisLabels.push(
                    D.div( {
                        cls: 'pcg-y-axis-label',
                        renderTo: yAxisLabelsStorage,
                        style: {bottom: offset - pos  +'px'}
                    }, PCG.numberFormat(out[ i ]) )
                );

            }
        }
    };
    PCG.updateXAxis = function updateYAxis(minMax, getY) {

    };
})(window['PCG']);