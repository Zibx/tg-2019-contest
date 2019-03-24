(function(PCG){
    const D = PCG.D;
    PCG.updateYAxis = function updateYAxis(minMax, getY) {
        const hash = this.els.YAxisHash;
        const delta = Math.ceil(minMax.max)-Math.floor(minMax.min),
            from = minMax.min;
        const yAxisStorage = this.els.yAxisStorage;
        const yAxisLabelsStorage = this.els.yAxisLabelsStorage;
        let item, line, label;

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
                    item = hash[val];
                    line = item.line;
                    label = item.label;
                    if(item.destroy !== false){
                        item.destroy = false;
                        line.classList.remove('hide');
                        label.classList.remove('hide');
                        line.classList.add('visible');
                        label.classList.add('visible');
                    }
                    if(item.visible === false){
                        item.visible = true;
                        line.classList.add('visible');
                        label.classList.add('visible');
                    }
                    line.style.top = pos + 'px';
                    label.style.bottom = offset - pos  +'px';
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
                item = hash[val];
                line = item.line;
                label = item.label;

                let pos = getY(item.val);
                line.style.top = pos + 'px';
                label.style.bottom = offset - pos  +'px';
                if(item.destroy === false){
                    item.destroy = now + 700;
                    line.classList.add('hide');
                    label.classList.add('hide');
                    line.classList.remove('visible');
                    label.classList.remove('visible');
                } else {
                    if(item.destroy<now){
                        yAxisLabelsStorage.removeChild(item.label);
                        yAxisStorage.removeChild(item.line);
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
            bigBang = this.camera.offset,
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
})(window['PCG']);