// Main code for logic and environment setup
// ----------------------------------------------------------------------


// World canvas setup
const world = document.getElementById('world')
let world_ht = 1
world.width = window.innerHeight * world_ht
world.height = world.width

// World context
const ctx = world.getContext('2d',{willReadFrequently:true})



// Food --> individual food item spawned in the world
class Food {
    constructor(id,pos,size=2,col='yellow'){
        // display & env properties
        this.id = id
        this.pos = pos;
        this.size = size;
        this.holder = null;
        this.color = col;
    }
}

// Creature --> individual creature alive in the world
// 
// methods: move, tryEating, eat, healthy?, home?, reproduce, boostTrait, onSuccess, ...
//
class Creature {
    constructor(id,pos,gene,props,dim){
        this.id = id
        this.pos = pos
        this.gene = gene // gene name of creature, used to obtain other properites
        this.props = JSON.parse(JSON.stringify(props)); // feature properties and mutation settings
        // parsing json
        for(let f in this.props){
            this.props[f].value = parseFloat(this.props[f].value)
            this.props[f].mutation_chance = parseFloat(this.props[f].mutation_chance)
        }
        // console.log(this.props.speed.value,this.init_ttl)

        this.dim = dim  // dimensions of current inhabited world

        // begin with a random angle to face towards the world
        this.ang = this.pos.angleTo(this.dim.center) + (Math.random()*2-1)*Math.PI/2

        // spawn point (home)
        this.spawn = this.pos.copy()



        this.food = 0   // current amt of food
        this.size = 5   // radius of blob


        this.sight = 0.5    // base angle of view (fov)
        this.fov = this.sight // modified dynamic fov (depending on status)


        this.maxTokens = 30;    // trait token limit

        this.target = {     // current ambition of creature: could be looking for (food, home)
            looking_for: 'food',
            pos: null,  // position of identified target
            fid: null   // identified food item
        }

        this.norm_props = {}    // normalized props to [0,10]
        this.normalizeProps();

        this.init_ttl = this.norm_props.stamina.value;  // time to live (shelf life) <--- stamina
        this.ttl = this.init_ttl; // current ttl, reduces every timestep

        this.age = 0;   // no. of days survived


        // debug settings
        if(TESTING){
            this.pos = new Vec(dim.center.x,dim.center.y)
            this.spawn = new Vec(dim.radius,0);
            this.food = 1;
            this.target.looking_for = 'home'
        }

    }

    // set all feature scales to normalized appropriate world amounts
    // based on evidence and size of world
    normalizeProps = () => {
        clearObject(this.norm_props);

        for(let f in this.props){
            let v;
            switch(f){
                case 'speed':
                    v = this.props[f].value * 0.8; break;   
                case 'stamina':
                    v = this.props[f].value * Math.floor(maxTime/10); break;
                case 'vision':
                    v = this.props[f].value * 10; break;
                case 'gps':
                    v = Math.pow(this.props[f].value * 0.1, 1); break;
                case 'greed':
                    v = Math.pow(this.props[f].value * 0.1, 1); break;
                default:
                    v = this.props[f].value;
            }
            this.norm_props[f] = {
                value: v,
                mutation_chance: this.props[f].mutation_chance
            }
        }
    }

    // reset relevant params upon surviving the day
    daySuccess = () => {
        this.ttl = this.init_ttl
        this.age += 1;
        this.ang = this.pos.angleTo(this.dim.center) + (Math.random()*2-1)*Math.PI/2 // random starting angle
        this.food = 0
        this.fov = this.sight
        this.spawn = this.pos.copy()
        this.target.looking_for = 'food'
        this.target.pos = null;
        this.target.fid = null;
    }

    // find nearby food using vision strength and FOV
    nearbyFood = (food_cells,close=null) => {
        // 2d array of sets
        // look through surrounding cells of enough length
        let world_size = this.dim.radius*2;

        // Grid System -------------------
        // to optimize searching for food, we design a grid system and load each food item's location in the correct grid cell
        // when a creature searches for food, we only need to search the surrounding grid cells lying within the FOV
        let grid_size = world_size / food_cells.length;
        let grid_search_range = (close!=null) ? 1 : Math.ceil(this.props.vision.value / grid_size);

        let x=this.pos.x, y=this.pos.y
        let gridX = Math.floor((x+world_size/2)*food_cells.length / (world_size))
        let gridY = Math.floor((y+world_size/2)*food_cells.length / (world_size))

        let res = []
        for(let i=Math.max(0,gridX-grid_search_range);i<=Math.min(food_cells.length-1,gridX+grid_search_range);i++){
            for(let j=Math.max(0,gridY-grid_search_range);j<=Math.min(food_cells.length-1,gridY+grid_search_range);j++){
                for(let val of food_cells[i][j]) res.push(val);
            }
        }
        // console.log(res)
        return res;
    }

