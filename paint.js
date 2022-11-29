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
                        src: img.src,
                        pattern: pattern,
                        img: patternContext.getImageData(0,0,patternSize,patternSize).data,
                        size: patternSize
                    })

                    let dom = document.getElementById('terrain-img-icons');
                    dom.innerHTML += `
                        <div id="terrain-img-${img.src}" class="bar-btn cent fl terrain-img" onclick="selectTerrainIcon(this.id)">
                            <img class="bar-img terrain-icon" src="${img.src}"> 
                        </div>
                    `
                    // console.log(this.terrains[0].src,img.attributes.src.nodeValue,img)
                    if(this.patterns.length == 1){
                        document.getElementById(`terrain-img-${img.src}`).style.borderLeft = '1px solid rgb(152,152,152)'
                    }
                    if(this.patterns.length == this.terrains.length){
                        document.getElementById(`terrain-img-${img.src}`).style.borderRight = '1px solid rgb(152,152,152)'
                        // this.reset()
                    }
                };
            }

        }

        this.selectTerrain = (src) => {
            let pat = this.patterns.filter(x=>x.src==src)
            if(pat.length == 0) return;
            this.selectedTerrain = pat[0];
        }

        // this.ctx.fillRect(0,0,this.sx,this.sy)
        

        this.newLine = true;
        this.mousedown = false

        

        document.addEventListener('mousedown', this.handleMouseDown)
        document.addEventListener('mouseup', this.handleMouseUp)
        document.addEventListener('mousemove', this.handleMouseMove)


        // this.regions = []
        this.drawing = false;
        this.filling = false;
        this.setDraw = (v) => {
            this.drawing = v
        }
        this.setFill = (v) => {
            this.filling = v;
            if(this.filling)
                this.findRegions()
        }

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


        this.paintTouchUps = () => {
            params.touchUps(this);
        }
        this.paintTouchUps()
        this.saveImage();

    }

    reset = (complete=false) => {
        this.ctx.fillStyle = 'rgba(200,200,200,1)';
        this.ctx.fillRect(0,0,this.sx,this.sy);
        if(complete){
            this.paintTouchUps();
            // alert('hi')
            this.saveImage();
            // return;
        }
        this.loadImage()
        // this.paintTouchUps()
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
        // if(crd == null || !this._worldContains(crd)) return;
        // console.log(crd)
        let reg;
        if(crd == null){
            reg = -1;
        }
        else{
            reg = this.regionOfPoint[Math.floor(crd.y)*this.sx + Math.floor(crd.x)]
        }
        // console.log(reg)
        
        // setting opacity
        var img = this.ctx.getImageData(0,0,this.sx,this.sy);
        for(let r in this.pointsofRegion){
            let opac = (r == reg) ? 1/1.1 : 1.1;
            for(let point of this.pointsofRegion[r]){
                img.data[4*point + 3] = Math.max(0,Math.min(255,opac*this.savedImage.data[4*point+3]))
            }
        }
        this.ctx.putImageData(img,0,0)
    }

    handleMouseDown = (e) => {
        if(this.mousedown) return;
        if(this.filling) {
            this.paintRegion(e)
        };
        this.mousedown = true;
    }

    handleMouseUp = (e) => {
        if(!this.mousedown) return;
        if(this.drawing){
            this.ctx.closePath()
            this.newLine = true;
            this.saveImage()
        }
        this.mousedown = false;

    }

    handleMouseMove = (e) => {
        if(this.filling){
            // hover stuff
            this.hoverRegion(e);
        }

        

        if(this.mousedown && this.drawing){
            let crd = this._getCanvasCoordinate(e)
            if(crd == null) return;

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

    findRegions = () => {
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
        
        this.saveImage()
    }

    paintRegion = (e) => {
        let crd = this._getCanvasCoordinate(e)
        console.log(crd)
        let reg;
        if(crd == null){
            return;
        }
        else{
            reg = this.regionOfPoint[Math.floor(crd.y)*this.sx + Math.floor(crd.x)]
        }

        crd.x = Math.round(crd.x)
        crd.y = Math.round(crd.y)
        
        var img = this.ctx.getImageData(0,0,this.sx,this.sy);
        let pat_img = this.selectedTerrain;
        console.log(pat_img.size)

        // console.log('painting region',reg,pat_img)
        
        for(let point of this.pointsofRegion[reg]){
            let y = point % this.sx
            let x = Math.floor(point / this.sx)

            let pix_ind = 4 * ((x % pat_img.size) * pat_img.size + (y % pat_img.size))
            // console.log(offset_x)
            let pix_val = [pat_img.img[pix_ind],pat_img.img[pix_ind+1],pat_img.img[pix_ind+2],pat_img.img[pix_ind+3]]
            // console.log(pix_ind,pix_val)
            this._paintPixel(x,y,pix_val,img)
        }
        this.ctx.putImageData(img,0,0)

        this.saveImage()
    }

}

// var Paint = new paintCanvas(canvas,ctx,{x:1300,y:700})