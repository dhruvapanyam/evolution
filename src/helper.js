// Helper functions and definitions
// --------------------------------------------

// Custom Vector2 class
// relevant functions defined, personalized
//
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

    // check if a vector is within a circle boundary
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

    // slope angle
    angle = () => {
        return Math.atan2(this.y,this.x)
    }

    angleTo = (b) => {
        return b.subC(this).angle()
    }
}


// generate random vec2 (length and slope angle)
function randVec(l=1,ang=Math.random()*Math.PI*2){
    return new Vec(l*Math.cos(ang),l*Math.sin(ang))
}

// generate random point in circle
// not simply random length and angle --> tends to gravitate towards center
// 
function randomPointInCircle(center,radius){
    let r = radius * Math.sqrt(Math.random())
    let theta = Math.random() * Math.PI * 2
    return new Vec(center.x + r*Math.cos(theta), center.y + r*Math.sin(theta))
}


// ------------------------------- GLOBALS ----------------------------------


// Global settings for world simulation and functionality
var maxTime = 300; // total timesteps per day
var maxFood = 2; // maximum food consumable by a creature


// for dev debug purposes
var TESTING;
TESTING = false;



// Fundamental properties for each trait/feature
// mut_int --> increment amount upon mutation (varies due to the scale of each)
// def_mut --> default mutation probability (tried and tested with appropriate amounts)
//
var features = {
    // default settings
    'speed': { // distance travelled per timestep
        mut_inc: 0.5,
        def_mut: 0.15
    },
    'stamina': { // shelf life per day
        mut_inc: 1,
        def_mut: 0.1
    },
    'vision': { // range of vision to scope for food
        mut_inc: 0.2,
        def_mut: 0.3
    },
    'gps': { // ability to gauge location of spawn
        mut_inc: 0.5,
        def_mut: 0.1
    },
    'greed': { // likelihood of looking for 2nd food
        mut_inc: 0.5,
        def_mut: 0.1
    },
}

// //TESTING
// for(let p in features) features[p].def_mut = 0.2

// reverse indexing for 
const propIndex = (f) => {
    propNames.indexOf(f)
}

// round up decimal point problems (0.99999, etc)
const roundTraitValue = (val) => {
    // let mult = Math.round(val / features[f].mut_inc);
    // let res = mult * features[f].mut_inc
    // console.log(val,res)
    // return res;
    return Math.round(val*100)/100
}


// Helper Utility functions
// ----------------------------------------------------

// empty an object, to reuse
const clearObject = (obj) => {
    for(let key of Object.keys(obj)){
        obj[key] = undefined;
        delete obj[key];
    }
}

// given an 'rgba()' string, edit opacity
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

// last item of array, shorthand
function lastItem(arr){
    return arr[arr.length-1];
}

function caps(str){
    return str[0].toUpperCase() + str.substring(1).toLowerCase()
}

function capsAll(str){
    return str.toUpperCase()
}


// Download data to file
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