    // Most important logic
    // Determines movement and tick-based functions to perform
    move = (food,food_cells) => {

        let speed_slower = 1;   // modify speed based on conditions

        // If in search of food,
        // --------------------------------------------------
        if(this.target.looking_for == 'food'){
            // console.log('foodie')

            // if no food has been identified,
            // look for nearest reachable food item
            if(this.target.fid == null){
                let foodID = this.nearbyFood(food_cells); // find nearest reachable food

                if(this.food < 2){
                    for(let fid of foodID){
                        if(food[fid] == undefined) continue; // for example, if another blob has already taken the food identified
                        let f = food[fid]
                        // console.log(fid,f)

                        // check if food is visible in this timestep
                        let dx = Math.abs(f.pos.x - this.pos.x)
                        let dy = Math.abs(f.pos.y - this.pos.y) // scaling
                        if(dx>this.norm_props.vision.value || dy>this.norm_props.vision.value) continue 
                        // if food item is visible, update target props
                        if(this.pos.distTo(f.pos) <= this.norm_props.vision.value && ((Math.PI*2 + this.ang - this.pos.angleTo(f.pos))%(Math.PI*2) < this.sight)){ // fov = 0.6
                            this.target.looking_for = 'food'
                            this.target.pos = f.pos
                            this.target.fid = fid

                            this.ang = this.pos.angleTo(f.pos);
                            // console.log('found food',fid)
                            
                            break;
                        }           
                    }
                }
                // if target food item is null, face a random direction within fov
                if(this.target.fid == null)
                    this.ang += (Math.random()*2-1) * this.fov
            }
            else{
                // keep going in the same direction;
                if(food[this.target.fid] == undefined){
                    this.target.pos = null;
                    this.target.fid = null;
                }
            }
        }
        else{
            // looking for home

            if(this.pos.distTo(this.spawn) <= this.norm_props.vision.value && ((Math.PI*2 + this.ang - this.pos.angleTo(this.spawn))%(Math.PI*2) < this.sight)){ // fov = 0.6
                this.target.pos = this.spawn
            } 

            this.ang = this.pos.angleTo(this.spawn);
            // console.log(ang_to_spawn)
            let dist_to_spawn = this.pos.distTo(this.spawn);

            // GPS influence --> create uncertainty and error in target direction --> lowers speed, and increases angle variability
            if(this.target.pos == null){
                // create error in position belief

                // let err_radius = this.dim.radius * 1 * (1 - this.norm_props.gps.value);
                // choose random point in this circle;
                // let pseudo = randomPointInCircle(this.pos, err_radius);
                // this.ang = pseudo.angleTo(this.spawn)

                let min_speed = 0.2
                speed_slower = min_speed + this.norm_props.gps.value * (1-min_speed); // reduce speed based on gps confidence
                let coin1 = Math.random()*2 - 1; // tossing a continuous coin [-1,1]
                let min_err = Math.PI/8;
                let err_range = Math.PI*1 - min_err
                let ang_err = (coin1 * err_range) + min_err // generate angular error based on coin flip with constant error range
                // // let coin2 = Math.random();

                // // error reduces with distance?
                // ie, closer you are to the target, lower the error impacted
                let err = ang_err * (1-this.norm_props.gps.value) //* Math.min(1,Math.pow(dist_to_spawn / this.dim.radius,0.2))
                this.ang += err
            }
            
        }


        let step = randVec(this.norm_props.speed.value * speed_slower, this.ang) // not actually random, specified distance and angle
        this.pos.add(step)  // move by `step`
        this.pos = this.pos.bordered(this.dim) // control the boundary limits of the creature
        // console.log('move',this)
        this.ttl--
        // if(this.ttl == 0) console.log('dead :(')

        // return whether creature can move again
        return (!this.home() && this.alive())
        // if ttl > 0 and not home yet, returns TRUE
        // if dead, or reached home, returns FALSE
    }

