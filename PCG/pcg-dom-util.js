(function(PCG){
    const svgNS = 'http://www.w3.org/2000/svg';

// I am too lazy to do DOM manually / anyway this solution is optimal enough

// ~jsx h function
    const domEl = function( type, cfg = {} ){
        const cls = cfg.cls,
            style = cfg.style,
            attr = cfg.attr,
            prop = cfg.prop,
            on = cfg.on,
            renderTo = cfg.renderTo,
            el = cfg.el || document.createElement( type ),
            classList = el.classList;

        let i, _i;

        if( cls ){
            cls.split( ' ' ).forEach( ( clsItem ) => classList.add( clsItem ) );
        }

        if( style ){
            Object.assign( el.style, style );
        }

        for( i in attr ){
            attr.hasOwnProperty( i ) && el.setAttribute( i, attr[ i ] );
        }

        for( i in prop ){
            prop.hasOwnProperty( i ) && ( el[ i ] = prop[ i ] );
        }

        for( i in on ){
            on.hasOwnProperty( i ) && el.addEventListener( i, on[ i ] );
        }

        for( i = 2, _i = arguments.length; i < _i; i++ ){
            let child = arguments[ i ],
                type = typeof child;
            if( type !== 'object' ){
                child = D.Text( child );
            }
            el.appendChild( child );
        }

        if( renderTo ){
            renderTo.appendChild( el );
        }

        return el;
    };

    const D = PCG.D = {
        svg: null,
        label: null,
        div: null,
        path: null,
        canvas: null,
        Text: ( val ) => document.createTextNode( val )
    };
    'div,input,label,canvas'.split( ',' ).forEach( ( name ) => {
        D[ name ] = ( ...args ) => {
            return domEl.apply( null, [ name, ...args ] )
        };
    } );

    'svg,path,circle'.split( ',' ).forEach( ( name ) => {
        D[ name ] = ( cfg, ...args ) => {
            if( !cfg ){
                cfg = {};
            }
            cfg.el = document.createElementNS( svgNS, name );
            cfg.el.setAttribute( 'xmlns', svgNS );
            return domEl.apply( null, [ null, cfg, ...args ] )
        };
    } );

    D.removeChildren = (el)=>{
        let subEl;
        while((subEl = el.lastChild)){
            el.removeChild(subEl);
        }
    };
})(window['PCG']);