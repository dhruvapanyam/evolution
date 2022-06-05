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
        // dim = {w:[0,300],h:[0,200]}
        if(this.x>dim.w) this.x = dim.w
        else if(this.x<0) this.x = 0
        if(this.y>dim.h) this.y = dim.h
        else if(this.y<0) this.y = 0
    }

    borderedC = (dim) => {
        let temp = this.copy()
        temp.bordered(dim)
        return temp;
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const gui1 = new dat.GUI()
gui1.domElement.id = 'gui1'
const gui2 = new dat.GUI()
gui2.domElement.id = 'gui2'

const chart = document.getElementById('chart1')
const pop1 = new Chart(chart, {
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

const maxSpeed = 10;
var simMetadata = {
    days: 50,
    TTLratio: 500,
    speedTTLexp: 0.7
}


const bar = document.getElementById('chart2')
const bar1 = new Chart(bar, {
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



const world = document.getElementById('world')
world.width = 500
world.height = 500

ctx = world.getContext('2d')


class Food {
    constructor(id,pos){
        this.id = id
        this.pos = pos;
    }
}

class Creature {
    constructor(id,pos,gene,props,dim){
        const D = simMetadata.TTLratio
        this.id = id
        this.pos = pos
        this.gene = gene
        this.props = props
        this.init_ttl = Math.floor(D/Math.pow(this.props.speed.val, simMetadata.speedTTLexp))
        // console.log(this.props.speed.val,this.init_ttl)
        this.ttl = this.init_ttl
        this.dim = dim
        this.ang = new Vec(dim.w/2,dim.h/2).subC(this.pos).angle()

        this.spawn = this.pos.copy()

        this.food = 0

        this.fov = this.props.vision.fov // range of angle of direction change

        if(this.id==10) console.log(this.pos.x,this.pos.y)
    }

    reset = () => {
        this.ttl = this.init_ttl
        this.ang = this.pos.angleTo(new Vec(this.dim.w/2,this.dim.h/2))
        this.food = 0
        this.fov = this.props.vision.fov
        this.spawn = this.pos.copy()
    }

    move = (food=new Set()) => {

        // if(this.id != 10) return false;
        let food_found = null;
        if(this.food < 2){
            for(let f of food){
                let dx = Math.abs(f.pos.x - this.pos.x)
                let dy = Math.abs(f.pos.y - this.pos.y)
                if(dx>this.props.vision.dist || dy>this.props.vision.dist) continue 
                if(this.pos.distTo(f.pos) <= this.props.vision.dist && ((Math.PI*2 + this.ang - this.pos.angleTo(f.pos))%(Math.PI*2) < this.props.vision.fov)){
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
        let step = randVec(this.props.speed.val, this.ang)
        this.pos.add(step)
        this.pos.bordered(this.dim)
        this.ttl--
        // if(this.ttl == 0) console.log('dead :(')

        // return whether can move again
        return (!this.home() && this.alive())
    }

    eat = () => {
        this.food += 1
        
        
        // choose whether to go back home
        let r = Math.random()
        if(r > this.props.greed.val || this.food==2){
            this.fov = this.props.vision.fov * (1-this.props.gps.confidence)
        }
        
        this.ang = this.pos.angleTo(this.spawn)
    }

    alive = () => {return this.ttl > 0}
    healthy = () => {return this.food > 0}
    home = () => {
        // returns whether back home healthy
        // if(this.pos.x < 1) console.log(this.healthy() && this.pos.x==0)
        return (this.healthy() && (this.pos.x==0 || this.pos.y==0 || this.pos.x==this.dim.w || this.pos.y==this.dim.h))
    }



    reproduce = (id,pos) => {
        let r = Math.random()
        let m = this.props.speed.mutation
        let inc = r < m ? 1 : (r < 2*m ? -1 : 0)
        let temp = JSON.parse(JSON.stringify(this.props))
        temp.speed.val += inc
        temp.speed.val = Math.max(Math.min(temp.speed.val,maxSpeed),this.props.speed.min)
        return new Creature(id,pos,this.gene,temp,this.dim)
    }
}

class World {
    constructor(params){
        // params: dimensions, init_pop, init_food, gene_split
        this.params = params;
        this.dim = params.dim   // size of world

        this.creatureID = 1;    // unique creature ID

        this.food = new Set()   // set of food items in the world
        this.creatures = {}  // set of creatures currently alive
        this.awake = new Set()      // set of creatures currently alive and not home

        this.day = 0
    }

    drawWorld = (c) => {
        let scale = world.width/this.dim.w
        c.beginPath()
        c.moveTo(0,0)
        c.lineTo(0,world.height)
        c.lineTo(world.width,world.height)
        c.lineTo(world.width,0)
        c.lineTo(0,0)
        c.closePath()
        c.stroke()
        c.fillStyle = 'rgb(240,240,240)'
        c.fillRect(0,0,world.width,world.height)

        for(let f of this.food){
            c.fillStyle = 'red'
            c.beginPath()
            c.arc(f.pos.x*scale,f.pos.y*scale,2*scale,0,Math.PI*2)
            c.fill()
        }

        // let counter = 0;
        for(let id in this.creatures){
            // if(id!=10) continue;
            let f = this.creatures[id]
            // c.fillStyle = f.food > 0 ? (f.food > 1 ? 'green' : 'blue') : 'grey'
            let col = 'rgb(255,'+String(255 - f.props.speed.val*(255)/(maxSpeed-1))+',0)'
            c.fillStyle = col;
            c.beginPath()
            c.arc(f.pos.x*scale,f.pos.y*scale,5*scale,0,Math.PI)
            c.fill()
            c.fillStyle = f.food > 1 ? 'green' : (f.food > 0 ? 'blue' : 'grey')
            c.beginPath()
            c.arc(f.pos.x*scale,f.pos.y*scale,5*scale,Math.PI,Math.PI*2)
            c.fill()

            c.fillStyle = 'rgba(255,0,0,0.1)'
            c.beginPath()
            c.arc(f.pos.x*scale,f.pos.y*scale,f.props.vision.dist*scale,f.ang-f.fov,f.ang+f.fov)
            c.lineTo(f.pos.x*scale,f.pos.y*scale)
            c.fill()

            // counter++
        }
        // console.log('Drew',counter,'blobs')
    }

    getRandStartingPos = () => {
        let size = this.dim
        let initpos = Math.random()*2*(size.w+size.h)
        let pos;
        if(initpos<size.w)
            pos = new Vec(Math.random()*size.w,0)
        else if(initpos < size.w+size.h)
            pos = new Vec(size.w, Math.random()*size.h)
        else if(initpos < size.w*2+size.h)
            pos = new Vec(Math.random()*size.w,size.h)
        else
            pos = new Vec(0,Math.random()*size.h)
        // console.log('rand:',pos.x,pos.y)
        return pos;
    }

    placeFood = (num_food) => {
        for(let i=0;i<num_food;i++){
            this.food.add(new Food(i, new Vec(Math.random()*this.dim.w, Math.random()*this.dim.h)))
        }
    }

    showStats = (verbose=true) => {
        let gene_stats = {}
        for(let g in this.params.gene_split) gene_stats[g] = 0
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
        for(let g in this.params.gene_split){
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
        let tokens = Object.values(this.params.gene_split).map(g=>g.freq).reduce((x,y)=>x+y);
        // console.log('tokens:',tokens)
        let j=0;
        for(let gene in this.params.gene_split){
            // each gene name
            let cur = i;
            while (i < cur + tot*this.params.gene_split[gene].freq/tokens){
                this.creatureID++
                this.creatures[this.creatureID] = new Creature(this.creatureID, this.getRandStartingPos(), gene, this.params.gene_split[gene].props, this.dim)
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
            scount[this.creatures[id].props.speed.val-1]+=1
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

        this.updateChart()

        let day=0;
        let simulation = setInterval(()=>{
            this.simDay()
            this.updateChart()
            // this.drawWorld(ctx)
            day++
            if(day==days) clearInterval(simulation)
        },wait)        
    }

    simDay = (visual=false) => {
        // console.log('new day!')
        let maxD = 8    // distance to food
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
                let res = this.creatures[id].move(this.food) // res = T/F
                // console.log(res)
                // res: {alive:?, home:?}
                // check if can eat food
                if(this.creatures[id].food < maxF)
                    for(let f of this.food){
                        let dx = Math.abs(f.pos.x - this.creatures[id].pos.x)
                        let dy = Math.abs(f.pos.y - this.creatures[id].pos.y)
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
        this.updateChart()
    }

    showDayProgress = () => {
        let maxD = 8    // distance to food
        let maxF = 2    // max food capacity

        for(let f of this.food) {
            // f = null
            this.food.delete(f)
        }
        this.placeFood(this.params.init_food) // place food items
        for(let id in this.creatures) this.awake.add(id)
        // simulate next day
        // console.log('Num awake:',this.awake.size)

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
                        let dx = Math.abs(f.pos.x - this.creatures[id].pos.x)
                        let dy = Math.abs(f.pos.y - this.creatures[id].pos.y)
                        if(dx>maxD || dy>maxD) continue
                        if(this.creatures[id].pos.distTo(f.pos) <= maxD){
                            this.creatures[id].eat()
                            // f = null
                            this.food.delete(f)
                        }
                    }
                if(!res){
                    // console.log('deleting')
                    // console.log('id',id,'not awake: pos',this.creatures[id].pos.x,this.creatures[id].pos.y,'healthy:',res.healthy,'home:',res.home,'alive:',res.alive)
                    this.awake.delete(id)
                }
            }
            if(this.awake.size==0) {
                // console.log('stopping day sim...')
                this.endDay(true,false,true)
                clearInterval(showDay)
            }
        },30)

    }



}


var gene_data = {
    'slow & aware':{
        freq: 0,  // token system
        props:{
            speed:{
                val: 2,
                min: 1,
                max: 20,
                mutation: 0.1
            },
            vision:{
                dist: 40,
                fov: 0.6,
                min: 0,
                max: 30,
                mutation: 0.1
            },
            gps:{
                confidence: 0.8,
            },
            greed:{
                val: 0.5
            }
        }
    },
    'fast & forgetful':{
        freq: 0,  // token system
        props:{
            speed:{
                val: 5,
                min: 1,
                max: maxSpeed,
                mutation: 0.1
            },
            vision:{
                dist: 20,
                fov: 0.6,
                min: 0,
                max: 30,
                mutation: 0.1
            },
            gps:{
                confidence: 0.2
            },
            greed:{
                val: 0.5
            }
        }
    },
    'greedy':{
        freq: 1,  // token system
        props:{
            speed:{
                val: 4,
                min: 1,
                max: maxSpeed,
                mutation: 0.01
            },
            vision:{
                dist: 30,
                fov: 0.6,
                min: 0,
                max: 30,
                mutation: 0.1
            },
            gps:{
                confidence: 0.5
            },
            greed:{
                val: 0.8
            }
        }
    },
    'content':{
        freq: 1,  // token system
        props:{
            speed:{
                val: 4,
                min: 1,
                max: maxSpeed,
                mutation: 0.01
            },
            vision:{
                dist: 30,
                fov: 0.6,
                min: 0,
                max: 30,
                mutation: 0.1
            },
            gps:{
                confidence: 0.5
            },
            greed:{
                val: 0.2
            }
        }
    },
}

var selected = []

const W = new World({
    dim: {w: 400, h: 400},
    init_food: 50,
    init_pop: 50,
    gene_split: gene_data
})

// setInterval(()=>{pop1.update()},100)

W.setupNewSim()



document.addEventListener('keydown',e=>{
    let k=e.key
    if(k=='0'){
        W.simDay(true)
    }
    else if(k=='-'){
        W.showDayProgress()
    }
})

document.getElementById('setupSim').onclick = ()=>{
    W.setupNewSim()
}
document.getElementById('startSim').onclick = ()=>{
    W.startNewSim(simMetadata.days,1)
}
document.getElementById('startDaySim').onclick = ()=>{
    W.showDayProgress()
}


var gene_gui = gui1.addFolder('Gene Data');
var subgenes = {}
for(let g in gene_data){
    subgenes[g] = gene_gui.addFolder('[G] '+g)
    subgenes[g].add(W.params.gene_split[g],'freq').min(0).max(5).step(1)
    subgenes[g].add(W.params.gene_split[g].props.speed,'val').min(1).max(maxSpeed).step(1).name('speed')
    subgenes[g].add(W.params.gene_split[g].props.vision,'dist').min(0).max(100).step(10).name('vision:dist')
    subgenes[g].add(W.params.gene_split[g].props.vision,'fov').min(0.3).max(1).step(0.1).name('vision:fov')
    subgenes[g].add(W.params.gene_split[g].props.gps,'confidence').min(0).max(1).step(0.1).name('gps:conf')
    subgenes[g].add(W.params.gene_split[g].props.greed,'val').min(0).max(1).step(0.1).name('greed')
    // subgenes[g].add(W.params.gene_split[g].props,'ttl').min(100).max(1000).step(50)
    subgenes[g].open()
}
gene_gui.open()

var params = gui2.addFolder('Init Params')
params.add(W.params,'init_pop').min(50).max(400).step(50)
params.add(W.params,'init_food').min(50).max(400).step(50)

params.open()


var glob_params = gui2.addFolder('World Params')
glob_params.add(W.params.dim,'w').min(100).max(600).step(100)
glob_params.add(W.params.dim,'h').min(100).max(600).step(100)
glob_params.add(simMetadata,'days').min(5).max(200).step(5)
glob_params.add(simMetadata,'TTLratio').min(100).max(3000).step(100)
glob_params.add(simMetadata,'speedTTLexp').min(0.5).max(1).step(0.1)

glob_params.open()