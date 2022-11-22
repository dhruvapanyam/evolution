// const canvas = document.getElementById('paint-canvas')
// const ctx = canvas.getContext('2d',{
//     willReadFrequently: true
// })


class paintCanvas{
    constructor(canvas,ctx,size,params=null){
        // console.log('new paint canvas created!')
        this.canvas = canvas
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.sx = this.canvas.width;
        this.sy = this.canvas.height;

        this.ctx = ctx;
        this.ctx.strokeStyle = 'white'
        this.ctx.lineWidth = 3
        this.ctx.fillStyle = 'grey'

        this.terrains = null;
        if(params) this.terrains = params.terrains;
        // console.log(this.terrains)

        this.patterns = []
        // this.patternRatio = 0.5;
        
        if(this.terrains != null){
            var pattern;
            for(let terrain of this.terrains){
                let patternCanvas = document.createElement("canvas");
                
                // // load image approach
                const img = new Image();
                // console.log('media/terrains/grass.jpeg')
                img.src = terrain.src;
                img.onload = () => {
                    let patternSize = Math.floor(img.width * terrain.ratio);
                    patternCanvas.width = patternSize
                    patternCanvas.height = patternSize

                    // console.log(patternCanvas.width)

                    let patternContext = patternCanvas.getContext("2d");

                
                    let imgSize = img.width;
                    patternContext.drawImage(img, 0,0, imgSize,imgSize,0,0,patternSize,patternSize)
                    pattern = this.ctx.createPattern(patternCanvas, "repeat");
                    // pattern = this.ctx.createPattern(img, "repeat");
                    // console.log(img)
                    this.patterns.push({
                        pattern: pattern,
                        img: patternContext.getImageData(0,0,patternSize,patternSize).data,
                        size: patternSize
                    })
                    // console.log(this.patterns)
                };
            }

        }

        // this.ctx.fillRect(0,0,this.sx,this.sy)
        

        this.newLine = true;
        this.mousedown = false

        

        document.addEventListener('mousedown', this.handleMouseDown)
        document.addEventListener('mouseup', this.handleMouseUp)
        document.addEventListener('mousemove', this.handleMouseMove)

        document.addEventListener('keydown', e=>{
            if(e.key == 'd'){
                //toggle drawing
                this.drawing = !this.drawing;
                if(this.drawing){
                    // unhover any regions
                    // this.hoverRegion(this.mouseXY)
                }
                else{
                    // find regions
                    this.findRegions(false)
                    // console.log(this.boundaryOfRegion)
                }
            }
            if(e.key == 'f'){
                this.findRegions(true)
            }
        })

        // this.regions = []
        this.drawing = false

        this.regionOfPoint = {}
        this.pointsofRegion = {}
        this.boundaryOfRegion = {}

        this._worldContains = (crd) => {
            return params.borderCheck(crd,this.canvas);
        }

        this.saveImage = () => {
            this.savedImage = this.ctx.getImageData(0,0,this.sx,this.sy)
        }
        this.loadImage = () => {
            this.ctx.putImageData(this.savedImage, 0,0);
        }

        this.saveImage();

        this.paintTouchUps = () => {
            // params.touchUps(this);
        }
    }

