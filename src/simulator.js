// Simulator --> extends World to provide simulation functions
// handles pauses, timers, sim monitoring

class Simulator extends World{
    constructor(world_params){
        super(world_params);

        

        this.currentDay = 0;
        this.latestStartDay = 0;
        this.deadlineDay = 0;

        this.intervals = new Set();
        this.clearIntervals = () => {
            for(let k of this.intervals)
                clearInterval(k);
            this.intervals.clear();
        }

        this.simState = 'stopped';

    }

    // 3 sleep states: stopped, paused, running

    // stopped: sim yet to begin
    // paused: sim paused midway
    // running
    
    sleep = () => {
        if(this.simState == 'stopped') return false;
        this.simState = 'stopped'
        return true;
    }
    wake = () => {
        if(this.simState == 'running') return false;
        this.simState = 'running'
        return true;
    }
    nap = () => {
        if(this.simState == 'paused') return false;
        this.simState = 'paused'
        return true;
    }


    // bool check for day timer
    timeUp = () => {
        return this.time >= maxTime;
    }

    // bool check for sim end
    daysUp = () => {
        return this.currentDay >= this.deadlineDay;
    }


    resetSim = () => {
        this.currentDay = 0;
        this.latestStartDay = 0;
        this.deadlineDay = 0;

        this.clearIntervals();
        this.sleep();
    }

    // given simulation length (in days), generate new sim
    initNewSim = (params) => {
        this.latestStartDay = this.currentDay;
        this.deadlineDay = this.latestStartDay + params.sim_length;
    }

    

    // SIMS ------------------------------------

    startSim = (params) => {
        this.initNewSim(params);

        for(let a of this.awake) this.awake.delete(a)
        this.playSim();
    }

    playSim = (wait=1) => {
        if(this.wake()){
            this.intervals.add(
                setInterval(
                    () => {
                        if(!this.simDay()) this.endSim();
                    },
                    wait
                )
            );
        }
    }

    pauseSim = () => {
        this.clearIntervals();
        this.nap();
    }

    endSim = () => {
        this.clearIntervals();
        // console.log('done')
        this.nap();
    }

    // DEMO ------------------------------------

    startDemo = (params) => {
        this.playDemo(params);
    }

    playDemo = (params) => {
        if(this.wake()){
            for(let id in this.creatures) this.awake.add(id);
            this.intervals.add(
                setInterval(
                    () => {
                        // console.log('hi?')
                        let success = this.timeStep(true);
                        if(!success) this.endDemo();
                    },
                    params.wait_duration
                )
            );
    
        }
    }

    pauseDemo = this.pauseSim

    stopDemo = this.resetSim

    endDemo = () => {
        this.clearIntervals();
        // console.log(this.intervals)
        this.time = 0;
        this.nap();
        this.endDay();
    }




    // simulate a day, by calling timesteps for world timer, until all creatures are asleep
    simDay = () => {

        // console.log(this.currentDay)
        if(this.daysUp()) return false; // if sim has ended
        for(let id in this.creatures) this.awake.add(id) // tracks all creatures currently moving
        while(this.awake.size > 0){
            this.timeStep() // perform a world step
        }
        this.endDay();
        return true;
    }

