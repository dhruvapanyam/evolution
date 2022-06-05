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



var maxSpeed = 10;
var simMetadata = {
    days: 50,
    TTLratio: 300,
    speedTTLexp: 1.3
}


var chart = document.getElementById('chart1')
var pop1 = new Chart(chart, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        animation: false
    }
})








var features = {
    // default settings
    'pop': {
        def_val: 1,
        min: 0,
        max: 10,
        mut_inc: 0,
        def_mut: 0
    },
    'speed': {
        def_val: 3,
        min: 1,
        max: 10,
        mut_inc: 1,
        def_mut: 0.1
    },
    'vision': {
        def_val: 30,
        min: 0,
        max: 100,
        mut_inc: 2,
        def_mut: 0.3
    },
    'gps': {
        def_val: 0.7,
        min: 0,
        max: 1,
        mut_inc: 0.05,
        def_mut: 0.05
    },
    'greed': {
        def_val: 0.5,
        min: 0,
        max: 1,
        mut_inc: 0.05,
        def_mut: 0.05
    },
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


function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}





var bars = document.getElementById('prop-bars')

var prop_bars = {}

var visiongraph;

for(let f in features){
    if(f=='pop') continue
    bars.innerHTML += `<div class="row"><div class="col s12"><canvas id="${f}-bar" width="100" height:"50"></canvas></div></div>`
}

for(let f in features){
    if(f=='pop') continue
    let tempctx = document.getElementById(`${f}-bar`).getContext('2d')
    // tempctx.fillRect(0,0,50,5)
    let num_vals = parseInt((features[f].max-features[f].min)/features[f].mut_inc + 1)

    prop_bars[f] = new Chart(tempctx,{
        type:'bar',
        data:{
            labels: Object.keys([...Array(num_vals)]).map(x=>features[f].min + Math.round(100*parseInt(x)*features[f].mut_inc)/100),
            datasets:[{
                data:Object.keys([...Array(num_vals)]).map(x=>x),
                label: `${f.toUpperCase()} tracking`,
                backgroundColor: Object.keys([...Array(num_vals)]).map(i => {
                    return 'rgb(255,'+String(255 - i*(255)/(num_vals-1))+',0)'
                })
            }]
        }
    })
}



for(let f in prop_bars){
    // let num_vals = parseInt((features[f].max-features[f].min)/features[f].mut_inc + 1)

    // prop_bars[f].chart.data = {
    //         labels: Object.keys([...Array(num_vals)]).map(x=> features[f].min + parseInt(x)*features[f].mut_inc),
    //         datasets: [
    //             {
    //                 label: `${f} Tracking`,
    //                 data: Object.keys([...Array((features[f].max-features[f].min)/features[f].mut_inc)]).map(x=>0),
    //                 backgroundColor: Object.keys([...Array((features[f].max-features[f].min)/features[f].mut_inc)]).map(i=>{
    //                     return 'rgb(255,'+String(255 - i*(255)/(num_vals-1))+',0)'
    //                 })
    //             }
    //         ]
    //     }
    
    // prop_bars[f].chart.options = {
    //         scales:{
    //             y:{
    //                 beginAtZero: true
    //             }
    //         },
    //         animation: false
    // }


    // visiongraph = prop_bars[f].chart
}