    // attempt to eat food item in `target` property
    tryEating = (food,food_cells) => {
        if(this.target.looking_for != 'food') return null;
        if(this.target.fid == null) return null;

        let fid = this.target.fid
        // console.log(this.id,'wants food',fid,food[fid])
        // check distance constraint
        if(this.pos.distTo(food[fid].pos) > this.size + food[fid].size) return null;
        // else, eat
        // console.log(this.id,'eating',fid)
        this.eat()
        return fid;
    }

    // Eat food item, and update ambitions
    eat = () => {
        this.food += 1
        this.target.pos = null;
        this.target.fid = null;
        
        // console.log('eating')
        
        // choose whether to go back home
        // Greed influence
        let r = Math.random()   // toss a biased coin based on props.greed.value

        if(r > this.norm_props.greed.value || this.food==2){    // if already has 2 food, or coin fails, look for home
            this.fov = this.sight * (1-this.norm_props.gps.value)
            this.fov = 0
            this.ang = this.pos.angleTo(this.spawn)
            // console.log(this.id,'going home')
            this.target.looking_for = 'home';
        }
        else{   // otherwise, considered greedy, looks for more food
            // console.log(this.id,'greedy')
            this.target.looking_for = 'food';
        }
    }

    alive = () => {return this.ttl > 0}
    healthy = () => {return this.food > 0}
    home = () => {
        // returns whether back home healthy
        // check if at spawn point
        return (this.healthy() && Math.abs(this.pos.distTo(this.spawn)) < this.size/2)
    }

    // compute feature token total
    energyUsed = () => {
        let s=0;
        for(let prop in this.props) s += this.props[prop].value;
        return s;
    }

    // handle MUTATION
    // if a trait mutates, it uses up excess energy, so other traits must be reduced
    boostTrait = (prop, direction) => { // direction = upwards or downwards
        let v = this.props[prop].value;
        let change = features[prop].mut_inc
        let new_val = roundTraitValue(v + (direction*change))
        this.props[prop].value = Math.max(Math.min(10, new_val),0) // bound to [0,10]

        // console.log(`New ${prop}:${v}->${this.props[prop].value}`)


        // if too much energy used, damage other traits
        if(this.energyUsed() > this.maxTokens){
            let rand_prop;
            let ps = Object.keys(this.props);
            do{
                rand_prop = ps[Math.floor(Math.random()*ps.length)]; // choose a random trait to damage
                while(this.props[rand_prop].value > 0 && this.energyUsed() > this.maxTokens){ // reduce the value of this trait 
                    let val = this.props[rand_prop].value
                    this.props[rand_prop].value = roundTraitValue(val-features[rand_prop].mut_inc)
                }
                // console.log(`Damaging ${rand_prop}`)
            } while(this.energyUsed()>this.maxTokens)
        }
        // after mutation handling, normalize props to fit the world sim
        this.normalizeProps();
    }

    // if 2 foods, and day success, reproduce an offspring
    reproduce = (id,pos) => {
        let offspring = new Creature(id,pos,this.gene,this.props,this.dim)
        // for each feature, try mutating (using mutation_chance)
        for(let f in offspring.props){
            let coin = Math.random() < offspring.props[f].mutation_chance; // biased coin toss (mutation_chance)
            let dir = Math.round(Math.random())*2 - 1 // + or - 1

            if(coin){
                offspring.boostTrait(f,dir);
            }
            // console.log(coin)
        }
        return offspring;
    }
}



// Class World ---> defines world properties, display functions, simulation settings, paint features
// 
// Handles stats and graph syncing

class World {
    constructor(params){
        // params: dimensions, init_pop, init_food, gene_split
        this.params = params;

        this.canvas = this.params.canvas;
        this.ctx = this.params.ctx;
        this.dim = params.dim   // size of world {center,radius}

        this.genes = {}

        this.creatureID = 1;    // unique creature ID

        this.food = {}   // set of food items in the world
        this.food_cells = []
        let gsize = 10;
        for(let i=0;i<gsize;i++){
            this.food_cells.push([])
            for(let j=0;j<gsize;j++)
                this.food_cells[i].push(new Set())
        }
        this.creatures = {}  // set of creatures currently alive
        this.awake = new Set()      // set of creatures currently alive and not home

        this.currentDay = 0
        this.startDay = 0
        this.stopDay = 0
        this.time = 0


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
            propwise: {},
            agewise: {}
        };

        this.drawTimer()

        this.intervals = new Set();