    // single timestep in a day sim
    timeStep = (draw = false) => {

        if(this.awake.size == 0 || this.timeUp()) return false; // if timer has ended, or if no creature is awake

        // if time for food to be spawned
        if(this.time % this.food_frequency == 0){
            // inject food
            this.injectFood(this.params.init_food,(this.time==0)) // second param --> whether it is the first food injection
        }

        // if visual simulation is enabled, draw world and creatures and food
        if(draw){
            this.drawWorld();
        }

        // handle motion for each awake creature
        for(let id of this.awake){
            let c = this.creatures[id];
            let res = c.move(this.food,this.food_cells) // main move() function, returns whether movable again

            if(draw){
                // let scale = this.canvas.width/2 * 0.95 / this.dim.radius
                // this.ctx.beginPath()
                // this.ctx.moveTo(c.pos.x*scale+this.canvas.width/2,c.pos.y*scale+this.canvas.height/2)
                // this.ctx.lineTo(c.spawn.x*scale+this.canvas.width/2,c.spawn.y*scale+this.canvas.height/2)
                // this.ctx.strokeStyle = 'red'
                // this.ctx.stroke()
                // this.ctx.closePath()

                // ^^ handled in drawWorld()
            }


            if(c.target.looking_for == 'food' && c.target.fid != null){    // can't see any food? why try eating?
                if(c.food < maxFood){
                    let eaten_fid = c.tryEating(this.food,this.food_cells);
                    if(eaten_fid != null){
                        let eaten = this.food[eaten_fid];
                        let x=eaten.pos.x, y=eaten.pos.y;
                        let gridX = Math.floor((x+this.dim.radius)*this.food_cells.length / (this.dim.radius*2))
                        let gridY = Math.floor((y+this.dim.radius)*this.food_cells.length / (this.dim.radius*2))
                        
                        // handle eaten food cleanup
                        this.food_cells[gridX][gridY].delete(eaten_fid);
                        this.food[eaten_fid] = undefined;
                        delete this.food[eaten_fid];
                    }
                }
            }
            
            if(!res){
                // not awake anymore (either dead, or survived)
                this.awake.delete(id)
            }
        }
        this.time++
        if(draw) this.drawTimer(); // draw timer icon filled

        return true;
    }

    // handle end of day
    // update stats, handle reproduction, reset creatures to spawn points
    endDay = () => {
        // console.log('before ending:',Object.keys(this.creatures).length)
        let curIDs = Object.keys(this.creatures)
        let net = 0;    // tracking population change

        // for each creature, handle next steps
        for(let id of curIDs){
            let c = this.creatures[id]

            // if survived!
            if(c.home()) {
                // if enough to reproduce,
                if(c.food == 2){
                    // console.log('birth')
                    this.creatureID+=1
                    this.creatures[this.creatureID] = c.reproduce(this.creatureID,this.getRandStartingPos())
                    // console.log(this.creatures[this.creatureID].props.vision.value)
                    net += 1
                    // birth
                    this.hanldeBirthStats(this.creatures[this.creatureID]);
                    // console.log('Current speed:',c.props.speed.val,'Baby speed:',this.creatures[this.creatureID].props.speed.val)
                }

                // update trend charts' age values
                trendCharts['age'].cur_mean['overall'].sum += 1
                trendCharts['age'].cur_mean[c.gene].sum += 1
                c.daySuccess()
            }
            else {
                // kill the creature
                this.handleDeathStats(this.creatures[id])
                // console.log('death')
                net -= 1;
                this.creatures[id] = undefined
                delete this.creatures[id]
                // console.log('killed creature')
            }
        }
        // console.log(`${net} net pop | ${Object.keys(this.creatures).length} remaining`)
        // console.log('after ending day:',Object.keys(this.creatures).length)

        this.currentDay++
        this.time = 0

        this.findDominant() // compute dominant sub-genes
        this.newDayStats(); // setup new day stats
        // console.log('done')
    }

}


// Instantiating global WORLD

const W = new Simulator({
    canvas: world,
    ctx: ctx,
    dim: {radius: 300, center: new Vec(0,0)},
    canvas_size: {x: world.width, y: world.height},
    painter: {
        // terrain imgs for world paint
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
        // custom function for world borders, depending on dimensions and shape
        borderCheck: (crd,canvas) => {
            // return !(crd.x < 0 || crd.y < 0 || crd.x >= canvas.width || crd.y >= canvas.height) // rect
            return new Vec(crd.x,crd.y).distTo(new Vec(canvas.width/2,canvas.width/2)) <= canvas.width/2 * 0.95
        },
        boundaryCheck: (rgb) => {
            return (rgb[0] == 0 && rgb[1] == 0 && rgb[2] == 0)
        },
        // painting fine tuning
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


    // initial parameters, defined in `sim.js`
    food_frequency: food_freq(),
    init_food: init_food(),
    init_pop: init_pop(),

})

