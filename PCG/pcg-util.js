(function(PCG){
    if(!('requestAnimationFrame' in window)){
        window.requestAnimationFrame = function(fn) {
            setTimeout(fn,0)
        };
    }
    if(!('abs' in Math)){
        Math.abs = function(a) {return a<0?-a:a;};
    }
    var pow = Math.pow;
    PCG.lerp = function(from, to, percent,n) {
        if(n)
            return from+(to-from)*pow(percent,1/n);
        else
            return from+(to-from)*percent;
    };
    PCG.apply = function(a,b) {
        for(var k in b){
            a[k] = b[k];
        }
        return a;
    };
    PCG.path = {
        join: function(a,b) {
            return (a + '/'+ b).replace(/\/+/g,'/');
        }
    };
    var tmpColor = [];
    PCG.color = function(arr, opacity) {
        tmpColor[0] = arr[0];
        tmpColor[1] = arr[1];
        tmpColor[2] = arr[2];
        tmpColor[3] = opacity === void 0 ? arr[3] : opacity;
        return 'rgba('+tmpColor+')'
    };
    var MinMax = function() {};
    MinMax.prototype = {
        min: +Infinity,
        max: -Infinity,
        delta: 0,
        update: function(o, opacity) {
            if(o.min<this.min){
                if(opacity !== void 0 && isFinite(this.min)){
                    this.min = this.min-(this.min-o.min)*opacity;
                }else{
                    this.min = o.min;
                }
            }
            if(o.max>this.max){
                if(opacity !== void 0 && isFinite(this.max)){
                    this.max = this.max+(o.max-this.max)*opacity;
                }else{
                    this.max = o.max;
                }
            }
            this.updateDelta();
            return this;
        },
        updateDelta: function() {
            this.delta = this.max-this.min;
            return this;
        }
    };
    PCG.MinMax = MinMax;

    var h2d = function(a){return parseInt(a,16)/255;};
    var h2i = function(a) {return parseInt(a,16);};
    var hex2float = PCG.h2f = function(clr, opacityPercent) {
        if(clr.charAt(0)==='#')clr = clr.substr(1);

        if(clr.length === 3){
            return clr.split('').map(h2i).concat(1);
        }else{
            if(opacityPercent)
                clr+=((256*opacityPercent/100)|0).toString(16)

            return [
                h2i(clr.substr(0,2)),
                h2i(clr.substr(2,2)),
                h2i(clr.substr(4,2)),
                clr.length>6?h2d(clr.substr(6,2)):1
            ];
        }
    };
})(window['PCG']);