(function(PCG){
    const D = PCG.D;
    const XlabelSize = 45;
    PCG.updateYAxis = function updateYAxis(minMax, dt){
        /*var axeData = this.yAxis;

        var minMax1 = this.camera.minMax1;
        var cc = 0;
        if(minMax1.delta===0)
            console.log(minMax1)
        for( var i = minMax1.min; i < minMax1.max; i += minMax1.delta / 6+0.1 ){
            cc++
            if(cc>=1000)
                return;
            this.ctx.axisY( this.getY1( i ) )
        }*/
return
        var ctx = this.ctx.activate('graph');


        var needUpdate = false;

        var hash = this.els.YAxisHash;

        var minMax1 = this.camera.minMax1,
            delta1 = minMax1.delta,
            from1 = minMax1.min;


        var count = 7,
            getY = this.getY1;


        let item, line, label;



        var basic = delta1/(count-1),
            scale = Math.pow(10, Math.ceil(Math.log(basic)/Math.log(10)-1)),
            rounded = Math.round(basic/scale)*scale,
            roundedFrom = Math.ceil(from1/scale*10)*scale/10;


        if(this.y_scaled){
            var visible = this._getVisible();
            var minMax2 = this.camera.minMax2;
        }

        var out = [roundedFrom];
        let i, val;

        for(i = 1; i < count; i++){
            out.push(Math.round((roundedFrom+ rounded*i)/scale)*scale)
        }

        if(this.percentage){

            out = [0,25,50,75,100];
            getY = this.getPercentY
        }
        const now = +new Date();

        const graphHeight = this.world.graph.height;
        const offset = graphHeight + this.consts.XAxisHeight + this.consts.YAxisLabelPaddingBottom;
        const usedHash = {};

        for(i = 0; i < count; i++){

            const pos = getY.call(this, out[i]);

            if(pos<graphHeight*1.01 && pos>0.05){
                val = out[i];
                var readable = PCG.numberFormat(val);
                usedHash[readable] = true;
                if(readable in hash){
                    item = hash[readable];
                    item.visible = true;
                    item.top = pos;
                }else{
                    hash[readable] = {
                        val: val,
                        visible: true,
                        opacity: 1,
                        top: pos,
                        label: readable
                    };
                    //this.ctx.axisY(pos);

                }
            }
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.lineWidth = this.constsDPR.axisWidth;
        ctx.font = this.constsDPR.labelFont+'px HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';

        for( val in hash ){
            item = hash[val];
            if(!(val in usedHash)){
                needUpdate = true;
                label = item.label;

                let pos = this.getY1(item.val);
                item.visible = false;
                item.top = pos;
                item.opacity = Math.max(0,item.opacity - dt*1000/this.animation.labelHide);
                if(item.opacity <= 0){
                    delete hash[val];
                    continue;
                }
            }else{
                if(item.opacity<1){
                    needUpdate = true;
                    item.opacity = Math.min(1,item.opacity + dt * 1000 / this.animation.labelShow);
                }
            }
            if(this.y_scaled){

                var label2 = PCG.numberFormat(Math.round((item.val-minMax1.min)/minMax1.delta*minMax2.delta+minMax2.min))
                this.ctx.axisYscaled(
                    item.label,
                    label2,
                    item.top,
                    this.getColor( this.columns[ 0 ], this._all[0].opacity*item.opacity ),
                    this.getColor( this.columns[ 1 ], this._all[1].opacity*item.opacity ),
                    PCG.color( this.scheme.axis, this.scheme.axis[ 3 ] * item.opacity )
                );
            }else{
                this.ctx.axisY( item.label, item.top, PCG.color( this.scheme.yLabel, this.scheme.yLabel[ 3 ] * item.opacity ),
                    PCG.color( this.scheme.axis, this.scheme.axis[ 3 ] * item.opacity )
                );
            }


        }
        if(needUpdate)
            this.update();
    };
    PCG.updateXAxis = function updateXAxis(dt, from, to) {
        var ctx = this.ctx.activate('x');
        this.ctx.clear();
        var needUpdate = false;

        var delta = to - from,
            granule = delta / 6,
            bigBang = this.camera.offset,
            initialTimeOffset = bigBang % granule;

        //from -= granule;

        let i, val, left, date, item, _i;
        const hash = this.els.XAxisHash,
            usedHash = {};
        let width = this.world.graph.width;
        const step = this.camera.AxisXGranule;
        for(i = from; i < to+step; i+=step){
            val = (this.camera.offset % this.camera.AxisXGranule) - (this.frame.from % this.camera.AxisXGranule)+i;

            left = this.getX(val);
            date = PCG.dateFormatter(val);

            usedHash[date] = true;

            if(date in hash){

                item = hash[date];
                item.visible = true;
                item.left = left;//label.style.left = leftSetter(left,width) +'px';
            }else{
                if(this.XAxisLabelCount>70){
                    continue;
                }
                item = hash[ date ] = {
                    val: val,
                    left: left,
                    visible: true,
                    label: date,
                    opacity: 1
                };
                this.XAxisLabelCount++;
            }
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font = this.constsDPR.labelFont+'px HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';

        for(val in hash){
            item = hash[val];
            if(!(val in usedHash)){
                needUpdate = true;
                let left = this.getX(item.val);
                item.visible = false;
                item.left = left;
                item.opacity = Math.max(0,item.opacity - dt*1000/this.animation.labelHide);
                if(item.opacity <= 0){
                    delete hash[val];
                    this.XAxisLabelCount--;
                    continue;
                }
            }else{
                if(item.opacity<1){
                    needUpdate = true;
                    item.opacity = Math.min(1,item.opacity + dt * 1000 / this.animation.labelShow);
                }
            }

            ctx.fillStyle = PCG.color(this.scheme.xLabel, this.scheme.xLabel[3]*item.opacity);
            ctx.fillText(item.label, item.left, 6)
        }
        if(needUpdate)
            this.update();
        //console.log(bigBang)
    };
})(window['PCG']);