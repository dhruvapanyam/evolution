class Vec{
    constructor(x,y){
        this.x = x
        this.y = y
    }

    copy = () => {
        return new Vec(this.x,this.y)
    }

    neg = () => {
        return new Vec(-this.x,-this.y)
    }

    add = (b) => {
        this.x += b.x
        this.y += b.y
    }

    sub = (b) => {
        this.add(b.neg())
    }

    addC = (b) => {
        return new Vec(this.x+b.x,this.y+b.y)
    }

    subC = (b) => {
        return this.addC(b.neg())
    }

    distTo = (b) => {
        return Math.sqrt((this.x-b.x)**2 + (this.y-b.y)**2)
    }

    scale = (f) => {
        this.x*=f
        this.y*=f
    }

    magnitude = () => {
        return Math.sqrt(this.x**2 + this.y**2)
    }

    bordered = (dim) => {
        // dim = {center:?, rad:?}
        if(this.distTo(dim.center) < dim.radius) return this.copy();

        let ang = dim.center.angleTo(this);
        let temp = new Vec(dim.radius * Math.cos(ang), dim.radius * Math.sin(ang)).addC(dim.center)
        // console.log('border! dist:',temp.distTo(dim.center))
        return temp

    }
    

    equals = (b) => {
        if(b == undefined) return false;
        return (this.x==b.x && this.y==b.y)
    }

    angle = () => {
        return Math.atan2(this.y,this.x)
    }

    angleTo = (b) => {
        return b.subC(this).angle()
    }
}


function randVec(l=1,ang=Math.random()*Math.PI*2){
    return new Vec(l*Math.cos(ang),l*Math.sin(ang))
}


// ------------------------------- GLOBALS



var maxTime = 200;
var maxFood = 2;

var TESTING;
TESTING = true;
TESTING = false;




var features = {
    // default settings
    'speed': {
        mut_inc: 0.5,
        def_mut: 0.15
    },
    'stamina': {
        mut_inc: 1,
        def_mut: 0.1
    },
    'vision': {
        mut_inc: 0.2,
        def_mut: 0.3
    },
    'gps': {
        mut_inc: 0.5,
        def_mut: 0.1
    },
    'greed': {
        mut_inc: 0.5,
        def_mut: 0.1
    },
}

//TESTING
for(let p in features) features[p].def_mut = 0.2

const propIndex = (f) => {
    propNames.indexOf(f)
}

const roundTraitValue = (val) => {
    // let mult = Math.round(val / features[f].mut_inc);
    // let res = mult * features[f].mut_inc
    // console.log(val,res)
    // return res;
    return Math.round(val*100)/100
}


const clearObject = (obj) => {
    for(let key of Object.keys(obj)){
        obj[key] = undefined;
        delete obj[key];
    }
}



function changeOpacity(col,o){
    let s = col.split(',')
    if(s.length == 3){
        // rgb()
        return 'rgba('+s[0].split('(')[1]+','+s[1]+','+s[2].slice(0,s[2].length-1)+','+String(o)+')'
    }
    else{
        // rgba()
        return s[0]+','+s[1]+','+s[2]+','+String(o)+')'
    }
}

function lastItem(arr){
    return arr[arr.length-1];
}

function caps(str){
    return str[0].toUpperCase() + str.substring(1).toLowerCase()
}

function capsAll(str){
    return str.toUpperCase()
}


function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function randomPointInCircle(center,radius){
    let r = radius * Math.sqrt(Math.random())
    let theta = Math.random() * Math.PI * 2
    return new Vec(center.x + r*Math.cos(theta), center.y + r*Math.sin(theta))
}