    _getCanvasCoordinate = (e) => {
        var rect = this.canvas.getBoundingClientRect() // abs. size of element
        let scaleX = this.canvas.width / rect.width    // relationship bitmap vs. element for x
        let scaleY = this.canvas.height / rect.height;  // relationship bitmap vs. element for y
    
        let crd =  {
            x: (e.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
            y: (e.clientY - rect.top) * scaleY     // been adjusted to be relative to element
        }
        if(!this._worldContains(crd)) return null;
        // if(crd.x < 0 || crd.y < 0 || crd.x >= this.sx || crd.y >= this.sy) return null;
        // console.log(rect,scaleX,scaleY,crd)
        return crd;
    }

    hoverRegion = (e) => {
        let crd = this._getCanvasCoordinate(e)
        // console.log(crd)
        let reg;
        if(crd == null){
            reg = -1;
        }
        else{
            reg = this.regionOfPoint[Math.floor(crd.y)*this.sx + Math.floor(crd.x)]
        }
        
        // setting opacity
        var img = this.ctx.getImageData(0,0,this.sx,this.sy);
        for(let r in this.pointsofRegion){
            
            let opac = (r == reg) ? 210 : 255;
            for(let point of this.pointsofRegion[r]){
                img.data[4*point + 3] = opac
            }
        }
        this.ctx.putImageData(img,0,0)
    }

    handleMouseDown = (e) => {
        if(this.mousedown) return;
        if(!this.drawing) return;
        // else: user has just pressed the mouse down
        // create new region
        // this.regions.push(new Path2D());
        this.mousedown = true;
        // console.log(this.regions)
    }

    handleMouseUp = (e) => {
        if(!this.mousedown) return;
        if(!this.drawing) return;
        // else: user has just released the mouse
        // this.regions[this.regions.length-1].closePath();
        this.ctx.closePath()
        // this.ctx.beginPath()
        this.mousedown = false;

        this.newLine = true;
    }

    handleMouseMove = (e) => {
        if(!this.drawing){
            // hover stuff
            this.hoverRegion(e);
        }

        let crd = this._getCanvasCoordinate(e)
        if(crd == null) return;

        if(this.mousedown && this.drawing){
            if(this.newLine){
                this.newLine = false;
                // console.log('resetting')
                // this.regions[this.regions.length-1].moveTo(crd.x,crd.y)
                this.ctx.beginPath()
                this.ctx.moveTo(crd.x,crd.y)
            }
            else{
                // this.regions[this.regions.length-1].lineTo(crd.x,crd.y)
                this.ctx.lineTo(crd.x,crd.y)
                // console.log(crd)
                // this.ctx.stroke(this.regions[this.regions.length-1])

                this.ctx.save()
                this.ctx.strokeStyle = 'white'
                this.ctx.stroke()
                this.ctx.restore()
            }
            
            // this.ctx.stroke()
        }

        
            
    }

    setRegionOpacity = (reg, o) => {
        var img = this.ctx.getImageData(0,0,this.sx,this.sy);
        for(let point of this.pointsofRegion[reg]){
            img.data[4 * (point) + 3] = o;
        }

        this.ctx.putImageData(img,0,0)
    }

    _edges = (i,j) => {
        let res = []
        for(let p=-1;p<=1;p++){
            for(let q=-1;q<=1;q++){
                if(!this._worldContains({x:j+p, y:i+q})) continue;
                // if(i+q < 0 || i+q > this.sy || j+p < 0 || j+p > this.sx) continue
                res.push([i+q,j+p])
            }
        }
        return res;
    }

    _isBoundary = (i,j,img,verbose=false) => {
        let white = (img.data[4*(i*this.sx + j)] + img.data[4*(i*this.sx + j) + 1] + img.data[4*(i*this.sx + j) + 2])
        if(verbose) console.log(white==255*3)
        return white == 255*3
    }

    _paintPixel = (i,j,col,img) => {
        img.data[4*(i*this.sx + j)+0] = col[0]
        img.data[4*(i*this.sx + j)+1] = col[1]
        img.data[4*(i*this.sx + j)+2] = col[2]
        img.data[4*(i*this.sx + j)+3] = col[3]
    }

    findRegions = (paint=true) => {
        var img = this.ctx.getImageData(0,0,this.sx,this.sy);

        for(let p of Object.keys(this.regionOfPoint)){
            this.regionOfPoint[p] = null;
            delete this.regionOfPoint[p]
        }
        for(let r of Object.keys(this.pointsofRegion)){
            this.pointsofRegion[r] = null;
            delete this.pointsofRegion[r]
        }
        
        // console.log(img.data.length/4)
        

        let Q = []
        let visited = new Set()
        let num_regions = 0;
        
        for(let i=0; i<=this.sy; i+=1){
            for(let j=0; j<=this.sx; j+=1){
                if(!this._worldContains({x:j,y:i})) continue;
                if(visited.has(i*this.sx + j)) continue;
                if(this._isBoundary(i,j,img)) continue;

                let start_node = [i,j]

                // else: start BFS
                let col = [0,0,0].map(x=>Math.floor(Math.random()*255));
                col.push(255);
                num_regions += 1

                this.pointsofRegion[num_regions] = []
                this.boundaryOfRegion[num_regions] = []

                // console.log('new component! col:',col)
                Q.push([i,j])
                visited.add(i*this.sx + j);
                while(Q.length > 0){
                    let node = Q.shift();
                    let x = node[0]
                    let y = node[1]
                    this.regionOfPoint[x*this.sx + y] = num_regions;
                    this.pointsofRegion[num_regions].push(x*this.sx + y)
                    if(paint) {
                        if(this.patterns.length > 0){
                            let pat_img = this.patterns[num_regions % this.patterns.length];
                            // console.log(pat_img.img)
                            let offset_x = (((x - start_node[0]) % pat_img.size) + pat_img.size) % pat_img.size
                            let offset_y = (((y - start_node[1]) % pat_img.size) + pat_img.size) % pat_img.size
                            let pix_ind = 4 * (offset_x * pat_img.size + offset_y);
                            // console.log(pix_offset,pix_ind)
                            let pix_val = [pat_img.img[pix_ind],pat_img.img[pix_ind+1],pat_img.img[pix_ind+2],pat_img.img[pix_ind+3]]
                            // console.log(offset_x,offset_y,pix_val)
                            this._paintPixel(x,y,pix_val,img)
                        }
                        // this._paintPixel(x,y,col,img);
                    }
                    for(let e of this._edges(x,y)){
                        if(visited.has(e[0]*this.sx + e[1])) continue;
                        if(this._isBoundary(e[0],e[1],img)){
                            // add this point to this region's boundary
                            this.boundaryOfRegion[num_regions].push(e)
                            continue;
                        }
                        visited.add(e[0]*this.sx + e[1])
                        Q.push(e);
                    }
                }

            }
        }
        console.log(`Found ${num_regions} different regions!`)
        if(paint) this.paint(img);

        this.saveImage()
    }

    paint = (img) => {
        this.ctx.putImageData(img,0,0);
        this.paintTouchUps();
    }

}

// var Paint = new paintCanvas(canvas,ctx,{x:1300,y:700})