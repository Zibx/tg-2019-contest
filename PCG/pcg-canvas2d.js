(function(PCG){

    const h2d = a=>parseInt(a,16)/255;
    const hex2float = function(clr) {
        if(clr.length === 3){
            return clr.split('').map(h2d).concat(0);
        }else{
            return [
                h2d(clr.substr(0,2)),
                h2d(clr.substr(2,2)),
                h2d(clr.substr(4,2)),
                1];

        }
    };
    const sqrt = Math.sqrt;
    const Point = function(x,y) {
        if(x instanceof Point){
            y = x.y;
            x = x.x;
        }
        this.x = x;
        this.y = y;
    };
    Point.prototype = {
        normalize: function() {
            return this.div(this.magnitude())
        },
        magnitude: function() {
            return sqrt(this.x*this.x+this.y*this.y);
        },
        clone: function(where) {
            where.x = this.x;
            where.y = this.y;
            return where;
        },
        borrow: function(from) {
            this.x = from.x;
            this.y = from.y;
            return this;
        },
        sub: function(o) {
            this.x-=o.x;
            this.y-=o.y;
            return this;
        },
        add: function(x,y) {
            this.x+=x;
            this.y+=y;
            return this;
        },
        div: function(o) {
            if(typeof o === 'number'){
                this.x /= o;
                this.y /= o;
            }else{
                this.x /= o.x;
                this.y /= o.y;
            }
            return this;
        },
        mul: function(o) {
            if(typeof o === 'number'){
                this.x *= o;
                this.y *= o;
            }else{
                this.x *= o.x;
                this.y *= o.y;
            }
            return this;
        }
    };

    PCG.Canvas2d = function(canvas, cfg) {
        this.c = canvas;
        this.tmp = document.createElement("canvas");
        this.ctx = this.tmp.getContext('2d', {alpha:false});


        this.ctxReal = this.c.getContext('2d', {alpha:false});
        this.consts = cfg.constsDPR;
        this.init();


    };
    PCG.Canvas2d.prototype = {
        scene: null,
        init: function() {
            //this.gl.clearColor(0, 0, 0, 0);
            this.resize();
            this.scene = [];
        },
        clear: function() {
            //this.ctx.fillStyle = 'transparent';
            //this.ctx.fillRect(0,0,this.w,this.h);
            var h =(this.consts.graphicHeight+this.consts.graphicPadding)|0;
            if(!this.imageData){
                //this.ctx.clearRect(0,0,this.w,this.h);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(0,0,this.w,h);
                this.imageData = this.ctx.getImageData(0,0,this.w,h);

            }else{
                this.ctx.putImageData( this.imageData,0,0,0,0,this.w,h);
            }
        },
        /*clear: function() {
            var h =(this.consts.graphicHeight+this.consts.graphicPadding)|0;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0,0,this.w,h);
        },*/
        resize: function() {
            const c = this.c,
                tmp = this.tmp;
            this.w = c.width = tmp.width = c.clientWidth*PCG.DPR;
            this.h = c.height = c.clientHeight*PCG.DPR;
            tmp.height = this.consts.graphicHeight;
            this.imageData = null;
        },
        graph: function(time, arr, from, to, width, color) {

            var ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                ctx.lineTo(time[i], arr[i])
            }
            ctx.stroke();
            //ctx.stroke(new Path2D('M'+arr.slice(from,to).join('L')));
            //new Path2D('M'+arr.join('L')));

        },
        area: function(time, arr, from, to, width, color) {

            var ctx = this.ctx;
            var h = this.consts.graphicHeight;

            ctx.beginPath();
            ctx.moveTo(time[from], h);
            ctx.lineTo(time[from], arr[from]);
            for(var i = from+1; i<=to; i++){
                ctx.lineTo(time[i], arr[i])
            }
            ctx.moveTo(time[i-1], h);

            ctx.fill();

        },
        bar: function(time, arr, from, to, width, color) {
            var ctx = this.ctx;
            ctx.beginPath();
            var h = this.consts.graphicHeight;
            ctx.moveTo(time[from], h);
            ctx.lineTo(time[from], arr[from]);
            for(var i = from+1; i<to; i++){
                var last = i-1;
                var middleX = ((time[last]+time[i])/2)|0;
                ctx.lineTo(
                    middleX,
                    arr[last]
                );
                ctx.lineTo(
                    middleX,
                    arr[i]
                );

//                ctx.lineTo(time[i], arr[i])
            }
            ctx.lineTo(time[i], arr[i-1]);
            ctx.lineTo(time[i], h);
            ctx.fill();
        },
        axisY: function(pos) {
            pos = (pos|0)+0.5;
            this.ctx.strokeStyle = '#182d3b0a';
            this.ctx.lineWidth= 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.consts.paddingLeft, pos);
            this.ctx.lineTo(this.w-this.consts.paddingRight, pos);
            this.ctx.stroke();
        },
        render: function() {
            /*var ctx = this.ctx;
            this.scene.forEach(function(item) {
                ctx.strokeStyle = item.color;
                ctx.lineWidth = item.width;
                ctx.lineJoin = 'round';
                ctx.stroke(item.path);
            });*/
            this.ctxReal.drawImage(this.tmp,0,0)
        }
    };
})(window['PCG']);