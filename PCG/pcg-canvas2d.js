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
        this.ctx = this.c.getContext('2d');
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
            this.scene.length = 0;
        },
        resize: function() {
            const c = this.c;
            this.w = c.width = c.clientWidth;
            this.h = c.height = c.clientHeight;
        },
        polyLine: function(arr, width, color) {
            this.scene.push()


            const indices = [];//0,1,2,3,4];
            const vertices =  [];

            var chartData = arr;

            var halfThick = width/2;
            
            
            var _i = chartData.length,
                p1 = new Point(-1, chartData[0]),
                p2 = new Point(2/_i*(1)-1, chartData[1]),
                p3 = new Point(2/_i*(2)-1, chartData[2]),
                p4,
                n1 = new Point(0,0),
                n2 = new Point(0,0),

                d = new Point(0,0),

                m1 = new Point(0,0),
                m2 = new Point(0,0)
            ;

            --_i;
            var c=-1;
            for( var i = 2; i < _i; i++ ){

                n1.borrow(p3)
                    .sub(p2)
                    .normalize()
                    .sub(
                        n2.borrow(p1)
                            .sub(p2)
                            //.normalize()
                    )
                    .normalize()
                    .mul(halfThick)
                    .clone(d);

                p2.clone(m1)
                    .add(-d.y, d.x);

                p2.clone(m2)
                    .add(d.y, -d.x);

                p4=p1;
                p1=p2;
                p2=p3;
                p3=p4;
                p3.x = 2/(_i+1)*(i+1)-1;
                p3.y = chartData[i+1];

                indices.push(++c,++c);

                vertices.push(
                    m1.x,m1.y,0
                );
                vertices.push(
                    m2.x,m2.y,0
                );
            }
            this.scene.push({v: new Float32Array(vertices), i: new Uint16Array(indices), un: {u_clr: hex2float(color.substr(1))}});

        },
        render: function() {
            var gl = this.gl;


            // Vertex shader source code
            var shaderProgram = this.programm;



            // Use the combined shader program object
            gl.useProgram( shaderProgram );
            var u_clr = gl.getUniformLocation(shaderProgram, "u_clr");

            /*======= Associating shaders to buffer objects =======*/




            var coord = gl.getAttribLocation( shaderProgram, "coordinates" );

            gl.enable( gl.DEPTH_TEST );

            // Clear the color buffer bit
            gl.clear( gl.COLOR_BUFFER_BIT );

            // Set the view port
            gl.viewport( 0, 0, this.w, this.h );
            var vertex_buffer = gl.createBuffer();
            var Index_Buffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, Index_Buffer );

            this.scene.forEach((obj)=>{
                for(var i = 100; i<4400;i+=3){
                    //obj.v[ i ]+=(Math.random()-0.5)/10;
                    //obj.v[ i+1 ]+=(Math.random()-0.5)/10;
                    obj.v[ i+2 ]+=(Math.random()-0.5)/1000;
                }
                gl.bufferData( gl.ARRAY_BUFFER, obj.v, gl.STATIC_DRAW );
                gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, obj.i, gl.STATIC_DRAW );

                // Bind vertex buffer object

                gl.uniform4fv(u_clr, obj.un.u_clr);

  //              gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );

                // Bind index buffer object
//                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, Index_Buffer );
                gl.vertexAttribPointer( coord, 3, gl.FLOAT, false, 0, 0 );

                gl.enableVertexAttribArray( coord );
                gl.drawElements( gl.TRIANGLE_STRIP, obj.i.length, gl.UNSIGNED_SHORT, 0 );

                //TRIANGLE_STRIP  LINE_STRIP

                gl.uniform4fv(u_clr, [1,0.5,0,1]);
                gl.drawElements( gl.LINE_STRIP, obj.i.length, gl.UNSIGNED_SHORT, 0 );

//                gl.bindBuffer( gl.ARRAY_BUFFER, null );
  //              gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

            });
            gl.bindBuffer( gl.ARRAY_BUFFER, null );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
            gl.deleteBuffer(vertex_buffer);
            gl.deleteBuffer(Index_Buffer);
            /*================ Shaders ====================*/


            //gl.uniform2fv(u_clr, [0.3,0.4,0.5,1]);

            // Get the attribute location

            // Point an attribute to the currently bound VBO

            // Enable the attribute

            /*=========Drawing the triangle===========*/

            // Clear the canvas

            // Enable the depth test


            // Draw the triangle//TRIANGLE_STRIP  LINE_STRIP
        },
        predraw: function() {
            this.bindFramebuffer();
            this.setViewport(this.width * this.dpr, this.height * this.dpr);
        }
    };
})(window['PCG']);