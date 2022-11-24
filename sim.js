
const world = document.getElementById('world')
let world_ht = 1
world.width = window.innerHeight * world_ht
world.height = world.width


const ctx = world.getContext('2d',{willReadFrequently:true})



class Food {
    constructor(id,pos,size=2,col='yellow'){
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
        // this.init_ttl = Math.floor(Math.pow(D / this.props.speed.value, simMetadata.speedTTLexp)) * this.dim.radius/300
        this.init_ttl = this.props.stamina.value * 10 + 100;
        this.ttl = this.init_ttl
        this.ang = this.pos.angleTo(this.dim.center) + (Math.random()*2-1)*Math.PI/2
        // this.ang = this.pos.angleTo(dim.center)
        // this.ang = Math.random()*Math.PI*2

        this.spawn = this.pos.copy()

        this.food = 0
        this.size = 5


        this.sight = 0.5
        this.fov = this.sight

        // console.log(this.ttl)
        

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
                let dx = Math.abs(f.pos.x - this.pos.x) / 10
                let dy = Math.abs(f.pos.y - this.pos.y) / 10 // scaling
                if(dx>this.props.vision.value || dy>this.props.vision.value) continue 
                if(this.pos.distTo(f.pos)/10 <= this.props.vision.value && ((Math.PI*2 + this.ang - this.pos.angleTo(f.pos))%(Math.PI*2) < this.sight)){ // fov = 0.6
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
        let r = Math.random() * 10
        if(r > this.props.greed.value || this.food==2){
            this.fov = this.sight * (1-this.props.gps.value/10)
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
        // console.log('old creature:',this.props.speed.value,temp.speed.value)
        for(let f in temp){
            // console.log(f,temp[f].value)
            let biased_coin = Math.random()
            let direction = Math.round(Math.random())*2 - 1
            let m = temp[f].mutation_chance

            let inc = (biased_coin < m) ? (features[f].mut_inc * direction) : 0 // can both increase and decrease
            // console.log(inc)

            temp[f].value = parseFloat(temp[f].value) + parseFloat(inc)
            temp[f].value = Math.max(Math.min(temp[f].value,10),0)
            
        }
        // console.log('new creature:',temp)
        // console.log('mutation:',this.props.gps.value,temp.gps.value)
        return new Creature(id,pos,this.gene,temp,this.dim)
    }
}




class World {
    constructor(params){
        // params: dimensions, init_pop, init_food, gene_split
        this.params = params;

        this.canvas = this.params.canvas;
        this.ctx = this.params.ctx;
        this.dim = params.dim   // size of world {center,radius}

        this.genes = {}

        this.creatureID = 1;    // unique creature ID

        this.food = new Set()   // set of food items in the world
        this.creatures = {}  // set of creatures currently alive
        this.awake = new Set()      // set of creatures currently alive and not home

        this.day = 0
        this.time = 0

        this.update_period = 1

        this.running = false;

        this.painter = new paintCanvas(this.canvas, this.ctx, this.params.canvas_size, this.params.painter);
        let img = new Image();
        img.src = 'media/blob.png';
        img.onload = () => {
            this.blob = img;
            this.blob.style.filter = 'hue-rotate(230deg)'
            // console.log(this.blob)
            // this.ctx.drawImage(img,0,0,img.width,img.height,100,100,20,20)
        }

        this.blobs = {};

        this.resize = (ht) => {
            // console.log('resizing')
            this.canvas.style.width = `${ht}px`;
            this.canvas.style.height = `${ht}px`;
        }

        this.stats = {
            countwise: {},
            propwise: {}
        };

        this.drawTimer()
    }

    resetPainter = () => {
        this.painter.reset();
    }

    setDraw = (v) => {
        if(this.running) return;
        this.painter.setDraw(v)
    }

    setFill = (v) => {
        if(this.running) return;
        this.painter.setFill(v)
    }

    drawWorld = () => {
        let scale = this.canvas.width/2 * 0.95 / this.dim.radius

        let c = this.ctx;
        this.painter.reset();

        c.strokeStyle = 'black'
        c.beginPath()
        c.arc(this.canvas.width/2, this.canvas.height/2,this.dim.radius*scale,0,Math.PI*2)
        c.stroke()

        c.lineWidth = 1


        for(let f of this.food){
            c.fillStyle = f.color
            c.beginPath()
            c.arc(this.canvas.width/2 + f.pos.x*scale, this.canvas.height/2 + f.pos.y*scale,f.size*scale,0,Math.PI*2)
            c.fill()
        }

        // let counter = 0;
        this.ctx.save()
        for(let id in this.creatures){
            if(this.creatures[id] == undefined) console.log('ye')
            // if(id!=10) continue;
            let f = this.creatures[id]
            // console.log(f==undefined)
            // c.fillStyle = f.food > 0 ? (f.food > 1 ? 'green' : 'blue') : 'grey'

            

            // console.log(this.creatures[id])
            let img = this.blobs[this.genes[this.creatures[id].gene].img];
            let blob_size = 15;
            this.ctx.drawImage(
                    img,
                    0,0,
                    img.width,img.height,
                    (this.canvas.width/2) + (f.pos.x * scale) - blob_size/2,(this.canvas.height/2) + (f.pos.y * scale) - blob_size/2,
                    blob_size,blob_size
                )

            // let col = 'rgb(255,'+String(255 - f.props.speed.value*(255)/(maxSpeed-1))+',0)'
            // c.fillStyle = col;
            // c.beginPath()
            // c.arc(this.canvas.width/2 + f.pos.x*scale, this.canvas.height/2 + f.pos.y*scale,f.size*scale,0,Math.PI)
            // c.fill()
            // c.fillStyle = f.food > 1 ? 'green' : (f.food > 0 ? 'blue' : 'grey')
            // c.beginPath()
            // c.arc(this.canvas.width/2 + f.pos.x*scale, this.canvas.height/2 + f.pos.y*scale,f.size*scale,Math.PI,Math.PI*2)
            // c.fill()

            

            c.fillStyle = 'rgba(150,150,150,0.3)'
            c.beginPath()
            c.arc(this.canvas.width/2 + f.pos.x*scale, this.canvas.height/2 + f.pos.y*scale,f.props.vision.value*10*scale,f.ang-f.fov,f.ang+f.fov)
            c.lineTo(this.canvas.width/2 + f.pos.x*scale, this.canvas.height/2 + f.pos.y*scale)
            c.fill()

            // counter++
        }
        this.ctx.restore()

        // console.log('Drew',counter,'blobs')
        this.drawTimer()
    }

    drawTimer = () => {
        let percent = this.time / 200
        this.ctx.save()

        let x = this.canvas.width * 0.93
        let y = this.canvas.height * 0.93
        let r = this.canvas.width * 0.03

        this.ctx.beginPath()
        this.ctx.arc(x,y,r, 0, Math.PI*2)
        this.ctx.strokeStyle = 'black'
        this.ctx.lineWidth = 2;
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.moveTo(x,y)
        this.ctx.arc(x,y,r, -Math.PI/2, Math.PI*2*percent-Math.PI/2)
        this.ctx.fillStyle = 'red'
        this.ctx.fill()

        this.ctx.font = '10px serif'
        this.ctx.fillStyle = 'black'

        this.ctx.fillText('0',x-2, y-r-2)
        this.ctx.fillText('50',x+r+2, y+3)
        this.ctx.fillText('100',x-7, y+r+10)
        this.ctx.fillText('150',x-r-18,y+3)

        this.ctx.restore()
    }

    getRandStartingPos = () => {
        let ang = Math.random()*Math.PI*2
        return new Vec(Math.cos(ang)*this.dim.radius, Math.sin(ang)*this.dim.radius).addC(this.dim.center)
        // return pos;
    }

    placeFood = (num_food) => {
        for(let i=0;i<num_food;i++){
            // let x=-1,y=-1;
            // do{
            //     x = Math.random() * this.canvas.width;
            //     y = Math.random() * this.canvas.height;
            // } while(this.painter._worldContains({x:x-this.canvas}))

            let d = Math.random()*this.dim.radius
            let a = Math.random()*Math.PI*2
            this.food.add(new Food(i, new Vec(Math.cos(a)*d,Math.sin(a)*d)))
        }
    }


    setGeneData = (genes) => {
        popLine.data.labels = []
        popLine.data.datasets = []
        for(let gname in genes){
            this.genes[gname] = {...genes[gname]}

            popLine.data.datasets.push({
                data: [],
                label: gname,
                borderColor: changeOpacity(genes[gname].color, 0.8),
                pointBorderWidth: 1,
                backgroundColor: changeOpacity(genes[gname].color, 0.4)
            })
        }
 
        this._loadBlobs();
        this.setupNewSim();
        showGeneData();

    }

    saveGeneData = () => {
        download(JSON.stringify(this.genes), 'genes.txt', 'text');
    }

    loadGeneData = () => {
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => { 

            // getting a hold of the file reference
            var file = e.target.files[0]; 
         
            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
         
            // here we tell the reader what to do when it's done reading...
            reader.onload = readerEvent => {
               var content = readerEvent.target.result; // this is the content!
            //    console.log( content );
                var gene_data = JSON.parse(content);
                this.setGeneData(gene_data)
            }
         
        }
         
        //  input.click();

        var gene_data = JSON.parse(
            `{"Gene1":{"name":"Gene1","inUse":true,"color":"rgb(223,135,97,0.6)","img":"media/blob_draw/orange.png","colorName":"orange","props":{"speed":{"value":5,"mutation_chance":0},"stamina":{"value":5,"mutation_chance":0},"vision":{"value":5,"mutation_chance":0},"gps":{"value":5,"mutation_chance":0},"greed":{"value":5,"mutation_chance":0}},"pop":1},"Gene2":{"name":"Gene2","inUse":true,"color":"rgb(64,170,216,0.6)","img":"media/blob_draw/blue.png","colorName":"blue","props":{"speed":{"value":8,"mutation_chance":0},"stamina":{"value":4,"mutation_chance":0},"vision":{"value":5,"mutation_chance":0.3},"gps":{"value":3,"mutation_chance":0},"greed":{"value":5,"mutation_chance":0}},"pop":1}}`
        )
        this.setGeneData(gene_data);

        
    }

    setupStats = () => {
        for(let g in this.genes){
            this.stats.countwise[g] = 0
        }
        for(let f in features){
            let len = parseInt(10/(features[f].mut_inc)) + 1
            // console.log(f,features[f].mut_inc,len)
            this.stats.propwise[f] = [...Array(len)].map(x=>0);
            propBars[f].data.datasets[0].data = []
            for(let i=0;i<this.stats.propwise[f].length;i++)
                propBars[f].data.datasets[0].data.push(0);
            propBars[f].data.labels = this.stats.propwise[f].map((x,i)=>Math.round(i*features[f].mut_inc*10)/10)
            propBars[f].data.datasets[0].backgroundColor = this.stats.propwise[f].map((x,i)=>{
                let col = 'rgba(0,128,128,1)'
                return changeOpacity(col,i/this.stats.propwise[f].length)
            })
            propBars[f].data.datasets[0].borderColor = this.stats.propwise[f].map((x,i)=>{
                return 'rgba(0,128,128,1)'
            })
            
            propBars[f].update()
        }
    }

    calculateStats = () => {
        this.setupStats();
        for(let cid in this.creatures){
            let c = this.creatures[cid];
            this.hanldeBirthStats(c); // treat this creature as new
        }
    }

    handleDeathStats = (c) => {
        this.stats.countwise[c.gene] -= 1;
        for(let f in c.props){
            let index = parseInt(c.props[f].value / features[f].mut_inc)
            this.stats.propwise[f][index] -= 1
        }
    }

    hanldeBirthStats = (c) => {
        this.stats.countwise[c.gene] += 1;
        for(let f in c.props){
            let index = parseInt(c.props[f].value / features[f].mut_inc)
            // console.log('updating index',index)
            this.stats.propwise[f][index] += 1
            // console.log(this.stats.propwise[f])
        }
    }

    newDayStats = () => {
        if(this.day != popLine.data.labels.length-1)
            popLine.data.labels.push(`T+${this.day}`)
        this.calculateStats()
        let i=0;
        for(let g in this.genes){
            popLine.data.datasets[i].data.push(this.stats.countwise[g]);
            i++;
        }
        popLine.update();

        for(let f in this.stats.propwise){
            for(let i=0;i<this.stats.propwise[f].length;i++)
                propBars[f].data.datasets[0].data[i] = this.stats.propwise[f][i]
            propBars[f].update()
            // console.log(propBars[f].data.datasets[0].data)
        }
    }

    findDominant = () => {
        let propwise = {};

        for(let cid in this.creatures){
            let c = this.creatures[cid];
            let s = this.genes[c.gene].colorName
            for(let prop in c.props){
                let v = c.props[prop].value;
                v = Math.floor(v);
                v = String(v);
                s += '-'+v;
            }
            
            let cur = 0;
            if(s in propwise){
                cur = propwise[s]
            }
            propwise[s] = cur + 1;
        }

        // alert(JSON.stringify(this.stats))
        showDominant(propwise);

    }


    _loadBlobs = () => {
        for(let g in this.genes){
            if(this.genes[g].img in this.blobs) continue;
            // console.log('loading',this.genes[g].img)
            let img = new Image();
            img.src = this.genes[g].img
            img.onload = () => {
                this.blobs[this.genes[g].img] = img;
                console.log('loaded',this.genes[g].img)
            }
        }
    }

    setupNewSim = () => {
        // set world back to init

        let i=0;
        let opac = 0.4
        


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
        let tokens = Object.values(this.genes).map(g=>g.pop).reduce((x,y)=>x+y); // sum of all tokens (ratio of pop values)
        // console.log('tokens:',tokens)
        let j=0;
        for(let gene in this.genes){
            // each gene name
            let cur = i;
            while (i < cur + tot*this.genes[gene].pop/tokens){
                this.creatureID++
                this.creatures[this.creatureID] = new Creature(this.creatureID, this.getRandStartingPos(), gene, this.genes[gene].props, this.dim)
                i++
            }
            j++
            
        }

        this.day = 0
        this.time = 0

        // this.setupStats();
        this.running = false;
        // this.calculateStats()
        this.newDayStats();
        this.findDominant();

        this.resetPainter()
    }

    startNewSim = (days, wait=10, food_change=(f)=>f) => {
        // start simulating world

        for(let a of this.awake) this.awake.delete(a)

        // this.newDayStats()

        this.update_period = parseInt(Math.sqrt(days)+1)

        let day=0;
        this.running = true;
        let simulation = setInterval(()=>{
            if(day==days || this.running == false) clearInterval(simulation)
            this.simDay()
            // this.newDayStats()
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
        let net = 0;
        for(let id of curIDs){
            let c = this.creatures[id]
            if(c.home()) {
                if(c.food == 2){
                    // console.log('birth')
                    this.creatureID+=1
                    this.creatures[this.creatureID] = c.reproduce(this.creatureID,this.getRandStartingPos())
                    net += 1
                    // birth
                    // this.hanldeBirthStats(this.creatures[this.creatureID]);
                    // console.log('Current speed:',c.props.speed.val,'Baby speed:',this.creatures[this.creatureID].props.speed.val)
                }
                c.reset()
            }
            else {
                // kill the creature
                // this.handleDeathStats(this.creatures[id])
                // console.log('death')
                net -= 1;
                this.creatures[id] = undefined
                delete this.creatures[id]
                // console.log('killed creature')
            }
        }
        // console.log(`${net} net pop | ${Object.keys(this.creatures).length} remaining`)
        // console.log('after ending day:',Object.keys(this.creatures).length)

        this.day++
        this.time = 0

        this.findDominant()
        this.newDayStats();
        // this.showStats()
        if(draw) this.drawWorld()
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
        // console.log('Num awake:',this.awake.size)

        this.running = true;
        let showDay = setInterval(()=>{
            this.drawWorld()
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
                // console.log('stopping day sim...')
                if(this.running) this.endDay(true,false,true)
                clearInterval(showDay)
            }

            this.time++
            this.drawTimer()

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
        this.drawWorld();
    }



}


const W = new World({
    canvas: world,
    ctx: ctx,
    dim: {radius: 300, center: new Vec(0,0)},
    canvas_size: {x: world.width, y: world.height},
    painter: {
        terrains: [
            {
                src:'media/terrains/grass.jpeg',
                ratio:0.2,
            },
            {
                src:'media/terrains/stone.webp',
                ratio:0.5,
            },
            {
                src:'media/terrains/wall.jpeg',
                ratio:0.2,
            },
        ],
        borderCheck: (crd,canvas) => {
            // return !(crd.x < 0 || crd.y < 0 || crd.x >= canvas.width || crd.y >= canvas.height) // rect
            return new Vec(crd.x,crd.y).distTo(new Vec(canvas.width/2,canvas.width/2)) <= canvas.width/2 * 0.95
        },
        boundaryCheck: (rgb) => {
            return (rgb[0] == 0 && rgb[1] == 0 && rgb[2] == 0)
        },
        touchUps: (painter) => {
            console.log(painter.ctx.strokeStyle)
            painter.ctx.save();
            painter.ctx.fillStyle = 'rgb(200,200,200)'
            painter.ctx.fillRect(0,0,painter.canvas.width,painter.canvas.height);
            painter.ctx.beginPath();
            painter.ctx.strokeStyle = 'black'
            painter.ctx.lineWidth = 5
            painter.ctx.arc(painter.canvas.width/2+1,painter.canvas.height/2+1,painter.canvas.width/2 * 0.95 + 2.2,0,Math.PI*2);
            console.log(painter.ctx.strokeStyle)
            painter.ctx.stroke();
            painter.ctx.closePath();
            // console.log('done')
            painter.ctx.restore();
        }
    },

    init_food: 100,
    init_pop: 100,
})

document.addEventListener('keydown', e => {
    if(e.key == 'r'){
        W.showDayProgress()
    }
    if(e.key == '1'){
        W.startNewSim(2,1)
    }
    if(e.key == '2'){
        W.startNewSim(100,1)
    }
})