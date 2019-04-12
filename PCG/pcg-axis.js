(function(PCG){
    const D = PCG.D;
    const XlabelSize = 45;
    PCG.updateYAxis = function updateYAxis(minMax, getY) {
        return
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

                    this.ctx.axisY(pos);

                    /*line.style.top = pos + 'px';
                    label.style.bottom = offset - pos  +'px';*/
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
                    this.ctx.axisY(pos);

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
    let leftSetter = (left, width)=>{
        return left/width*(width-XlabelSize)+XlabelSize/2;
    };
    PCG.updateXAxis = function updateYAxis() {
        return
        //D.removeChildren(this.els.xAxisLabelsStorage);
        const from = this.frame.from,
            to = this.frame.to,
            delta = to - from,
            granule = delta / 6,
            bigBang = this.camera.offset,
            initialTimeOffset = bigBang % granule,
            spinOffTime = (from % granule) - initialTimeOffset;


        let i, val, left, date, item, _i;
        const hash = this.els.XAxisHash,
            usedHash = {},
            now = +new Date();
        let width = this.world.graph.width;
        const step = this.camera.AxisXGranule;
        for(i = from; i < to+step; i+=step){
        //    val = from-spinOffTime+granule*i;
            val = (this.camera.offset % this.camera.AxisXGranule) - (this.frame.from % this.camera.AxisXGranule)+i;
            left = this.getX(val);
            /*if(left<10){
                left = 10;
            }
            if(left>this.world.graph.width-20){
                if(i<to)
                    continue;
                left = this.world.graph.width - 20
            }*/
            //val = this.xToTime(left)
            date = PCG.dateFormatter(val);

            usedHash[val] = true;

            if(val in hash){
                item = hash[val];
                if(item.destroy !== false){
                    item.destroy = false;
                    item.label.classList.remove('hide');
                    item.label.classList.add('visible');
                }
                if(item.visible === false){
                    item.visible = true;
                    item.label.classList.add('visible');
                }
                item.label.style.left = leftSetter(left,width) +'px';
            }else{
                if(this.XAxisLabelCount>40){
                    continue;
                }
                item = hash[ val ] = {
                    val: val,
                    left: left,
                    visible: false,
                    destroy: false,
                    label: D.div( {
                        cls: 'pcg-x-axis-label',
                        style: {
                            left: leftSetter(left,width) + 'px'
                        },
                        renderTo: this.els.xAxisLabelsStorage
                    }, date )
                };
                this.XAxisLabelCount++;
            }

        }
        const xAxisLabelsStorage = this.els.xAxisLabelsStorage;

        for(val in hash){

            if(!(val in usedHash)){
                item = hash[val];
                let left = this.getX(item.val);
                item.label.style.left = leftSetter(left,width)+'px';
                if(item.destroy === false){
                    item.destroy = now + 400;
                    item.label.classList.add('hide');
                    item.label.classList.remove('visible');
                } else {
                    if(item.destroy<now){
                        xAxisLabelsStorage.removeChild(item.label);
                        delete hash[val];
                        this.XAxisLabelCount--;
                    }else{
                        this.update();
                    }
                }
            }
        }
        //console.log(bigBang)
    };
})(window['PCG']);