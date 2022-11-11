
const world = document.getElementById('world')
let world_ht = 1
world.width = window.innerHeight * world_ht
world.height = world.width


const ctx = world.getContext('2d',{willReadFrequently:true})


const WP = new paintCanvas(world, ctx, {x:world.width, y:world.height}, {
    terrains: ['media/terrains/grass.jpeg','media/terrains/stone.webp','media/terrains/wall.jpeg']
})

// ctx.fillStyle = 'rgb(240,240,240)'
// ctx.beginPath()
// ctx.arc(world.width/2,world.height/2, world.width/2 * 0.95,0, Math.PI*2)
// ctx.fill()


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
        // console.log(this.props.speed.value,this.init_ttl)
        this.dim = dim
        this.init_ttl = Math.floor(Math.pow(D / this.props.speed.value, simMetadata.speedTTLexp)) * this.dim.radius/300
        this.ttl = this.init_ttl
        this.ang = this.pos.angleTo(this.dim.center) + (Math.random()*2-1)*Math.PI/2
        // this.ang = this.pos.angleTo(dim.center)
        // this.ang = Math.random()*Math.PI*2

        this.spawn = this.pos.copy()

        this.food = 0
        this.size = 5


        this.sight = 0.5
        this.fov = this.sight

    }

    reset = () => {
        this.ttl = this.init_ttl
        this.ang = this.pos.angleTo(this.dim.center) + (Math.random()*2-1)*Math.PI/2
        // this.ang = Math.random()*Math.PI
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
        // console.log('move',this)
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
        // console.log('home',this.healthy(),this.pos.magnitude())
        // if(this.pos.x < 1) console.log(this.healthy() && this.pos.x==0)
        return (this.healthy() && Math.abs(this.pos.distTo(this.dim.center)-this.dim.radius) < 1)
    }



    reproduce = (id,pos) => {
        let temp = JSON.parse(JSON.stringify(this.props))
        for(let f in temp){
            let r = Math.random()
            let m = temp[f].mutation_chance
            let inc = r < m ? features[f].mut_inc : (r < 2*m ? -features[f].mut_inc : 0)
            temp[f].value = parseFloat(temp[f].value) +  parseFloat(inc)
            // console.log(temp.speed.value)
            temp[f].value = Math.max(Math.min(temp[f].value,features[f].max),features[f].min)
            
        }
        // console.log('mutation:',this.props.gps.value,temp.gps.value)
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

        this.update_period = 1

        this.running = false;
    }

    drawWorld = (c) => {
        let scale = world.width/2 * 0.95 / this.dim.radius

        c.fillStyle = 'white'
        c.fillRect(0,0,world.width,world.height)

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
        // console.log()

        let s=0, i=0;
        for(let g in gdata){
            // console.log(g)
            // s+=gdata[g]
            s = gdata[g]
            pop1.data.datasets[i].data.push(s)
            i++
        }
        // console.log('matches?',Object.keys(this.creatures).length == s)
        // pop1.data.labels.push('Day '+this.day)
        pop1.update()

        if(this.day % this.update_period) return;
        // console.log('updating chart on day:',this.day)
        for(let f in prop_bars){
            let d = {}
            // console.log(f)
            for(let j=features[f].min;j<=features[f].max;j+=features[f].mut_inc){
                d[Math.round(100*j)/100] = 0;
            }
            // console.log(d)
            for(let id in this.creatures){
                d[Math.round(100*this.creatures[id].props[f].value)/100] += 1
            }
            prop_bars[f].data.datasets[0].data = Object.values(d)
            // if(f=='gps')console.log(d)
            prop_bars[f].update()
        }
        // let scount = Object.keys([...Array(maxSpeed)]).map(x=>0)

        // for(let id in this.creatures){
        //     scount[this.creatures[id].props.speed.value-1]+=1
        // }
        // // console.log(scount)
        // for(let j=0;j<maxSpeed;j++){
        //     bar1.data.datasets[0].data[j] = scount[j]
        // }
        // console.log('Speed stats:', Object.values(this.creatures).map(c=>c.props.speed.val))
        // bar1.update()
    }

    clearChart = () => {
        pop1.data.labels = []
        pop1.data.datasets = []
        pop1.update()

        // bar1.data.datasets[0].data = Object.keys([...Array(maxSpeed)]).map(x=>0)
        // bar1.update()

        for(let f in prop_bars){
            prop_bars[f].data.datasets[0].data = prop_bars[f].data.datasets[0].data.map(x=>0)
            prop_bars[f].update()
        }
        
    }

    setGeneData = (graph, genes) => {
        graph.data.datasets = []
        for(let g of Object.keys(W.genes)){
            W.genes[g] = undefined;
            delete W.genes[g]
        }
        for(let i=0; i<genes.length; i++){
            let gname = genes[i].gname;
            W.genes[gname] = {
                name: gname,
                inUse: true,
                color: changeOpacity(genes[i].col, 0.6),
                props: genes[i].props
            }

            graph.data.datasets.push({
                gene: gname,
                label: gname,
                data: Object.keys(W.genes[gname].props).map(p=>W.genes[gname].props[p].value / features[p].max),
                backgroundColor: W.genes[gname].color
            })
        }
        graph.update()
        this.setupNewSim()
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
                borderColor: changeOpacity(this.genes[g].color, 0.9),
                backgroundColor: changeOpacity(this.genes[g].color, 0.4),
                // opacity: 0.5
            })
            i++
        }


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
        // now: generate population based on token system (G1=3, G2=4) --> (3/7, 4/7)
        let tokens = Object.values(this.genes).map(g=>g.props.pop.value).reduce((x,y)=>x+y); // sum of all tokens (ratio of pop values)
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
            pop1.data.datasets[j].data.push(i-cur) // init pops
            j++
            
        }

        this.day = 0

        // console.log('Setup complete!')

        // this.showStats();

        

        pop1.update()
        this.updateChart()

        // let scount = Object.keys([...Array(maxSpeed)]).map(x=>0)

        // for(let id in this.creatures){
        //     scount[this.creatures[id].props.speed.value-1]+=1
        // }
        // // console.log(scount)
        // for(let j=0;j<maxSpeed;j++){
        //     bar1.data.datasets[0].data[j] = scount[j]
        // }
        // // console.log('Speed stats:', Object.values(this.creatures).map(c=>c.props.speed.val))
        // bar1.update()




    }

    startNewSim = (days, wait=10, food_change=(f)=>f) => {
        // start simulating world

        for(let a of this.awake) this.awake.delete(a)

        pop1.data.labels = pop1.data.labels.concat([...Array(days).keys()].map(i=>'Day '+String(i+this.day)))
        pop1.update()

        this.updateChart()

        this.update_period = parseInt(Math.sqrt(days)+1)

        let day=0;
        this.running = true;
        let simulation = setInterval(()=>{
            if(day==days || this.running == false) clearInterval(simulation)
            this.simDay()
            this.updateChart()
            // this.drawWorld(ctx)
            day++
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

        if(this.running)
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
        // console.log('ended day')
    }

    showDayProgress = () => {
        this.update_period = 1
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

        this.running = true;
        let showDay = setInterval(()=>{
            this.drawWorld(ctx)
            if(!this.running) console.log('reset')
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
                        // if(f.pos == undefined) console.log('yee')
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
                    // console.log('deleting')
                    let cr = this.creatures[id]
                    // console.log(cr.healthy(),cr.home(),cr.pos.magnitude())
                    // console.log('id',id,'not awake: pos',this.creatures[id].pos.x,this.creatures[id].pos.y,'healthy:',res.healthy,'home:',res.home,'alive:',res.alive)
                    this.awake.delete(id)
                }
            }
            if(this.awake.size==0 || this.running==false) {
                console.log('stopping day sim...')
                if(this.running) this.endDay(true,false,true)
                clearInterval(showDay)
            }
        },30)

    }

    resetSimulator = () => {
        this.running = false;
        for(let f of this.food.keys()){
            this.food.delete(f);
        }
        for(let f of this.awake.keys()){
            this.awake.delete(f);
        }
        
        for(let c of Object.keys(this.creatures)){
            this.creatures[c] = undefined;
            delete this.creatures[c]
        }
        this.clearChart()
        this.drawWorld(ctx);
    }



}


// const W = new World({
//     dim: {radius: 300, center: new Vec(0,0)},
//     init_food: 100,
//     init_pop: 100,
// })