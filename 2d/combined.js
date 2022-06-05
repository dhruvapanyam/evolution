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

    bordered = (dim) => {
        // dim = {center:?, rad:?}
        if(this.distTo(dim.center) < dim.radius) return this.copy();

        let ang = dim.center.angleTo(this);
        return new Vec(dim.radius * Math.cos(ang), dim.radius * Math.sin(ang)).add(dim.center)

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
    TTLratio: 500,
    speedTTLexp: 0.7
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



var bar = document.getElementById('chart2')
var bar1 = new Chart(bar, {
    type: 'bar',
    data: {
        labels: Object.keys([...Array(maxSpeed)]).map(x=>parseInt(x)+1),
        datasets: [
            {
                label: 'Speed Count',
                data: Object.keys([...Array(maxSpeed)]).map(x=>0),
                backgroundColor: Object.keys([...Array(maxSpeed)]).map(i=>{
                    return 'rgb(255,'+String(255 - i*(255)/(maxSpeed-1))+',0)'
                })
            }
        ]
    },
    options:{
        scales:{
            y:{
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

















































const world = document.getElementById('world')
let world_ht = 0.65
world.width = window.innerHeight * world_ht
world.height = world.width

const ctx = world.getContext('2d')

ctx.fillStyle = 'rgb(240,240,240)'
ctx.beginPath()
ctx.arc(world.width/2,world.height/2, world.width/2 * 0.95,0, Math.PI*2)
ctx.fill()



class Food {
    constructor(id,pos,size=2,col='red'){
        this.id = id
        this.pos = pos;
        this.size = size;
        this.holder = null;
        this.color = col;
    }
}

class Creature {
    constructor(id,pos,gene,props,dim){
        const D = simMetadata.TTLratio
        this.id = id
        this.pos = pos
        this.gene = gene
        this.props = props
        this.init_ttl = Math.floor(D/Math.pow(this.props.speed.value, simMetadata.speedTTLexp))
        // console.log(this.props.speed.value,this.init_ttl)
        this.ttl = this.init_ttl
        this.dim = dim
        this.ang = this.pos.angleTo(dim.center)

        this.spawn = this.pos.copy()

        this.food = 0
        this.size = 5


        this.sight = 0.05
        this.fov = this.sight

    }

    reset = () => {
        this.ttl = this.init_ttl
        this.ang = this.pos.angleTo(this.dim.center)
        this.food = 0
        this.fov = this.sight
        this.spawn = this.pos.copy()
    }

    move = (food=new Set()) => {

        // if(this.id != 10) return false;
        let food_found = null;
        if(this.food < 2){
            for(let f of food){
                let dx = Math.abs(f.pos.x - this.pos.x)
                let dy = Math.abs(f.pos.y - this.pos.y)
                if(dx>this.props.vision.value || dy>this.props.vision.value) continue 
                if(this.pos.distTo(f.pos) <= this.props.vision.value && ((Math.PI*2 + this.ang - this.pos.angleTo(f.pos))%(Math.PI*2) < this.sight)){ // fov = 0.6
                    food_found = f.pos
                    break;
                }           
            }
        }
        if(food_found == null){
            this.ang += (Math.random()*2-1) * this.fov
        }
        else{
            // console.log('found food!')
            this.ang = this.pos.angleTo(food_found)
            // this.fov = this.vision
        }
        let step = randVec(this.props.speed.value, this.ang)
        this.pos.add(step)
        this.pos = this.pos.bordered(this.dim)
        // console.log('move',this.pos)
        this.ttl--
        // if(this.ttl == 0) console.log('dead :(')

        // return whether can move again
        return (!this.home() && this.alive())
    }

    eat = () => {
        this.food += 1
        
        
        // choose whether to go back home
        let r = Math.random()
        if(r > this.props.greed.value || this.food==2){
            this.fov = this.sight * (1-this.props.gps.value)
        }
        
        this.ang = this.pos.angleTo(this.spawn)
    }

    alive = () => {return this.ttl > 0}
    healthy = () => {return this.food > 0}
    home = () => {
        // returns whether back home healthy
        // console.log(this.pos.x,this.pos.y)
        // console.log('home',this)
        // if(this.pos.x < 1) console.log(this.healthy() && this.pos.x==0)
        return (this.healthy() && Math.abs(this.pos.distTo(this.dim.center)) < 1)
    }



    reproduce = (id,pos) => {
        let r = Math.random()
        let m = this.props.speed.mutation_chance
        let inc = r < m ? 1 : (r < 2*m ? -1 : 0)
        let temp = JSON.parse(JSON.stringify(this.props))
        temp.speed.value += inc
        temp.speed.value = Math.max(Math.min(temp.speed.value,features.speed.max),features.speed.min)
        return new Creature(id,pos,this.gene,temp,this.dim)
    }
}




class World {
    constructor(params){
        // params: dimensions, init_pop, init_food, gene_split
        this.params = params;
        this.dim = params.dim   // size of world {center,radius}

        this.genes = {}

        this.creatureID = 1;    // unique creature ID

        this.food = new Set()   // set of food items in the world
        this.creatures = {}  // set of creatures currently alive
        this.awake = new Set()      // set of creatures currently alive and not home

        this.day = 0
    }

    drawWorld = (c) => {
        let scale = world.width/2 * 0.95 / this.dim.radius
        c.lineWidth = 2
        c.fillStyle = 'rgb(240,240,240)'
        c.beginPath()
        c.arc(world.width/2, world.height/2,this.dim.radius*scale,0,Math.PI*2)
        c.fill()

        c.strokeStyle = 'black'
        c.beginPath()
        c.arc(world.width/2, world.height/2,this.dim.radius*scale,0,Math.PI*2)
        c.stroke()

        c.lineWidth = 1


        for(let f of this.food){
            c.fillStyle = f.color
            c.beginPath()
            c.arc(world.width/2 + f.pos.x*scale, world.height/2 + f.pos.y*scale,f.size*scale,0,Math.PI*2)
            c.fill()
        }

        // let counter = 0;
        for(let id in this.creatures){
            if(this.creatures[id] == undefined) console.log('ye')
            // if(id!=10) continue;
            let f = this.creatures[id]
            // console.log(f==undefined)
            // c.fillStyle = f.food > 0 ? (f.food > 1 ? 'green' : 'blue') : 'grey'
            let col = 'rgb(255,'+String(255 - f.props.speed.value*(255)/(maxSpeed-1))+',0)'
            c.fillStyle = col;
            c.beginPath()
            c.arc(world.width/2 + f.pos.x*scale, world.height/2 + f.pos.y*scale,f.size*scale,0,Math.PI)
            c.fill()
            c.fillStyle = f.food > 1 ? 'green' : (f.food > 0 ? 'blue' : 'grey')
            c.beginPath()
            c.arc(world.width/2 + f.pos.x*scale, world.height/2 + f.pos.y*scale,f.size*scale,Math.PI,Math.PI*2)
            c.fill()

            c.fillStyle = 'rgba(255,0,0,0.1)'
            c.beginPath()
            c.arc(world.width/2 + f.pos.x*scale, world.height/2 + f.pos.y*scale,f.props.vision.value*scale,f.ang-f.fov,f.ang+f.fov)
            c.lineTo(world.width/2 + f.pos.x*scale, world.height/2 + f.pos.y*scale)
            c.fill()

            // counter++
        }
        // console.log('Drew',counter,'blobs')
    }

    getRandStartingPos = () => {
        let ang = Math.random()*Math.PI*2
        return new Vec(Math.cos(ang)*this.dim.radius, Math.sin(ang)*this.dim.radius).addC(this.dim.center)
        // return pos;
    }

    placeFood = (num_food) => {
        for(let i=0;i<num_food;i++){
            let d = Math.random()*this.dim.radius
            let a = Math.random()*Math.PI*2
            this.food.add(new Food(i, new Vec(Math.cos(a)*d,Math.sin(a)*d)))
        }
    }

    showStats = (verbose=true) => {
        let gene_stats = {}
        for(let g in this.genes) gene_stats[g] = 0
        for(let c of Object.keys(this.creatures)) gene_stats[this.creatures[c].gene]++
        // console.log(Object.keys(this.creatures).length,'creatures alive...')

        if(verbose){
            console.log('----------------------')
            console.log('POPULATION STATISTICS')
            console.log('----------------------')
            console.log('Total:', Object.keys(this.creatures).length)
            
            for(let g in gene_stats)
                console.log('[G]',g+':',gene_stats[g])
            console.log('----------------------')
            console.log()
        }

        return gene_stats

        
    }

    updateChart = () => {
        let gdata = this.showStats(false);

        let s=0, i=0;
        for(let g in gdata){
            // console.log(g)
            s+=gdata[g]
            pop1.data.datasets[i].data.push(s)
            i++
        }
        // console.log('matches?',Object.keys(this.creatures).length == s)
        // pop1.data.labels.push('Day '+this.day)
        pop1.update()

        let scount = Object.keys([...Array(maxSpeed)]).map(x=>0)

        for(let id in this.creatures){
            scount[this.creatures[id].props.speed.val-1]+=1
        }
        // console.log(scount)
        for(let j=0;j<maxSpeed;j++){
            bar1.data.datasets[0].data[j] = scount[j]
        }
        // console.log('Speed stats:', Object.values(this.creatures).map(c=>c.props.speed.val))
        bar1.update()
    }

    clearChart = () => {
        pop1.data.labels = []
        pop1.data.datasets = []
        pop1.update()

        bar1.data.datasets[0].data = Object.keys([...Array(maxSpeed)]).map(x=>0)
        bar1.update()
    }

    setupNewSim = () => {
        // set world back to init

        this.clearChart()
        let cols = ['rgb(255,255,0)','rgb(255,0,0)','rgb(0,0,255)','rgb(0,255,255)']
        let i=0;
        let opac = 0.4
        for(let g in this.genes){
            pop1.data.datasets.push({
                label: '#'+g,
                data: [],
                fill: true,
                borderColor: cols[i],
                backgroundColor: cols[i].slice(0,3)+'a'+cols[i].slice(3,cols[i].length-1)+','+String(opac)+')',
                // opacity: 0.5
            })
            i++
        }
        pop1.data.labels.push('Day 0')


        // this.food = new Set()
        for(let f of this.food) {
            // f = null;
            this.food.delete(f)
        }
        this.placeFood(this.params.init_food) // place food items

        // this.creatures = new Set()
        for(let c in this.creatures) {
            this.creatures[c] = undefined
            delete this.creatures[c]
        }
        i=0;
        let tot = this.params.init_pop;
        let tokens = Object.values(this.genes).map(g=>g.props.pop.value).reduce((x,y)=>x+y);
        // console.log('tokens:',tokens)
        let j=0;
        for(let gene in this.genes){
            // each gene name
            let cur = i;
            while (i < cur + tot*this.genes[gene].props.pop.value/tokens){
                this.creatureID++
                this.creatures[this.creatureID] = new Creature(this.creatureID, this.getRandStartingPos(), gene, this.genes[gene].props, this.dim)
                i++
            }
            pop1.data.datasets[j].data.push(i)
            j++
            
        }

        this.day = 0

        // console.log('Setup complete!')

        // this.showStats();

        

        pop1.update()

        let scount = Object.keys([...Array(maxSpeed)]).map(x=>0)

        for(let id in this.creatures){
            scount[this.creatures[id].props.speed.value-1]+=1
        }
        // console.log(scount)
        for(let j=0;j<maxSpeed;j++){
            bar1.data.datasets[0].data[j] = scount[j]
        }
        // console.log('Speed stats:', Object.values(this.creatures).map(c=>c.props.speed.val))
        bar1.update()




    }

    startNewSim = (days, wait=10, food_change=(f)=>f) => {
        // start simulating world

        for(let a of this.awake) this.awake.delete(a)

        pop1.data.labels = pop1.data.labels.concat([...Array(days).keys()].map(i=>'Day '+String(i+this.day)))
        pop1.update()

        // this.updateChart()

        let day=0;
        let simulation = setInterval(()=>{
            this.simDay()
            // this.updateChart()
            // this.drawWorld(ctx)
            day++
            if(day==days) clearInterval(simulation)
        },wait)        
    }

    simDay = (visual=false) => {
        // console.log('new day!')
        // let maxD = 8    // distance to food
        let maxF = 2    // max food capacity

        for(let f of this.food) {
            // f = null
            this.food.delete(f)
        }
        this.placeFood(this.params.init_food) // place food items

        for(let id in this.creatures) this.awake.add(id)
        // simulate next day
        // console.log('Num awake:',this.awake.size)
        while(this.awake.size > 0){
            // move every awake creature
            for(let id of this.awake){
                if(id!=10) continue
                // console.log('sim',this.creatures[id].pos)
                let res = this.creatures[id].move(this.food) // res = T/F
                // console.log(res)
                // res: {alive:?, home:?}
                // check if can eat food
                if(this.creatures[id].food < maxF)
                    for(let f of this.food){
                        let dx = Math.abs(f.pos.x - this.creatures[id].pos.x)
                        let dy = Math.abs(f.pos.y - this.creatures[id].pos.y)
                        let maxD = f.size + this.creatures[id].size
                        if(dx>maxD || dy>maxD) continue
                        if(this.creatures[id].pos.distTo(f.pos) <= maxD){
                            this.creatures[id].eat()
                            // f = null
                            // console.log('deleting food')
                            this.food.delete(f)
                        }
                    }
                if(!res){
                    this.awake.delete(id)
                }
            }
        }

        this.endDay(visual=visual)

        
    }

    endDay = (single_day=false,draw=false,visual=false) => {
        // console.log('before ending:',Object.keys(this.creatures).length)
        let curIDs = Object.keys(this.creatures)
        for(let id of curIDs){
            let c = this.creatures[id]
            if(c.home()) {
                if(c.food == 2){
                    this.creatureID+=1
                    this.creatures[this.creatureID] = c.reproduce(this.creatureID,this.getRandStartingPos())
                    // console.log('Current speed:',c.props.speed.val,'Baby speed:',this.creatures[this.creatureID].props.speed.val)
                }
                c.reset()
            }
            else {
                this.creatures[id] = undefined
                delete this.creatures[id]
                // console.log('killed creature')
            }
        }
        // console.log('after ending day:',Object.keys(this.creatures).length)

        this.day++

        // this.showStats()
        if(single_day) pop1.data.labels.push('Day '+this.day)
        if(draw) this.drawWorld(ctx)
        // this.updateChart()
        console.log('ended day')
    }

    showDayProgress = () => {
        // let maxD = 8    // distance to food
        let maxF = 2    // max food capacity

        for(let f of this.food) {
            // f = null
            this.food.delete(f)
        }
        this.placeFood(this.params.init_food) // place food items
        for(let id in this.creatures) this.awake.add(id)
        // simulate next day
        console.log('Num awake:',this.awake.size)

        let showDay = setInterval(()=>{
            this.drawWorld(ctx)
            // move every awake creature
            for(let id of this.awake){
                // if(id != 10) continue;
                let res = this.creatures[id].move(this.food)
                // console.log(res)
                // res: {alive:?, home:?}
                // check if can eat food
                if(this.creatures[id].food < maxF)
                    for(let f of this.food){
                        // if(f.holder != null) continue
                        if(f.pos == undefined) console.log('yee')
                        let dx = Math.abs(f.pos.x - this.creatures[id].pos.x)
                        let dy = Math.abs(f.pos.y - this.creatures[id].pos.y)
                        let maxD = f.size + this.creatures[id].size
                        if(dx>maxD || dy>maxD) continue
                        if(this.creatures[id].pos.distTo(f.pos) <= maxD){
                            this.creatures[id].eat()
                            // f = null
                            // this.food.holder = id;
                            this.food.delete(f)
                        }
                    }
                if(!res){
                    console.log('deleting')
                    console.log('id',id,'not awake: pos',this.creatures[id].pos.x,this.creatures[id].pos.y,'healthy:',res.healthy,'home:',res.home,'alive:',res.alive)
                    this.awake.delete(id)
                }
            }
            if(this.awake.size==0) {
                console.log('stopping day sim...')
                this.endDay(true,false,true)
                clearInterval(showDay)
            }
        },30)

    }



}


const W = new World({
    dim: {radius: 300, center: new Vec(0,0)},
    init_food: 50,
    init_pop: 50,
})






























var topsec = document.getElementById('top-section-div')
let topsec_ht = 0.7
topsec.style.height = String(window.innerHeight * topsec_ht)+'px'

window.addEventListener('resize',e=>{
    topsec.style.height = String(window.innerHeight * topsec_ht)+'px'
    world.width = window.innerHeight * world_ht
    world.height = world.width
})


const sumChart = document.getElementById('summary-chart').getContext('2d')
// sumChart.fillRect(0,0,document.getElementById('summary-chart').width,document.getElementById('summary-chart').height)

const sumbar = new Chart(sumChart, {
    type:'bar',
    data: {
        labels: [],
        datasets:[]
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: 'Preset Init Summary'
            }
        },
        yAxes: [{
            ticks: {
              min: 0,
              max: 1,
        
              // forces step size to be 5 units
              stepSize: 0.1 // <----- This prop sets the stepSize
            }
          }]
    }
})

sumbar.data.labels = Object.keys(features)
sumbar.update()

var gene_list = new Set()
// var genes = {}

var active_gene = null;


function addNewGene(gname,props=null){
    active_gene = gname


    gene_list.add(gname)
    W.genes[gname] = {
        name: gname,
        inUse: true,
        color: `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.6)`,
        props:{}
    }

    if(props == null){
        
        for(let f in features){
            W.genes[gname].props[f] = {
                value: features[f].def_val,
                mutation_chance: features[f].def_mut
            }
        }

    }
    else{
        for(let f in features){
            W.genes[gname].props[f] = {
                value: parseFloat(props[f].value),
                mutation_chance: parseFloat(props[f].mutation_chance)
            }
        }
    }

    let p = `
    <ul id="${gname}-props" class="collection gene-props" style="display:none">
    `
    
    for(let f in features){
        p = p + `
            <li class="collection-item" style="padding-left: 0; background-color:${changeOpacity(W.genes[gname].color,0.2)}">
                <div class="row" style="margin: 0;"> 
                    <div class="col s3" style="display: inline-block; ">
                        <div class="row">
                            <div class="col s3" style="cursor:pointer; display: inline-block;" >
                                <i style="cursor:pointer;" class="material-icons" onclick="editGeneProps('${gname}','${f}',${features[f].def_val},${features[f].def_mut})">loop</i>
                            </div>
                            <div class="col s9">
                                &nbsp;&nbsp;${f.toUpperCase()}:
                            </div>
                        </div>

                    </div>
                    <div class="col s9" >
                        <div class="row">
                            <div class="col s2 offset-s1">
                                <label style="padding-top: 25px;">Value: </label>
                            </div>
                            <div class="col s8">
                                <form action="#">
                                    <p class="range-field">
                                    <input id="${gname}-${f}-val-inp" oninput="editGeneProps('${gname}','${f}',this.value,null)" type="range" min="${features[f].min}" max="${features[f].max}" step="${features[f].mut_inc}" value="${W.genes[gname].props[f].value}" />
                                    </p>
                                </form>
                            </div>
                            <div class="col s1">
                                <div id="${gname}-${f}-val-val" style="margin-top: 5px;">${W.genes[gname].props[f].value}</div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col s4 offset-s1">
                                <label style="padding-top: 25px;">Mutation: </label>
                            </div>
                            <div class="col s6">
                                <form action="#">
                                    <p class="range-field">
                                        <input id="${gname}-${f}-mut-inp" oninput="editGeneProps('${gname}','${f}',null,this.value)" type="range" min="0" max="1" step="0.05" value="${W.genes[gname].props[f].mutation_chance}" />
                                    </p>
                                </form>
                            </div>
                            <div class="col s1">
                                <div id="${gname}-${f}-mut-val" style="margin-top: 5px;">${W.genes[gname].props[f].mutation_chance}</div>
                            </div>

                    </div>
                    <div class="col s1"></div>
                </div>
            </li>
        `
    }

    p = p + `</ul>`
    document.getElementById('gene-props-sidebar').innerHTML += p;
    
    loadPresetContent()

    document.getElementById('new-gene-inp').value = ''

    sumbar.data.datasets.push({
        gene: gname,
        label: gname,
        data: Object.keys(W.genes[gname].props).map(p=>W.genes[gname].props[p].value / features[p].max),
        backgroundColor: W.genes[gname].color
    })

    sumbar.update()


}



function removeGene(gname){
    gene_list.delete(gname)
    delete W.genes[gname]
    // delete propsDOM[[gname]]
    document.getElementById(`${gname}-props`).remove()

    active_gene = Object.keys(W.genes)[0]

    loadPresetContent()

    sumbar.data.datasets = sumbar.data.datasets.filter(d=>d.gene!=gname)
    sumbar.update()

}

function setGeneProps(g,props){
    for(let f in props){
        let v = parseFloat(props[f].value)
        let m = parseFloat(props[f].mutation_chance)
        // console.log(`setting ${g}-${f} to ${props[f].value}`)

        document.getElementById(`${g}-${f}-val-inp`).value = v
        document.getElementById(`${g}-${f}-mut-inp`).value = m
        editGeneProps(g,f,v,m)
    }

}


function editGeneProps(g,f,v,m){
    // console.log('editing',g,f,v,m)
    if(v!=null) {
        W.genes[g].props[f].value = v
        document.getElementById(`${g}-${f}-val-val`).innerHTML = v;
        for(let d of sumbar.data.datasets){
            if(d.gene != g) continue
            let j=-1;
            for(let x in features){
                j++
                if(x!=f) continue
                d.data[j] = v / features[x].max
            }
        }
    }
    if(m!=null) {
        W.genes[g].props[f].mutation_chance = m
        document.getElementById(`${g}-${f}-mut-val`).innerHTML = m;
    }

    
    sumbar.update()

}


function loadPresetContent(){
    var glist = document.getElementById('gene-list-sidebar')
    glist.innerHTML = `<li class="collection-header">List of Genes:</li>`
    for(let g of gene_list){
        glist.innerHTML += `<li class="collection-item"  style="cursor:context-menu; padding-left: 10px; padding-right: 4px; background-color:${changeOpacity(W.genes[g].color,0.4)}" onclick="activateGene('${g}')">
                <div class="row" style="margin:0">
                    <div class="col s10" style="margin:0;padding:0;height:100%">${g}</div>
                    <div class="col s2">
                        <a href="#!" class="secondary-content" onclick="removeGene('${g}')"><i class="material-icons">delete</i></a>
                    </div>
                </div>
            </li>`        
    }

    for(let dom of document.getElementsByClassName('gene-props')){
        dom.style.display = 'none'
        if(dom.id.split('-')[0] == active_gene)
            dom.style.display = 'block'
    }

}

function activateGene(g){
    if(W.genes[g] == null) return;
    active_gene = g
    loadPresetContent()
}





function loadPreset(preset_str){
    for(let g in W.genes)
        removeGene(g)
    let data = JSON.parse(preset_str)
    for(let g in data){
        addNewGene(g,data[g].props)
        // setGeneProps(g,data[g].props)
    }
}





const test_preset = '{"staminated":{"name":"staminated","inUse":true,"color":"rgba(205,130,173,0.6)","props":{"pop":{"value":1,"mutation_chance":0},"speed":{"value":3,"mutation_chance":0.1},"vision":{"value":"50","mutation_chance":0.3},"gps":{"value":"0.5","mutation_chance":0.05},"greed":{"value":0.5,"mutation_chance":0.05}}},"speedic":{"name":"speedic","inUse":true,"color":"rgba(239,159,62,0.6)","props":{"pop":{"value":1,"mutation_chance":0},"speed":{"value":"6","mutation_chance":0.1},"vision":{"value":"50","mutation_chance":0.3},"gps":{"value":"0.5","mutation_chance":0.05},"greed":{"value":0.5,"mutation_chance":0.05}}}}'

document.getElementById('load-preset').onclick = () => {
    loadPreset(test_preset)
}


loadPreset(test_preset)