        //TESTING
        this.food_frequency = Math.floor(maxTime/this.params.food_frequency);

    }

    resetPainter = (complete=false) => {
        this.painter.reset(complete);
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

        // c.strokeStyle = 'black'
        // c.beginPath()
        // c.arc(this.canvas.width/2, this.canvas.height/2,this.dim.radius*scale,0,Math.PI*2)
        // c.stroke()

        c.lineWidth = 1


        for(let fid in this.food){
            let f = this.food[fid]
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

            this.ctx.font = '10px serif'
            this.ctx.fillStyle = 'red'
            // this.ctx.fillText(id, this.canvas.width/2+f.pos.x*scale,this.canvas.height/2+f.pos.y*scale-10)

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
        let percent = this.time / maxTime
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
        this.ctx.fillStyle = 'rgb(100,100,100)'
        this.ctx.fill()

        this.ctx.font = '10px serif'
        this.ctx.fillStyle = 'black'

        this.ctx.fillText('0',x-2, y-r-2)
        this.ctx.fillText(Math.floor(maxTime/4),x+r+2, y+3)
        this.ctx.fillText(Math.floor(maxTime/2),x-7, y+r+10)
        this.ctx.fillText(Math.floor(3*maxTime/4),x-r-18,y+3)

        this.ctx.restore()
    }

    getRandStartingPos = () => {
        let ang = Math.random()*Math.PI*2
        return new Vec(Math.cos(ang)*this.dim.radius, Math.sin(ang)*this.dim.radius).addC(this.dim.center)
        return randomPointInCircle(this.dim.center, this.dim.radius)
        // return pos;
    }

    injectFood = (num_food,beginning=true) => {

        if(beginning){
            clearObject(this.food)
            this.foodID = 0;
            for(let i=0;i<this.food_cells.length;i++){
                for(let j=0;j<this.food_cells[i].length;j++){
                    this.food_cells[i][j].clear();
                }
            }
        }

        // console.log('adding foods')
        
        for(let i=0;i<num_food;i++){
            let rand_point = randomPointInCircle(this.dim.center, this.dim.radius)
            // let x=-1,y=-1;
            // do{
            //     x = (Math.random()*2-1) * this.dim.radius;
            //     y = (Math.random()*2-1) * this.dim.radius;
            // } while(new Vec(x,y).distTo(this.dim.center) > this.dim.radius)

            // let d = Math.random()*this.dim.radius
            // let a = Math.random()*Math.PI*2
            // this.food.add(new Food(i, new Vec(Math.cos(a)*d,Math.sin(a)*d)))
            let gridX = Math.floor((rand_point.x+this.dim.radius)*this.food_cells.length / (this.dim.radius*2))
            let gridY = Math.floor((rand_point.y+this.dim.radius)*this.food_cells.length / (this.dim.radius*2))
            // console.log()
            this.food_cells[gridX][gridY].add(i)
            this.food[this.foodID] = new Food(this.foodID, rand_point)//,2,`rgb(150,${gridX*20},${gridY*20})`)
            this.foodID++;
        }
    }


    setGeneData = (genes) => {
        // console.log(genes)
        popLine.data.labels = []
        popLine.data.datasets = []
        clearObject(this.genes)
        
        for(let gname in genes){
            this.genes[gname] = {...genes[gname]}

            popLine.data.datasets.push({
                data: [],
                label: gname,
                borderColor: changeOpacity(genes[gname].color, 0.8),
                pointBorderWidth: 1,
                backgroundColor: changeOpacity(genes[gname].color, 0.4),

                parsing: false,
                normalized: true
            })
        }
 
        this._loadBlobs();
        showGeneData(this.genes);
        this.setupNewSim();

    }

    saveGeneData = () => {
        download(JSON.stringify(this.genes), 'genes.txt', 'text');
    }

    loadGeneData = (str=null) => {

        if(str != null) this.setGeneData(JSON.parse(str));
        else{
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
             
             input.click();
    
        }
        
        

        
    }

    setupStats = () => {
        for(let g in this.genes){
            this.stats.countwise[g] = 0
        }
        let j=0;
        allTrends.data.datasets = [];
        allTrends.data.labels = [];
        for(let f in trendCharts){

            // TREND GRAPHS
            trendCharts[f].chart.data.labels = [`T+0`];
            let i=0;
            trendCharts[f].chart.data.datasets = [{
                data:[],
                label: 'overall',
                borderColor: 'black',
                borderWidth: 1.5
            }]
            trendCharts[f].chart.options.plugins.annotation.annotations['overall'] = 
            {
                type: 'line',
                yMin: 7,
                yMax: 7,
                borderColor: changeOpacity('rgba(0,0,0,1)',1),
                borderWidth: 1.2,
                borderDash: [2]
            }
            trendCharts[f].cur_mean['overall'] = {num:0,sum:0}

            allTrends.data.datasets.push({
                label: f,
                data:[],
                borderColor: gcols[gcol_names[j++]]
            })

            for(let g in this.genes){
                // trendCharts[f].chart.options.plugins.annotation.annotations[g] = 
                // {
                //     type: 'line',
                //     yMin: 7,
                //     yMax: 7,
                //     borderColor: changeOpacity(this.genes[g].color,0.5),
                //     borderWidth: 1,
                // }
                trendCharts[f].chart.data.datasets.push({
                    label:g,
                    data:[],
                    borderColor: this.genes[g].color,
                    hidden: true
                });
                trendCharts[f].cur_mean[g] = {num:0,sum:0}
            }

            

            if(f in features == false) continue; // 'age', etc


            // PROP BARS
            let len = parseInt(10/(features[f].mut_inc)) + 1
            // console.log(f,features[f].mut_inc,len)
            this.stats.propwise[f] = [...Array(len)].map(x=>0);
            propBars[f].data.datasets[0].data = []
            for(let i=0;i<this.stats.propwise[f].length;i++)
                propBars[f].data.datasets[0].data.push({
                    x: i,
                    y: 0
                });
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

    handleDeathStats = (c) => {
        this.stats.countwise[c.gene] -= 1;
        for(let f in c.props){
            let index = parseInt(c.props[f].value / features[f].mut_inc)
            this.stats.propwise[f][index] -= 1


            trendCharts[f].cur_mean[c.gene].num -= 1
            trendCharts[f].cur_mean[c.gene].sum -= c.props[f].value

            trendCharts[f].cur_mean['overall'].num -= 1
            trendCharts[f].cur_mean['overall'].sum -= c.props[f].value
        }

        trendCharts['age'].cur_mean[c.gene].num -= 1
        trendCharts['age'].cur_mean[c.gene].sum -= c.age

        trendCharts['age'].cur_mean['overall'].num -= 1
        trendCharts['age'].cur_mean['overall'].sum -= c.age
    }

    hanldeBirthStats = (c) => {
        this.stats.countwise[c.gene] += 1;
        // console.log(c.props.vision.value)
        for(let f in c.props){
            let index = parseInt(c.props[f].value / features[f].mut_inc)
            // if(f=='vision') console.log('updating index',index,c.props.vision.value)
            this.stats.propwise[f][index] += 1
            // console.log(this.stats.propwise[f])

            trendCharts[f].cur_mean[c.gene].num += 1
            trendCharts[f].cur_mean[c.gene].sum += c.props[f].value

            trendCharts[f].cur_mean['overall'].num += 1
            trendCharts[f].cur_mean['overall'].sum += c.props[f].value
        }

        trendCharts['age'].cur_mean[c.gene].num += 1
        trendCharts['age'].cur_mean[c.gene].sum += c.age

        trendCharts['age'].cur_mean['overall'].num += 1
        trendCharts['age'].cur_mean['overall'].sum += c.age
    }

    newDayStats = () => {

        // console.log('new day')
        let sim_length = this.stopDay-this.startDay
        let update_freq = Math.max(1,Math.floor(sim_length/100));
        let update_chart = Boolean((this.currentDay-this.startDay)%update_freq==0 || this.stopDay==this.currentDay)

        // if(this.currentDay == popLine.data.labels.length-1) alert('hmm')

        popLine.data.labels.push(`T+${this.currentDay}`)
        document.getElementById('day-number').innerHTML = this.currentDay;
        // this.calculateStats()
        let i=0;
        let pop = 0;
        for(let g in this.genes){
            // console.log(i,g,popLine.data.datasets)
            popLine.data.datasets[i].data.push(
                    {x:this.currentDay, y:this.stats.countwise[g]}
                );
            i++;
            pop+=this.stats.countwise[g];
        }
        if(update_chart) popLine.update();

        document.getElementById('pop-number').innerHTML = pop;

        let j=0
        allTrends.data.labels.push(`T+${this.currentDay}`)

        for(let f in trendCharts){
            // console.log(this.stats.propwise[f])
            if(f in features){
                for(let i=0;i<this.stats.propwise[f].length;i++)
                propBars[f].data.datasets[0].data[i].y = this.stats.propwise[f][i]
                if(update_chart) propBars[f].update()
            }
            
            trendCharts[f].chart.data.labels.push(`T+${this.currentDay}`)
            i=0
            let mData = trendCharts[f].cur_mean['overall'];
            let mean;
            if (mData.num == 0) 
                mean = 0
            else 
                mean = Math.round(100*mData.sum / mData.num)/100

            allTrends.data.datasets[j++].data.push(mean)
            trendCharts[f].chart.data.datasets[i++].data.push(mean)

            for(let g in this.genes){
                let mData = trendCharts[f].cur_mean[g];
                let mean;
                if (mData.num == 0) 
                    mean = 0
                else 
                    mean = Math.round(100*mData.sum / mData.num)/100
                trendCharts[f].chart.data.datasets[i++].data.push(mean)
            }
            // console.log(trendCharts[f].chart.data)

            
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
        this.params.init_pop = init_pop()
        this.params.init_food = init_food()
        
        this.setupStats();

        // this.creatures = new Set()
        clearObject(this.creatures)
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
                this.hanldeBirthStats(this.creatures[this.creatureID])
                i++
            }
            j++
            
        }

        this.currentDay = 0
        this.time = 0

        this.running = false;
        // this.calculateStats()
        this.newDayStats();
        this.findDominant();

        this.resetPainter()
    }

    startNewSim = (days, wait=10) => {
        // start simulating world

        for(let a of this.awake) this.awake.delete(a)

        // this.newDayStats()

        this.stopDay = this.currentDay + days;
        this.startDay = this.currentDay;

        let day=0;
        this.running = true;
        this.intervals.add(
            setInterval(
                () => {
                    if(this.currentDay==this.stopDay || this.running == false) {
                        // console.log('enough')
                        this.stopSim();
                        return;
                    }
                    this.simDay()
                    // this.newDayStats()
                    // this.drawWorld(ctx)
                    // console.log('day',this.currentDay,this.stopDay)
                    day++
                },
                wait
            )
        )     
    }


}

let init_pop = () => TESTING ? 1 : 100
let init_food = () => TESTING ? 0 : 100
let food_freq = () => 1


// const W = new World({
//     canvas: world,
//     ctx: ctx,
//     dim: {radius: 300, center: new Vec(0,0)},
//     canvas_size: {x: world.width, y: world.height},
//     painter: {
//         terrains: [
//             {
//                 src:'media/terrains/grass.jpeg',
//                 ratio:0.2,
//             },
//             {
//                 src:'media/terrains/stone.webp',
//                 ratio:0.5,
//             },
//             {
//                 src:'media/terrains/wall.jpeg',
//                 ratio:0.2,
//             },
//         ],
//         borderCheck: (crd,canvas) => {
//             // return !(crd.x < 0 || crd.y < 0 || crd.x >= canvas.width || crd.y >= canvas.height) // rect
//             return new Vec(crd.x,crd.y).distTo(new Vec(canvas.width/2,canvas.width/2)) <= canvas.width/2 * 0.95
//         },
//         boundaryCheck: (rgb) => {
//             return (rgb[0] == 0 && rgb[1] == 0 && rgb[2] == 0)
//         },
//         touchUps: (painter) => {
//             console.log(painter.ctx.strokeStyle)
//             painter.ctx.save();
//             painter.ctx.fillStyle = 'rgb(200,200,200)'
//             painter.ctx.fillRect(0,0,painter.canvas.width,painter.canvas.height);
//             painter.ctx.beginPath();
//             painter.ctx.strokeStyle = 'black'
//             painter.ctx.lineWidth = 5
//             painter.ctx.arc(painter.canvas.width/2+1,painter.canvas.height/2+1,painter.canvas.width/2 * 0.95 + 2.2,0,Math.PI*2);
//             console.log(painter.ctx.strokeStyle)
//             painter.ctx.stroke();
//             painter.ctx.closePath();
//             // console.log('done')
//             painter.ctx.restore();
//         }
//     },

//     food_frequency: food_freq(),
//     init_food: init_food(),
//     init_pop: init_pop(),

// })


// setTimeout(()=>{
//     W.loadGeneData()
// },10)