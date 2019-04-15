
// It is poor man's builder, do not look at it!

const fs = require('fs'),
    path = require('path');

const start = ['base.js', 'pcg-dom-util.js'],
    end = ['picograph.js'];

const dir = 'PCG',
    absoluteDir = path.join(__dirname, dir);
const list = fs.readdirSync(absoluteDir).filter((name)=>name.match(/\.js$/)!== null);

start.map(function(name) {
    const i = list.indexOf(name);
    if(i===-1){
        throw new Error('No file `'+name+'`');
    }
    list.splice(i, 1);
});

end.map(function(name) {
    const i = list.indexOf(name);
    if(i===-1){
        throw new Error('No file `'+name+'`');
    }
    list.splice(i, 1);
});

const orderedList = start.slice().concat(list).concat(end);

const source = ';(function(){'+
orderedList.map((name)=>{
    return '// file: '+name+'\n'+fs.readFileSync(path.join(__dirname, dir, name)).toString('utf-8')
            .replace('})(window[\'PCG\']);','')
            .replace(/[^\w]const\s/g,'var ')
            .replace(/[^\w]let\s/g,'var ')
            .replace('const D = PCG.D;','')
            .replace('(function(PCG){','')+'\n\n\n';
}).join('\n') +
'})();';
fs.writeFileSync(path.join(__dirname, 'build', 'build.js'), source);

console.log('done');